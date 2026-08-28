import type { MovementType, Prisma } from "@prisma/client";
import { prisma } from "@/infra/db/prisma";
import { expandToStockUnits } from "./availability";

export type Tx = Prisma.TransactionClient;

export type MovementInput = {
  productId: string;
  type: MovementType;
  quantity: number;
  orderId?: string | null;
  subscriptionBoxId?: string | null;
  userId?: string | null;
  comment?: string | null;
};

/**
 * ÚNICO punto de escritura del stock.
 *
 * Toda modificación queda registrada como InventoryMovement con el valor
 * anterior y posterior. Bloquea la fila con FOR UPDATE para que dos pedidos
 * simultáneos no puedan sobrevender.
 */
export async function recordMovement(tx: Tx, input: MovementInput) {
  const { productId, type } = input;
  const quantity = Math.abs(Math.trunc(input.quantity));
  if (quantity === 0 && type !== "AJUSTE") return null;

  // Bloqueo pesimista de la fila de inventario.
  await tx.$queryRaw`SELECT id FROM "Inventory" WHERE "productId" = ${productId} FOR UPDATE`;

  const inventory = await tx.inventory.findUnique({ where: { productId } });
  if (!inventory) {
    throw new Error(`El producto ${productId} no tiene inventario asociado.`);
  }

  let onHand = inventory.onHand;
  let reserved = inventory.reserved;

  switch (type) {
    case "ENTRADA":
    case "DEVOLUCION":
      onHand += quantity;
      break;
    case "RESERVA":
    case "SUSCRIPCION":
      reserved += quantity;
      break;
    case "LIBERACION":
      reserved = Math.max(0, reserved - quantity);
      break;
    case "VENTA":
      onHand -= quantity;
      reserved = Math.max(0, reserved - quantity);
      break;
    case "ROTURA":
    case "MERMA":
      onHand -= quantity;
      break;
    case "AJUSTE":
      onHand = Math.trunc(input.quantity);
      break;
  }

  await tx.inventory.update({
    where: { productId },
    data: { onHand, reserved },
  });

  return tx.inventoryMovement.create({
    data: {
      productId,
      type,
      quantity: type === "AJUSTE" ? Math.abs(onHand - inventory.onHand) : quantity,
      onHandBefore: inventory.onHand,
      onHandAfter: onHand,
      reservedBefore: inventory.reserved,
      reservedAfter: reserved,
      orderId: input.orderId ?? null,
      subscriptionBoxId: input.subscriptionBoxId ?? null,
      userId: input.userId ?? null,
      comment: input.comment ?? null,
    },
  });
}

/**
 * Reserva el stock de un pedido. Los packs se expanden a sus componentes.
 * Si falta stock de algún componente, lanza y la transacción entera se revierte.
 */
export async function reserveStockForOrder(tx: Tx, orderId: string, userId?: string | null) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { id: true, number: true, items: { select: { productId: true, quantity: true, name: true } } },
  });
  if (!order) throw new Error("Pedido inexistente.");

  const units = await expandToStockUnits(
    order.items
      .filter((i): i is { productId: string; quantity: number; name: string } => Boolean(i.productId))
      .map((i) => ({ productId: i.productId!, quantity: i.quantity })),
  );

  const alreadyReserved = await tx.inventoryAllocation.count({
    where: { orderId, releasedAt: null },
  });
  if (alreadyReserved > 0) return; // idempotente

  for (const unit of units) {
    const inventory = await tx.inventory.findUnique({ where: { productId: unit.productId } });
    const available = (inventory?.onHand ?? 0) - (inventory?.reserved ?? 0);
    if (available < unit.quantity) {
      const product = await tx.product.findUnique({
        where: { id: unit.productId },
        select: { name: true },
      });
      throw new Error(
        `Stock insuficiente de ${product?.name ?? unit.productId}: ` +
          `se necesitan ${unit.quantity} y hay ${Math.max(0, available)} disponibles.`,
      );
    }

    await recordMovement(tx, {
      productId: unit.productId,
      type: "RESERVA",
      quantity: unit.quantity,
      orderId,
      userId,
      comment: `Reserva por pedido #${order.number}`,
    });

    await tx.inventoryAllocation.create({
      data: { productId: unit.productId, quantity: unit.quantity, orderId },
    });
  }
}

/** Libera reservas (cancelación de pedido). */
export async function releaseStockForOrder(tx: Tx, orderId: string, userId?: string | null) {
  const allocations = await tx.inventoryAllocation.findMany({
    where: { orderId, releasedAt: null },
  });
  if (allocations.length === 0) return;

  const order = await tx.order.findUnique({ where: { id: orderId }, select: { number: true } });

  for (const allocation of allocations) {
    await recordMovement(tx, {
      productId: allocation.productId,
      type: "LIBERACION",
      quantity: allocation.quantity,
      orderId,
      userId,
      comment: `Liberación por cancelación del pedido #${order?.number ?? ""}`,
    });
  }

  await tx.inventoryAllocation.updateMany({
    where: { orderId, releasedAt: null },
    data: { releasedAt: new Date() },
  });
}

/** Descuenta el stock físico al despachar y cierra las reservas. */
export async function consumeStockForOrder(tx: Tx, orderId: string, userId?: string | null) {
  const allocations = await tx.inventoryAllocation.findMany({
    where: { orderId, releasedAt: null },
  });
  if (allocations.length === 0) return;

  const order = await tx.order.findUnique({ where: { id: orderId }, select: { number: true } });

  for (const allocation of allocations) {
    await recordMovement(tx, {
      productId: allocation.productId,
      type: "VENTA",
      quantity: allocation.quantity,
      orderId,
      userId,
      comment: `Despacho del pedido #${order?.number ?? ""}`,
    });
  }

  await tx.inventoryAllocation.updateMany({
    where: { orderId, releasedAt: null },
    data: { releasedAt: new Date() },
  });
}

/** Devuelve mercadería al stock (reembolso con retorno). */
export async function returnStockForOrder(tx: Tx, orderId: string, userId?: string | null) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { number: true, items: { select: { productId: true, quantity: true } } },
  });
  if (!order) return;

  const units = await expandToStockUnits(
    order.items
      .filter((i) => Boolean(i.productId))
      .map((i) => ({ productId: i.productId!, quantity: i.quantity })),
  );

  for (const unit of units) {
    await recordMovement(tx, {
      productId: unit.productId,
      type: "DEVOLUCION",
      quantity: unit.quantity,
      orderId,
      userId,
      comment: `Devolución del pedido #${order.number}`,
    });
  }
}

/**
 * Reserva el stock del box del Club para un pedido de suscripción.
 * Usa el tipo SUSCRIPCION para poder distinguirlo en reportes, pero crea las
 * mismas asignaciones que un pedido de tienda, así el despacho las consume igual.
 *
 * No bloquea el despacho si falta stock: registra la reserva posible y deja
 * constancia del faltante, porque el cobro ya ocurrió y el pedido debe existir.
 */
export async function reserveBoxStockForOrder(
  tx: Tx,
  params: { orderId: string; boxId?: string | null; userId?: string | null; period: string },
): Promise<{ missing: { productId: string; name: string; requested: number; available: number }[] }> {
  const order = await tx.order.findUnique({
    where: { id: params.orderId },
    select: { number: true, items: { select: { productId: true, quantity: true, name: true } } },
  });
  if (!order) throw new Error("Pedido inexistente.");

  const already = await tx.inventoryAllocation.count({
    where: { orderId: params.orderId, releasedAt: null },
  });
  if (already > 0) return { missing: [] };

  const missing: { productId: string; name: string; requested: number; available: number }[] = [];

  for (const item of order.items) {
    if (!item.productId) continue;

    const inventory = await tx.inventory.findUnique({ where: { productId: item.productId } });
    const available = (inventory?.onHand ?? 0) - (inventory?.reserved ?? 0);
    const reservable = Math.max(0, Math.min(available, item.quantity));

    if (reservable < item.quantity) {
      missing.push({
        productId: item.productId,
        name: item.name,
        requested: item.quantity,
        available: Math.max(0, available),
      });
    }

    if (reservable > 0) {
      await recordMovement(tx, {
        productId: item.productId,
        type: "SUSCRIPCION",
        quantity: reservable,
        orderId: params.orderId,
        subscriptionBoxId: params.boxId ?? null,
        userId: params.userId,
        comment: `Box del Club ${params.period} — pedido #${order.number}`,
      });

      await tx.inventoryAllocation.create({
        data: {
          productId: item.productId,
          quantity: reservable,
          orderId: params.orderId,
          subscriptionBoxId: params.boxId ?? null,
        },
      });
    }
  }

  return { missing };
}

/** Productos por debajo del mínimo, para las alertas del admin. */
export async function getLowStockProducts(limit = 20) {
  const rows = await prisma.$queryRaw<
    { id: string; name: string; sku: string; onHand: number; reserved: number; minStock: number }[]
  >`
    SELECT p.id, p.name, p.sku, i."onHand", i.reserved, i."minStock"
    FROM "Inventory" i
    JOIN "Product" p ON p.id = i."productId"
    WHERE p.status = 'ACTIVE' AND (i."onHand" - i.reserved) <= i."minStock"
    ORDER BY (i."onHand" - i.reserved) ASC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ ...r, available: r.onHand - r.reserved }));
}
