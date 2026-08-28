import { prisma } from "@/infra/db/prisma";
import { getPaymentProvider } from "@/infra/payments/registry";
import { markOrderPaid, markPaymentRejected } from "@/domain/orders/fulfillment";
import {
  registerCycleFailure, registerCyclePayment, syncSubscriptionStatus,
} from "@/domain/subscriptions/service";
import { getSettings } from "@/domain/settings/service";
import { err, ok, type Result } from "@/lib/result";
import { toNumber } from "@/lib/money";
import type { WebhookVerification } from "./ports";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Crea la sesión de pago del pedido y devuelve la URL del proveedor. */
export async function startOrderCheckout(
  orderId: string,
): Promise<Result<{ redirectUrl: string; providerCode: string }>> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: { where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order) return err("Pedido inexistente.", "NOT_FOUND");
  if (order.status !== "PAYMENT_PENDING") {
    return err("El pedido ya no está esperando pago.", "ALREADY_PAID");
  }

  const payment = order.payments[0];
  if (!payment) return err("El pedido no tiene un pago pendiente.", "NO_PAYMENT");

  const settings = await getSettings();
  const provider = getPaymentProvider();
  const [firstName, ...rest] = order.customerName.split(" ");

  try {
    const session = await provider.createCheckoutSession({
      orderId: order.id,
      orderNumber: order.number,
      amount: toNumber(order.total),
      currency: order.currency,
      items: [
        ...order.items.map((item) => ({
          title: item.name,
          quantity: item.quantity,
          unitPrice: toNumber(item.unitPrice),
          sku: item.sku,
        })),
        ...(toNumber(order.shippingTotal) > 0
          ? [{ title: "Envío", quantity: 1, unitPrice: toNumber(order.shippingTotal) }]
          : []),
        ...(toNumber(order.discountTotal) > 0
          ? [{ title: "Descuentos", quantity: 1, unitPrice: -toNumber(order.discountTotal) }]
          : []),
      ],
      payer: {
        firstName,
        lastName: rest.join(" "),
        email: order.customerEmail,
        phone: order.customerPhone,
        documentId: order.customerDocument,
      },
      externalReference: `order-${order.number}`,
      idempotencyKey: payment.idempotencyKey,
      successUrl: `${siteUrl()}/checkout/estado/${order.number}`,
      failureUrl: `${siteUrl()}/checkout/estado/${order.number}`,
      pendingUrl: `${siteUrl()}/checkout/estado/${order.number}`,
      notificationUrl: `${siteUrl()}/api/webhooks/${provider.code}`,
      statementDescriptor: settings.payments.statementDescriptor,
      maxInstallments: settings.payments.installmentsEnabled
        ? settings.payments.maxInstallments
        : 1,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { provider: session.providerCode, preferenceId: session.preferenceId },
    });

    return ok({ redirectUrl: session.redirectUrl, providerCode: session.providerCode });
  } catch (error) {
    return err(
      error instanceof Error ? error.message : "No pudimos iniciar el pago.",
      "PROVIDER_ERROR",
    );
  }
}

export type WebhookResult =
  | { status: "duplicated"; eventId: string }
  | { status: "processed"; eventId: string; detail: string }
  | { status: "ignored"; eventId: string; detail: string }
  | { status: "failed"; eventId: string; detail: string };

/**
 * Procesa un webhook del proveedor de pagos.
 *
 * Garantías:
 *  - idempotencia por (provider, eventId): el mismo evento nunca se procesa dos veces
 *  - todo evento queda registrado con su payload, para poder reprocesar desde el admin
 *  - la confirmación de pago viene de acá, nunca del redirect del navegador
 */
export async function processWebhook(params: {
  providerCode: string;
  verification: Extract<WebhookVerification, { valid: true }>;
  rawBody: string;
  headers?: Record<string, string>;
}): Promise<WebhookResult> {
  const { providerCode, verification } = params;
  const payload = safeJson(params.rawBody);

  // Registro + idempotencia en un solo paso.
  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider: providerCode, eventId: verification.eventId } },
  });

  if (existing && existing.status === "PROCESSED") {
    return { status: "duplicated", eventId: verification.eventId };
  }

  const event = existing
    ? await prisma.webhookEvent.update({
        where: { id: existing.id },
        data: { status: "PROCESSING", attempts: { increment: 1 } },
      })
    : await prisma.webhookEvent.create({
        data: {
          provider: providerCode,
          eventId: verification.eventId,
          eventType: verification.eventType,
          status: "PROCESSING",
          payload: payload as object,
          headers: params.headers ? (params.headers as object) : undefined,
          attempts: 1,
        },
      });

  try {
    const result = await dispatchEvent(providerCode, verification);

    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: result.status === "ignored" ? "IGNORED" : "PROCESSED",
        processedAt: new Date(),
        error: null,
      },
    });

    return { ...result, eventId: verification.eventId };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error desconocido";
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { status: "FAILED", error: detail },
    });
    return { status: "failed", eventId: verification.eventId, detail };
  }
}

async function dispatchEvent(
  providerCode: string,
  verification: Extract<WebhookVerification, { valid: true }>,
): Promise<{ status: "processed" | "ignored"; detail: string }> {
  const provider = getPaymentProvider(providerCode);
  const type = verification.eventType.toLowerCase();
  const resourceId = verification.resourceId;

  if (!resourceId) return { status: "ignored", detail: "El evento no trae recurso asociado." };

  // ─── Suscripciones: cambios del contrato ──────────────────────────────────
  if (type.includes("preapproval") || type.includes("subscription_preapproval")) {
    await syncSubscriptionStatus(resourceId);
    return { status: "processed", detail: `Suscripción ${resourceId} sincronizada.` };
  }

  // ─── Pagos ────────────────────────────────────────────────────────────────
  if (type.includes("payment")) {
    const remote = await provider.getPayment(resourceId);
    if (!remote) return { status: "ignored", detail: `Pago ${resourceId} inexistente.` };

    // 1) ¿Es un cobro de suscripción?
    const subscription = await findSubscription(remote.preapprovalId, remote.externalReference);
    if (subscription) {
      if (remote.status === "APPROVED") {
        const result = await registerCyclePayment({
          subscriptionId: subscription.id,
          amount: remote.amount || toNumber(subscription.amount),
          externalPaymentId: remote.externalId,
          paymentMethod: remote.paymentMethod,
          rawPayload: remote.raw,
          chargedAt: remote.approvedAt ?? new Date(),
        });
        if (!result.ok) throw new Error(result.error);
        return {
          status: "processed",
          detail: result.data.duplicated
            ? `Ciclo ya registrado para la suscripción #${subscription.number}.`
            : `Ciclo y pedido generados para la suscripción #${subscription.number}.`,
        };
      }

      if (remote.status === "REJECTED" || remote.status === "CANCELLED") {
        const result = await registerCycleFailure({
          subscriptionId: subscription.id,
          amount: remote.amount || toNumber(subscription.amount),
          reason: remote.statusDetail,
          externalPaymentId: remote.externalId,
          failedAt: new Date(),
          rawPayload: remote.raw,
        });
        if (!result.ok) throw new Error(result.error);
        return { status: "processed", detail: `Cobro rechazado de la suscripción #${subscription.number}.` };
      }

      return { status: "ignored", detail: `Pago de suscripción en estado ${remote.externalStatus}.` };
    }

    // 2) Pago de un pedido de tienda.
    const payment = await findOrderPayment(remote.externalId, remote.externalReference);
    if (!payment) {
      return { status: "ignored", detail: `Pago ${resourceId} sin pedido asociado.` };
    }

    if (remote.status === "APPROVED") {
      const result = await markOrderPaid({
        orderId: payment.orderId!,
        paymentId: payment.id,
        externalPaymentId: remote.externalId,
        paymentMethod: remote.paymentMethod,
        installments: remote.installments,
        rawPayload: remote.raw,
      });
      if (!result.ok) throw new Error(result.error);
      return { status: "processed", detail: `Pedido pagado y stock reservado.` };
    }

    if (remote.status === "REJECTED" || remote.status === "CANCELLED") {
      await markPaymentRejected({
        paymentId: payment.id,
        reason: remote.statusDetail,
        rawPayload: remote.raw,
      });
      return { status: "processed", detail: "Pago rechazado registrado." };
    }

    if (remote.status === "REFUNDED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED", externalStatus: remote.externalStatus },
      });
      return { status: "processed", detail: "Reembolso registrado." };
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "IN_PROCESS", externalStatus: remote.externalStatus },
    });
    return { status: "processed", detail: `Pago en estado ${remote.externalStatus}.` };
  }

  return { status: "ignored", detail: `Tipo de evento no manejado: ${verification.eventType}.` };
}

async function findSubscription(preapprovalId: string | null, externalReference: string | null) {
  if (preapprovalId) {
    const byExternal = await prisma.subscription.findFirst({
      where: { externalId: preapprovalId },
    });
    if (byExternal) return byExternal;
  }
  if (externalReference?.startsWith("subscription-")) {
    const number = Number(externalReference.replace("subscription-", ""));
    if (Number.isFinite(number)) {
      return prisma.subscription.findUnique({ where: { number } });
    }
  }
  return null;
}

async function findOrderPayment(externalId: string, externalReference: string | null) {
  const byExternal = await prisma.payment.findFirst({
    where: { externalId, orderId: { not: null } },
  });
  if (byExternal) return byExternal;

  if (externalReference?.startsWith("order-")) {
    const number = Number(externalReference.replace("order-", ""));
    if (Number.isFinite(number)) {
      const order = await prisma.order.findUnique({
        where: { number },
        include: {
          payments: { where: { status: { in: ["PENDING", "IN_PROCESS"] } }, orderBy: { createdAt: "desc" }, take: 1 },
        },
      });
      return order?.payments[0] ?? null;
    }
  }
  return null;
}

function safeJson(raw: string): unknown {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { raw };
  }
}

/** Reprocesa un webhook desde el admin (spec §59). */
export async function reprocessWebhookEvent(webhookEventId: string): Promise<WebhookResult> {
  const event = await prisma.webhookEvent.findUnique({ where: { id: webhookEventId } });
  if (!event) return { status: "failed", eventId: webhookEventId, detail: "Evento inexistente." };

  const payload = event.payload as { data?: { id?: string }; type?: string };

  await prisma.webhookEvent.update({
    where: { id: event.id },
    data: { status: "RECEIVED", error: null },
  });

  return processWebhook({
    providerCode: event.provider,
    verification: {
      valid: true,
      eventId: event.eventId,
      eventType: event.eventType ?? payload.type ?? "payment",
      resourceId: payload.data?.id ?? null,
    },
    rawBody: JSON.stringify(event.payload),
  });
}
