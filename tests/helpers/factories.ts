import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

export const prisma = new PrismaClient();

/** Limpia la base de test respetando el orden de dependencias. */
export async function resetDatabase() {
  await prisma.$transaction([
    prisma.notificationLog.deleteMany(),
    prisma.notificationTemplate.deleteMany(),
    prisma.webhookEvent.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.shippingLabel.deleteMany(),
    prisma.shipmentEvent.deleteMany(),
    prisma.shipment.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.orderEvent.deleteMany(),
    prisma.inventoryMovement.deleteMany(),
    prisma.inventoryAllocation.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.couponUsage.deleteMany(),
    prisma.order.deleteMany(),
    prisma.subscriptionEvent.deleteMany(),
    prisma.subscriptionCycle.deleteMany(),
    prisma.subscriptionBoxItem.deleteMany(),
    prisma.subscriptionBox.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.planBenefit.deleteMany(),
    prisma.clubBenefit.deleteMany(),
    prisma.subscriptionPlan.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.couponProduct.deleteMany(),
    prisma.couponCategory.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.packItem.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.inventory.deleteMany(),
    prisma.product.deleteMany(),
    prisma.address.deleteMany(),
    prisma.user.deleteMany(),
    prisma.shippingRate.deleteMany(),
    prisma.shippingZone.deleteMany(),
    prisma.carrier.deleteMany(),
    prisma.setting.deleteMany(),
  ]);
}

export async function createWine(overrides: {
  name?: string;
  price?: number;
  onHand?: number;
  reserved?: number;
  minStock?: number;
} = {}) {
  const suffix = nanoid(6);
  return prisma.product.create({
    data: {
      kind: "WINE",
      status: "ACTIVE",
      name: overrides.name ?? `Vino ${suffix}`,
      slug: `vino-${suffix}`,
      sku: `SKU-${suffix}`,
      price: overrides.price ?? 20000,
      wineType: "TINTO",
      vintage: 2022,
      inventory: {
        create: {
          onHand: overrides.onHand ?? 100,
          reserved: overrides.reserved ?? 0,
          minStock: overrides.minStock ?? 6,
        },
      },
    },
    include: { inventory: true },
  });
}

export async function createPack(
  components: { productId: string; quantity: number }[],
  overrides: { price?: number; name?: string } = {},
) {
  const suffix = nanoid(6);
  return prisma.product.create({
    data: {
      kind: "PACK",
      status: "ACTIVE",
      name: overrides.name ?? `Pack ${suffix}`,
      slug: `pack-${suffix}`,
      sku: `PACK-${suffix}`,
      price: overrides.price ?? 50000,
      packItems: {
        create: components.map((c) => ({ componentId: c.productId, quantity: c.quantity })),
      },
    },
  });
}

export async function createCustomer(overrides: { email?: string } = {}) {
  const suffix = nanoid(6);
  return prisma.user.create({
    data: {
      email: overrides.email ?? `cliente-${suffix}@test.local`,
      firstName: "Test",
      lastName: "Cliente",
      phone: "+54 9 351 555-0000",
      documentId: "30111222",
    },
  });
}

export async function createCartWith(
  items: { productId: string; quantity: number }[],
  userId?: string,
) {
  const token = `cart-${nanoid(10)}`;
  return prisma.cart.create({
    data: {
      token,
      userId: userId ?? null,
      items: { create: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) },
    },
  });
}

export async function createShippingZone() {
  const carrier = await prisma.carrier.create({
    data: { code: "mock", name: "Interno", isActive: true },
  });
  return prisma.shippingZone.create({
    data: {
      name: "Todo el país",
      provinces: [],
      cities: [],
      rates: {
        create: [
          { name: "Estándar", price: 8900, freeFrom: 100000, etaMinDays: 3, etaMaxDays: 5, carrierId: carrier.id },
        ],
      },
    },
    include: { rates: true },
  });
}

export async function createPlanWithBox(params: {
  price?: number;
  bottleCount?: number;
  freeShipping?: boolean;
  storeDiscountPercent?: number;
  boxItems?: { productId: string; quantity: number }[];
  periodMonth?: number;
  periodYear?: number;
}) {
  const suffix = nanoid(6);
  const now = new Date();

  const benefit = await prisma.clubBenefit.create({
    data: {
      code: `store_discount_${suffix}`,
      name: "Descuento en tienda",
      value: params.storeDiscountPercent ?? 10,
    },
  });

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: `Plan ${suffix}`,
      slug: `plan-${suffix}`,
      price: params.price ?? 60000,
      frequency: "MONTHLY",
      bottleCount: params.bottleCount ?? 4,
      freeShipping: params.freeShipping ?? true,
      isActive: true,
      benefits: { create: [{ benefitId: benefit.id }] },
    },
  });

  const box = params.boxItems
    ? await prisma.subscriptionBox.create({
        data: {
          planId: plan.id,
          periodMonth: params.periodMonth ?? now.getMonth() + 1,
          periodYear: params.periodYear ?? now.getFullYear(),
          isPublished: true,
          items: { create: params.boxItems },
        },
        include: { items: true },
      })
    : null;

  return { plan, box, benefit };
}

export async function availableOf(productId: string): Promise<number> {
  const inventory = await prisma.inventory.findUnique({ where: { productId } });
  return (inventory?.onHand ?? 0) - (inventory?.reserved ?? 0);
}
