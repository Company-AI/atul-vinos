import {
  MercadoPagoConfig, Payment, PreApproval, PaymentRefund, Preference,
  WebhookSignatureValidator, InvalidWebhookSignatureError,
} from "mercadopago";
import type {
  CheckoutSession, CheckoutSessionInput, PaymentProvider, PreapprovalInput,
  PreapprovalResult, ProviderPayment, ProviderPaymentStatus, ProviderPreapproval,
  WebhookVerification,
} from "@/domain/payments/ports";

/** Mapeo de estados de Mercado Pago a los estados del dominio. */
const STATUS_MAP: Record<string, ProviderPaymentStatus> = {
  pending: "PENDING",
  in_process: "IN_PROCESS",
  in_mediation: "IN_PROCESS",
  authorized: "IN_PROCESS",
  approved: "APPROVED",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
  charged_back: "CHARGED_BACK",
};

export class MercadoPagoProvider implements PaymentProvider {
  readonly code = "mercadopago";
  readonly name = "Mercado Pago";

  private client(): MercadoPagoConfig {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) throw new Error("MP_ACCESS_TOKEN no configurado.");
    return new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } });
  }

  isConfigured(): boolean {
    return Boolean(process.env.MP_ACCESS_TOKEN);
  }

  async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession> {
    const preference = new Preference(this.client());

    const response = await preference.create({
      body: {
        items: input.items.map((item, index) => ({
          id: item.sku ?? `item-${index}`,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          currency_id: input.currency,
        })),
        payer: {
          name: input.payer.firstName,
          surname: input.payer.lastName,
          email: input.payer.email,
          ...(input.payer.documentId
            ? { identification: { type: "DNI", number: input.payer.documentId } }
            : {}),
        },
        external_reference: input.externalReference,
        statement_descriptor: input.statementDescriptor,
        back_urls: {
          success: input.successUrl,
          failure: input.failureUrl,
          pending: input.pendingUrl,
        },
        auto_return: "approved",
        notification_url: input.notificationUrl,
        payment_methods: input.maxInstallments
          ? { installments: input.maxInstallments }
          : undefined,
        metadata: { order_id: input.orderId, order_number: input.orderNumber },
      },
      requestOptions: { idempotencyKey: input.idempotencyKey },
    });

    const sandbox = !process.env.MP_ACCESS_TOKEN?.startsWith("APP_USR");
    const redirectUrl =
      (sandbox ? response.sandbox_init_point : response.init_point) ??
      response.init_point ??
      response.sandbox_init_point;

    if (!redirectUrl) throw new Error("Mercado Pago no devolvió una URL de checkout.");

    return {
      providerCode: this.code,
      preferenceId: response.id ?? null,
      redirectUrl,
      sandbox,
    };
  }

  async createPreapproval(input: PreapprovalInput): Promise<PreapprovalResult> {
    const preapproval = new PreApproval(this.client());

    const response = await preapproval.create({
      body: {
        reason: input.planName,
        external_reference: input.externalReference,
        payer_email: input.payerEmail,
        back_url: input.backUrl,
        auto_recurring: {
          frequency: input.frequencyMonths,
          frequency_type: "months",
          transaction_amount: input.amount,
          currency_id: input.currency,
          ...(input.startDate ? { start_date: input.startDate.toISOString() } : {}),
        },
        status: "pending",
      },
    });

    if (!response.id) throw new Error("Mercado Pago no devolvió el id de la suscripción.");

    return {
      externalId: response.id,
      status: response.status ?? "pending",
      redirectUrl: response.init_point ?? null,
    };
  }

  async getPayment(externalId: string): Promise<ProviderPayment | null> {
    const payment = new Payment(this.client());
    const response = await payment.get({ id: externalId });
    if (!response?.id) return null;

    return {
      externalId: String(response.id),
      status: STATUS_MAP[response.status ?? "pending"] ?? "PENDING",
      externalStatus: response.status ?? "pending",
      statusDetail: response.status_detail ?? null,
      amount: response.transaction_amount ?? 0,
      externalReference: response.external_reference ?? null,
      paymentMethod: response.payment_method_id ?? null,
      installments: response.installments ?? null,
      preapprovalId:
        (response.metadata as Record<string, unknown> | undefined)?.preapproval_id as string ??
        // Los cobros recurrentes llegan con el id de la suscripción en este campo.
        (response as { preapproval_id?: string }).preapproval_id ??
        null,
      approvedAt: response.date_approved ? new Date(response.date_approved) : null,
      raw: response,
    };
  }

  async getPreapproval(externalId: string): Promise<ProviderPreapproval | null> {
    const preapproval = new PreApproval(this.client());
    const response = await preapproval.get({ id: externalId });
    if (!response?.id) return null;

    return {
      externalId: String(response.id),
      status: response.status ?? "pending",
      nextPaymentDate: response.next_payment_date ? new Date(response.next_payment_date) : null,
      amount: response.auto_recurring?.transaction_amount ?? null,
      externalReference: response.external_reference ?? null,
      raw: response,
    };
  }

  async updatePreapprovalStatus(
    externalId: string,
    status: "paused" | "authorized" | "cancelled",
  ): Promise<void> {
    const preapproval = new PreApproval(this.client());
    await preapproval.update({ id: externalId, body: { status } });
  }

  async refund(paymentExternalId: string, amount?: number): Promise<void> {
    const refund = new PaymentRefund(this.client());
    await refund.create({
      payment_id: paymentExternalId,
      body: amount ? { amount } : {},
    });
  }

  /**
   * Verifica la firma del webhook con el validador oficial del SDK.
   * Sin secreto configurado no se acepta el evento en producción.
   */
  verifyWebhook({
    headers,
    rawBody,
    searchParams,
  }: {
    headers: Headers;
    rawBody: string;
    searchParams: URLSearchParams;
  }): WebhookVerification {
    let payload: Record<string, unknown> = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return { valid: false, reason: "El cuerpo del webhook no es JSON válido." };
    }

    const data = payload.data as { id?: string } | undefined;
    const dataId = data?.id ?? searchParams.get("data.id") ?? searchParams.get("id");
    const eventType = String(payload.type ?? payload.topic ?? searchParams.get("type") ?? "unknown");
    const requestId = headers.get("x-request-id");

    // El id del evento es lo que garantiza idempotencia.
    const eventId = String(payload.id ?? requestId ?? `${eventType}-${dataId ?? "sin-id"}`);

    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === "production") {
        return { valid: false, reason: "MP_WEBHOOK_SECRET no configurado." };
      }
      // En desarrollo se acepta sin firma para poder probar el flujo completo.
      return { valid: true, eventId, eventType, resourceId: dataId ?? null };
    }

    try {
      WebhookSignatureValidator.validate({
        xSignature: headers.get("x-signature"),
        xRequestId: requestId,
        dataId,
        secret,
      });
      return { valid: true, eventId, eventType, resourceId: dataId ?? null };
    } catch (error) {
      const reason =
        error instanceof InvalidWebhookSignatureError
          ? `Firma inválida: ${error.reason}`
          : "Firma inválida.";
      return { valid: false, reason };
    }
  }
}
