import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/infra/db/prisma";
import {
  consumeStockForOrder, releaseStockForOrder, reserveStockForOrder, returnStockForOrder,
} from "@/domain/inventory/service";
import { registerCouponUsage } from "@/domain/promotions/coupons";
import { notify } from "@/domain/notifications/service";
import { createShipmentForOrder } from "@/domain/shipping/service";
import { err, ok, type Result } from "@/lib/result";
import { formatARS, toCents, toNumber } from "@/lib/money";
import { canTransition, ORDER_STATUS_LABELS } from "./status";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Confirma el pago de un pedido y reserva el stock, todo en una transacción.
 *
 * Es idempotente: si el pedido ya está pagado, no duplica nada. La llama el
 * webhook del proveedor de pagos, nunca el redirect del navegador (spec §13).
 */
export async function markOrderPaid(params: {
  orderId: string;
  paymentId?: string | null;
  externalPaymentId?: string | null;
  paymentMethod?: string | null;
  installments?: number | null;
  rawPayload?: unknown;
}): Promise<Result<{ status: OrderStatus }>> {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { items: true },
  });
  if (!order) return err("Pedido inexistente.", "NOT_FOUND");

  // Idempotencia: ya procesado.
  if (order.status !== "PAYMENT_PENDING") {
    return ok({ status: order.status });
  }

  const targetStatus: OrderStatus = "STOCK_RESERVED";

  try {
    await prisma.$transaction(async (tx) => {
      if (params.paymentId) {
        await tx.payment.update({
          where: { id: params.paymentId },
          data: {
            status: "APPROVED",
            externalId: params.externalPaymentId ?? undefined,
            externalStatus: "approved",
            paymentMethod: params.paymentMethod ?? undefined,
            installments: params.installments ?? undefined,
            approvedAt: new Date(),
            rawPayload: params.rawPayload
              ? (params.rawPayload as object)
              : undefined,
          },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: new Date() },
      });

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "payment",
          fromStatus: "PAYMENT_PENDING",
          toStatus: "PAID",
          message: "Pago confirmado por el proveedor",
        },
      });

      // Reserva de stock: si falla, la transacción entera se revierte y el
      // pedido queda pendiente para revisión manual.
      await reserveStockForOrder(tx, order.id);

      await tx.order.update({
        where: { id: order.id },
        data: { status: targetStatus },
      });

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "status_change",
          fromStatus: "PAID",
          toStatus: targetStatus,
          message: "Stock reservado",
        },
      });

      if (order.couponId) {
        await registerCouponUsage({
          couponId: order.couponId,
          orderId: order.id,
          userId: order.userId,
          email: order.customerEmail,
          amountCents: toCents(order.discountTotal),
          tx,
        });
      }

      // El carrito ya cumplió su función.
      await tx.cartItem.deleteMany({
        where: { cart: { userId: order.userId ?? undefined } },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos reservar el stock.";
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "note",
        message: `Pago aprobado pero la reserva de stock falló: ${message}`,
      },
    });
    return err(message, "RESERVE_FAILED");
  }

  await notify(
    "order.paid",
    { email: order.customerEmail, name: order.customerName, userId: order.userId },
    {
      subject: `Pago confirmado — pedido #${order.number}`,
      heading: "Recibimos tu pago",
      intro: `Gracias ${order.customerName.split(" ")[0]}. Ya estamos preparando tu pedido #${order.number}.`,
      body: `Pago confirmado del pedido #${order.number}. Total ${formatARS(order.total)}.`,
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: formatARS(i.lineTotal),
      })),
      rows: [
        { label: "Subtotal", value: formatARS(order.subtotal) },
        ...(toNumber(order.discountTotal) > 0
          ? [{ label: "Descuentos", value: `−${formatARS(order.discountTotal)}` }]
          : []),
        { label: "Envío", value: toNumber(order.shippingTotal) === 0 ? "Sin cargo" : formatARS(order.shippingTotal) },
        { label: "Total", value: formatARS(order.total) },
      ],
      cta: { label: "Ver mi pedido", url: `${siteUrl()}/mi-cuenta/pedidos` },
    },
    { type: "Order", id: order.id },
  );

  return ok({ status: targetStatus });
}

/** Marca el pago como rechazado sin tocar stock ni generar despacho. */
export async function markPaymentRejected(params: {
  paymentId: string;
  reason?: string | null;
  rawPayload?: unknown;
}): Promise<void> {
  const payment = await prisma.payment.update({
    where: { id: params.paymentId },
    data: {
      status: "REJECTED",
      externalStatus: "rejected",
      failureReason: params.reason ?? null,
      rawPayload: params.rawPayload ? (params.rawPayload as object) : undefined,
    },
    include: { order: true },
  });

  if (payment.order) {
    await prisma.orderEvent.create({
      data: {
        orderId: payment.order.id,
        type: "payment",
        message: `Pago rechazado${params.reason ? `: ${params.reason}` : ""}`,
      },
    });
  }
}

export type TransitionOptions = {
  actorEmail?: string | null;
  actorId?: string | null;
  message?: string | null;
  /** Al despachar: crea el envío si todavía no existe. */
  createShipment?: boolean;
  /** Al reembolsar: devuelve la mercadería al stock. */
  restock?: boolean;
};

/**
 * Cambia el estado de un pedido aplicando los efectos de inventario y
 * notificación correspondientes. Rechaza transiciones no permitidas.
 */
export async function transitionOrder(
  orderId: string,
  to: OrderStatus,
  options: TransitionOptions = {},
): Promise<Result<{ status: OrderStatus }>> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shipments: true },
  });
  if (!order) return err("Pedido inexistente.", "NOT_FOUND");
  if (order.status === to) return ok({ status: to });

  if (!canTransition(order.status, to)) {
    return err(
      `No se puede pasar de "${ORDER_STATUS_LABELS[order.status]}" a "${ORDER_STATUS_LABELS[to]}".`,
      "INVALID_TRANSITION",
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const now = new Date();
      const data: Record<string, unknown> = { status: to };

      switch (to) {
        case "STOCK_RESERVED":
          await reserveStockForOrder(tx, order.id, options.actorId);
          break;
        case "READY":
          data.preparedAt = now;
          break;
        case "SHIPPED":
          await consumeStockForOrder(tx, order.id, options.actorId);
          data.shippedAt = now;
          if (!data.preparedAt && !order.preparedAt) data.preparedAt = now;
          break;
        case "DELIVERED":
          data.deliveredAt = now;
          break;
        case "CANCELLED":
          await releaseStockForOrder(tx, order.id, options.actorId);
          data.cancelledAt = now;
          break;
        case "REFUNDED":
          if (order.status === "SHIPPED" || order.status === "DELIVERED") {
            if (options.restock) await returnStockForOrder(tx, order.id, options.actorId);
          } else {
            await releaseStockForOrder(tx, order.id, options.actorId);
          }
          data.cancelledAt = order.cancelledAt ?? now;
          break;
      }

      await tx.order.update({ where: { id: order.id }, data });
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "status_change",
          fromStatus: order.status,
          toStatus: to,
          message: options.message ?? null,
          actorEmail: options.actorEmail ?? null,
        },
      });

      if (to === "SHIPPED") {
        const shipment = order.shipments.find((s) => s.status !== "CANCELLED");
        if (shipment) {
          await tx.shipment.update({
            where: { id: shipment.id },
            data: { status: "DISPATCHED", dispatchedAt: now },
          });
          await tx.shipmentEvent.create({
            data: { shipmentId: shipment.id, status: "DISPATCHED", description: "Despachado" },
          });
        }
      }

      if (to === "DELIVERED") {
        const shipment = order.shipments.find((s) => s.status !== "CANCELLED");
        if (shipment) {
          await tx.shipment.update({
            where: { id: shipment.id },
            data: { status: "DELIVERED", deliveredAt: now },
          });
          await tx.shipmentEvent.create({
            data: { shipmentId: shipment.id, status: "DELIVERED", description: "Entregado" },
          });
        }
      }
    });
  } catch (error) {
    return err(
      error instanceof Error ? error.message : "No pudimos actualizar el pedido.",
      "TRANSITION_FAILED",
    );
  }

  // El envío se crea fuera de la transacción: depende de un proveedor externo.
  if (options.createShipment && (to === "READY" || to === "PREPARING")) {
    try {
      await createShipmentForOrder(order.id);
    } catch (error) {
      console.error(`[pedidos] No se pudo crear el envío del pedido ${order.number}:`, error);
    }
  }

  await notifyStatusChange(order.id, to);
  return ok({ status: to });
}

async function notifyStatusChange(orderId: string, status: OrderStatus): Promise<void> {
  const events: Partial<Record<OrderStatus, { event: Parameters<typeof notify>[0]; subject: string; heading: string; intro: string }>> = {
    READY: {
      event: "order.ready",
      subject: "Tu pedido está listo",
      heading: "Tu pedido está embalado",
      intro: "Lo despachamos en las próximas horas y te enviamos el seguimiento.",
    },
    SHIPPED: {
      event: "order.shipped",
      subject: "Tu pedido salió del depósito",
      heading: "Tu pedido está en camino",
      intro: "Ya lo entregamos al transportista.",
    },
    DELIVERED: {
      event: "order.delivered",
      subject: "Tu pedido fue entregado",
      heading: "Tu pedido llegó",
      intro: "Esperamos que lo disfrutes. Si algo no está bien, escribinos.",
    },
    CANCELLED: {
      event: "order.cancelled",
      subject: "Tu pedido fue cancelado",
      heading: "Cancelamos tu pedido",
      intro: "Si el pago ya se había acreditado, el reintegro se procesa por el mismo medio.",
    },
    REFUNDED: {
      event: "order.refunded",
      subject: "Reembolsamos tu pedido",
      heading: "Tu reembolso está en curso",
      intro: "El plazo depende de tu medio de pago.",
    },
  };

  const config = events[status];
  if (!config) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shipments: { orderBy: { createdAt: "desc" }, take: 1, include: { carrier: true } } },
  });
  if (!order) return;

  const shipment = order.shipments[0];

  await notify(
    config.event,
    { email: order.customerEmail, name: order.customerName, userId: order.userId },
    {
      subject: `${config.subject} — pedido #${order.number}`,
      heading: config.heading,
      intro: config.intro,
      body: `${config.subject}. Pedido #${order.number}.`,
      rows: shipment?.trackingNumber
        ? [
            { label: "Transportista", value: shipment.carrier?.name ?? "—" },
            { label: "Seguimiento", value: shipment.trackingNumber },
          ]
        : undefined,
      cta: shipment?.trackingUrl
        ? { label: "Seguir mi envío", url: shipment.trackingUrl.startsWith("http") ? shipment.trackingUrl : `${siteUrl()}${shipment.trackingUrl}` }
        : { label: "Ver mi pedido", url: `${siteUrl()}/mi-cuenta/pedidos` },
    },
    { type: "Order", id: order.id },
  );
}
