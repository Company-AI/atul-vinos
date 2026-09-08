import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getShowcaseProducts, listProducts } from "@/domain/catalog/service";
import { getPageSections } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { getFavoriteIds } from "@/app/actions/favorites";
import { SectionRenderer } from "@/components/marketing/section-renderer";
import { SectionBanners, type SectionBanner } from "@/components/marketing/section-banners";
import { FilterChips, type FilterChip } from "@/components/shop/filter-chips";
import { WineCardRow } from "@/components/shop/wine-card-row";

export const revalidate = 300;

/*
  Primera maqueta. Se diferencia de la de "/" en la mecánica de descubrimiento:
  acá los filtros son pastillas de texto y allá círculos con foto. Y suma una
  sección propia de cajas al pie.
*/
const FILTROS: FilterChip[] = [
  { label: "Todos", href: "/vinos" },
  { label: "Tintos", href: "/vinos?tipo=TINTO" },
  { label: "Malbec", href: "/vinos?varietal=malbec" },
  { label: "Blancos", href: "/vinos?tipo=BLANCO" },
  { label: "Rosados", href: "/vinos?tipo=ROSADO" },
  { label: "Cabernet", href: "/vinos?varietal=cabernet-franc" },
  { label: "Chardonnay", href: "/vinos?varietal=chardonnay" },
  { label: "Box", href: "/box" },
  { label: "Ofertas", href: "/ofertas" },
];

const TIRAS: SectionBanner[] = [
  {
    titulo: "Destacados",
    bajada: "del mes",
    cta: "Ver vinos",
    href: "/vinos",
    imageUrl: "/media/banners/ofertas.webp",
  },
  {
    titulo: "Novedades",
    bajada: "que tenés que probar",
    cta: "Ver novedades",
    href: "/novedades",
    imageUrl: "/media/banners/novedades.webp",
  },
  {
    titulo: "Box",
    bajada: "Experiencias en botella",
    cta: "Ver box",
    href: "/box",
    imageUrl: "/media/banners/box.webp",
  },
];

export default async function MaquetaUnoPage() {
  const [sections, settings, vinos, cajas, favoriteIds] = await Promise.all([
    getPageSections("home"),
    getSettings(),
    getShowcaseProducts("featured", 6),
    listProducts({ soloPacks: true, perPage: 3, orden: "destacados" }),
    getFavoriteIds(),
  ]);

  const hero = sections.filter((s) => s.key === "home.hero");

  return (
    <>
      <SectionRenderer
        sections={hero}
        logoUrl={settings.company.logoLightUrl}
        companyName={settings.company.name}
      />

      <FilterChips items={FILTROS} activo="Todos" />

      <section className="mx-auto max-w-[1600px] px-gutter pt-14">
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

        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vinos.map((product, i) => (
            <WineCardRow
              key={product.id}
              product={product}
              isFavorite={favoriteIds.has(product.id)}
              priority={i < 2}
            />
          ))}
        </div>
      </section>

      <SectionBanners items={TIRAS} />

      {cajas.items.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-gutter pb-4 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-display-sm font-medium text-carbon-900">
                Nuestras cajas
              </h2>
              <p className="mt-1.5 text-[14px] text-stone-600">
                Selecciones pensadas para cada ocasión.
              </p>
            </div>
            <Link
              href="/box"
              className="inline-flex items-center gap-2 text-[13px] text-accent-700 transition-colors hover:text-accent-600"
            >
              Ver todos los box
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cajas.items.map((pack) => (
              <WineCardRow
                key={pack.id}
                product={pack}
                isFavorite={favoriteIds.has(pack.id)}
              />
            ))}
          </div>
        </section>
      )}

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
