/**
 * Contrato de pagos. El dominio no sabe qué proveedor hay detrás: solo pide
 * una sesión de checkout, una suscripción recurrente o el estado de un pago.
 */

export type PaymentItem = {
  title: string;
  quantity: number;
  unitPrice: number;
  sku?: string;
};

export type CheckoutSessionInput = {
  orderId: string;
  orderNumber: number;
  amount: number;
  currency: string;
  items: PaymentItem[];
  payer: { firstName: string; lastName: string; email: string; phone?: string | null; documentId?: string | null };
  externalReference: string;
  idempotencyKey: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl: string;
  statementDescriptor?: string;
  maxInstallments?: number;
};

export type CheckoutSession = {
  providerCode: string;
  preferenceId: string | null;
  /** URL a la que se redirige al comprador. */
  redirectUrl: string;
  sandbox: boolean;
};

export type PreapprovalInput = {
  subscriptionId: string;
  planName: string;
  amount: number;
  currency: string;
  /** Frecuencia en meses. */
  frequencyMonths: number;
  payerEmail: string;
  externalReference: string;
  backUrl: string;
  notificationUrl: string;
  startDate?: Date;
};

export type PreapprovalResult = {
  externalId: string;
  status: string;
  redirectUrl: string | null;
};

export type ProviderPaymentStatus =
  | "PENDING" | "IN_PROCESS" | "APPROVED" | "REJECTED"
  | "REFUNDED" | "CANCELLED" | "CHARGED_BACK";

export type ProviderPayment = {
  externalId: string;
  status: ProviderPaymentStatus;
  externalStatus: string;
  statusDetail: string | null;
  amount: number;
  externalReference: string | null;
  paymentMethod: string | null;
  installments: number | null;
  /** Presente cuando el pago corresponde a una suscripción recurrente. */
  preapprovalId: string | null;
  approvedAt: Date | null;
  raw: unknown;
};

export type ProviderPreapproval = {
  externalId: string;
  status: string;
  /** authorized | paused | cancelled | pending */
  nextPaymentDate: Date | null;
  amount: number | null;
  externalReference: string | null;
  raw: unknown;
};

export type WebhookVerification =
  | { valid: true; eventId: string; eventType: string; resourceId: string | null }
  | { valid: false; reason: string };

export interface PaymentProvider {
  readonly code: string;
  readonly name: string;
  isConfigured(): boolean;
  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession>;
  createPreapproval(input: PreapprovalInput): Promise<PreapprovalResult>;
  getPayment(externalId: string): Promise<ProviderPayment | null>;
  getPreapproval(externalId: string): Promise<ProviderPreapproval | null>;
  updatePreapprovalStatus(externalId: string, status: "paused" | "authorized" | "cancelled"): Promise<void>;
  refund(paymentExternalId: string, amount?: number): Promise<void>;
  verifyWebhook(params: {
    headers: Headers;
    rawBody: string;
    searchParams: URLSearchParams;
  }): WebhookVerification;
}
