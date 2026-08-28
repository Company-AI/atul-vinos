import { NextResponse } from "next/server";
import { processWebhook } from "@/domain/payments/service";
import { getPaymentProvider } from "@/infra/payments/registry";
import { clientIp, rateLimit } from "@/infra/security/rate-limit";

/**
 * Endpoint de webhooks del proveedor de pagos.
 *
 *  - verifica la firma antes de mirar el contenido
 *  - registra el evento con su payload completo
 *  - es idempotente: el mismo eventId nunca se procesa dos veces
 *  - devuelve 200 cuando el evento quedó resuelto y 500 solo si conviene que
 *    el proveedor reintente
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: providerCode } = await context.params;
  const ip = clientIp(request.headers);

  const limit = rateLimit(`webhook:${providerCode}:${ip}`, { limit: 120, windowSeconds: 60 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const rawBody = await request.text();
  const provider = getPaymentProvider(providerCode);

  const verification = provider.verifyWebhook({
    headers: request.headers,
    rawBody,
    searchParams: new URL(request.url).searchParams,
  });

  if (!verification.valid) {
    console.warn(`[webhook:${providerCode}] rechazado — ${verification.reason}`);
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  const result = await processWebhook({
    providerCode: provider.code,
    verification,
    rawBody,
    headers: {
      "x-request-id": request.headers.get("x-request-id") ?? "",
      "user-agent": request.headers.get("user-agent") ?? "",
    },
  });

  if (result.status === "failed") {
    // 500 para que el proveedor reintente; el evento queda FAILED y
    // reprocesable desde el admin.
    return NextResponse.json({ status: result.status, detail: result.detail }, { status: 500 });
  }

  return NextResponse.json({ status: result.status, eventId: result.eventId }, { status: 200 });
}

/** Algunos proveedores validan el endpoint con un GET. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
