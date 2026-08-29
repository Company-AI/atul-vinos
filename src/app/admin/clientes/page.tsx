import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { REVENUE_STATUSES } from "@/domain/orders/status";
import { SUBSCRIPTION_STATUS_LABELS, SUBSCRIPTION_STATUS_TONES } from "@/domain/subscriptions/status";
import { formatARS, toNumber } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { AdminCard, AdminPageHeader, AdminTable, Td } from "@/components/admin/admin-ui";
import { Badge } from "@/ui/badge";
import { buttonVariants } from "@/ui/button";
import { Input } from "@/ui/field";

export const metadata: Metadata = { title: "Clientes" };

type PageProps = { searchParams: Promise<{ q?: string; socios?: string }> };

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  await requireStaff("customers.view");
  const { q, socios } = await searchParams;

  const customers = await prisma.user.findMany({
    where: {
      isStaff: false,
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(socios ? { subscriptions: { some: { status: "ACTIVE" } } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 },
      orders: {
        where: { status: { in: REVENUE_STATUSES } },
        select: { total: true, createdAt: true },
      },
      _count: { select: { orders: true, favorites: true } },
    },
  });

  const rows = customers.map((customer) => {
    const spent = customer.orders.reduce((acc, order) => acc + toNumber(order.total), 0);
    const lastOrder = customer.orders
      .map((o) => o.createdAt)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return { customer, spent, lastOrder, subscription: customer.subscriptions[0] ?? null };
  });

  return (
    <>
      <AdminPageHeader
        title="Clientes"
        description={`${customers.length} clientes registrados`}
      />

      <form className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-stone-500">Buscar</span>
          <Input name="q" defaultValue={q ?? ""} placeholder="Nombre, email o teléfono"
            className="h-8 w-64 text-[13px]" />
        </label>
        <button type="submit" className={buttonVariants({ variant: "subtle", size: "sm" })}>
          Buscar
        </button>
        <Link
          href={socios ? "/admin/clientes" : "/admin/clientes?socios=1"}
          className={buttonVariants({ variant: socios ? "dark" : "subtle", size: "sm" })}
        >
          Solo socios del Club
        </Link>
      </form>

      <AdminCard padded={false}>
        <AdminTable
          headers={[
            "Cliente", "Contacto", "Registro",
            { label: "Pedidos", align: "right" },
            { label: "Gastado", align: "right" },
            "Última compra", "Suscripción", { label: "", align: "right" },
          ]}
          empty={<p className="text-[13px] text-stone-500">No hay clientes con ese filtro.</p>}
        >
          {rows.map(({ customer, spent, lastOrder, subscription }) => (
            <tr key={customer.id}>
              <Td>
                <Link href={`/admin/clientes/${customer.id}`} className="hover:text-wine-700">
                  {customer.firstName} {customer.lastName}
                </Link>
                {customer.internalNotes && (
                  <span className="ml-2 text-[11px] text-warning-500">nota interna</span>
                )}
              </Td>
              <Td>
                <span className="block text-[12px]">{customer.email}</span>
                {customer.phone && (
                  <span className="block text-[11px] text-stone-500">{customer.phone}</span>
                )}
              </Td>
              <Td className="whitespace-nowrap tabular text-stone-500">
                {formatDate(customer.createdAt)}
              </Td>
              <Td align="right" className="tabular">{customer._count.orders}</Td>
              <Td align="right" className="whitespace-nowrap tabular">{formatARS(spent)}</Td>
              <Td className="whitespace-nowrap tabular text-stone-500">
                {lastOrder ? formatDate(lastOrder) : "—"}
              </Td>
              <Td>
                {subscription ? (
                  <Badge tone={SUBSCRIPTION_STATUS_TONES[subscription.status]}>
                    {subscription.plan.name} · {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                  </Badge>
                ) : (
                  <span className="text-stone-400">—</span>
                )}
              </Td>
              <Td align="right">
                <Link
                  href={`/admin/clientes/${customer.id}`}
                  className="text-[12px] underline underline-offset-2 hover:text-wine-700"
                >
                  Ver
                </Link>
              </Td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>
    </>
  );
}
