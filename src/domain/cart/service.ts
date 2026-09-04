import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { nanoid } from "nanoid";
import { prisma } from "@/infra/db/prisma";
import { IS_DEMO } from "@/infra/demo/mode";
import { getSession } from "@/infra/auth/session";
import { getAvailabilityMap } from "@/domain/inventory/availability";
import { getMemberBenefits } from "@/domain/promotions/club-benefits";
import { validateCoupon } from "@/domain/promotions/coupons";
import { getSettings } from "@/domain/settings/service";
import { toCents, toNumber } from "@/lib/money";
import { calculatePricing, type PricingResult } from "./pricing";

const CART_COOKIE = "bodega_cart";

export type CartLine = {
  itemId: string;
  productId: string;
  slug: string;
  name: string;
  sku: string;
  kind: "WINE" | "PACK";
  imageUrl: string | null;
  vintage: number | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
  available: number;
  /** La cantidad pedida supera el stock disponible. */
  exceedsStock: boolean;
  packComponents: { name: string; quantity: number }[];
};

export type CartSummary = {
  id: string | null;
  lines: CartLine[];
  itemCount: number;
  bottleCount: number;
  pricing: PricingResult;
  coupon: { code: string; description: string | null } | null;
  couponError: string | null;
  member: { isMember: boolean; planName: string | null; discountPercent: number };
  freeShippingFrom: number | null;
  hasStockIssues: boolean;
};

export const EMPTY_CART: CartSummary = {
  id: null,
  lines: [],
  itemCount: 0,
  bottleCount: 0,
  pricing: calculatePricing({ lines: [] }),
  coupon: null,
  couponError: null,
  member: { isMember: false, planName: null, discountPercent: 0 },
  freeShippingFrom: null,
  hasStockIssues: false,
};

/** Solo lectura: no crea carrito ni escribe cookies (seguro en RSC). */
export async function getCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/** Para server actions: crea el carrito y la cookie si no existen. */
export async function getOrCreateCart(): Promise<{ id: string; token: string }> {
  const store = await cookies();
  const session = await getSession();
  let token = store.get(CART_COOKIE)?.value;

  if (token) {
    const existing = await prisma.cart.findUnique({ where: { token } });
    if (existing) {
      // Al iniciar sesión, el carrito anónimo pasa a ser del usuario.
      if (session?.userId && existing.userId !== session.userId) {
        await prisma.cart.update({
          where: { id: existing.id },
          data: { userId: session.userId },
        });
      }
      return { id: existing.id, token };
    }
  }

  token = nanoid(24);
  const cart = await prisma.cart.create({
    data: { token, userId: session?.userId ?? null },
  });
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return { id: cart.id, token };
}

export const getCart = cache(async (): Promise<CartSummary> => {
  if (IS_DEMO) return EMPTY_CART;

  const token = await getCartToken();
  if (!token) return EMPTY_CART;

  const [cart, session, settings] = await Promise.all([
    prisma.cart.findUnique({
      where: { token },
      include: {
        coupon: true,
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            product: {
              select: {
                id: true, slug: true, name: true, sku: true, kind: true,
                price: true, compareAtPrice: true, vintage: true, status: true,
                categoryId: true,
                images: { where: { isPrimary: true }, take: 1, select: { url: true } },
                packItems: {
                  select: { quantity: true, component: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    }),
    getSession(),
    getSettings(),
  ]);

  if (!cart || cart.items.length === 0) {
    return {
      ...EMPTY_CART,
      id: cart?.id ?? null,
      freeShippingFrom: settings.shipping.freeShippingFrom,
    };
  }

  const availability = await getAvailabilityMap(cart.items.map((i) => i.productId));
  const member = await getMemberBenefits(session?.userId);

  const lines: CartLine[] = cart.items
    .filter((item) => item.product.status === "ACTIVE")
    .map((item) => {
      const available = availability.get(item.productId)?.available ?? 0;
      const unitPrice = toNumber(item.product.price);
      return {
        itemId: item.id,
        productId: item.productId,
        slug: item.product.slug,
        name: item.product.name,
        sku: item.product.sku,
        kind: item.product.kind,
        imageUrl: item.product.images[0]?.url ?? null,
        vintage: item.product.vintage,
        unitPrice,
        compareAtPrice: item.product.compareAtPrice ? toNumber(item.product.compareAtPrice) : null,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
        available,
        exceedsStock: item.quantity > available,
        packComponents: item.product.packItems.map((pi) => ({
          name: pi.component.name,
          quantity: pi.quantity,
        })),
      };
    });

  const subtotalCents = lines.reduce(
    (acc, l) => acc + toCents(l.unitPrice) * l.quantity, 0,
  );

  // Revalidamos el cupón en cada lectura: puede haber vencido o dejado de aplicar.
  let coupon: CartSummary["coupon"] = null;
  let couponError: string | null = null;
  let couponDiscount: { discountCents: number; freeShipping: boolean; code: string } | null = null;

  if (cart.coupon) {
    const paidOrders = session?.userId
      ? await prisma.order.count({
          where: { userId: session.userId, status: { notIn: ["PAYMENT_PENDING", "CANCELLED"] } },
        })
      : 0;

    const validation = await validateCoupon(cart.coupon.code, {
      subtotalCents,
      userId: session?.userId ?? null,
      email: session?.email ?? null,
      isClubMember: member.isMember,
      productIds: lines.map((l) => l.productId),
      categoryIds: cart.items.map((i) => i.product.categoryId).filter((c): c is string => !!c),
      isFirstPurchase: paidOrders === 0,
    });

    if (validation.ok) {
      coupon = { code: validation.data.coupon.code, description: validation.data.coupon.description };
      couponDiscount = {
        discountCents: validation.data.discountCents,
        freeShipping: validation.data.freeShipping,
        code: validation.data.coupon.code,
      };
    } else {
      couponError = validation.error;
    }
  }

  const pricing = calculatePricing({
    lines: lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitPriceCents: toCents(l.unitPrice),
    })),
    memberDiscountPercent: member.storeDiscountPercent,
    coupon: couponDiscount,
    shippingCents: 0, // el envío se cotiza en el checkout, con dirección
    freeShippingFromCents: settings.shipping.freeShippingFrom
      ? toCents(settings.shipping.freeShippingFrom)
      : null,
  });

  return {
    id: cart.id,
    lines,
    itemCount: lines.length,
    bottleCount: lines.reduce(
      (acc, l) => acc + l.quantity * (l.kind === "PACK"
        ? l.packComponents.reduce((s, c) => s + c.quantity, 0)
        : 1), 0,
    ),
    pricing,
    coupon,
    couponError,
    member: {
      isMember: member.isMember,
      planName: member.planName,
      discountPercent: member.storeDiscountPercent,
    },
    freeShippingFrom: settings.shipping.freeShippingFrom,
    hasStockIssues: lines.some((l) => l.exceedsStock),
  };
});

/** Cantidad de unidades en el carrito, para el badge del header. */
export const getCartCount = cache(async (): Promise<number> => {
  if (IS_DEMO) return 0;

  const token = await getCartToken();
  if (!token) return 0;
  const result = await prisma.cartItem.aggregate({
    where: { cart: { token } },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
});
