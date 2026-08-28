import { prisma } from "@/infra/db/prisma";
import { toNumber } from "@/lib/money";
import { periodLabel } from "@/lib/dates";

export type BoxItemView = {
  productId: string;
  name: string;
  sku: string;
  slug: string;
  quantity: number;
  price: number;
  cost: number;
  imageUrl: string | null;
  available: number;
};

export type BoxView = {
  id: string;
  planId: string;
  planName: string;
  periodMonth: number;
  periodYear: number;
  periodLabel: string;
  name: string | null;
  curatorNote: string | null;
  isPublished: boolean;
  estimatedCost: number;
  commercialValue: number;
  items: BoxItemView[];
  /** Suscriptores activos del plan: define el stock necesario. */
  subscriberCount: number;
  requirements: {
    productId: string;
    name: string;
    sku: string;
    perBox: number;
    needed: number;
    available: number;
    missing: number;
  }[];
  totalMissing: number;
};

/** Box del plan para un período; si no existe, null. */
export async function getBox(
  planId: string,
  periodMonth: number,
  periodYear: number,
): Promise<BoxView | null> {
  const box = await prisma.subscriptionBox.findUnique({
    where: { planId_periodYear_periodMonth: { planId, periodYear, periodMonth } },
    include: {
      plan: { select: { id: true, name: true } },
      items: {
        include: {
          product: {
            select: {
              id: true, name: true, sku: true, slug: true, price: true, cost: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
              inventory: { select: { onHand: true, reserved: true } },
            },
          },
        },
      },
    },
  });
  if (!box) return null;

  const subscriberCount = await prisma.subscription.count({
    where: { planId, status: "ACTIVE" },
  });

  const items: BoxItemView[] = box.items.map((item) => ({
    productId: item.productId,
    name: item.product.name,
    sku: item.product.sku,
    slug: item.product.slug,
    quantity: item.quantity,
    price: toNumber(item.product.price),
    cost: toNumber(item.product.cost),
    imageUrl: item.product.images[0]?.url ?? null,
    available: Math.max(
      0,
      (item.product.inventory?.onHand ?? 0) - (item.product.inventory?.reserved ?? 0),
    ),
  }));

  const requirements = items.map((item) => {
    const needed = item.quantity * subscriberCount;
    return {
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      perBox: item.quantity,
      needed,
      available: item.available,
      missing: Math.max(0, needed - item.available),
    };
  });

  return {
    id: box.id,
    planId: box.planId,
    planName: box.plan.name,
    periodMonth: box.periodMonth,
    periodYear: box.periodYear,
    periodLabel: periodLabel(box.periodMonth, box.periodYear),
    name: box.name,
    curatorNote: box.curatorNote,
    isPublished: box.isPublished,
    estimatedCost: toNumber(box.estimatedCost),
    commercialValue: toNumber(box.commercialValue),
    items,
    subscriberCount,
    requirements,
    totalMissing: requirements.reduce((acc, r) => acc + r.missing, 0),
  };
}

/**
 * Resuelve qué box corresponde cobrar/enviar para un período.
 * Si no hay box para ese mes, usa el más reciente publicado del plan: el pedido
 * nunca queda sin contenido y el admin ve la alerta.
 */
export async function resolveBoxForPeriod(
  planId: string,
  periodMonth: number,
  periodYear: number,
) {
  const exact = await prisma.subscriptionBox.findUnique({
    where: { planId_periodYear_periodMonth: { planId, periodYear, periodMonth } },
    include: { items: { include: { product: true } } },
  });
  if (exact && exact.items.length > 0) return exact;

  return prisma.subscriptionBox.findFirst({
    where: { planId, items: { some: {} } },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    include: { items: { include: { product: true } } },
  });
}

/** Necesidad agregada de stock del Club, para no vender en tienda lo comprometido. */
export async function getClubStockRequirements(periodMonth: number, periodYear: number) {
  const boxes = await prisma.subscriptionBox.findMany({
    where: { periodMonth, periodYear },
    include: {
      plan: { select: { id: true, name: true } },
      items: {
        include: {
          product: {
            select: {
              id: true, name: true, sku: true,
              inventory: { select: { onHand: true, reserved: true } },
            },
          },
        },
      },
    },
  });

  const counts = await prisma.subscription.groupBy({
    by: ["planId"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });
  const subscribersByPlan = new Map(counts.map((c) => [c.planId, c._count._all]));

  const totals = new Map<
    string,
    { productId: string; name: string; sku: string; needed: number; available: number }
  >();

  for (const box of boxes) {
    const subscribers = subscribersByPlan.get(box.planId) ?? 0;
    for (const item of box.items) {
      const entry = totals.get(item.productId) ?? {
        productId: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        needed: 0,
        available: Math.max(
          0,
          (item.product.inventory?.onHand ?? 0) - (item.product.inventory?.reserved ?? 0),
        ),
      };
      entry.needed += item.quantity * subscribers;
      totals.set(item.productId, entry);
    }
  }

  return [...totals.values()]
    .map((t) => ({ ...t, missing: Math.max(0, t.needed - t.available) }))
    .sort((a, b) => b.missing - a.missing);
}
