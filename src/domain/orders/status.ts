import type { OrderStatus } from "@prisma/client";

/** Etiquetas para el cliente: nunca se muestran los nombres técnicos. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "Pendiente de pago",
  PAID: "Pagado",
  STOCK_RESERVED: "Pagado",
  PREPARING: "Preparando",
  READY: "Listo para despachar",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

/** Etiquetas para el admin: distinguen reserva de stock. */
export const ORDER_STATUS_ADMIN_LABELS: Record<OrderStatus, string> = {
  ...ORDER_STATUS_LABELS,
  PAID: "Pagado (sin reservar)",
  STOCK_RESERVED: "Stock reservado",
};

export const ORDER_STATUS_TONES: Record<
  OrderStatus,
  "neutral" | "info" | "warning" | "success" | "danger" | "gold" | "dark"
> = {
  PAYMENT_PENDING: "warning",
  PAID: "info",
  STOCK_RESERVED: "info",
  PREPARING: "gold",
  READY: "gold",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "danger",
};

/** Transiciones permitidas. Cualquier otra combinación se rechaza. */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PAYMENT_PENDING: ["PAID", "STOCK_RESERVED", "CANCELLED"],
  PAID: ["STOCK_RESERVED", "PREPARING", "CANCELLED", "REFUNDED"],
  STOCK_RESERVED: ["PREPARING", "CANCELLED", "REFUNDED"],
  PREPARING: ["READY", "CANCELLED", "REFUNDED"],
  READY: ["SHIPPED", "PREPARING", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Estados que el depósito debe preparar. */
export const PICKING_STATUSES: OrderStatus[] = ["STOCK_RESERVED", "PREPARING"];

/** Estados que cuentan como venta concretada. */
export const REVENUE_STATUSES: OrderStatus[] = [
  "PAID", "STOCK_RESERVED", "PREPARING", "READY", "SHIPPED", "DELIVERED",
];

/** Pasos visibles del timeline del cliente. */
export const CUSTOMER_TIMELINE: { status: OrderStatus; label: string }[] = [
  { status: "PAID", label: "Pago confirmado" },
  { status: "PREPARING", label: "Preparando tu pedido" },
  { status: "READY", label: "Listo para despachar" },
  { status: "SHIPPED", label: "En camino" },
  { status: "DELIVERED", label: "Entregado" },
];
