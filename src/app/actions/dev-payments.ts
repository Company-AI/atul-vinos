"use server";

import { nanoid } from "nanoid";
import { prisma } from "@/infra/db/prisma";
import { processWebhook } from "@/domain/payments/service";

/**
 * Simulador de pagos para desarrollo.
 *
 * Dispara exactamente el mismo procesamiento que un webhook real del proveedor,
 * así el flujo que se prueba en local es el que corre en producción.
 * Bloqueado en producción.
 */
export async function simulateProviderEvent(input: {
  externalId: string;
  decision: "approved" | "rejected" | "pending";
}): Promise<{ ok: true; detail: string } | { ok: false; error: string }> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "El simulador no está disponible en producción." };
  }

  const { externalId, decision } = input;
  let resourceId = externalId;

  if (externalId.startsWith("mock-sub-")) {
    // Cobro de suscripción: el id sintético lleva la decisión.
    resourceId = `sim:${externalId}:${decision}`;
  } else {
    const payment = await prisma.payment.findFirst({ where: { externalId } });
    if (!payment) return { ok: false, error: "No encontramos el pago simulado." };

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalStatus: decision,
        paymentMethod: "simulador",
        failureReason: decision === "rejected" ? "cc_rejected_insufficient_amount" : null,
      },
    });
  }

  const result = await processWebhook({
    providerCode: "mock",
    verification: {
      valid: true,
      eventId: `sim-${nanoid(12)}`,
      eventType: "payment",
      resourceId,
    },
    rawBody: JSON.stringify({
      id: `sim-${nanoid(8)}`,
      type: "payment",
      data: { id: resourceId },
      simulated: true,
    }),
  });

  if (result.status === "failed") return { ok: false, error: result.detail };
  return {
    ok: true,
    detail: result.status === "processed" ? result.detail : `Evento ${result.status}.`,
  };
}
