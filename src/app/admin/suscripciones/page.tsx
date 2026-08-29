import type { Metadata } from "next";
import Link from "next/link";
import type { SubscriptionStatus } from "@prisma/client";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import {
  SUBSCRIPTION_STATUS_LABELS, SUBSCRIPTION_STATUS_TONES,
} from "@/domain/subscriptions/status";
import { formatARS } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { AdminCard, AdminPageHeader, AdminTable, MetricCard, Td } from "@/components/admin/admin-ui";
import { Badge } from "@/ui/badge";
import { buttonVariants } from "@/ui/button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Suscriptores" };

type PageProps = { searchParams: Promise<{ estado?: string; plan?: string }> };

export default async function AdminSubscriptionsPage({ searchParams }: PageProps) {
  await requireStaff("subscriptions.view");
  const { estado, plan } = await searchParams;

  const [subscriptions, plans, counts] = await Promise.all([
    prisma.subscription.findMany({
      where: {
        ...(estado ? { status: estado as SubscriptionStatus } : {}),
        ...(plan ? { plan: { slug: plan } } : {}),
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        user: true,
        plan: true,
        cycles: { orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }], take: 1 },
        orders: { orderBy: { createdAt: "desc" }, take: 1, select: { number: true, status: true } },
      },
    }),
    prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.subscription.groupBy({ by: ["status"], _count: { _all: true }, _sum: { amount: true } }),
  ]);

  const countBy = (status: SubscriptionStatus) =>
    counts.find((c) => c.status === status)?._count._all ?? 0;

  const mrr = counts.find((c) => c.status === "ACTIVE")?._sum.amount ?? 0;

  const filters = [
    { value: "", label: `Todas (${subscriptions.length})` },
    { value: "ACTIVE", label: `Activas (${countBy("ACTIVE")})` },
    { value: "PAUSED", label: `Pausadas (${countBy("PAUSED")})` },
    { value: "PAYMENT_FAILED", label: `Pago fallido (${countBy("PAYMENT_FAILED")})` },
    { value: "CANCELLED", label: `Canceladas (${countBy("CANCELLED")})` },
  ];

  return (
    <>
      <AdminPageHeader
        title="Suscriptores"
        description="Cada suscripción es un contrato; sus ciclos y pedidos están en el detalle."
        actions={
          <>
            <Link href="/admin/suscripciones/planes" className={buttonVariants({ variant: "subtle", size: "sm" })}>
              Planes
            </Link>
            <Link href="/admin/suscripciones/box" className={buttonVariants({ variant: "dark", size: "sm" })}>
              Box del mes
            </Link>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <MetricCard label="Activas" value={countBy("ACTIVE")} tone="success" />
        <MetricCard label="Pausadas" value={countBy("PAUSED")} />
        <MetricCard
          label="Pago fallido"
          value={countBy("PAYMENT_FAILED")}
          tone={countBy("PAYMENT_FAILED") > 0 ? "danger" : "neutral"}
        />
        <MetricCard label="Ingreso recurrente" value={formatARS(mrr)} tone="info" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.label}
            href={filter.value ? `/admin/suscripciones?estado=${filter.value}` : "/admin/suscripciones"}
            className={cn(
              "flex h-8 items-center rounded-sm border px-3 text-[12px] transition-colors",
              (estado ?? "") === filter.value
                ? "border-carbon-900 bg-carbon-900 text-bone"
                : "border-linen-300 text-carbon-800 hover:border-stone-400",
            )}
          >
            {filter.label}
          </Link>
        ))}

        {plans.map((p) => (
          <Link
            key={p.id}
            href={`/admin/suscripciones?plan=${p.slug}`}
            className={cn(
              "flex h-8 items-center rounded-sm border px-3 text-[12px] transition-colors",
              plan === p.slug
                ? "border-carbon-900 bg-carbon-900 text-bone"
                : "border-linen-300 text-stone-600 hover:border-stone-400",
            )}
          >
            {p.name}
          </Link>
        ))}
      </div>

      <AdminCard padded={false}>
        <AdminTable
          headers={[
            "Nº", "Cliente", "Plan", "Estado", "Alta", "Próximo cobro", "Último cobro",
            { label: "Monto", align: "right" },
            { label: "Ciclos", align: "right" },
            "Último envío", { label: "", align: "right" },
          ]}
          empty={<p className="text-[13px] text-stone-500">No hay suscripciones con ese filtro.</p>}
        >
          {subscriptions.map((subscription) => (
            <tr key={subscription.id}>
              <Td className="tabular">#{subscription.number}</Td>
              <Td>
                <Link
                  href={`/admin/suscripciones/${subscription.id}`}
                  className="hover:text-wine-700"
                >
                  {subscription.user.firstName} {subscription.user.lastName}
                </Link>
                <span className="block text-[11px] text-stone-500">{subscription.user.email}</span>
              </Td>
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
              <Td className="whitespace-nowrap tabular text-stone-500">
                {subscription.lastChargeAt ? formatDate(subscription.lastChargeAt) : "—"}
              </Td>
              <Td align="right" className="whitespace-nowrap tabular">
                {formatARS(subscription.amount)}
              </Td>
              <Td align="right" className="tabular">{subscription.cyclesCount}</Td>
              <Td className="text-stone-500">
                {subscription.orders[0] ? `#${subscription.orders[0].number}` : "—"}
              </Td>
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
    </>
  );
}
