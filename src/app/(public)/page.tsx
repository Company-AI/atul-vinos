import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getShowcaseProducts } from "@/domain/catalog/service";
import { getPageSections } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { getFavoriteIds } from "@/app/actions/favorites";
import { SectionRenderer } from "@/components/marketing/section-renderer";
import { SectionBanners, type SectionBanner } from "@/components/marketing/section-banners";
import { CategoryCircles, type CategoryCircle } from "@/components/shop/category-circles";
import { WineCardRow } from "@/components/shop/wine-card-row";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getSettings();
  return {
    title: { absolute: seo.defaultTitle },
    description: seo.defaultDescription,
    alternates: { canonical: "/" },
  };
}

/*
  Categorías y tiras viven acá y no en el CMS por ahora: son estructura de
  navegación y el diseño todavía se está definiendo. Cuando se estabilice
  conviene moverlas a bloques editables, como el resto del contenido.

  Las imágenes (300×300 para los círculos, 800×350 para las tiras) están
  pendientes: los componentes funcionan sin ellas.
*/
const CATEGORIAS: CategoryCircle[] = [
  { label: "Todos", href: "/vinos" },
  { label: "Tintos", href: "/vinos?tipo=TINTO" },
  { label: "Blancos", href: "/vinos?tipo=BLANCO" },
  { label: "Rosados", href: "/vinos?tipo=ROSADO" },
  { label: "Espumantes", href: "/vinos?tipo=ESPUMANTE" },
  { label: "Malbec", href: "/vinos?varietal=malbec" },
  { label: "Cabernet", href: "/vinos?varietal=cabernet-sauvignon" },
  { label: "Chardonnay", href: "/vinos?varietal=chardonnay" },
  { label: "Bodegas", href: "/quienes-somos" },
  { label: "Box", href: "/box" },
];

const TIRAS: SectionBanner[] = [
  {
    titulo: "Box",
    bajada: "Experiencias en botella",
    cta: "Ver box",
    href: "/box",
    imageUrl: "/media/packs/pack-regalo.jpg",
  },
  {
    titulo: "Novedades",
    bajada: "Lo nuevo en nuestra cava",
    cta: "Ver novedades",
    href: "/novedades",
    imageUrl: "/media/scenes/cellar.jpg",
  },
  {
    titulo: "Ofertas",
    bajada: "Grandes vinos, mejores momentos",
    cta: "Ver ofertas",
    href: "/ofertas",
    imageUrl: "/media/scenes/pouring-dark.jpg",
  },
];

export default async function HomePage() {
  const [sections, settings, productos, favoriteIds] = await Promise.all([
    getPageSections("home"),
    getSettings(),
    getShowcaseProducts("featured", 5),
    getFavoriteIds(),
  ]);

  // Sólo el hero viene del CMS; el resto de la home es estructura de tienda.
  const hero = sections.filter((s) => s.key === "home.hero");

  return (
    <>
      <SectionRenderer
        sections={hero}
        logoUrl={settings.company.logoLightUrl}
        companyName={settings.company.name}
      />

      <CategoryCircles items={CATEGORIAS} activo="Todos" />

      <section className="mx-auto max-w-[1600px] px-gutter pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-display-sm font-medium text-carbon-900">
            Nuestros vinos
          </h2>
          <Link
            href="/vinos"
            className="inline-flex items-center gap-2 text-[13px] text-wine-700 transition-colors hover:text-wine-600"
          >
            Ver todos
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {productos.map((product, i) => (
            <WineCardRow
              key={product.id}
              product={product}
              isFavorite={favoriteIds.has(product.id)}
              priority={i < 3}
            />
          ))}
        </div>
      </section>

      <SectionBanners items={TIRAS} />

      <div className="mx-auto flex max-w-[1600px] items-center gap-6 px-gutter py-12">
        <span aria-hidden className="h-px flex-1 bg-linen-300" />
        <p className="text-center text-[13px] uppercase tracking-[0.16em] text-stone-500">
          «Más que vinos, encuentros»
        </p>
        <span aria-hidden className="h-px flex-1 bg-linen-300" />
      </div>
    </>
  );
}
