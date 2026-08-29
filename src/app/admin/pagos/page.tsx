import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { formatARS } from "@/lib/money";
import { formatDateTime, periodLabel } from "@/lib/dates";
import { AdminCard, AdminPageHeader, AdminTable, MetricCard, Td } from "@/components/admin/admin-ui";
import { RecoverPaymentButton, ReprocessWebhookButton } from "@/components/admin/webhook-actions";
import { Badge } from "@/ui/badge";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Pagos y webhooks" };

type PageProps = { searchParams: Promise<{ estado?: string }> };

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  const staff = await requireStaff("payments.view");
  const { estado } = await searchParams;
  const onlyFailed = estado === "fallidos";
  const canManage = staff.isSuperAdmin || staff.permissions.has("payments.manage");

  const [payments, failedCycles, webhooks, totals] = await Promise.all([
    prisma.payment.findMany({
      where: onlyFailed ? { status: { in: ["REJECTED", "CANCELLED", "CHARGED_BACK"] } } : {},
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        order: { select: { id: true, number: true } },
        subscription: { select: { id: true, number: true, user: true } },
        cycle: { select: { periodMonth: true, periodYear: true } },
      },
    }),
    prisma.subscriptionCycle.findMany({
      where: { status: "PAYMENT_FAILED" },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
      include: { subscription: { include: { user: true, plan: true } } },
    }),
    prisma.webhookEvent.findMany({
      orderBy: { receivedAt: "desc" },
      take: 40,
    }),
    prisma.payment.groupBy({ by: ["status"], _count: { _all: true }, _sum: { amount: true } }),
  ]);

  const countBy = (status: string) =>
    totals.find((t) => t.status === status)?._count._all ?? 0;
  const sumBy = (status: string) =>
    totals.find((t) => t.status === status)?._sum.amount ?? 0;

  return (
    <>
      <AdminPageHeader
        title="Pagos y webhooks"
        description="La confirmación de pago siempre llega por webhook, nunca por el redirect del navegador."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <MetricCard label="Aprobados" value={countBy("APPROVED")} hint={formatARS(sumBy("APPROVED"))} tone="success" />
        <MetricCard label="Pendientes" value={countBy("PENDING")} tone={countBy("PENDING") > 0 ? "warning" : "neutral"} />
        <MetricCard label="Rechazados" value={countBy("REJECTED")} tone={countBy("REJECTED") > 0 ? "danger" : "neutral"} />
        <MetricCard label="Ciclos del Club fallidos" value={failedCycles.length} tone={failedCycles.length > 0 ? "danger" : "neutral"} />
      </div>

      {/* Recuperación de cobros del Club */}
      {failedCycles.length > 0 && (
        <AdminCard
          title="Cobros del Club para recuperar"
          description="Estas cajas no se despachan hasta que se acredite el pago."
          className="mb-4"
          padded={false}
        >
          <AdminTable
            headers={["Socio", "Plan", "Período", { label: "Monto", align: "right" }, { label: "Intentos", align: "right" }, "Motivo", { label: "", align: "right" }]}
          >
            {failedCycles.map((cycle) => (
              <tr key={cycle.id}>
                <Td>
                  <Link
                    href={`/admin/suscripciones/${cycle.subscriptionId}`}
                    className="hover:text-wine-700"
                  >
                    {cycle.subscription.user.firstName} {cycle.subscription.user.lastName}
                  </Link>
                  <span className="block text-[11px] text-stone-500">
                    {cycle.subscription.user.email}
                  </span>
                </Td>
                <Td>{cycle.subscription.plan.name}</Td>
                <Td className="whitespace-nowrap">
                  {periodLabel(cycle.periodMonth, cycle.periodYear)}
                </Td>
                <Td align="right" className="tabular">{formatARS(cycle.amount)}</Td>
                <Td align="right" className="tabular">{cycle.chargeAttempts}</Td>
                <Td className="text-[12px] text-danger-500">{cycle.failureReason ?? "—"}</Td>
                <Td align="right">
                  {canManage && (
                    <RecoverPaymentButton
                      subscriptionId={cycle.subscriptionId}
                      subscriberName={`${cycle.subscription.user.firstName} ${cycle.subscription.user.lastName}`}
                      amount={formatARS(cycle.amount)}
                    />
                  )}
                </Td>
              </tr>
            ))}
          </AdminTable>
        </AdminCard>
      )}

      <div className="mb-4 flex gap-2">
        <Link
          href="/admin/pagos"
          className={cn(
            "flex h-8 items-center rounded-sm border px-3 text-[12px]",
            !onlyFailed ? "border-carbon-900 bg-carbon-900 text-bone" : "border-linen-300 text-carbon-800",
          )}
        >
          Todos los pagos
        </Link>
        <Link
          href="/admin/pagos?estado=fallidos"
          className={cn(
            "flex h-8 items-center rounded-sm border px-3 text-[12px]",
            onlyFailed ? "border-carbon-900 bg-carbon-900 text-bone" : "border-linen-300 text-carbon-800",
          )}
        >
          Solo rechazados
        </Link>
      </div>

      <AdminCard title="Pagos" padded={false} className="mb-4">
        <AdminTable
          headers={[
            "Fecha", "Proveedor", "Motivo", "Estado",
            { label: "Monto", align: "right" },
            "Pedido / Suscripción", "Método", "ID externo", "Detalle",
          ]}
          empty={<p className="text-[13px] text-stone-500">No hay pagos con ese filtro.</p>}
        >
          {payments.map((payment) => (
            <tr key={payment.id}>
              <Td className="whitespace-nowrap tabular text-stone-500">
                {formatDateTime(payment.createdAt)}
              </Td>
              <Td className="text-stone-600">{payment.provider}</Td>
              <Td className="text-stone-600">
                {payment.purpose === "ORDER"
                  ? "Pedido"
                  : payment.purpose === "SUBSCRIPTION_SIGNUP"
                    ? "Alta del Club"
                    : "Renovación"}
                {payment.cycle && (
                  <span className="ml-1 text-[11px]">
                    ({periodLabel(payment.cycle.periodMonth, payment.cycle.periodYear)})
                  </span>
                )}
              </Td>
              <Td>
                <Badge
                  tone={
                    payment.status === "APPROVED" ? "success"
                      : payment.status === "REJECTED" || payment.status === "CHARGED_BACK" ? "danger"
                      : payment.status === "REFUNDED" ? "warning" : "neutral"
                  }
                >
                  {payment.status}
                </Badge>
              </Td>
              <Td align="right" className="whitespace-nowrap tabular">
                {formatARS(payment.amount)}
              </Td>
              <Td>
                {payment.order ? (
                  <Link href={`/admin/pedidos/${payment.order.id}`} className="tabular hover:text-wine-700">
                    Pedido #{payment.order.number}
                  </Link>
                ) : payment.subscription ? (
                  <Link
                    href={`/admin/suscripciones/${payment.subscription.id}`}
                    className="tabular hover:text-wine-700"
                  >
                    Suscripción #{payment.subscription.number}
                  </Link>
                ) : (
                  <span className="text-stone-400">—</span>
                )}
              </Td>
              <Td className="text-stone-500">{payment.paymentMethod ?? "—"}</Td>
              <Td className="max-w-[140px] truncate text-[11px] tabular text-stone-500">
                {payment.externalId ?? "—"}
              </Td>
              <Td className="max-w-[180px] truncate text-[12px] text-danger-500">
                {payment.failureReason ?? ""}
              </Td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>

      <AdminCard
        title="Webhooks recibidos"
        description="Cada evento se guarda con su payload. El mismo eventId nunca se procesa dos veces."
        padded={false}
      >
        <AdminTable
          headers={[
            "Recibido", "Proveedor", "Tipo", "Event ID", "Estado",
            { label: "Intentos", align: "right" },
            "Procesado", "Error", { label: "", align: "right" },
          ]}
          empty={<p className="text-[13px] text-stone-500">Todavía no llegaron webhooks.</p>}
        >
          {webhooks.map((event) => (
            <tr key={event.id}>
              <Td className="whitespace-nowrap tabular text-stone-500">
                {formatDateTime(event.receivedAt)}
              </Td>
              <Td className="text-stone-600">{event.provider}</Td>
              <Td className="text-stone-600">{event.eventType ?? "—"}</Td>
              <Td className="max-w-[160px] truncate text-[11px] tabular text-stone-500">
                {event.eventId}
              </Td>
              <Td>
                <Badge
                  tone={
                    event.status === "PROCESSED" ? "success"
                      : event.status === "FAILED" ? "danger"
                      : event.status === "IGNORED" ? "neutral" : "warning"
                  }
                >
                  {event.status}
                </Badge>
              </Td>
              <Td align="right" className="tabular">{event.attempts}</Td>
              <Td className="whitespace-nowrap tabular text-stone-500">
                {event.processedAt ? formatDateTime(event.processedAt) : "—"}
              </Td>
              <Td className="max-w-[220px] truncate text-[12px] text-danger-500">
                {event.error ?? ""}
              </Td>
              <Td align="right">
                {canManage && event.status !== "PROCESSED" && (
                  <ReprocessWebhookButton webhookEventId={event.id} />
                )}
              </Td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>

      {failedCycles.length > 0 && (
        <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-stone-500">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning-500" />
          Si el proveedor tiene reintentos automáticos, los ciclos se recuperan solos cuando el
          cobro se acredita. «Registrar cobro» es para casos excepcionales en los que el pago está
          confirmado del lado del proveedor pero el webhook nunca llegó.
        </p>
      )}
    </>
  );
}
