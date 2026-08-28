import { NextResponse } from "next/server";
import { prisma } from "@/infra/db/prisma";
import { getCurrentUser } from "@/infra/auth/session";
import { ORDER_STATUS_ADMIN_LABELS } from "@/domain/orders/status";
import { formatARS } from "@/lib/money";

/** Buscador global del admin. Solo para staff autenticado. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.isStaff) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ orders: [], customers: [], products: [], subscriptions: [] });
  }

  const orderNumber = Number(q.replace("#", ""));
  const like = { contains: q, mode: "insensitive" as const };

  const [orders, customers, products, subscriptions] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [
          ...(Number.isFinite(orderNumber) ? [{ number: orderNumber }] : []),
          { customerName: like },
          { customerEmail: like },
          { shipments: { some: { trackingNumber: like } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, number: true, customerName: true, total: true, status: true },
    }),
    prisma.user.findMany({
      where: {
        isStaff: false,
        OR: [{ firstName: like }, { lastName: like }, { email: like }, { phone: like }],
      },
      take: 5,
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.product.findMany({
      where: { OR: [{ name: like }, { sku: like }, { slug: like }] },
      take: 5,
      select: { id: true, name: true, sku: true },
    }),
    prisma.subscription.findMany({
      where: {
        OR: [
          ...(Number.isFinite(orderNumber) ? [{ number: orderNumber }] : []),
          { user: { OR: [{ firstName: like }, { lastName: like }, { email: like }] } },
          { externalId: like },
        ],
      },
      take: 5,
      include: { user: true, plan: true },
    }),
  ]);

  return NextResponse.json(
    {
      orders: orders.map((o) => ({
        id: o.id, number: o.number, customerName: o.customerName,
        total: formatARS(o.total), status: ORDER_STATUS_ADMIN_LABELS[o.status],
      })),
      customers: customers.map((c) => ({
        id: c.id, name: `${c.firstName} ${c.lastName}`, email: c.email,
      })),
      products,
      subscriptions: subscriptions.map((s) => ({
        id: s.id, number: s.number,
        customerName: `${s.user.firstName} ${s.user.lastName}`,
        planName: s.plan.name,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
