"use server";

import { revalidatePath } from "next/cache";
import type { MovementType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { assertPermission } from "@/infra/auth/guards";
import { recordAudit } from "@/domain/audit/service";
import { recordMovement } from "@/domain/inventory/service";

export type StockActionResult = { ok: true; message: string } | { ok: false; error: string };

const MOVEMENT_TYPES = [
  "ENTRADA", "AJUSTE", "ROTURA", "MERMA", "DEVOLUCION", "LIBERACION",
] as const;

const schema = z.object({
  productId: z.string().min(1),
  type: z.enum(MOVEMENT_TYPES),
  quantity: z.number().int().min(0).max(100000),
  comment: z.string().max(300).optional(),
});

/**
 * Movimiento manual de stock. Nunca se edita el número directo: siempre pasa
 * por recordMovement, que deja historial con valor anterior y posterior.
 */
export async function createStockMovement(input: {
  productId: string;
  type: MovementType;
  quantity: number;
  comment?: string;
}): Promise<StockActionResult> {
  let user;
  try {
    user = await assertPermission("stock.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  if (parsed.data.type !== "AJUSTE" && parsed.data.quantity <= 0) {
    return { ok: false, error: "La cantidad tiene que ser mayor a cero." };
  }
  if (parsed.data.type === "AJUSTE" && !parsed.data.comment?.trim()) {
    return { ok: false, error: "Los ajustes necesitan un motivo." };
  }

  const before = await prisma.inventory.findUnique({
    where: { productId: parsed.data.productId },
  });
  if (!before) return { ok: false, error: "El producto no tiene inventario (¿es un pack?)." };

  try {
    await prisma.$transaction(async (tx) => {
      await recordMovement(tx, {
        productId: parsed.data.productId,
        type: parsed.data.type,
        quantity: parsed.data.quantity,
        userId: user.id,
        comment: parsed.data.comment ?? null,
      });
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No pudimos registrar el movimiento.",
    };
  }

  const after = await prisma.inventory.findUnique({
    where: { productId: parsed.data.productId },
  });

  await recordAudit(user, {
    action: parsed.data.type === "AJUSTE" ? "stock.adjust" : "stock.movement",
    entityType: "Inventory",
    entityId: parsed.data.productId,
    before: { onHand: before.onHand, reserved: before.reserved },
    after: { onHand: after?.onHand, reserved: after?.reserved, type: parsed.data.type },
  });

  revalidatePath("/admin/stock");
  revalidatePath("/admin");
  return { ok: true, message: "Movimiento registrado." };
}

export async function updateMinStock(input: {
  productId: string;
  minStock: number;
  location?: string;
}): Promise<StockActionResult> {
  let user;
  try {
    user = await assertPermission("stock.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  if (!Number.isInteger(input.minStock) || input.minStock < 0) {
    return { ok: false, error: "El stock mínimo tiene que ser un número positivo." };
  }

  const before = await prisma.inventory.findUnique({ where: { productId: input.productId } });

  await prisma.inventory.update({
    where: { productId: input.productId },
    data: {
      minStock: input.minStock,
      ...(input.location !== undefined ? { location: input.location.trim() || null } : {}),
    },
  });

  await recordAudit(user, {
    action: "stock.movement",
    entityType: "Inventory",
    entityId: input.productId,
    before: { minStock: before?.minStock, location: before?.location },
    after: { minStock: input.minStock, location: input.location },
  });

  revalidatePath("/admin/stock");
  return { ok: true, message: "Datos de stock actualizados." };
}
