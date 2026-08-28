import type { OrderType, Prisma } from "@prisma/client";
import { prisma } from "@/infra/db/prisma";
import { getMemberBenefits } from "@/domain/promotions/club-benefits";
import { validateCoupon } from "@/domain/promotions/coupons";
import { calculatePricing } from "@/domain/cart/pricing";
import { getAvailabilityMap } from "@/domain/inventory/availability";
import { getSettings } from "@/domain/settings/service";
import { err, ok, type Result } from "@/lib/result";
import { toCents, toNumber } from "@/lib/money";

export type CheckoutContact = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentId?: string | null;
};

export type CheckoutAddress = {
  street: string;
  number: string;
  apartment?: string | null;
  city: string;
  province: string;
  postalCode: string;
  reference?: string | null;
};

export type CreateOrderInput = {
  cartToken: string;
  userId?: string | null;
  contact: CheckoutContact;
  address: CheckoutAddress;
  billing?: (CheckoutContact & CheckoutAddress & { taxId?: string | null }) | null;
  shipping: {
    methodName: string;
    price: number;
    carrierCode: string;
    serviceCode?: string | null;
  };
  customerNote?: string | null;
  /** Solo para pedidos generados por suscripción. */
  type?: OrderType;
};

export type CreatedOrder = {
  orderId: string;
  orderNumber: number;
  total: number;
  paymentId: string;
  idempotencyKey: string;
};

/**
 * Crea el pedido desde el carrito dentro de una transacción.
 *
 * Importante: NO reserva stock todavía. La reserva ocurre cuando el pago se
 * confirma por webhook (spec §13, §17). Acá solo se valida disponibilidad para
 * no dejar iniciar un checkout imposible.
 */
export async function createOrderFromCart(
  input: CreateOrderInput,
): Promise<Result<CreatedOrder>> {
  const settings = await getSettings();

  const cart = await prisma.cart.findUnique({
    where: { token: input.cartToken },
    include: {
      coupon: true,
      items: {
        include: {
          product: {
            select: {
              id: true, name: true, sku: true, kind: true, price: true, status: true,
              categoryId: true, vintage: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
              packItems: {
                select: { quantity: true, component: { select: { slug: true, name: true, sku: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return err("Tu carrito está vacío.", "EMPTY_CART");
  }

  const inactive = cart.items.filter((i) => i.product.status !== "ACTIVE");
  if (inactive.length > 0) {
    return err(
      `${inactive[0].product.name} ya no está disponible. Quitalo del carrito para continuar.`,
      "PRODUCT_UNAVAILABLE",
    );
  }

  // Validación de stock antes de cobrar.
  const availability = await getAvailabilityMap(cart.items.map((i) => i.productId));
  for (const item of cart.items) {
    const available = availability.get(item.productId)?.available ?? 0;
    if (item.quantity > available) {
      return err(
        `Solo quedan ${available} unidades de ${item.product.name}.`,
        "INSUFFICIENT_STOCK",
      );
    }
  }

  const member = await getMemberBenefits(input.userId);
  const subtotalCents = cart.items.reduce(
    (acc, i) => acc + toCents(i.product.price) * i.quantity, 0,
  );

  // Revalidación del cupón en el momento de crear el pedido.
  let couponData: { id: string; code: string; discountCents: number; freeShipping: boolean } | null = null;
  if (cart.coupon) {
    const paidOrders = input.userId
      ? await prisma.order.count({
          where: { userId: input.userId, status: { notIn: ["PAYMENT_PENDING", "CANCELLED"] } },
        })
      : 0;

    const validation = await validateCoupon(cart.coupon.code, {
      subtotalCents,
      userId: input.userId ?? null,
      email: input.contact.email,
      isClubMember: member.isMember,
      productIds: cart.items.map((i) => i.productId),
      categoryIds: cart.items.map((i) => i.product.categoryId).filter((c): c is string => !!c),
      isFirstPurchase: paidOrders === 0,
    });

    if (validation.ok) {
      couponData = {
        id: validation.data.coupon.id,
        code: validation.data.coupon.code,
        discountCents: validation.data.discountCents,
        freeShipping: validation.data.freeShipping,
      };
    }
  }

  const pricing = calculatePricing({
    lines: cart.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPriceCents: toCents(i.product.price),
    })),
    memberDiscountPercent: member.storeDiscountPercent,
    coupon: couponData
      ? { discountCents: couponData.discountCents, freeShipping: couponData.freeShipping, code: couponData.code }
      : null,
    shippingCents: toCents(input.shipping.price),
    freeShippingFromCents: settings.shipping.freeShippingFrom
      ? toCents(settings.shipping.freeShippingFrom)
      : null,
    shippingCoveredByBenefit: false,
  });

  const idempotencyKey = `order-${cart.id}-${pricing.totalCents}-${Date.now()}`;

  const shippingSnapshot = {
    firstName: input.contact.firstName,
    lastName: input.contact.lastName,
    phone: input.contact.phone,
    documentId: input.contact.documentId ?? "",
    street: input.address.street,
    number: input.address.number,
    apartment: input.address.apartment ?? "",
    city: input.address.city,
    province: input.address.province,
    postalCode: input.address.postalCode,
    reference: input.address.reference ?? "",
    method: input.shipping.methodName,
    carrierCode: input.shipping.carrierCode,
  };

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Dirección guardada en la cuenta, para reutilizar en el próximo pedido.
      let addressId: string | null = null;
      if (input.userId) {
        const existing = await tx.address.findFirst({
          where: {
            userId: input.userId,
            street: input.address.street,
            number: input.address.number,
            postalCode: input.address.postalCode,
          },
        });
        addressId = existing
          ? existing.id
          : (
              await tx.address.create({
                data: {
                  userId: input.userId,
                  firstName: input.contact.firstName,
                  lastName: input.contact.lastName,
                  phone: input.contact.phone,
                  documentId: input.contact.documentId ?? null,
                  street: input.address.street,
                  number: input.address.number,
                  apartment: input.address.apartment ?? null,
                  city: input.address.city,
                  province: input.address.province,
                  postalCode: input.address.postalCode,
                  reference: input.address.reference ?? null,
                  isDefaultShipping: true,
                },
              })
            ).id;
      }

      const order = await tx.order.create({
        data: {
          type: input.type ?? "STORE",
          status: "PAYMENT_PENDING",
          userId: input.userId ?? null,
          guestEmail: input.userId ? null : input.contact.email,
          customerName: `${input.contact.firstName} ${input.contact.lastName}`.trim(),
          customerEmail: input.contact.email,
          customerPhone: input.contact.phone,
          customerDocument: input.contact.documentId ?? null,
          addressId,
          shippingSnapshot,
          billingSnapshot: input.billing ? { ...input.billing } : undefined,
          subtotal: pricing.subtotal,
          discountTotal: pricing.discountTotal,
          shippingTotal: pricing.shippingTotal,
          total: pricing.total,
          currency: settings.company.currency,
          couponId: couponData?.id ?? null,
          couponCode: couponData?.code ?? null,
          shippingMethod: input.shipping.methodName,
          carrierCode: input.shipping.carrierCode,
          customerNote: input.customerNote ?? null,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              name: `${item.product.name}${item.product.vintage ? ` ${item.product.vintage}` : ""}`,
              sku: item.product.sku,
              kind: item.product.kind,
              imageUrl: item.product.images[0]?.url ?? null,
              unitPrice: toNumber(item.product.price),
              quantity: item.quantity,
              lineTotal: toNumber(item.product.price) * item.quantity,
              packSnapshot:
                item.product.kind === "PACK"
                  ? (item.product.packItems.map((pi) => ({
                      slug: pi.component.slug,
                      name: pi.component.name,
                      sku: pi.component.sku,
                      quantity: pi.quantity,
                    })) as Prisma.InputJsonValue)
                  : undefined,
            })),
          },
          events: {
            create: [{
              type: "status_change",
              toStatus: "PAYMENT_PENDING",
              message: "Pedido creado, esperando confirmación de pago",
            }],
          },
        },
      });

      const payment = await tx.payment.create({
        data: {
          provider: settings.payments.provider,
          purpose: "ORDER",
          status: "PENDING",
          amount: pricing.total,
          currency: settings.company.currency,
          orderId: order.id,
          idempotencyKey,
          externalReference: `order-${order.number}`,
        },
      });

      return {
        orderId: order.id,
        orderNumber: order.number,
        total: pricing.total,
        paymentId: payment.id,
        idempotencyKey,
      };
    });

    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos crear el pedido.";
    return err(message, "CREATE_FAILED");
  }
}
