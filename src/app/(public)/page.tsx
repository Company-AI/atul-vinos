import type { Metadata } from "next";
import Image from "next/image";
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
  Las categorías salen de packshots reales de las bodegas, todos con el mismo
  tratamiento sobre crema. Se listan sólo las que tienen productos: no hay
  espumantes en catálogo, y mandar a alguien a un filtro vacío es peor que no
  ofrecer la categoría.

  Categorías y tiras viven acá y no en el CMS por ahora: son estructura de
  navegación y el diseño todavía se está definiendo. Cuando se estabilice
  conviene moverlas a bloques editables, como el resto del contenido.

  Las imágenes (300×300 para los círculos, 800×350 para las tiras) están
  pendientes: los componentes funcionan sin ellas.
*/
const CATEGORIAS: CategoryCircle[] = [
  { label: "Todos", href: "/vinos" },
  { label: "Tintos", href: "/vinos?tipo=TINTO", imageUrl: "/media/categories/tintos.webp" },
  { label: "Malbec", href: "/vinos?varietal=malbec", imageUrl: "/media/categories/malbec.webp" },
  { label: "Blancos", href: "/vinos?tipo=BLANCO", imageUrl: "/media/categories/blancos.webp" },
  { label: "Rosados", href: "/vinos?tipo=ROSADO", imageUrl: "/media/categories/rosados.webp" },
  {
    label: "Cabernet",
    href: "/vinos?varietal=cabernet-franc",
    imageUrl: "/media/categories/cabernet.webp",
  },
  {
    label: "Chardonnay",
    href: "/vinos?varietal=chardonnay",
    imageUrl: "/media/categories/chardonnay.webp",
  },
  { label: "Box", href: "/box", imageUrl: "/media/categories/box.webp" },
];

const TIRAS: SectionBanner[] = [
  {
    titulo: "Box",
    bajada: "Experiencias en botella",
    cta: "Ver box",
    href: "/box",
    imageUrl: "/media/banners/box.webp",
  },
  {
    titulo: "Novedades",
    bajada: "Lo nuevo en nuestra cava",
    cta: "Ver novedades",
    href: "/novedades",
    imageUrl: "/media/banners/novedades.webp",
  },
  {
    titulo: "Ofertas",
    bajada: "Grandes vinos, mejores momentos",
    cta: "Ver ofertas",
    href: "/ofertas",
    imageUrl: "/media/banners/ofertas.webp",
  },
];

export default async function HomePage() {
  const [sections, settings, productos, favoriteIds] = await Promise.all([
    getPageSections("home"),
    getSettings(),
    getShowcaseProducts("featured", 8),
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

      <section className="mx-auto max-w-[1600px] px-gutter pt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-display-sm font-medium text-carbon-900">
            Nuestros vinos
          </h2>
          <Link
            href="/vinos"
            className="inline-flex items-center gap-2 text-[13px] text-accent-700 transition-colors hover:text-accent-600"
          >
            Ver todos
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      {/*
        Una sola imagen y tres líneas: la historia completa vive en
        /quienes-somos. Acá sólo abre la puerta.
      */}
      <section className="mx-auto max-w-[1600px] px-gutter py-16">
        <div className="grid items-center gap-10 overflow-hidden rounded-md border border-linen-200 bg-bone-pure lg:grid-cols-2 lg:gap-0">
          <div className="relative min-h-[280px] lg:min-h-[380px]">
            <Image
              src="/media/scenes/cellar.jpg"
              alt="Sala de crianza con barricas de roble"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="px-7 pb-10 lg:px-14 lg:py-14">
            <p className="eyebrow text-stone-500">Quiénes somos</p>
            <h2 className="mt-5 font-display text-display-sm font-medium text-carbon-900">
              No vendemos nada que no probemos.
            </h2>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.8] text-stone-600">
              Somos distribuidores: vamos a la bodega, probamos la añada que se va a vender y
              recién ahí compramos. Por eso el catálogo es corto y podemos defender cada botella.
            </p>
            <Link
              href="/quienes-somos"
              className="mt-8 inline-flex items-center gap-2 text-[13px] text-accent-700 transition-colors hover:text-accent-600"
            >
              Conocé cómo elegimos
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1600px] items-center gap-6 px-gutter py-20">
        <span aria-hidden className="h-px flex-1 bg-linen-300" />
        <p className="text-center text-[13px] uppercase tracking-[0.16em] text-stone-500">
          «Más que vinos, encuentros»
        </p>
        <span aria-hidden className="h-px flex-1 bg-linen-300" />
      </div>
    </>
  );
}
