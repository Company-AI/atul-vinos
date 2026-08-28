import type { Metadata } from "next";
import type { OrderStatus, OrderType, Prisma } from "@prisma/client";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { formatARS } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { OrderFilters } from "@/components/admin/order-filters";
import { OrdersTable, type OrderRow } from "@/components/admin/orders-table";
import { Pagination } from "@/components/shop/pagination";

export const metadata: Metadata = { title: "Pedidos" };

const PER_PAGE = 40;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  await requireStaff("orders.view");
  const params = await searchParams;

  const value = (key: string) => {
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] : raw)?.trim() || undefined;
  };

  const page = Math.max(1, Number(value("pagina") ?? 1) || 1);
  const q = value("q");
  const estado = value("estado") as OrderStatus | undefined;
  const tipo = value("tipo") as OrderType | undefined;
  const transportista = value("transportista");
  const desde = value("desde");
  const hasta = value("hasta");

  const where: Prisma.OrderWhereInput = {};
  const and: Prisma.OrderWhereInput[] = [];

  if (q) {
    const asNumber = Number(q.replace("#", ""));
    and.push({
      OR: [
        ...(Number.isFinite(asNumber) ? [{ number: asNumber }] : []),
        { customerName: { contains: q, mode: "insensitive" } },
        { customerEmail: { contains: q, mode: "insensitive" } },
        { shipments: { some: { trackingNumber: { contains: q, mode: "insensitive" } } } },
        { items: { some: { name: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }
  if (estado) and.push({ status: estado });
  if (tipo) and.push({ type: tipo });
  if (transportista) and.push({ carrierCode: transportista });
  if (desde) and.push({ createdAt: { gte: new Date(`${desde}T00:00:00`) } });
  if (hasta) and.push({ createdAt: { lte: new Date(`${hasta}T23:59:59`) } });
  if (and.length) where.AND = and;

  const [orders, total, carriers, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        items: { select: { id: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
        shipments: {
          orderBy: { createdAt: "desc" }, take: 1,
          select: { trackingNumber: true, status: true, carrier: { select: { name: true } } },
        },
      },
    }),
    prisma.order.count({ where }),
    prisma.carrier.findMany({ orderBy: { sortOrder: "asc" }, select: { code: true, name: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const rows: OrderRow[] = orders.map((order) => ({
    id: order.id,
    number: order.number,
    createdAt: formatDate(order.createdAt),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    type: order.type,
    total: formatARS(order.total),
    status: order.status,
    paymentStatus: order.payments[0]?.status ?? null,
    shippingStatus: order.shipments[0]?.status ?? null,
    trackingNumber: order.shipments[0]?.trackingNumber ?? null,
    carrierName: order.shipments[0]?.carrier?.name ?? null,
    itemCount: order.items.length,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const buildHref = (targetPage: number) => {
    const search = new URLSearchParams();
    for (const [key, raw] of Object.entries(params)) {
      if (key === "pagina") continue;
      const v = Array.isArray(raw) ? raw[0] : raw;
      if (v) search.set(key, v);
    }
    if (targetPage > 1) search.set("pagina", String(targetPage));
    const qs = search.toString();
    return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
  };

  const pendingCount = counts.find((c) => c.status === "PAYMENT_PENDING")?._count._all ?? 0;

  return (
    <>
      <AdminPageHeader
        title="Pedidos"
        description={`${total} pedidos${pendingCount > 0 ? ` · ${pendingCount} esperando pago` : ""}`}
      />

      <OrderFilters carriers={carriers} />

      <AdminCard padded={false}>
        <OrdersTable orders={rows} />
      </AdminCard>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
      )}
    </>
  );
}
