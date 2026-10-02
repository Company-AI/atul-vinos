import type {
  CarrierLabel, CreateShipmentInput, CreateShipmentResult, ShippingDestination,
  ShippingParcel, ShippingQuote, TrackingEvent, TrackingStatus, TrackingStatusCode,
} from "@/domain/shipping/ports";
import { provinceCode } from "@/lib/ar";
import { normalizarBusqueda } from "@/lib/buscar";

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

/* ── Despacho: crear el envío y traer la etiqueta ──────────────────────────── */

/**
 * Envíopack maneja dos entidades: el pedido, que representa la orden de tu
 * tienda, y el envío, que es el paquete físico. Todo envío cuelga de un
 * pedido, así que despachar son dos llamadas.
 *
 * El envío se crea confirmado, que es lo que lo informa al correo y le da
 * estado "En Proceso". Recién cuando el correo contesta pasa a "Procesado" y
 * ahí aparecen el número de seguimiento y la etiqueta: por eso crear un envío
 * no devuelve tracking todavía.
 */

async function pedir<T>(
  config: EnviopackConfig,
  ruta: string,
  init: RequestInit & { query?: Record<string, string> } = {},
): Promise<T> {
  const token = await obtenerToken(config);
  const query = new URLSearchParams({ access_token: token, ...(init.query ?? {}) });
  const res = await fetch(`${BASE}${ruta}?${query}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) olvidarTokenEnviopack();
    /* El cuerpo del error suele decir qué campo está mal: se arrastra entero. */
    const detalle = await res.text().catch(() => "");
    throw new Error(
      `Envíopack devolvió HTTP ${res.status} en ${ruta}${detalle ? `: ${detalle.slice(0, 300)}` : ""}`,
    );
  }

  return (await res.json()) as T;
}

/** Fecha en el formato que pide Envíopack: 2016-04-26 13:52:00 */
function fechaEnviopack(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * El código de servicio que armó el cotizador, de vuelta en sus partes.
 *
 * Se guardó como "correo-servicio-modalidad" al cotizar justamente para poder
 * despachar con el mismo correo que se le prometió a la persona, y no con
 * cualquiera.
 */
export function partirServiceCode(serviceCode: string) {
  const [correo, servicio, modalidad] = serviceCode.split("-");
  return {
    correo: correo && correo !== "correo" ? correo : null,
    servicio: servicio || "N",
    modalidad: modalidad === "S" ? "S" : "D",
  };
}

export async function crearEnvioEnviopack(
  config: EnviopackConfig,
  input: CreateShipmentInput,
): Promise<CreateShipmentResult> {
  const deposito = process.env.ENVIOPACK_DIRECCION_ENVIO?.trim();
  if (!deposito) {
    throw new Error(
      "Falta ENVIOPACK_DIRECCION_ENVIO: es el depósito desde donde retiran, " +
        "y se saca de Configuración / Depósitos en el panel de Envíopack.",
    );
  }

  const provincia = provinceCode(input.destination.province, input.destination.postalCode);
  if (!provincia) {
    throw new Error(`No pudimos determinar la provincia de "${input.destination.province}".`);
  }

  const { correo, servicio, modalidad } = partirServiceCode(input.serviceCode);
  if (!correo) {
    throw new Error(
      "El pedido no tiene guardado con qué correo se cotizó. " +
        "Volvé a cotizar el envío antes de despacharlo.",
    );
  }

  const [nombre, ...resto] = input.recipient.name.trim().split(/\s+/);

  const pedido = await pedir<{ id: number }>(config, "/pedidos", {
    method: "POST",
    body: JSON.stringify({
      id_externo: String(input.orderNumber).slice(0, 30),
      nombre: (nombre || "Cliente").slice(0, 30),
      apellido: (resto.join(" ") || "-").slice(0, 30),
      email: (input.recipient.email ?? "").slice(0, 100),
      telefono: (input.recipient.phone ?? "").slice(0, 30),
      monto: Number(input.parcel.declaredValue.toFixed(2)),
      fecha_alta: fechaEnviopack(new Date()),
      pagado: true,
      provincia,
      localidad: input.destination.city.slice(0, 50),
    }),
  });

  const envio = await pedir<{ id: number; tracking_number: string | null; estado?: string; costo?: number }>(
    config,
    "/envios",
    {
      method: "POST",
      body: JSON.stringify({
        pedido: pedido.id,
        direccion_envio: deposito,
        destinatario: input.recipient.name.slice(0, 50),
        confirmado: true,
        modalidad,
        servicio,
        despacho: process.env.ENVIOPACK_DESPACHO?.trim().toUpperCase() === "S" ? "S" : "D",
        correo,
        calle: (input.destination.street ?? "").slice(0, 50),
        numero: (input.destination.number ?? "").slice(0, 5),
        piso: (input.destination.apartment ?? "").slice(0, 6),
        referencia_domicilio: (input.destination.reference ?? "").slice(0, 30),
        codigo_postal: Number(input.destination.postalCode.replace(/\D/g, "").slice(0, 4)),
        provincia,
        localidad: input.destination.city.slice(0, 50),
        /*
          Se manda un solo bulto con el peso real. Las medidas son las del
          paquete armado; si cambian, el correo recalcula al recibirlo.
        */
        paquetes: [
          {
            alto: 32,
            ancho: Math.max(10, Math.ceil(Math.sqrt(input.parcel.bottles)) * 9),
            largo: Math.max(10, Math.ceil(input.parcel.bottles / 2) * 9),
            peso: Number((input.parcel.weightGrams / 1000).toFixed(2)),
            descripcion_primera_linea: `Pedido #${input.orderNumber}`,
            descripcion_segunda_linea: `${input.parcel.bottles} botellas`,
          },
        ],
      }),
    },
  );

  return {
    externalId: String(envio.id),
    /*
      Todavía no hay número de seguimiento: aparece cuando el correo confirma y
      el envío pasa a "Procesado". Queda vacío a propósito en vez de inventar
      uno, y se completa al sincronizar.
    */
    trackingNumber: envio.tracking_number ?? "",
    trackingUrl: null,
    cost: typeof envio.costo === "number" ? envio.costo : null,
    labelPayload: {
      proveedor: "enviopack",
      envioId: envio.id,
      pedidoId: pedido.id,
      correo,
      servicio,
      modalidad,
      estado: envio.estado ?? null,
    },
  };
}

export async function etiquetaEnviopack(
  config: EnviopackConfig,
  externalId: string,
): Promise<CarrierLabel | null> {
  const token = await obtenerToken(config);
  const query = new URLSearchParams({ access_token: token, formato: "pdf" });

  const res = await fetch(`${BASE}/envios/${externalId}/etiqueta?${query}`, {
    method: "GET",
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) olvidarTokenEnviopack();
    /*
      La etiqueta sólo existe cuando el envío está "Procesado", o sea cuando el
      correo ya lo confirmó. Antes de eso Envíopack rechaza el pedido, y el
      mensaje tiene que decir eso y no un número de error.
    */
    throw new Error(
      `Todavía no hay etiqueta para este envío (HTTP ${res.status}). ` +
        "Suele significar que el correo no lo confirmó todavía.",
    );
  }

  return {
    contentType: res.headers.get("content-type") ?? "application/pdf",
    filename: `etiqueta-${externalId}.pdf`,
    data: await res.arrayBuffer(),
  };
}

/* ── Seguimiento ───────────────────────────────────────────────────────────── */

/**
 * Traduce la condición que informa el correo a uno de nuestros estados.
 *
 * Envíopack publica el árbol de condiciones en GET /envios/condiciones, que
 * necesita credenciales, así que todavía no sabemos los identificadores
 * exactos. Mientras tanto se reconoce el texto, con dos reglas que importan:
 *
 *   - lo que no se reconoce NO cambia el estado. Se guarda el evento con las
 *     palabras del correo y listo. Un estado inventado en la página de
 *     seguimiento es peor que un estado viejo.
 *   - las negaciones se evalúan primero. "No entregado" no puede caer en la
 *     regla de "entregado": sería avisarle a alguien que su vino llegó cuando
 *     justamente no llegó.
 */
const CONDICIONES: { patron: RegExp; estado: TrackingStatusCode }[] = [
  { patron: /no\s*se?\s*entreg|no\s*entregad|fallid|rechaz|ausente|domicilio\s*cerrado/, estado: "FAILED" },
  { patron: /devoluc|devuelt|retorn/, estado: "RETURNED" },
  { patron: /anulad|cancelad/, estado: "CANCELLED" },
  { patron: /entregad/, estado: "DELIVERED" },
  { patron: /repart|distribuc|salio\s*a\s*entregar/, estado: "OUT_FOR_DELIVERY" },
  { patron: /transito|en\s*camino|arribo|despacho|manifiest/, estado: "IN_TRANSIT" },
  { patron: /guia\s*emitida|etiqueta|pre.?ingreso|procesad/, estado: "LABEL_CREATED" },
];

export function estadoDesdeCondicion(texto: string): TrackingStatusCode | null {
  const limpio = normalizarBusqueda(texto);
  for (const { patron, estado } of CONDICIONES) {
    if (patron.test(limpio)) return estado;
  }
  return null;
}

type EnvioEnviopack = {
  id?: number;
  estado?: string;
  tracking_number?: string | null;
  condicion?: string | null;
};

export async function consultarEnvio(config: EnviopackConfig, externalId: string) {
  return pedir<EnvioEnviopack>(config, `/envios/${externalId}`);
}

export async function trackingEnviopack(
  config: EnviopackConfig,
  externalId: string,
): Promise<TrackingStatus> {
  const [envio, eventos] = await Promise.all([
    consultarEnvio(config, externalId),
    pedir<{ fecha?: string; mensaje?: string }[]>(config, `/envios/${externalId}/tracking`, {
      query: { formato: "ISO" },
    }).catch(() => [] as { fecha?: string; mensaje?: string }[]),
  ]);

  const events: TrackingEvent[] = (Array.isArray(eventos) ? eventos : [])
    .filter((e) => e.mensaje)
    .map((e) => ({
      status: estadoDesdeCondicion(e.mensaje!) ?? "IN_TRANSIT",
      description: e.mensaje!,
      occurredAt: e.fecha ? new Date(e.fecha.replace(" ", "T")) : new Date(),
    }))
    .filter((e) => !Number.isNaN(e.occurredAt.getTime()));

  /*
    El estado final sale del último evento reconocible, no del último evento a
    secas: si el correo manda algo que no entendemos, se conserva el último que
    sí entendimos en vez de retroceder a un genérico.
  */
  const ultimoConocido = [...events]
    .reverse()
    .find((e) => estadoDesdeCondicion(e.description) !== null);

  const porCondicion = envio.condicion ? estadoDesdeCondicion(envio.condicion) : null;
  const status =
    porCondicion ??
    (ultimoConocido ? estadoDesdeCondicion(ultimoConocido.description)! : null) ??
    (envio.tracking_number ? "LABEL_CREATED" : "PENDING");

  return {
    status,
    trackingUrl: envio.tracking_number
      ? `https://seguimiento.enviopack.com/?id=${envio.tracking_number}`
      : null,
    events,
    deliveredAt:
      status === "DELIVERED"
        ? (events.findLast((e) => e.status === "DELIVERED")?.occurredAt ?? new Date())
        : null,
  };
}
