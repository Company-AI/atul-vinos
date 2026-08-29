import { nanoid } from "nanoid";
import type {
  CheckoutSession, CheckoutSessionInput, PaymentProvider, PreapprovalInput,
  PreapprovalResult, ProviderPayment, ProviderPaymentStatus, ProviderPreapproval,
  WebhookVerification,
} from "@/domain/payments/ports";
import { prisma } from "@/infra/db/prisma";
import { toNumber } from "@/lib/money";

/**
 * Proveedor de desarrollo.
 *
 * Se usa cuando no hay credenciales de Mercado Pago. Redirige a un simulador
 * interno donde se elige el resultado del pago, y la confirmación viaja por el
 * MISMO webhook que usa producción: el flujo que se prueba en local es el real.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly code = "mock";
  readonly name = "Simulador de pagos (desarrollo)";

  isConfigured(): boolean {
    return process.env.NODE_ENV !== "production";
  }

  async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession> {
    const externalId = `mock-pay-${nanoid(10)}`;
    await prisma.payment.updateMany({
      where: { orderId: input.orderId, status: "PENDING" },
      data: { provider: this.code, externalId, externalStatus: "pending" },
    });

    return {
      providerCode: this.code,
      preferenceId: externalId,
      redirectUrl: `/checkout/simulador/${externalId}`,
      sandbox: true,
    };
  }

  async createPreapproval(_input: PreapprovalInput): Promise<PreapprovalResult> {
    const externalId = `mock-sub-${nanoid(10)}`;
    return {
      externalId,
      status: "pending",
      redirectUrl: `/checkout/simulador/${externalId}?tipo=suscripcion`,
    };
  }

  async getPayment(externalId: string): Promise<ProviderPayment | null> {
    // Cobro de suscripción simulado: el id codifica la suscripción y el
    // resultado, igual que un proveedor real referencia su propio registro.
    if (externalId.startsWith("sim:")) {
      const [, subscriptionExternalId, decision] = externalId.split(":");
      const subscription = await prisma.subscription.findFirst({
        where: { externalId: subscriptionExternalId },
      });
      if (!subscription) return null;

      const approved = decision === "approved";
      return {
        externalId,
        status: approved ? "APPROVED" : "REJECTED",
        externalStatus: approved ? "approved" : "rejected",
        statusDetail: approved ? null : "cc_rejected_insufficient_amount",
        amount: toNumber(subscription.amount),
        externalReference: `subscription-${subscription.number}`,
        paymentMethod: "simulador",
        installments: 1,
        preapprovalId: subscriptionExternalId,
        approvedAt: approved ? new Date() : null,
        raw: { simulated: true, externalId },
      };
    }

    const payment = await prisma.payment.findFirst({
      where: { externalId },
      include: { order: true, subscription: true },
    });
    if (!payment) return null;

    const statusMap: Record<string, ProviderPaymentStatus> = {
      approved: "APPROVED",
      rejected: "REJECTED",
      pending: "PENDING",
      in_process: "IN_PROCESS",
      refunded: "REFUNDED",
    };

    return {
      externalId,
      status: statusMap[payment.externalStatus ?? "pending"] ?? "PENDING",
      externalStatus: payment.externalStatus ?? "pending",
      statusDetail: payment.failureReason,
      amount: toNumber(payment.amount),
      externalReference: payment.externalReference,
      paymentMethod: payment.paymentMethod ?? "simulador",
      installments: payment.installments ?? 1,
      preapprovalId: payment.subscription?.externalId ?? null,
      approvedAt: payment.approvedAt,
      raw: { simulated: true, externalId },
    };
  }

  async getPreapproval(externalId: string): Promise<ProviderPreapproval | null> {
    const subscription = await prisma.subscription.findFirst({ where: { externalId } });
    if (!subscription) return null;
    return {
      externalId,
      status: subscription.externalStatus ?? "authorized",
      nextPaymentDate: subscription.nextChargeAt,
      amount: toNumber(subscription.amount),
      externalReference: `subscription-${subscription.number}`,
      raw: { simulated: true },
    };
  }

  async updatePreapprovalStatus(
    externalId: string,
    status: "paused" | "authorized" | "cancelled",
  ): Promise<void> {
    await prisma.subscription.updateMany({
      where: { externalId },
      data: { externalStatus: status },
    });
  }

  async refund(paymentExternalId: string): Promise<void> {
    await prisma.payment.updateMany({
      where: { externalId: paymentExternalId },
      data: { externalStatus: "refunded" },
    });
  }

  verifyWebhook({ rawBody }: { rawBody: string }): WebhookVerification {
    try {
      const payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
      const data = payload.data as { id?: string } | undefined;
      return {
        valid: true,
        eventId: String(payload.id ?? `mock-${data?.id ?? nanoid(8)}`),
        eventType: String(payload.type ?? "payment"),
        resourceId: data?.id ?? null,
      };
    } catch {
      return { valid: false, reason: "Cuerpo inválido." };
    }
  }
}
