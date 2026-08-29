import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { ORDER_STATUS_ADMIN_LABELS, ORDER_STATUS_TONES, REVENUE_STATUSES } from "@/domain/orders/status";
import { SUBSCRIPTION_STATUS_LABELS, SUBSCRIPTION_STATUS_TONES } from "@/domain/subscriptions/status";
import { getMemberBenefits } from "@/domain/promotions/club-benefits";
import { formatARS, toNumber } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { AdminCard, AdminPageHeader, AdminTable, MetricCard, Td } from "@/components/admin/admin-ui";
import { CustomerNote } from "@/components/admin/customer-note";
import { Badge } from "@/ui/badge";

export const metadata: Metadata = { title: "Ficha del cliente" };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const staff = await requireStaff("customers.view");
  const { id } = await params;

  const customer = await prisma.user.findFirst({
    where: { id, isStaff: false },
    include: {
      addresses: { orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }] },
      orders: { orderBy: { createdAt: "desc" }, include: { items: { select: { id: true } } } },
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" } },
      favorites: { include: { product: { select: { id: true, name: true, slug: true } } } },
      couponUsages: { include: { coupon: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) notFound();

  const benefits = await getMemberBenefits(customer.id);
  const paidOrders = customer.orders.filter((o) => REVENUE_STATUSES.includes(o.status));
  const spent = paidOrders.reduce((acc, order) => acc + toNumber(order.total), 0);
  const canEdit = staff.isSuperAdmin || staff.permissions.has("customers.edit");

  return (
    <>
      <AdminPageHeader
        breadcrumb={[{ label: "Clientes", href: "/admin/clientes" }]}
        title={`${customer.firstName} ${customer.lastName}`}
        description={`${customer.email} · cliente desde ${formatDate(customer.createdAt)}`}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <MetricCard label="Pedidos pagados" value={paidOrders.length} />
        <MetricCard label="Total comprado" value={formatARS(spent)} />
        <MetricCard
          label="Ticket promedio"
          value={formatARS(paidOrders.length ? Math.round(spent / paidOrders.length) : 0)}
        />
        <MetricCard
          label="Socio del Club"
          value={benefits.isMember ? "Sí" : "No"}
          hint={benefits.planName ?? undefined}
          tone={benefits.isMember ? "success" : "neutral"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <AdminCard title="Pedidos" padded={false}>
            <AdminTable
              headers={[
                "Nº", "Fecha", "Tipo",
                { label: "Ítems", align: "right" },
                { label: "Total", align: "right" },
                "Estado", { label: "", align: "right" },
              ]}
              empty={<p className="text-[13px] text-stone-500">Todavía no compró.</p>}
            >
              {customer.orders.map((order) => (
                <tr key={order.id}>
                  <Td className="tabular">#{order.number}</Td>
                  <Td className="whitespace-nowrap tabular text-stone-500">
                    {formatDate(order.createdAt)}
                  </Td>
                  <Td>
                    <Badge tone={order.type === "SUBSCRIPTION" ? "gold" : "neutral"}>
                      {order.type === "SUBSCRIPTION" ? "Club" : "Tienda"}
                    </Badge>
                  </Td>
                  <Td align="right" className="tabular">{order.items.length}</Td>
                  <Td align="right" className="whitespace-nowrap tabular">
                    {formatARS(order.total)}
                  </Td>
                  <Td>
                    <Badge tone={ORDER_STATUS_TONES[order.status]}>
                      {ORDER_STATUS_ADMIN_LABELS[order.status]}
                    </Badge>
                  </Td>
                  <Td align="right">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="text-[12px] underline underline-offset-2 hover:text-wine-700"
                    >
                      Ver
                    </Link>
                  </Td>
                </tr>
              ))}
            </AdminTable>
          </AdminCard>

          {customer.subscriptions.length > 0 && (
            <AdminCard title="Suscripciones" padded={false}>
              <AdminTable
                headers={["Nº", "Plan", "Estado", "Alta", "Próximo cobro", { label: "Ciclos", align: "right" }, { label: "", align: "right" }]}
              >
                {customer.subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <Td className="tabular">#{subscription.number}</Td>
                    <Td>{subscription.plan.name}</Td>
                    <Td>
                      <Badge tone={SUBSCRIPTION_STATUS_TONES[subscription.status]}>
                        {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap tabular text-stone-500">
                      {formatDate(subscription.startedAt ?? subscription.createdAt)}
                    </Td>
                    <Td className="whitespace-nowrap tabular text-stone-500">
                      {subscription.nextChargeAt ? formatDate(subscription.nextChargeAt) : "—"}
                    </Td>
                    <Td align="right" className="tabular">{subscription.cyclesCount}</Td>
                    <Td align="right">
                      <Link
                        href={`/admin/suscripciones/${subscription.id}`}
                        className="text-[12px] underline underline-offset-2 hover:text-wine-700"
                      >
                        Ver
                      </Link>
                    </Td>
                  </tr>
                ))}
              </AdminTable>
            </AdminCard>
          )}

          {customer.couponUsages.length > 0 && (
            <AdminCard title="Cupones usados" padded={false}>
              <AdminTable headers={["Código", "Fecha", { label: "Descuento", align: "right" }]}>
                {customer.couponUsages.map((usage) => (
                  <tr key={usage.id}>
                    <Td>{usage.coupon.code}</Td>
                    <Td className="tabular text-stone-500">{formatDate(usage.createdAt)}</Td>
                    <Td align="right" className="tabular">{formatARS(usage.amount)}</Td>
                  </tr>
                ))}
              </AdminTable>
            </AdminCard>
          )}
        </div>

        <div className="space-y-4">
          <AdminCard title="Datos">
            <dl className="space-y-2 text-[13px]">
              <div>
                <dt className="text-stone-500">Email</dt>
                <dd>{customer.email}</dd>
              </div>
              {customer.phone && (
                <div>
                  <dt className="text-stone-500">Teléfono</dt>
                  <dd>{customer.phone}</dd>
                </div>
              )}
              {customer.documentId && (
                <div>
                  <dt className="text-stone-500">DNI</dt>
                  <dd className="tabular">{customer.documentId}</dd>
                </div>
              )}
              <div>
                <dt className="text-stone-500">Newsletter</dt>
                <dd>{customer.acceptsMarketing ? "Suscripto" : "No"}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Último ingreso</dt>
                <dd className="tabular">
                  {customer.lastLoginAt ? formatDate(customer.lastLoginAt) : "Nunca"}
                </dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard title={`Direcciones (${customer.addresses.length})`}>
            {customer.addresses.length === 0 ? (
              <p className="text-[13px] text-stone-500">Sin direcciones guardadas.</p>
            ) : (
              <ul className="space-y-3">
                {customer.addresses.map((address) => (
                  <li key={address.id} className="text-[13px] leading-relaxed">
                    {address.isDefaultShipping && (
                      <Badge tone="neutral" className="mb-1">Predeterminada</Badge>
                    )}
                    <address className="not-italic text-carbon-800">
                      {address.street} {address.number}
                      {address.apartment ? `, ${address.apartment}` : ""}<br />
                      {address.city}, {address.province} ({address.postalCode})
                    </address>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          {customer.favorites.length > 0 && (
            <AdminCard title="Favoritos">
              <ul className="space-y-1.5 text-[13px]">
                {customer.favorites.map((favorite) => (
                  <li key={favorite.productId}>
                    <Link
                      href={`/admin/productos/${favorite.product.id}`}
                      className="hover:text-wine-700"
                    >
                      {favorite.product.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </AdminCard>
          )}

          <AdminCard title="Nota interna">
            {canEdit ? (
              <CustomerNote userId={customer.id} initialNote={customer.internalNotes ?? ""} />
            ) : (
              <p className="text-[13px] text-stone-600">
                {customer.internalNotes || "Sin notas."}
              </p>
            )}
          </AdminCard>
        </div>
      </div>
    </>
  );
}
