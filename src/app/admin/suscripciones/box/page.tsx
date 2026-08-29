import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { getAvailabilityMap } from "@/domain/inventory/availability";
import { toNumber } from "@/lib/money";
import { currentPeriod, periodLabel } from "@/lib/dates";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { BoxBuilder, type BoxState, type BoxWine } from "@/components/admin/box-builder";
import { EmptyState } from "@/ui/empty-state";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Box del mes" };

type PageProps = {
  searchParams: Promise<{ plan?: string; mes?: string; anio?: string }>;
};

export default async function AdminBoxPage({ searchParams }: PageProps) {
  const staff = await requireStaff("subscriptions.view");
  const params = await searchParams;
  const period = currentPeriod();

  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { subscriptions: { where: { status: "ACTIVE" } } } } },
  });

  if (plans.length === 0) {
    return (
      <>
        <AdminPageHeader title="Box del mes" />
        <EmptyState
          title="Todavía no hay planes del Club"
          description="Creá al menos un plan para poder armar el box mensual."
          action={
            <Link
              href="/admin/suscripciones/planes"
              className="text-[13px] underline underline-offset-4"
            >
              Ir a Planes
            </Link>
          }
        />
      </>
    );
  }

  const planId = params.plan && plans.some((p) => p.id === params.plan)
    ? params.plan
    : plans[0].id;
  const periodMonth = Number(params.mes ?? period.month) || period.month;
  const periodYear = Number(params.anio ?? period.year) || period.year;
  const plan = plans.find((p) => p.id === planId)!;

  const [box, wineRows] = await Promise.all([
    prisma.subscriptionBox.findUnique({
      where: { planId_periodYear_periodMonth: { planId, periodYear, periodMonth } },
      include: { items: true },
    }),
    prisma.product.findMany({
      where: { kind: "WINE", status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, price: true, cost: true },
    }),
  ]);

  const availability = await getAvailabilityMap(wineRows.map((w) => w.id));

  const wines: BoxWine[] = wineRows.map((wine) => ({
    id: wine.id,
    name: wine.name,
    sku: wine.sku,
    price: toNumber(wine.price),
    cost: toNumber(wine.cost),
    available: availability.get(wine.id)?.available ?? 0,
  }));

  const initial: BoxState = {
    planId,
    planName: plan.name,
    subscriberCount: plan._count.subscriptions,
    periodMonth,
    periodYear,
    name: box?.name ?? "",
    curatorNote: box?.curatorNote ?? "",
    isPublished: box?.isPublished ?? false,
    items: box?.items.map((i) => ({ productId: i.productId, quantity: i.quantity })) ?? [],
  };

  return (
    <>
      <AdminPageHeader
        breadcrumb={[{ label: "Suscriptores", href: "/admin/suscripciones" }]}
        title={`Box de ${periodLabel(periodMonth, periodYear)}`}
        description={`${plan.name} · ${plan._count.subscriptions} socios activos`}
      />

      {/* Selector rápido de plan */}
      <div className="mb-4 flex flex-wrap gap-2">
        {plans.map((option) => (
          <Link
            key={option.id}
            href={`/admin/suscripciones/box?plan=${option.id}&mes=${periodMonth}&anio=${periodYear}`}
            className={cn(
              "flex h-8 items-center rounded-sm border px-3 text-[12px] transition-colors",
              option.id === planId
                ? "border-carbon-900 bg-carbon-900 text-bone"
                : "border-linen-300 text-carbon-800 hover:border-stone-400",
            )}
          >
            {option.name}
            <span className="ml-1.5 text-[11px] opacity-70">
              {option._count.subscriptions}
            </span>
          </Link>
        ))}
      </div>

      <BoxBuilder
        initial={initial}
        wines={wines}
        canEdit={staff.isSuperAdmin || staff.permissions.has("subscriptions.box")}
      />
    </>
  );
}
