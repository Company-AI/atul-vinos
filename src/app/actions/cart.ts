"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { getSession } from "@/infra/auth/session";
import { getAvailability } from "@/domain/inventory/availability";
import { getMemberBenefits } from "@/domain/promotions/club-benefits";
import { validateCoupon } from "@/domain/promotions/coupons";
import { getOrCreateCart } from "@/domain/cart/service";
import { formatARS } from "@/lib/money";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const addSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

/** Agrega al carrito validando stock real (y el de los componentes si es pack). */
export async function addToCart(input: {
  productId: string;
  quantity?: number;
}): Promise<ActionResult> {
  const parsed = addSchema.safeParse({
    productId: input.productId,
    quantity: input.quantity ?? 1,
  });
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, name: true, status: true, kind: true },
  });
  if (!product || product.status !== "ACTIVE") {
    return { ok: false, error: "El producto ya no está disponible." };
  }

  const { id: cartId } = await getOrCreateCart();
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId: product.id } },
  });
  const desired = (existing?.quantity ?? 0) + parsed.data.quantity;

  const { available, limitedBy } = await getAvailability(product.id);
  if (available <= 0) {
    return {
      ok: false,
      error: product.kind === "PACK" && limitedBy
        ? `No podemos armar el pack: falta stock de ${limitedBy.name}.`
        : "Sin stock disponible.",
    };
  }
  if (desired > available) {
    return {
      ok: false,
      error: `Solo quedan ${available} ${available === 1 ? "unidad" : "unidades"} disponibles.`,
    };
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId: product.id } },
    create: { cartId, productId: product.id, quantity: parsed.data.quantity },
    update: { quantity: desired },
  });

  revalidatePath("/carrito");
  return { ok: true, message: `${product.name} agregado al carrito.` };
}

export async function updateCartItem(itemId: string, quantity: number): Promise<ActionResult> {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
    return { ok: false, error: "Cantidad inválida." };
  }
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { product: { select: { id: true, name: true } } },
  });
  if (!item) return { ok: false, error: "El ítem ya no está en el carrito." };

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    revalidatePath("/carrito");
    return { ok: true, message: "Producto eliminado." };
  }

  const { available } = await getAvailability(item.product.id);
  if (quantity > available) {
    return { ok: false, error: `Solo quedan ${available} disponibles de ${item.product.name}.` };
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  revalidatePath("/carrito");
  return { ok: true };
}

export async function removeCartItem(itemId: string): Promise<ActionResult> {
  await prisma.cartItem.deleteMany({ where: { id: itemId } });
  revalidatePath("/carrito");
  return { ok: true, message: "Producto eliminado." };
}

export async function applyCoupon(code: string): Promise<ActionResult> {
  const { id: cartId } = await getOrCreateCart();
  const session = await getSession();

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: { product: { select: { id: true, price: true, categoryId: true } } },
      },
    },
  });
  if (!cart || cart.items.length === 0) {
    return { ok: false, error: "Agregá productos antes de usar un código." };
  }

  const subtotalCents = cart.items.reduce(
    (acc, i) => acc + Math.round(Number(i.product.price) * 100) * i.quantity, 0,
  );
  const member = await getMemberBenefits(session?.userId);
  const paidOrders = session?.userId
    ? await prisma.order.count({
        where: { userId: session.userId, status: { notIn: ["PAYMENT_PENDING", "CANCELLED"] } },
      })
    : 0;

  const validation = await validateCoupon(code, {
    subtotalCents,
    userId: session?.userId ?? null,
    email: session?.email ?? null,
    isClubMember: member.isMember,
    productIds: cart.items.map((i) => i.product.id),
    categoryIds: cart.items.map((i) => i.product.categoryId).filter((c): c is string => !!c),
    isFirstPurchase: paidOrders === 0,
  });

  if (!validation.ok) return { ok: false, error: validation.error };

  await prisma.cart.update({
    where: { id: cartId },
    data: { couponId: validation.data.coupon.id },
  });

  revalidatePath("/carrito");
  const { coupon, discountCents, freeShipping } = validation.data;
  return {
    ok: true,
    message: freeShipping
      ? `Código ${coupon.code} aplicado: envío sin cargo.`
      : `Código ${coupon.code} aplicado: ${formatARS(discountCents / 100)} de descuento.`,
  };
}

export async function removeCoupon(): Promise<ActionResult> {
  const { id: cartId } = await getOrCreateCart();
  await prisma.cart.update({ where: { id: cartId }, data: { couponId: null } });
  revalidatePath("/carrito");
  return { ok: true, message: "Código quitado." };
}
