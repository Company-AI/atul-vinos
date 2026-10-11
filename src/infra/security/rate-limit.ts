/**
 * Rate limiting en memoria del proceso.
 *
 * Suficiente para una instancia; con varias réplicas hay que mover el contador
 * a Redis. La interface no cambia: solo se reemplaza el store.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  options: { limit: number; windowSeconds: number },
): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;

  // Limpieza perezosa para que el mapa no crezca sin control.
  if (buckets.size > MAX_KEYS) {
    for (const [k, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: options.limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: options.limit - bucket.count,
    retryAfterSeconds: 0,
  };
}

/** IP del cliente detrás de proxy. */
/**
 * La IP de quien hace el pedido, para contar intentos por visitante.
 *
 * Se mira primero la cabecera que pone Cloudflare, y no por preferencia sino
 * porque es la única que no se puede falsear: Cloudflare la escribe él y pisa
 * cualquier valor que mande el cliente. X-Forwarded-For, en cambio, se va
 * encadenando, y un pedido que ya trae una puesta a mano deja su invento
 * primero en la fila. Con eso alcanza para esquivar el límite de intentos:
 * basta cambiar el valor en cada pedido para parecer siempre alguien nuevo.
 *
 * Queda como respaldo para cuando no hay Cloudflare delante, que es el caso
 * de desarrollo y el de hoy en producción.
 */
export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "desconocida"
  );
}
