import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Wine } from "lucide-react";
import { requireUser } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { getSettings } from "@/domain/settings/service";
import { resolveBoxForPeriod } from "@/domain/subscriptions/boxes";
import {
  CYCLE_STATUS_LABELS, SUBSCRIPTION_STATUS_LABELS, SUBSCRIPTION_STATUS_TONES,
} from "@/domain/subscriptions/status";
import { formatARS } from "@/lib/money";
import { currentPeriod, formatDate, formatDateTime, periodLabel } from "@/lib/dates";
import { SubscriptionManager } from "@/components/account/subscription-manager";
import { Badge } from "@/ui/badge";
import { buttonVariants } from "@/ui/button";
import { Card } from "@/ui/card";
import { EmptyState } from "@/ui/empty-state";
import { Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Mi suscripción",
  robots: { index: false, follow: false },
};

export default async function MySubscriptionPage() {
  const user = await requireUser("/mi-cuenta/suscripcion");

  const [subscription, settings, plans, addresses] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        plan: { include: { benefits: { include: { benefit: true } } } },
        cycles: { orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }], include: { order: true } },
        events: { orderBy: { createdAt: "desc" }, take: 20 },
        orders: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
    getSettings(),
    prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!subscription) {
    return (
      <>
        <Eyebrow>Mi cuenta</Eyebrow>
        <Heading level={1} size="md" className="mt-3">Mi suscripción</Heading>
        <div className="mt-10">
          <EmptyState
            icon={<Wine className="size-8" />}
            title="Todavía no sos socio del Club"
            description="Elegí un plan y todos los meses te enviamos una selección distinta, con beneficios en la tienda."
            action={
              <Link href="/club" className={buttonVariants({ variant: "dark", uppercase: true })}>
                Conocer el Club
              </Link>
            }
          />
        </div>
      </>
    );
  }

  const period = currentPeriod();
  const nextBox = settings.club.showNextBoxToMembers
    ? await resolveBoxForPeriod(subscription.planId, period.month, period.year)
    : null;

  const boxProducts = nextBox
    ? await prisma.product.findMany({
        where: { id: { in: nextBox.items.map((i) => i.productId) } },
        select: {
          id: true, name: true, slug: true, vintage: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      })
    : [];

  return (
    <>
      <Eyebrow>Mi cuenta</Eyebrow>
      <Heading level={1} size="md" className="mt-3">Mi suscripción</Heading>

      {subscription.status === "PAYMENT_FAILED" && (
        <div className="mt-8 flex gap-3 border border-danger-500/30 bg-danger-100 px-5 py-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger-500" />
          <div>
            <p className="text-[14px] font-medium text-danger-500">
              No pudimos procesar tu último cobro
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-danger-500">
              Tu caja queda en espera hasta que se acredite el pago. Vamos a reintentar
              automáticamente; también podés actualizar tu medio de pago desde Mercado Pago.
            </p>
          </div>
        </div>
      )}

      {/* Estado */}
      <Card className="mt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-display-sm font-light text-carbon-900">
              {subscription.plan.name}
            </p>
            <p className="mt-1 text-[14px] text-stone-600">
              {formatARS(subscription.amount)} por mes · {subscription.plan.bottleCount} botellas
            </p>
          </div>
          <Badge tone={SUBSCRIPTION_STATUS_TONES[subscription.status]}>
            {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
          </Badge>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-linen-200 pt-5 sm:grid-cols-4">
          <div>
            <dt className="text-[12px] uppercase tracking-wider text-stone-500">Socio desde</dt>
            <dd className="mt-1 text-[14px] tabular text-carbon-900">
              {formatDate(subscription.startedAt ?? subscription.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] uppercase tracking-wider text-stone-500">Próximo cobro</dt>
            <dd className="mt-1 text-[14px] tabular text-carbon-900">
              {subscription.nextChargeAt ? formatDate(subscription.nextChargeAt) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] uppercase tracking-wider text-stone-500">Último cobro</dt>
            <dd className="mt-1 text-[14px] tabular text-carbon-900">
              {subscription.lastChargeAt ? formatDate(subscription.lastChargeAt) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] uppercase tracking-wider text-stone-500">Envíos recibidos</dt>
            <dd className="mt-1 text-[14px] tabular text-carbon-900">{subscription.cyclesCount}</dd>
          </div>
        </dl>

        {subscription.skipNextCycle && (
          <p className="mt-5 border-t border-linen-200 pt-4 text-[13px] text-warning-500">
            Vamos a omitir tu próximo envío. El cobro sigue programado según tu plan.
          </p>
        )}

        <div className="mt-6 border-t border-linen-200 pt-5">
          <SubscriptionManager
            subscriptionId={subscription.id}
            status={subscription.status}
            skipNextCycle={subscription.skipNextCycle}
            rules={{
              allowPause: settings.club.allowPause,
              allowCancel: settings.club.allowCancel,
              allowPlanChange: settings.club.allowPlanChange,
              allowSkip: settings.club.allowSkip,
              skipCutoffDays: settings.club.skipCutoffDays,
            }}
            plans={plans.map((p) => ({
              id: p.id, name: p.name, price: formatARS(p.price),
            }))}
            currentPlanId={subscription.planId}
            addresses={addresses.map((a) => ({
              id: a.id,
              label: `${a.street} ${a.number}${a.apartment ? `, ${a.apartment}` : ""} — ${a.city}, ${a.province}`,
            }))}
            currentAddressId={subscription.addressId}
          />
        </div>
      </Card>

      {/* Próxima selección */}
      {nextBox && boxProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-display-sm font-light text-carbon-900">
            Tu próxima selección · {periodLabel(nextBox.periodMonth, nextBox.periodYear)}
          </h2>
          {nextBox.curatorNote && (
            <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-stone-600">
              {nextBox.curatorNote}
            </p>
          )}
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nextBox.items.map((item) => {
              const product = boxProducts.find((p) => p.id === item.productId);
              if (!product) return null;
              return (
                <li key={item.id} className="flex items-center gap-4 border border-linen-200 bg-bone-pure p-4">
                  {product.images[0] && (
                    <Image
                      src={product.images[0].url} alt="" width={40} height={53}
                      className="h-14 w-10 shrink-0 object-contain"
                    />
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/vinos/${product.slug}`}
                      className="block truncate text-[14px] text-carbon-900 hover:text-wine-700"
                    >
                      {product.name} {product.vintage ?? ""}
                    </Link>
                    <p className="text-[12px] text-stone-500">
                      {item.quantity} {item.quantity === 1 ? "botella" : "botellas"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Ciclos y envíos */}
      <section className="mt-12">
        <h2 className="font-display text-display-sm font-light text-carbon-900">
          Historial de cobros y envíos
        </h2>
        <ul className="mt-6 divide-y divide-linen-200 border-y border-linen-200">
          {subscription.cycles.map((cycle) => (
            <li key={cycle.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="text-[14px] text-carbon-900">
                  {periodLabel(cycle.periodMonth, cycle.periodYear)}
                </p>
                <p className="mt-0.5 text-[13px] text-stone-500">
                  {formatARS(cycle.amount)}
                  {cycle.chargedAt ? ` · cobrado el ${formatDate(cycle.chargedAt)}` : ""}
                  {cycle.failureReason ? ` · ${cycle.failureReason}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  tone={
                    cycle.status === "PAID" ? "success"
                      : cycle.status === "PAYMENT_FAILED" ? "danger"
                      : cycle.status === "SKIPPED" ? "neutral" : "warning"
                  }
                >
                  {CYCLE_STATUS_LABELS[cycle.status]}
                </Badge>
                {cycle.order && (
                  <Link
                    href={`/mi-cuenta/pedidos/${cycle.order.number}`}
                    className="text-[13px] underline underline-offset-4 hover:text-wine-700"
                  >
                    Pedido #{cycle.order.number}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Timeline */}
      <section className="mt-12">
        <h2 className="font-display text-display-sm font-light text-carbon-900">Actividad</h2>
        <ol className="mt-6 space-y-3">
          {subscription.events.map((event) => (
            <li key={event.id} className="flex gap-4 text-[13px]">
              <span className="shrink-0 tabular text-stone-500">
                {formatDateTime(event.createdAt)}
              </span>
              <span className="text-carbon-800">{event.message ?? event.type}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
