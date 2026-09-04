import type { MetadataRoute } from "next";
import { prisma } from "@/infra/db/prisma";
import { getSettings } from "@/domain/settings/service";
import { IS_DEMO } from "@/infra/demo/mode";
import { DEMO_PRODUCTS } from "@/infra/demo/catalog";
import { demoPosts } from "@/infra/demo/content";
import { getPlanSlugs } from "@/domain/subscriptions/plans";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { seo } = await getSettings();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Con el sitio marcado como no indexable, el sitemap queda mínimo.
  if (!seo.indexable) {
    return [{ url: base, lastModified: new Date(), priority: 1 }];
  }

  const ahora = new Date();

  /*
    En modo demo no hay base: las URLs salen del catálogo en memoria. Se usa
    la fecha del build como lastModified, que es lo único cierto que hay.
  */
  const [products, posts, plans] = IS_DEMO
    ? [
        DEMO_PRODUCTS.map((p) => ({ slug: p.slug, updatedAt: ahora, kind: p.kind })),
        demoPosts().map((p) => ({ slug: p.slug, updatedAt: ahora })),
        (await getPlanSlugs()).map((slug) => ({ slug, updatedAt: ahora })),
      ]
    : await Promise.all([
        prisma.product.findMany({
          where: { status: "ACTIVE" },
          select: { slug: true, updatedAt: true, kind: true },
        }),
        prisma.post.findMany({
          where: { isPublished: true },
          select: { slug: true, updatedAt: true },
        }),
        prisma.subscriptionPlan.findMany({
          where: { isActive: true },
          select: { slug: true, updatedAt: true },
        }),
      ]);

  const staticRoutes: MetadataRoute.Sitemap = ([
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/vinos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/packs`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/club`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/historia`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/historias`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/contacto`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/envios`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/cambios-y-devoluciones`, changeFrequency: "yearly", priority: 0.3 },
  ] as const).map((route) => ({ ...route, lastModified: new Date() }));

  return [
    ...staticRoutes,
    ...products.map((product) => ({
      url: `${base}/vinos/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: `${base}/historias/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...plans.map((plan) => ({
      url: `${base}/club/suscribirse/${plan.slug}`,
      lastModified: plan.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
