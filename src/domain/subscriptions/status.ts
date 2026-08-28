import type { CycleStatus, SubscriptionStatus } from "@prisma/client";

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  PENDING: "Pendiente de autorización",
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  PAYMENT_FAILED: "Pago rechazado",
  EXPIRED: "Vencida",
  CANCELLED: "Cancelada",
};

export const SUBSCRIPTION_STATUS_TONES: Record<
  SubscriptionStatus,
  "neutral" | "info" | "warning" | "success" | "danger" | "gold"
> = {
  PENDING: "warning",
  ACTIVE: "success",
  PAUSED: "neutral",
  PAYMENT_FAILED: "danger",
  EXPIRED: "warning",
  CANCELLED: "neutral",
};

export const CYCLE_STATUS_LABELS: Record<CycleStatus, string> = {
  SCHEDULED: "Programado",
  PENDING_PAYMENT: "Esperando pago",
  PAID: "Pagado",
  PAYMENT_FAILED: "Pago rechazado",
  SKIPPED: "Omitido",
  CANCELLED: "Cancelado",
};

/** Estados que otorgan beneficios y generan ciclos futuros. */
export const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ["ACTIVE"];

export const FREQUENCY_MONTHS = { MONTHLY: 1, BIMONTHLY: 2, QUARTERLY: 3 } as const;

export const FREQUENCY_LABELS = {
  MONTHLY: "Mensual",
  BIMONTHLY: "Cada dos meses",
  QUARTERLY: "Trimestral",
} as const;
