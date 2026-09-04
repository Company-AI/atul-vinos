import { cache } from "react";
import { prisma } from "@/infra/db/prisma";
import { toNumber } from "@/lib/money";
import { IS_DEMO } from "@/infra/demo/mode";
import { demoPlanBySlug, demoPlanCards } from "@/infra/demo/content";
import type { PlanCardData } from "@/components/club/club-plan-card";
import { FREQUENCY_LABELS } from "./status";

export const getActivePlans = cache(async (): Promise<PlanCardData[]> => {
  if (IS_DEMO) return demoPlanCards();

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
  IS_DEMO
    ? demoPlanBySlug(slug)
    : prisma.subscriptionPlan.findUnique({
    where: { slug },
    include: { benefits: { include: { benefit: true } } },
  }),
);

/** El plan más barato: lo usan los bloques de "desde $X por mes". */
export const getEntryPlan = cache(async (): Promise<{ name: string; price: number } | null> => {
  const plans = await getActivePlans();
  if (plans.length === 0) return null;
  return plans.reduce((min, p) => (p.price < min.price ? p : min), plans[0]);
});

/** Slugs de los planes activos, para el sitemap. */
export const getPlanSlugs = cache(async (): Promise<string[]> => {
  const plans = await getActivePlans();
  return plans.map((p) => p.slug);
});
