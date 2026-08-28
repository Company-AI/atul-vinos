import type { Coupon } from "@prisma/client";
import { prisma } from "@/infra/db/prisma";
import { err, ok, type Result } from "@/lib/result";
import { percentOfCents, toCents } from "@/lib/money";

export type CouponContext = {
  subtotalCents: number;
  userId?: string | null;
  email?: string | null;
  isClubMember: boolean;
  productIds: string[];
  categoryIds: string[];
  /** true si el usuario nunca completó un pedido pagado */
  isFirstPurchase: boolean;
};

export type CouponDiscount = {
  coupon: Coupon;
  /** Descuento sobre productos, en centavos. */
  discountCents: number;
  freeShipping: boolean;
};

/**
 * Validación server-side de un cupón. Nunca se confía en el cliente:
 * vigencia, mínimo de compra, usos totales, usos por cliente, alcance por
 * producto/categoría, exclusividad para socios y primera compra.
 */
export async function validateCoupon(
  code: string,
  ctx: CouponContext,
): Promise<Result<CouponDiscount>> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return err("Ingresá un código.", "EMPTY");

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalized },
    include: { products: true, categories: true },
  });

  if (!coupon || !coupon.isActive) {
    return err("El código no existe o ya no está disponible.", "NOT_FOUND");
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return err("El código todavía no está vigente.", "NOT_STARTED");
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return err("El código venció.", "EXPIRED");
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return err("El código alcanzó el máximo de usos.", "MAX_USES");
  }
  if (coupon.minPurchase && ctx.subtotalCents < toCents(coupon.minPurchase)) {
    return err(
      `El código aplica en compras desde ${new Intl.NumberFormat("es-AR", {
        style: "currency", currency: "ARS", maximumFractionDigits: 0,
      }).format(Number(coupon.minPurchase))}.`,
      "MIN_PURCHASE",
    );
  }
  if (coupon.clubMembersOnly && !ctx.isClubMember) {
    return err("El código es exclusivo para socios del Club.", "CLUB_ONLY");
  }
  if (coupon.firstPurchaseOnly && !ctx.isFirstPurchase) {
    return err("El código aplica solo en la primera compra.", "FIRST_PURCHASE_ONLY");
  }

  if (coupon.maxUsesPerUser !== null && (ctx.userId || ctx.email)) {
    const used = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        OR: [
          ...(ctx.userId ? [{ userId: ctx.userId }] : []),
          ...(ctx.email ? [{ email: ctx.email }] : []),
        ],
      },
    });
    if (used >= coupon.maxUsesPerUser) {
      return err("Ya usaste este código.", "MAX_USES_PER_USER");
    }
  }

  // Alcance: si el cupón limita productos o categorías, solo descuenta sobre ellos.
  const scopedProductIds = coupon.products.map((p) => p.productId);
  const scopedCategoryIds = coupon.categories.map((c) => c.categoryId);
  const hasScope = scopedProductIds.length > 0 || scopedCategoryIds.length > 0;

  if (hasScope) {
    const matches =
      ctx.productIds.some((id) => scopedProductIds.includes(id)) ||
      ctx.categoryIds.some((id) => scopedCategoryIds.includes(id));
    if (!matches) {
      return err("El código no aplica a los productos de tu carrito.", "OUT_OF_SCOPE");
    }
  }

  if (coupon.type === "FREE_SHIPPING") {
    return ok({ coupon, discountCents: 0, freeShipping: true });
  }

  const discountCents =
    coupon.type === "PERCENT"
      ? percentOfCents(ctx.subtotalCents, Number(coupon.value))
      : Math.min(ctx.subtotalCents, toCents(coupon.value));

  return ok({ coupon, discountCents, freeShipping: false });
}

/** Registra el uso al confirmar el pago. Idempotente por pedido. */
export async function registerCouponUsage(params: {
  couponId: string;
  orderId: string;
  userId?: string | null;
  email?: string | null;
  amountCents: number;
  tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
}): Promise<void> {
  const db = params.tx ?? prisma;
  const existing = await db.couponUsage.findFirst({
    where: { couponId: params.couponId, orderId: params.orderId },
  });
  if (existing) return;

  await db.couponUsage.create({
    data: {
      couponId: params.couponId,
      orderId: params.orderId,
      userId: params.userId ?? null,
      email: params.email ?? null,
      amount: params.amountCents / 100,
    },
  });
  await db.coupon.update({
    where: { id: params.couponId },
    data: { usedCount: { increment: 1 } },
  });
}
