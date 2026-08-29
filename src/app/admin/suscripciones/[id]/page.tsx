import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import {
  CYCLE_STATUS_LABELS, FREQUENCY_LABELS, SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_TONES,
} from "@/domain/subscriptions/status";
import { ORDER_STATUS_ADMIN_LABELS, ORDER_STATUS_TONES } from "@/domain/orders/status";
import { formatARS } from "@/lib/money";
import { formatDate, formatDateTime, periodLabel } from "@/lib/dates";
import { AdminCard, AdminPageHeader, AdminTable, Td } from "@/components/admin/admin-ui";
import { SubscriptionAdminActions } from "@/components/admin/subscription-actions";
import { Badge } from "@/ui/badge";

export const metadata: Metadata = { title: "Detalle del suscriptor" };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminSubscriptionDetailPage({ params }: PageProps) {
  await requireStaff("subscriptions.view");
  const { id } = await params;

  const [subscription, plans] = await Promise.all([
    prisma.subscription.findUnique({
      where: { id },
      include: {
        user: { include: { addresses: true } },
        plan: { include: { benefits: { include: { benefit: true } } } },
        address: true,
        cycles: {
          orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
          include: { order: true, box: true, payments: true },
        },
        orders: { orderBy: { createdAt: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
        events: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  if (!subscription) notFound();

  const snapshot = subscription.shippingSnapshot as Record<string, string> | null;

  return (
    <>
      <AdminPageHeader
        breadcrumb={[{ label: "Suscriptores", href: "/admin/suscripciones" }]}
        title={`${subscription.user.firstName} ${subscription.user.lastName}`}
        description={`Suscripción #${subscription.number} · ${subscription.plan.name}`}
        actions={
          <Badge tone={SUBSCRIPTION_STATUS_TONES[subscription.status]}>
            {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
          </Badge>
        }
      />

      <AdminCard className="mb-4">
        <SubscriptionAdminActions
          subscriptionId={subscription.id}
          status={subscription.status}
          currentPlanId={subscription.planId}
          plans={plans.map((p) => ({ id: p.id, name: p.name, price: formatARS(p.price) }))}
        />
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <AdminCard title="Ciclos y pedidos" description="Un ciclo por período cobrado; un pedido por envío." padded={false}>
            <AdminTable
              headers={[
                "Período", "Estado del ciclo",
                { label: "Monto", align: "right" },
                "Cobrado", "Box", "Pedido", "Estado del pedido",
              ]}
              empty={<p className="text-[13px] text-stone-500">Todavía no hay ciclos.</p>}
            >
              {subscription.cycles.map((cycle) => (
                <tr key={cycle.id}>
                  <Td className="whitespace-nowrap">
                    {periodLabel(cycle.periodMonth, cycle.periodYear)}
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        cycle.status === "PAID" ? "success"
                          : cycle.status === "PAYMENT_FAILED" ? "danger"
                          : cycle.status === "SKIPPED" ? "neutral" : "warning"
                      }
                    >
                      {CYCLE_STATUS_LABELS[cycle.status]}
                    </Badge>
                    {cycle.failureReason && (
                      <span className="mt-1 block text-[11px] text-danger-500">
                        {cycle.failureReason}
                      </span>
                    )}
                  </Td>
                  <Td align="right" className="tabular">{formatARS(cycle.amount)}</Td>
                  <Td className="whitespace-nowrap tabular text-stone-500">
                    {cycle.chargedAt ? formatDate(cycle.chargedAt) : "—"}
                    {cycle.chargeAttempts > 1 && (
                      <span className="ml-1 text-[11px]">({cycle.chargeAttempts} intentos)</span>
                    )}
                  </Td>
                  <Td className="text-stone-500">
                    {cycle.box ? periodLabel(cycle.box.periodMonth, cycle.box.periodYear) : "—"}
                  </Td>
                  <Td>
                    {cycle.order ? (
                      <Link
                        href={`/admin/pedidos/${cycle.order.id}`}
                        className="tabular hover:text-wine-700"
                      >
                        #{cycle.order.number}
                      </Link>
                    ) : (
                      <span className="text-stone-400">Sin pedido</span>
                    )}
                  </Td>
                  <Td>
                    {cycle.order && (
                      <Badge tone={ORDER_STATUS_TONES[cycle.order.status]}>
                        {ORDER_STATUS_ADMIN_LABELS[cycle.order.status]}
                      </Badge>
                    )}
                  </Td>
                </tr>
              ))}
            </AdminTable>
          </AdminCard>

          <AdminCard title="Pagos" padded={false}>
            <AdminTable
              headers={["Fecha", "Motivo", "Estado", { label: "Monto", align: "right" }, "ID externo", "Detalle"]}
              empty={<p className="text-[13px] text-stone-500">Sin pagos registrados.</p>}
            >
              {subscription.payments.map((payment) => (
                <tr key={payment.id}>
                  <Td className="whitespace-nowrap tabular text-stone-500">
                    {formatDate(payment.createdAt)}
                  </Td>
                  <Td className="text-stone-600">
                    {payment.purpose === "SUBSCRIPTION_SIGNUP" ? "Alta" : "Renovación"}
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        payment.status === "APPROVED" ? "success"
                          : payment.status === "REJECTED" ? "danger" : "warning"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </Td>
                  <Td align="right" className="tabular">{formatARS(payment.amount)}</Td>
                  <Td className="max-w-[160px] truncate text-[11px] tabular text-stone-500">
                    {payment.externalId ?? "—"}
                  </Td>
                  <Td className="text-[11px] text-stone-500">{payment.failureReason ?? "—"}</Td>
                </tr>
              ))}
            </AdminTable>
          </AdminCard>

          <AdminCard title="Timeline" description="Historial completo de la suscripción" padded={false}>
            <ol className="divide-y divide-linen-200">
              {subscription.events.map((event) => (
                <li key={event.id} className="flex flex-wrap items-baseline gap-3 px-4 py-2.5 text-[13px]">
                  <span className="shrink-0 tabular text-stone-500">
                    {formatDateTime(event.createdAt)}
                  </span>
                  <span className="text-carbon-800">{event.message ?? event.type}</span>
                  {event.actorEmail && (
                    <span className="text-[11px] text-stone-500">— {event.actorEmail}</span>
                  )}
                </li>
              ))}
            </ol>
          </AdminCard>
        </div>

        <div className="space-y-4">
          <AdminCard title="Contrato">
            <dl className="space-y-2.5 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">Plan</dt>
                <dd>{subscription.plan.name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">Frecuencia</dt>
                <dd>{FREQUENCY_LABELS[subscription.frequency]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">Importe</dt>
                <dd className="tabular">{formatARS(subscription.amount)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">Alta</dt>
                <dd className="tabular">
                  {formatDate(subscription.startedAt ?? subscription.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">Próximo cobro</dt>
                <dd className="tabular">
                  {subscription.nextChargeAt ? formatDate(subscription.nextChargeAt) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">Ciclos</dt>
                <dd className="tabular">{subscription.cyclesCount}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">Proveedor</dt>
                <dd>{subscription.provider}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">ID externo</dt>
                <dd className="max-w-[140px] truncate text-[11px] tabular">
                  {subscription.externalId ?? "—"}
                </dd>
              </div>
              {subscription.skipNextCycle && (
                <div className="border-t border-linen-200 pt-2 text-[12px] text-warning-500">
                  El socio pidió omitir el próximo envío.
                </div>
              )}
              {subscription.cancelReason && (
                <div className="border-t border-linen-200 pt-2 text-[12px] text-stone-600">
                  Motivo de baja: {subscription.cancelReason}
                </div>
              )}
            </dl>
          </AdminCard>

          <AdminCard title="Cliente">
            <p className="text-[13px] text-carbon-900">
              {subscription.user.firstName} {subscription.user.lastName}
            </p>
            <p className="text-[13px] text-stone-600">{subscription.user.email}</p>
            {subscription.user.phone && (
              <p className="text-[13px] text-stone-600">{subscription.user.phone}</p>
            )}
            <Link
              href={`/admin/clientes/${subscription.userId}`}
              className="mt-3 inline-block text-[12px] underline underline-offset-2 hover:text-wine-700"
            >
              Ver ficha del cliente
            </Link>
          </AdminCard>

          <AdminCard title="Dirección de envío">
            {snapshot ? (
              <address className="text-[13px] not-italic leading-relaxed text-carbon-800">
                {snapshot.firstName} {snapshot.lastName}<br />
                {snapshot.street} {snapshot.number}
                {snapshot.apartment ? `, ${snapshot.apartment}` : ""}<br />
                {snapshot.city}, {snapshot.province} ({snapshot.postalCode})<br />
                {snapshot.phone}
              </address>
            ) : (
              <p className="text-[13px] text-stone-500">Sin dirección registrada.</p>
            )}
          </AdminCard>

          <AdminCard title="Beneficios del plan">
            <ul className="space-y-1.5 text-[13px] text-carbon-800">
              {subscription.plan.benefits.map((pb) => (
                <li key={pb.benefitId}>
                  {pb.benefit.name}
                  {pb.benefit.code === "store_discount" && (
                    <span className="ml-1 text-stone-500">
                      ({Number(pb.overrideValue ?? pb.benefit.value)}%)
                    </span>
                  )}
                </li>
              ))}
              {subscription.plan.benefits.length === 0 && (
                <li className="text-stone-500">El plan no tiene beneficios configurados.</li>
              )}
            </ul>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
