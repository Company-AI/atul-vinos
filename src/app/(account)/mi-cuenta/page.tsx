import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Package, Wine } from "lucide-react";
import { requireUser } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { getMemberBenefits } from "@/domain/promotions/club-benefits";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES, REVENUE_STATUSES } from "@/domain/orders/status";
import { SUBSCRIPTION_STATUS_LABELS, SUBSCRIPTION_STATUS_TONES } from "@/domain/subscriptions/status";
import { formatARS, toNumber } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/ui/badge";
import { buttonVariants } from "@/ui/button";
import { Card } from "@/ui/card";
import { EmptyState } from "@/ui/empty-state";
import { Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

export default async function AccountHomePage() {
  const user = await requireUser();

  const [orders, subscription, benefits, totalSpent] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { items: { take: 3 } },
    }),
    prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    }),
    getMemberBenefits(user.id),
    prisma.order.aggregate({
      where: { userId: user.id, status: { in: REVENUE_STATUSES } },
      _sum: { total: true },
      _count: { _all: true },
    }),
  ]);

  return (
    <>
      <Eyebrow>Mi cuenta</Eyebrow>
      <Heading level={1} size="md" className="mt-3">
        Hola, {user.firstName}
      </Heading>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="eyebrow text-stone-500">Pedidos</p>
          <p className="mt-2 text-2xl font-medium tabular text-carbon-900">
            {totalSpent._count._all}
          </p>
        </Card>
        <Card>
          <p className="eyebrow text-stone-500">Total comprado</p>
          <p className="mt-2 text-2xl font-medium tabular text-carbon-900">
            {formatARS(totalSpent._sum.total ?? 0)}
          </p>
        </Card>
        <Card>
          <p className="eyebrow text-stone-500">Club</p>
          <p className="mt-2 text-[15px] text-carbon-900">
            {benefits.isMember ? benefits.planName : "Sin suscripción"}
          </p>
          {benefits.isMember && benefits.storeDiscountPercent > 0 && (
            <p className="mt-1 text-[13px] text-success-500">
              {benefits.storeDiscountPercent}% off en la tienda
            </p>
          )}
        </Card>
      </div>

      {/* Suscripción */}
      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-display-sm font-light text-carbon-900">Mi suscripción</h2>
          {subscription && (
            <Link
              href="/mi-cuenta/suscripcion"
              className="flex items-center gap-1.5 text-[13px] underline underline-offset-4 hover:text-wine-700"
            >
              Administrar <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>

        {subscription ? (
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[15px] font-medium text-carbon-900">{subscription.plan.name}</p>
                <p className="mt-1 text-[13px] text-stone-500">
                  {formatARS(subscription.amount)} por mes ·{" "}
                  {subscription.nextChargeAt
                    ? `próximo cobro ${formatDate(subscription.nextChargeAt)}`
                    : "sin próximos cobros"}
                </p>
              </div>
              <Badge tone={SUBSCRIPTION_STATUS_TONES[subscription.status]}>
                {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
              </Badge>
            </div>
          </Card>
        ) : (
          <EmptyState
            compact
            icon={<Wine className="size-7" />}
            title="Todavía no sos socio del Club"
            description="Recibí una selección distinta cada mes y 10% de descuento permanente en la tienda."
            action={
              <Link href="/club" className={buttonVariants({ variant: "dark", uppercase: true })}>
                Conocer el Club
              </Link>
            }
          />
        )}
      </section>

      {/* Últimos pedidos */}
      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-display-sm font-light text-carbon-900">Últimos pedidos</h2>
          {orders.length > 0 && (
            <Link
              href="/mi-cuenta/pedidos"
              className="flex items-center gap-1.5 text-[13px] underline underline-offset-4 hover:text-wine-700"
            >
              Ver todos <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <EmptyState
            compact
            icon={<Package className="size-7" />}
            title="Todavía no hiciste ningún pedido"
            description="Cuando compres, vas a poder seguir el estado de cada envío desde acá."
            action={
              <Link href="/vinos" className={buttonVariants({ variant: "dark", uppercase: true })}>
                Ver los vinos
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-linen-200 border-y border-linen-200">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/mi-cuenta/pedidos/${order.number}`}
                  className="flex flex-wrap items-center justify-between gap-4 py-4 transition-colors hover:bg-linen-100"
                >
                  <div>
                    <p className="text-[14px] font-medium text-carbon-900">
                      Pedido #{order.number}
                      {order.type === "SUBSCRIPTION" && (
                        <span className="ml-2 text-[12px] font-normal text-stone-500">Club</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[13px] text-stone-500">
                      {formatDate(order.createdAt)} ·{" "}
                      {order.items.map((i) => i.name).join(", ")}
                      {order.items.length >= 3 ? "…" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[14px] tabular text-carbon-900">
                      {formatARS(order.total)}
                    </span>
                    <Badge tone={ORDER_STATUS_TONES[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
