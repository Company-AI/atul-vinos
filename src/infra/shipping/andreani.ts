import type {
  ShippingDestination, ShippingParcel, ShippingQuote,
} from "@/domain/shipping/ports";

/**
 * Andreani: autenticación y cotizador.
 *
 * Escrito contra la documentación oficial —el catálogo de APIs de
 * developers.andreani.com y la planilla "api-cotizador-v2-1"—, no contra
 * librerías de terceros. Lo que no se pudo hacer es probarlo: las credenciales
 * sólo se generan teniendo cuenta en Andreani, así que esto está verificado en
 * forma y no en vuelo. La primera corrida real va a decir la verdad.
 *
 * Autenticación: GET /login con Basic Auth devuelve un token que vale 24 horas
 * y después viaja en el header x-authorization-token.
 *
 * Cotizador: GET /v1/tarifas con el código postal de destino, el contrato, el
 * cliente y el volumen del bulto. Devuelve una sola tarifa, con y sin IVA, y
 * ningún plazo de entrega: los días los sigue poniendo la tarifa del admin.
 */

const HOSTS = {
  qa: "https://apisqa.andreani.com",
  prod: "https://apis.andreani.com",
} as const;

export type AndreaniConfig = {
  usuario: string;
  clave: string;
  /** Código de cliente dentro de Andreani; lo da el comercial al abrir la cuenta. */
  cliente: string;
  contrato: string;
  sucursalOrigen?: string;
  host: string;
  ambiente: "qa" | "prod";
};

/**
 * Las credenciales viven en variables de entorno y no en la base.
 *
 * Son una contraseña: guardarlas en una columna JSON que el panel lee y
 * escribe las deja al alcance de cualquier sesión de admin y de cualquier
 * volcado de la base. En el entorno sólo las ve el servidor.
 */
export function leerConfigAndreani(): AndreaniConfig | null {
  const usuario = process.env.ANDREANI_USUARIO?.trim();
  const clave = process.env.ANDREANI_CLAVE?.trim();
  const cliente = process.env.ANDREANI_CLIENTE?.trim();
  const contrato = process.env.ANDREANI_CONTRATO?.trim();

  if (!usuario || !clave || !cliente || !contrato) return null;

  /*
    Por defecto QA, nunca producción. Una variable mal puesta tiene que
    terminar cotizando contra el entorno de pruebas, no generando movimientos
    reales en la cuenta.
  */
  const ambiente = process.env.ANDREANI_AMBIENTE?.trim() === "prod" ? "prod" : "qa";

  return {
    usuario,
    clave,
    cliente,
    contrato,
    sucursalOrigen: process.env.ANDREANI_SUCURSAL_ORIGEN?.trim() || undefined,
    host: HOSTS[ambiente],
    ambiente,
  };
}

/*
  El token dura 24 horas: pedir uno por cotización sería una llamada de más en
  cada tecla que toca alguien en el checkout. Se guarda en memoria del proceso
  y se renueva cinco minutos antes de vencer, para no usar uno que caduque en
  pleno viaje.
*/
let cache: { token: string; vence: number } | null = null;
const MARGEN_MS = 5 * 60 * 1000;
const DURACION_MS = 24 * 60 * 60 * 1000;

export function olvidarTokenAndreani() {
  cache = null;
}

async function obtenerToken(config: AndreaniConfig): Promise<string> {
  if (cache && Date.now() < cache.vence) return cache.token;

  const basic = Buffer.from(`${config.usuario}:${config.clave}`).toString("base64");
  const res = await fetch(`${config.host}/login`, {
    method: "GET",
    headers: { Authorization: `Basic ${basic}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Andreani rechazó las credenciales (HTTP ${res.status}). Revisá usuario y clave.`,
    );
  }

  /*
    La documentación dice que se obtiene un token sin precisar dónde viene. Se
    buscan los dos lugares posibles —el header con el que después hay que
    mandarlo, y el cuerpo— en vez de adivinar uno: si cambia, el error dice
    qué llegó en lugar de fallar más adelante con un 401 sin explicación.
  */
  const enHeader = res.headers.get("x-authorization-token");
  if (enHeader) {
    cache = { token: enHeader, vence: Date.now() + DURACION_MS - MARGEN_MS };
    return enHeader;
  }

  const cuerpo: unknown = await res.json().catch(() => null);
  const enCuerpo =
    cuerpo && typeof cuerpo === "object"
      ? ((cuerpo as Record<string, unknown>).token ??
         (cuerpo as Record<string, unknown>).access_token)
      : null;

  if (typeof enCuerpo === "string" && enCuerpo.length > 0) {
    cache = { token: enCuerpo, vence: Date.now() + DURACION_MS - MARGEN_MS };
    return enCuerpo;
  }

  throw new Error(
    "Andreani respondió al login pero no encontramos el token, " +
      "ni en el header x-authorization-token ni en el cuerpo.",
  );
}

/*
  Volumen del bulto en cm³, que es el único dato obligatorio del paquete.

  Una botella de 750 ml ocupa, dentro de una caja y con su separador, algo así
  como 8 × 8 × 31 cm. Es una estimación: el día que tengan la caja propia
  medida, este número sale de ahí. Se puede corregir por entorno sin tocar
  código porque de él depende lo que se le cobra al cliente.
*/
const CM3_POR_BOTELLA_POR_DEFECTO = 2000;
const FACTOR_EMBALAJE = 1.15;

export function volumenCm3(bottles: number): number {
  const porBotella =
    Number(process.env.ANDREANI_CM3_POR_BOTELLA) || CM3_POR_BOTELLA_POR_DEFECTO;
  return Math.round(Math.max(1, bottles) * porBotella * FACTOR_EMBALAJE);
}

export type RespuestaTarifa = {
  pesoAforado?: string;
  tarifaConIva?: { total?: string };
  tarifaSinIva?: { total?: string };
};

export async function cotizarAndreani(
  config: AndreaniConfig,
  destination: ShippingDestination,
  parcel: ShippingParcel,
): Promise<ShippingQuote[]> {
  const token = await obtenerToken(config);

  const params = new URLSearchParams({
    cpDestino: destination.postalCode.trim(),
    contrato: config.contrato,
    cliente: config.cliente,
    "bultos[0][volumen]": String(volumenCm3(parcel.bottles)),
    "bultos[0][kilos]": (parcel.weightGrams / 1000).toFixed(2),
  });
  if (config.sucursalOrigen) params.set("sucursalOrigen", config.sucursalOrigen);
  if (parcel.declaredValue > 0) {
    params.set("bultos[0][valorDeclarado]", String(Math.round(parcel.declaredValue)));
  }

  const res = await fetch(`${config.host}/v1/tarifas?${params}`, {
    method: "GET",
    headers: { "x-authorization-token": token },
    cache: "no-store",
  });

  if (res.status === 401) {
    // El token venció antes de tiempo: se tira y se reintenta una sola vez.
    olvidarTokenAndreani();
    const reintento = await obtenerToken(config);
    const segundo = await fetch(`${config.host}/v1/tarifas?${params}`, {
      method: "GET",
      headers: { "x-authorization-token": reintento },
      cache: "no-store",
    });
    if (!segundo.ok) throw new Error(`Andreani devolvió HTTP ${segundo.status} al cotizar.`);
    return mapearTarifa(await segundo.json());
  }

  if (!res.ok) {
    throw new Error(`Andreani devolvió HTTP ${res.status} al cotizar.`);
  }

  return mapearTarifa(await res.json());
}

export function mapearTarifa(data: RespuestaTarifa): ShippingQuote[] {
  /*
    Se cobra con IVA porque es lo que termina pagando una persona. La tarifa
    sin IVA está en la respuesta y sirve para la contabilidad, no para la
    vidriera.
  */
  const total = Number(data?.tarifaConIva?.total ?? data?.tarifaSinIva?.total);
  if (!Number.isFinite(total)) return [];

  return [
    {
      providerCode: "andreani",
      serviceCode: "andreani-estandar",
      serviceName: "Andreani a domicilio",
      price: Math.round(total),
      /*
        El cotizador no devuelve plazos. Antes que inventar "3 a 5 días" se
        deja vacío: la ficha y el checkout ya saben no mostrar el plazo cuando
        no lo hay.
      */
      etaMinDays: null,
      etaMaxDays: null,
    },
  ];
}
