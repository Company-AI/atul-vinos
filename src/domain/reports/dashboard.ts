import { prisma } from "@/infra/db/prisma";
import { REVENUE_STATUSES } from "@/domain/orders/status";
import { getLowStockProducts } from "@/domain/inventory/service";
import { getClubStockRequirements } from "@/domain/subscriptions/boxes";
import { toNumber } from "@/lib/money";
import { currentPeriod } from "@/lib/dates";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export type DashboardMetrics = Awaited<ReturnType<typeof getDashboardMetrics>>;

/** Las 16 métricas del dashboard (spec §24). */
export async function getDashboardMetrics() {
  const today = startOfToday();
  const monthStart = startOfMonth();
  const period = currentPeriod();

  const [
    salesToday, salesMonth, ordersToday, pendingPayment, toPrepare, shipped,
    storeSales, subscriptionSales, activeSubscribers, newSubscribers,
    cancellations, failedPayments, lowStock, clubRequirements, upcomingShipments,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: REVENUE_STATUSES }, paidAt: { gte: today } },
      _sum: { total: true }, _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: REVENUE_STATUSES }, paidAt: { gte: monthStart } },
      _sum: { total: true }, _count: { _all: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: "PAYMENT_PENDING" } }),
    prisma.order.count({ where: { status: { in: ["PAID", "STOCK_RESERVED", "PREPARING"] } } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
    prisma.order.aggregate({
      where: { type: "STORE", status: { in: REVENUE_STATUSES }, paidAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { type: "SUBSCRIPTION", status: { in: REVENUE_STATUSES }, paidAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.subscription.count({ where: { cancelledAt: { gte: monthStart } } }),
    prisma.subscriptionCycle.count({
      where: { status: "PAYMENT_FAILED", failedAt: { gte: monthStart } },
    }),
    getLowStockProducts(50),
    getClubStockRequirements(period.month, period.year),
    prisma.order.count({
      where: { type: "SUBSCRIPTION", status: { in: ["PAID", "STOCK_RESERVED", "PREPARING", "READY"] } },
    }),
  ]);

  const monthRevenue = toNumber(salesMonth._sum.total);
  const monthOrders = salesMonth._count._all;

  // Ingreso recurrente mensual: suma del importe de las suscripciones activas.
  const mrrRows = await prisma.subscription.aggregate({
    where: { status: "ACTIVE" },
    _sum: { amount: true },
  });

  return {
    salesToday: toNumber(salesToday._sum.total),
    salesMonth: monthRevenue,
    ordersToday,
    pendingPayment,
    toPrepare,
    shipped,
    averageTicket: monthOrders > 0 ? Math.round(monthRevenue / monthOrders) : 0,
    activeSubscribers,
    newSubscribers,
    cancellations,
    failedPayments,
    mrr: toNumber(mrrRows._sum.amount),
    storeSales: toNumber(storeSales._sum.total),
    subscriptionSales: toNumber(subscriptionSales._sum.total),
    lowStock,
    lowStockCount: lowStock.length,
    clubRequirements: clubRequirements.filter((r) => r.missing > 0),
    upcomingShipments,
  };
}

export type DailySalesPoint = { date: string; store: number; club: number; total: number };

/** Serie de ventas diaria de los últimos N días. */
export async function getDailySales(days = 30): Promise<DailySalesPoint[]> {
  const rows = await prisma.$queryRaw<
    { day: Date; type: string; total: number }[]
  >`
    SELECT date_trunc('day', "paidAt") AS day, type, SUM(total)::float AS total
    FROM "Order"
    WHERE "paidAt" >= NOW() - (${days} || ' days')::interval
      AND status = ANY(${REVENUE_STATUSES}::"OrderStatus"[])
    GROUP BY 1, 2
    ORDER BY 1 ASC
  `;

  const byDay = new Map<string, DailySalesPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { date: key, store: 0, club: 0, total: 0 });
  }

  for (const row of rows) {
    const key = new Date(row.day).toISOString().slice(0, 10);
    const point = byDay.get(key);
    if (!point) continue;
    if (row.type === "SUBSCRIPTION") point.club += row.total;
    else point.store += row.total;
    point.total = point.store + point.club;
  }

  return [...byDay.values()];
}

export type MonthlySalesPoint = { month: string; store: number; club: number; total: number };

export async function getMonthlySales(months = 12): Promise<MonthlySalesPoint[]> {
  const rows = await prisma.$queryRaw<{ month: Date; type: string; total: number }[]>`
    SELECT date_trunc('month', "paidAt") AS month, type, SUM(total)::float AS total
    FROM "Order"
    WHERE "paidAt" >= date_trunc('month', NOW()) - (${months - 1} || ' months')::interval
      AND status = ANY(${REVENUE_STATUSES}::"OrderStatus"[])
    GROUP BY 1, 2
    ORDER BY 1 ASC
  `;

  const byMonth = new Map<string, MonthlySalesPoint>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, { month: key, store: 0, club: 0, total: 0 });
  }

  for (const row of rows) {
    const d = new Date(row.month);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const point = byMonth.get(key);
    if (!point) continue;
    if (row.type === "SUBSCRIPTION") point.club += row.total;
    else point.store += row.total;
    point.total = point.store + point.club;
  }

  return [...byMonth.values()];
}

export type SubscriptionFlowPoint = { month: string; signups: number; cancellations: number; mrr: number };

/** Altas, bajas e ingreso recurrente por mes. */
export async function getSubscriptionFlow(months = 12): Promise<SubscriptionFlowPoint[]> {
  const [signups, cancellations, cycles] = await Promise.all([
    prisma.$queryRaw<{ month: Date; count: bigint }[]>`
      SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::bigint AS count
      FROM "Subscription"
      WHERE "createdAt" >= date_trunc('month', NOW()) - (${months - 1} || ' months')::interval
      GROUP BY 1 ORDER BY 1
    `,
    prisma.$queryRaw<{ month: Date; count: bigint }[]>`
      SELECT date_trunc('month', "cancelledAt") AS month, COUNT(*)::bigint AS count
      FROM "Subscription"
      WHERE "cancelledAt" >= date_trunc('month', NOW()) - (${months - 1} || ' months')::interval
      GROUP BY 1 ORDER BY 1
    `,
    prisma.$queryRaw<{ month: Date; total: number }[]>`
      SELECT make_date("periodYear", "periodMonth", 1) AS month, SUM(amount)::float AS total
      FROM "SubscriptionCycle"
      WHERE status = 'PAID'
      GROUP BY 1 ORDER BY 1
    `,
  ]);

  const result = new Map<string, SubscriptionFlowPoint>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.set(key, { month: key, signups: 0, cancellations: 0, mrr: 0 });
  }

  const keyOf = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  for (const row of signups) {
    const point = result.get(keyOf(row.month));
    if (point) point.signups = Number(row.count);
  }
  for (const row of cancellations) {
    const point = result.get(keyOf(row.month));
    if (point) point.cancellations = Number(row.count);
  }
  for (const row of cycles) {
    const point = result.get(keyOf(row.month));
    if (point) point.mrr = row.total;
  }

  return [...result.values()];
}

export type TopProduct = {
  productId: string | null;
  name: string;
  sku: string;
  units: number;
  revenue: number;
};

export async function getTopProducts(limit = 8, days = 90): Promise<TopProduct[]> {
  return prisma.$queryRaw<TopProduct[]>`
    SELECT oi."productId", oi.name, oi.sku,
           SUM(oi.quantity)::int AS units,
           SUM(oi."lineTotal")::float AS revenue
    FROM "OrderItem" oi
    JOIN "Order" o ON o.id = oi."orderId"
    WHERE o."paidAt" >= NOW() - (${days} || ' days')::interval
      AND o.status = ANY(${REVENUE_STATUSES}::"OrderStatus"[])
    GROUP BY oi."productId", oi.name, oi.sku
    ORDER BY units DESC
    LIMIT ${limit}
  `;
}
