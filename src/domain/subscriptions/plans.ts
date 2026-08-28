import { cache } from "react";
import { prisma } from "@/infra/db/prisma";
import { toNumber } from "@/lib/money";
import type { PlanCardData } from "@/components/club/club-plan-card";
import { FREQUENCY_LABELS } from "./status";

export const getActivePlans = cache(async (): Promise<PlanCardData[]> => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
  });

  return plans.map((plan) => ({
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    tagline: plan.tagline,
    price: toNumber(plan.price),
    bottleCount: plan.bottleCount,
    frequencyLabel: FREQUENCY_LABELS[plan.frequency],
    perks: plan.perks,
    imageUrl: plan.imageUrl,
    featured: plan.featured,
    freeShipping: plan.freeShipping,
    shippingCost: toNumber(plan.shippingCost),
    firstCycleDiscountPercent: plan.firstCycleDiscountPercent,
  }));
});

export const getPlanBySlug = cache(async (slug: string) =>
  prisma.subscriptionPlan.findUnique({
    where: { slug },
    include: { benefits: { include: { benefit: true } } },
  }),
);
