import type { Metadata } from "next";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { toNumber } from "@/lib/money";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { PlanManager, type PlanRow } from "@/components/admin/plan-manager";

export const metadata: Metadata = { title: "Planes del Club" };

export default async function AdminPlansPage() {
  const staff = await requireStaff("subscriptions.view");

  const [plans, benefits] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
      include: {
        benefits: true,
        _count: { select: { subscriptions: { where: { status: "ACTIVE" } } } },
      },
    }),
    prisma.clubBenefit.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  const rows: PlanRow[] = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    tagline: plan.tagline,
    description: plan.description,
    price: toNumber(plan.price),
    frequency: plan.frequency,
    bottleCount: plan.bottleCount,
    imageUrl: plan.imageUrl,
    perks: plan.perks,
    shippingCost: plan.shippingCost ? toNumber(plan.shippingCost) : null,
    freeShipping: plan.freeShipping,
    trialDays: plan.trialDays,
    firstCycleDiscountPercent: plan.firstCycleDiscountPercent,
    isActive: plan.isActive,
    featured: plan.featured,
    sortOrder: plan.sortOrder,
    benefitIds: plan.benefits.map((b) => b.benefitId),
    subscriberCount: plan._count.subscriptions,
  }));

  return (
    <>
      <AdminPageHeader
        breadcrumb={[{ label: "Suscriptores", href: "/admin/suscripciones" }]}
        title="Planes del Club"
        description="Nada está hardcodeado: precios, botellas, beneficios y envío se editan acá."
      />
      <AdminCard padded={false}>
        <div className="p-4">
          <PlanManager
            plans={rows}
            benefits={benefits}
            canEdit={staff.isSuperAdmin || staff.permissions.has("subscriptions.plans")}
          />
        </div>
      </AdminCard>
    </>
  );
}
