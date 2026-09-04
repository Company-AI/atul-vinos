import { BANNERS, CMS_SECTIONS, FAQS, POSTS } from "../../../prisma/seed/content";
import { PLANS } from "../../../prisma/seed/plans";
import { SHIPPING_ZONES } from "../../../prisma/seed/shipping";
import { parseBlock, type BlockType } from "@/domain/cms/blocks";
import { slugify } from "@/lib/slug";
import type { Section } from "@/domain/cms/service";

/**
 * Contenido del modo demo, servido desde prisma/seed/content y /plans.
 *
 * Las formas replican lo que devolvería Prisma para que las páginas no
 * necesiten saber si hay base o no.
 */

export function demoPageSections(page: string): Section[] {
  return CMS_SECTIONS.filter((s) => s.page === page)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({
      id: `demo-${s.key}`,
      key: s.key,
      page: s.page,
      type: s.type as BlockType,
      title: s.title ?? null,
      sortOrder: s.sortOrder,
      data: parseBlock(s.type as BlockType, s.data),
    }));
}

export function demoSection(key: string) {
  return CMS_SECTIONS.find((s) => s.key === key)?.data;
}

export function demoBanners(position = "top") {
  return BANNERS.filter((b) => b.position === position && b.isActive !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((b, i) => ({
      id: `demo-banner-${i}`,
      message: b.message,
      linkUrl: (b as { linkUrl?: string }).linkUrl ?? null,
      linkLabel: (b as { linkLabel?: string }).linkLabel ?? null,
      position: b.position,
      isActive: true,
      sortOrder: b.sortOrder,
      startsAt: null as Date | null,
      endsAt: null as Date | null,
    }));
}

export function demoFaqs(group?: string) {
  return FAQS.filter((f) => !group || f.group === group)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((f, i) => ({
      id: `demo-faq-${i}`,
      question: f.question,
      answer: f.answer,
      group: f.group,
      sortOrder: f.sortOrder,
      isActive: true,
    }));
}

export function demoPosts() {
  const ahora = new Date(0); // fecha fija: el render tiene que ser determinista
  return POSTS.map((p, i) => ({
    id: `demo-post-${i}`,
    title: p.title,
    slug: p.slug,
    excerpt: (p as { excerpt?: string }).excerpt ?? null,
    coverUrl: (p as { coverUrl?: string }).coverUrl ?? null,
    content: (p as { content?: string }).content ?? "",
    author: (p as { author?: string }).author ?? null,
    categoryId: (p as { category?: string }).category
      ? `demo-cat-${slugify((p as { category?: string }).category!)}`
      : null,
    // La query real trae la relación con include: { category: true }.
    category: (p as { category?: string }).category
      ? {
          id: `demo-cat-${slugify((p as { category?: string }).category!)}`,
          name: (p as { category?: string }).category!,
          slug: slugify((p as { category?: string }).category!),
        }
      : null,
    seoTitle: null as string | null,
    seoDescription: null as string | null,
    isPublished: true,
    publishedAt: ahora,
    createdAt: ahora,
    updatedAt: ahora,
  }));
}

/** Planes con la forma de PlanCardData, que es lo que usa la grilla del Club. */
export function demoPlanCards() {
  return PLANS.map((p) => ({
    id: `demo-plan-${p.slug}`,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline as string | null,
    price: p.price,
    bottleCount: p.bottleCount,
    frequencyLabel: "Mensual",
    perks: p.perks,
    imageUrl: p.imageUrl as string | null,
    featured: Boolean(p.featured),
    freeShipping: p.freeShipping,
    shippingCost: p.shippingCost,
    firstCycleDiscountPercent: p.firstCycleDiscountPercent ?? null,
  }));
}

/**
 * Un plan con sus beneficios anidados, como lo devolvería Prisma con
 * `include`. Los beneficios del seed son textos, así que se exponen con la
 * misma forma que ClubBenefit para que las pantallas no cambien.
 */
export function demoPlanBySlug(slug: string) {
  const p = PLANS.find((x) => x.slug === slug);
  if (!p) return null;

  return {
    id: `demo-plan-${p.slug}`,
    name: p.name,
    slug: p.slug,
    tagline: p.tagline as string | null,
    description: p.description as string | null,
    price: p.price,
    bottleCount: p.bottleCount,
    sortOrder: p.sortOrder,
    shippingCost: p.shippingCost,
    freeShipping: p.freeShipping,
    featured: Boolean(p.featured),
    firstCycleDiscountPercent: p.firstCycleDiscountPercent ?? null,
    trialDays: p.trialDays ?? 0,
    imageUrl: p.imageUrl as string | null,
    isActive: true,
    perks: p.perks,
    frequency: "MONTHLY" as const,
    benefits: p.perks.map((titulo, i) => ({
      planId: `demo-plan-${p.slug}`,
      benefitId: `demo-benefit-${p.slug}-${i}`,
      overrideValue: null,
      benefit: {
        id: `demo-benefit-${p.slug}-${i}`,
        code: `demo_${i}`,
        name: titulo,
        description: null as string | null,
        value: null,
        isActive: true,
        sortOrder: i * 10,
      },
    })),
  };
}

/** Zonas de envío con la forma que espera /envios (`include: { rates }`). */
export function demoShippingZones() {
  return SHIPPING_ZONES.sort((a, b) => a.sortOrder - b.sortOrder).map((z, zi) => ({
    id: `demo-zone-${zi}`,
    name: z.name,
    sortOrder: z.sortOrder,
    provinces: z.provinces,
    cities: z.cities,
    isActive: true,
    rates: z.rates.map((r, i) => ({
      id: `demo-rate-${zi}-${i}`,
      zoneId: `demo-zone-${zi}`,
      carrierId: null as string | null,
      name: r.name,
      price: r.price,
      freeFrom: r.freeFrom ?? null,
      etaMinDays: r.etaMinDays,
      etaMaxDays: r.etaMaxDays,
      sortOrder: (i + 1) * 10,
      isActive: true,
    })),
  }));
}

/** Una nota por slug, para /historias/[slug]. */
export function demoPostBySlug(slug: string) {
  return demoPosts().find((p) => p.slug === slug) ?? null;
}
