import type { MetadataRoute } from "next";
import { getSettings } from "@/domain/settings/service";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { seo } = await getSettings();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!seo.indexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/mi-cuenta",
          "/checkout",
          "/carrito",
          "/ingresar",
          "/registrarme",
          "/buscar",
          "/seguimiento",
          "/api/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
