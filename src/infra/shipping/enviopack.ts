import type {
  ShippingDestination, ShippingParcel, ShippingQuote,
} from "@/domain/shipping/ports";
import { provinceCode } from "@/lib/ar";

/**
 * Envíopack: autenticación y cotizador.
 *
 * Es un intermediario, no un transportista: con una sola cuenta devuelve
 * precios de varios correos —Andreani, OCA y otros— usando las tarifas que
 * ellos tienen negociadas. A cambio cobra una comisión. Para quien no tiene
 * contrato propio con cada correo, es la diferencia entre semanas de alta
 * comercial y dar de alta una cuenta.
 *
 * Escrito contra developers.enviopack.com.ar. Igual que con Andreani, está
 * verificado en forma y no en vuelo: hace falta una cuenta para ejecutarlo.
 *
 * A diferencia de Andreani, este sí devuelve plazo de entrega —en horas— y
 * devuelve varias opciones, una por correo.
 */

const BASE = "https://api.enviopack.com";

export type EnviopackConfig = {
  apiKey: string;
  secret: string;
  /** "D" a domicilio, "S" a sucursal. */
  modalidad: string;
};

export function leerConfigEnviopack(): EnviopackConfig | null {
  const apiKey = process.env.ENVIOPACK_API_KEY?.trim();
  const secret = process.env.ENVIOPACK_SECRET_KEY?.trim();
  if (!apiKey || !secret) return null;

  /*
    A domicilio por defecto, que es lo que promete la tienda. Pidiendo todas
    las modalidades vuelven ocho combinaciones por correo —sucursal, prioritario,
    express— y la ficha del producto pasa a ser una tabla de logística.
  */
  const modalidad = process.env.ENVIOPACK_MODALIDAD?.trim().toUpperCase() === "S" ? "S" : "D";
  return { apiKey, secret, modalidad };
}

/*
  El token dura cuatro horas, bastante menos que el de Andreani, así que se
  guarda con el mismo criterio: en memoria del proceso y renovado un minuto
  antes de vencer.
*/
let cache: { token: string; vence: number } | null = null;
const DURACION_MS = 4 * 60 * 60 * 1000;
const MARGEN_MS = 60 * 1000;

export function olvidarTokenEnviopack() {
  cache = null;
}

async function obtenerToken(config: EnviopackConfig): Promise<string> {
  if (cache && Date.now() < cache.vence) return cache.token;

  const body = new URLSearchParams({
    "api-key": config.apiKey,
    "secret-key": config.secret,
  });

  const res = await fetch(`${BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Envíopack rechazó las credenciales (HTTP ${res.status}). Revisá la API key y el secret.`,
    );
  }

  const data: unknown = await res.json().catch(() => null);
  const token =
    data && typeof data === "object"
      ? (data as Record<string, unknown>).access_token
      : null;

  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Envíopack respondió al login pero no devolvió un access_token.");
  }

  cache = { token, vence: Date.now() + DURACION_MS - MARGEN_MS };
  return token;
}

type CotizacionEnviopack = {
  correo?: { id?: string; nombre?: string };
  servicio?: string;
  modalidad?: string;
  valor?: number | string;
  horas_entrega?: number | string;
};

export async function cotizarEnviopack(
  config: EnviopackConfig,
  destination: ShippingDestination,
  parcel: ShippingParcel,
): Promise<ShippingQuote[]> {
  const provincia = provinceCode(destination.province, destination.postalCode);
  if (!provincia) {
    /*
      Sin provincia no se cotiza, y no se adivina. Envíopack la pide como
      código ISO, y mandar una equivocada devolvería un precio de otra punta
      del país con toda la cara de ser correcto.
    */
    return [];
  }

  const token = await obtenerToken(config);
  const params = new URLSearchParams({
    access_token: token,
    provincia,
    codigo_postal: destination.postalCode.trim().replace(/\D/g, "").slice(0, 4),
    peso: (parcel.weightGrams / 1000).toFixed(2),
    modalidad: config.modalidad,
  });

  const res = await fetch(`${BASE}/cotizar/costo?${params}`, {
    method: "GET",
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    olvidarTokenEnviopack();
    throw new Error("Envíopack rechazó el token. Se pedirá uno nuevo en el próximo intento.");
  }
  if (!res.ok) {
    throw new Error(`Envíopack devolvió HTTP ${res.status} al cotizar.`);
  }

  return mapearCotizaciones(await res.json());
}

export function mapearCotizaciones(data: unknown): ShippingQuote[] {
  if (!Array.isArray(data)) return [];

  const quotes = (data as CotizacionEnviopack[])
    .map((fila): ShippingQuote | null => {
      const price = Number(fila?.valor);
      if (!Number.isFinite(price)) return null;

      const correo = fila.correo?.nombre?.trim() || "Envío";
      const horas = Number(fila?.horas_entrega);
      /*
        Vienen horas y se muestran días, porque es como se habla de un envío.
        Se redondea para arriba: prometer menos de lo que puede tardar es la
        única forma de que el plazo quede mal de un modo que molesta.
      */
      const dias = Number.isFinite(horas) && horas > 0 ? Math.ceil(horas / 24) : null;

      return {
        providerCode: "enviopack",
        serviceCode: `${fila.correo?.id ?? "correo"}-${fila.servicio ?? "N"}-${fila.modalidad ?? "D"}`,
        serviceName: fila.modalidad === "S" ? `${correo} a sucursal` : correo,
        price: Math.round(price),
        etaMinDays: dias,
        etaMaxDays: dias,
      };
    })
    .filter((q): q is ShippingQuote => q !== null);

  /*
    Un mismo correo puede volver repetido por servicio. Se deja el más barato
    de cada uno: la ficha del producto tiene que responder "cuánto sale", no
    desplegar el catálogo logístico del país.
  */
  const porCorreo = new Map<string, ShippingQuote>();
  for (const q of quotes) {
    const actual = porCorreo.get(q.serviceName);
    if (!actual || q.price < actual.price) porCorreo.set(q.serviceName, q);
  }

  return [...porCorreo.values()].sort((a, b) => a.price - b.price);
}
