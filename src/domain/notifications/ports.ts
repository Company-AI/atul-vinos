export type NotificationEvent =
  | "order.created" | "order.paid" | "order.ready" | "order.shipped"
  | "order.delivered" | "order.cancelled" | "order.refunded"
  | "subscription.created" | "subscription.upcoming_charge"
  | "subscription.payment_failed" | "subscription.paused"
  | "subscription.cancelled" | "subscription.order_created"
  | "auth.welcome" | "newsletter.confirmed";

export type NotificationRecipient = {
  email: string;
  name?: string | null;
  phone?: string | null;
  userId?: string | null;
};

export type NotificationMessage = {
  subject: string;
  /** Cuerpo en texto plano; el canal lo envuelve en su propia plantilla. */
  body: string;
  /** Bloques opcionales que el email renderiza con la identidad de la marca. */
  heading?: string;
  intro?: string;
  rows?: { label: string; value: string }[];
  items?: { name: string; quantity: number; price?: string }[];
  cta?: { label: string; url: string } | null;
  footnote?: string | null;
};

export interface NotificationChannel {
  readonly code: "EMAIL" | "WHATSAPP" | "SMS";
  isConfigured(): boolean;
  send(recipient: NotificationRecipient, message: NotificationMessage): Promise<void>;
}
