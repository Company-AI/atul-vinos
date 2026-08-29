"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/infra/db/prisma";
import { assertPermission } from "@/infra/auth/guards";
import { recordAudit } from "@/domain/audit/service";
import { reprocessWebhookEvent } from "@/domain/payments/service";
import { registerCyclePayment } from "@/domain/subscriptions/service";
import { toNumber } from "@/lib/money";

export type PaymentActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/** Reprocesa un webhook guardado (spec §59). */
export async function reprocessWebhook(webhookEventId: string): Promise<PaymentActionResult> {
  let user;
  try {
    user = await assertPermission("payments.manage");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const result = await reprocessWebhookEvent(webhookEventId);

  await recordAudit(user, {
    action: "webhook.reprocess",
    entityType: "WebhookEvent",
    entityId: webhookEventId,
    after: { status: result.status },
  });

  revalidatePath("/admin/pagos");

  if (result.status === "failed") {
    return { ok: false, error: `No se pudo procesar: ${result.detail}` };
  }
  return {
    ok: true,
    message:
      result.status === "duplicated"
        ? "El evento ya estaba procesado."
        : result.status === "ignored"
          ? `Evento ignorado: ${result.detail}`
          : `Procesado: ${result.detail}`,
  };
}

/**
 * Recupera manualmente un cobro de suscripción que el proveedor ya acreditó
 * pero que no llegó por webhook. Genera el ciclo y el pedido.
 */
export async function recoverSubscriptionPayment(input: {
  subscriptionId: string;
  externalPaymentId?: string;
}): Promise<PaymentActionResult> {
  let user;
  try {
    user = await assertPermission("payments.manage");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: input.subscriptionId },
  });
  if (!subscription) return { ok: false, error: "Suscripción inexistente." };

  const result = await registerCyclePayment({
    subscriptionId: subscription.id,
    amount: toNumber(subscription.amount),
    externalPaymentId: input.externalPaymentId ?? null,
    paymentMethod: "recuperado-manual",
    chargedAt: new Date(),
  });

  if (!result.ok) return { ok: false, error: result.error };

  await recordAudit(user, {
    action: "payments.recover",
    entityType: "Subscription",
    entityId: subscription.id,
    after: { cycleId: result.data.cycleId, orderId: result.data.orderId },
  });

  revalidatePath("/admin/pagos");
  revalidatePath(`/admin/suscripciones/${subscription.id}`);
  return {
    ok: true,
    message: result.data.duplicated
      ? "El ciclo de este período ya estaba registrado."
      : "Cobro registrado: se generó el ciclo y el pedido.",
  };
}
