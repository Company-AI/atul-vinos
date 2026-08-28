"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { assertPermission } from "@/infra/auth/guards";
import { recordAudit } from "@/domain/audit/service";
import { transitionOrder } from "@/domain/orders/fulfillment";
import { createShipmentForOrder, syncShipmentTracking } from "@/domain/shipping/service";

export type AdminActionResult =
  | { ok: true; message: string; data?: unknown }
  | { ok: false; error: string };

const STATUS_VALUES = [
  "PAYMENT_PENDING", "PAID", "STOCK_RESERVED", "PREPARING", "READY",
  "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED",
] as const;

export async function updateOrderStatus(input: {
  orderId: string;
  status: OrderStatus;
  message?: string;
  restock?: boolean;
}): Promise<AdminActionResult> {
  const permission = input.status === "CANCELLED" || input.status === "REFUNDED"
    ? "orders.cancel"
    : "orders.prepare";

  let user;
  try {
    user = await assertPermission(permission);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const parsed = z
    .object({
      orderId: z.string().min(1),
      status: z.enum(STATUS_VALUES),
      message: z.string().max(300).optional(),
      restock: z.boolean().optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const before = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    select: { status: true, number: true },
  });

  const result = await transitionOrder(parsed.data.orderId, parsed.data.status, {
    actorEmail: user.email,
    actorId: user.id,
    message: parsed.data.message,
    restock: parsed.data.restock,
    createShipment: parsed.data.status === "READY",
  });

  if (!result.ok) return { ok: false, error: result.error };

  await recordAudit(user, {
    action: "order.status",
    entityType: "Order",
    entityId: parsed.data.orderId,
    before: { status: before?.status },
    after: { status: parsed.data.status },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${parsed.data.orderId}`);
  revalidatePath("/admin/picking");
  return { ok: true, message: `Pedido #${before?.number} actualizado.` };
}

/** Cambio de estado masivo (spec §29). Informa qué pedidos no se pudieron mover. */
export async function bulkUpdateOrderStatus(input: {
  orderIds: string[];
  status: OrderStatus;
}): Promise<AdminActionResult> {
  let user;
  try {
    user = await assertPermission("orders.prepare");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  if (input.orderIds.length === 0) return { ok: false, error: "No seleccionaste pedidos." };

  const results = await Promise.all(
    input.orderIds.map(async (orderId) => {
      const result = await transitionOrder(orderId, input.status, {
        actorEmail: user.email,
        actorId: user.id,
        createShipment: input.status === "READY",
      });
      return { orderId, ok: result.ok, error: result.ok ? null : result.error };
    }),
  );

  const failed = results.filter((r) => !r.ok);
  const moved = results.length - failed.length;

  await recordAudit(user, {
    action: "order.bulk_status",
    entityType: "Order",
    after: { status: input.status, count: moved, failed: failed.length },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/picking");

  if (failed.length > 0) {
    return {
      ok: true,
      message: `${moved} pedidos actualizados. ${failed.length} no se pudieron mover: ${failed[0]?.error ?? ""}`,
    };
  }
  return { ok: true, message: `${moved} pedidos actualizados.` };
}

export async function addOrderNote(input: {
  orderId: string;
  note: string;
}): Promise<AdminActionResult> {
  let user;
  try {
    user = await assertPermission("orders.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const note = input.note.trim();
  if (!note) return { ok: false, error: "Escribí una nota." };

  await prisma.$transaction([
    prisma.order.update({
      where: { id: input.orderId },
      data: { internalNote: note },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: input.orderId,
        type: "note",
        message: note,
        actorEmail: user.email,
      },
    }),
  ]);

  await recordAudit(user, {
    action: "order.note",
    entityType: "Order",
    entityId: input.orderId,
    after: { note },
  });

  revalidatePath(`/admin/pedidos/${input.orderId}`);
  return { ok: true, message: "Nota guardada." };
}

export async function generateLabel(orderId: string): Promise<AdminActionResult> {
  let user;
  try {
    user = await assertPermission("orders.labels");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  try {
    const shipment = await createShipmentForOrder(orderId);
    await recordAudit(user, {
      action: "order.label",
      entityType: "Order",
      entityId: orderId,
      after: { shipmentId: shipment.id, tracking: shipment.trackingNumber },
    });

    revalidatePath(`/admin/pedidos/${orderId}`);
    revalidatePath("/admin/envios");
    return {
      ok: true,
      message: `Etiqueta generada. Seguimiento ${shipment.trackingNumber}.`,
      data: { shipmentId: shipment.id },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No pudimos generar la etiqueta.",
    };
  }
}

export async function bulkGenerateLabels(orderIds: string[]): Promise<AdminActionResult> {
  let user;
  try {
    user = await assertPermission("orders.labels");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const created: string[] = [];
  const failed: string[] = [];

  for (const orderId of orderIds) {
    try {
      const shipment = await createShipmentForOrder(orderId);
      created.push(shipment.id);
    } catch {
      failed.push(orderId);
    }
  }

  await recordAudit(user, {
    action: "order.label",
    entityType: "Order",
    after: { generated: created.length, failed: failed.length },
  });

  revalidatePath("/admin/envios");
  return {
    ok: true,
    message: `${created.length} etiquetas listas${failed.length ? `, ${failed.length} con error` : ""}.`,
    data: { shipmentIds: created },
  };
}

export async function refreshTracking(shipmentId: string): Promise<AdminActionResult> {
  try {
    await assertPermission("orders.view");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const tracking = await syncShipmentTracking(shipmentId);
  revalidatePath("/admin/envios");
  return {
    ok: true,
    message: tracking ? `Estado actualizado: ${tracking.status}.` : "Sin novedades del transportista.",
  };
}

export async function updateShipmentTracking(input: {
  shipmentId: string;
  trackingNumber: string;
  trackingUrl?: string;
  carrierCode?: string;
}): Promise<AdminActionResult> {
  let user;
  try {
    user = await assertPermission("orders.prepare");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const carrier = input.carrierCode
    ? await prisma.carrier.findUnique({ where: { code: input.carrierCode } })
    : null;

  const shipment = await prisma.shipment.update({
    where: { id: input.shipmentId },
    data: {
      trackingNumber: input.trackingNumber.trim(),
      trackingUrl: input.trackingUrl?.trim() || null,
      ...(carrier ? { carrierId: carrier.id } : {}),
    },
    include: { order: true },
  });

  await recordAudit(user, {
    action: "order.label",
    entityType: "Shipment",
    entityId: shipment.id,
    after: { trackingNumber: shipment.trackingNumber },
  });

  revalidatePath(`/admin/pedidos/${shipment.orderId}`);
  revalidatePath("/admin/envios");
  return { ok: true, message: "Seguimiento actualizado." };
}
