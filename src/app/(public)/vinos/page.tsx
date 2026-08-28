import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Wine } from "lucide-react";
import { getFilterOptions, listProducts } from "@/domain/catalog/service";
import { countActiveFilters, PARAM_KEYS, parseCatalogParams } from "@/domain/catalog/params";
import { getActiveBanners } from "@/domain/cms/service";
import { getSection } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { getFavoriteIds } from "@/app/actions/favorites";
import { CatalogSort } from "@/components/shop/catalog-sort";
import { Pagination } from "@/components/shop/pagination";
import { WineFilters } from "@/components/shop/wine-filters";
import { WineGrid } from "@/components/shop/wine-grid";
import { buttonVariants } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Container, Eyebrow, Heading, Prose } from "@/ui/layout";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getSettings();
  return {
    title: "Nuestros vinos",
    description:
      "Todos los vinos de la bodega: tintos, blancos, rosados y espumantes. Filtrá por varietal, región, cosecha o maridaje.",
    alternates: { canonical: "/vinos" },
    openGraph: { title: `Nuestros vinos · ${seo.defaultTitle}` },
  };
}

export default async function VinosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseCatalogParams(params, { perPage: 12 });

  const [page, options, favoriteIds, intro, banners] = await Promise.all([
    listProducts(filters),
    getFilterOptions(),
    getFavoriteIds(),
    getSection("vinos.intro", "rich_text"),
    getActiveBanners("shop"),
  ]);

  const activeCount = countActiveFilters(filters);

  const buildHref = (targetPage: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === PARAM_KEYS.page) continue;
      if (Array.isArray(value)) value.forEach((v) => search.append(key, v));
      else if (value) search.set(key, value);
    }
    if (targetPage > 1) search.set(PARAM_KEYS.page, String(targetPage));
    const qs = search.toString();
    return qs ? `/vinos?${qs}` : "/vinos";
  };

  return (
    <>
      <Container className="pb-12 pt-4">
        <Eyebrow>Tienda</Eyebrow>
        <Heading level={1} size="lg" className="mt-4 max-w-[24ch]">
          {intro.title || (filters.q ? `Resultados para «${filters.q}»` : "Nuestros vinos")}
        </Heading>
        {intro.body ? (
          <Prose className="mt-5">{intro.body}</Prose>
        ) : (
          <Prose className="mt-5">
            Todo lo que embotellamos, en un solo lugar. Filtrá por varietal, región, cosecha o por
            lo que vas a comer.
          </Prose>
        )}
      </Container>

      {banners.length > 0 && (
        <Container className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-linen-300 bg-linen-100 px-5 py-3">
            <p className="text-[13px] text-carbon-800">{banners[0].message}</p>
            {banners[0].linkUrl && banners[0].linkLabel && (
              <Link
                href={banners[0].linkUrl}
                className="text-[13px] underline underline-offset-4 hover:text-wine-700"
              >
                {banners[0].linkLabel}
              </Link>
            )}
          </div>
        </Container>
      )}

      <Container className="pb-section">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
          <Suspense fallback={<div className="hidden lg:block" />}>
            <WineFilters options={options} activeCount={activeCount} resultCount={page.total} />
          </Suspense>

          <div>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-linen-200 pb-4">
              <p className="text-[13px] tabular text-stone-500">
                {page.total === 0
                  ? "Sin resultados"
                  : `${page.total} ${page.total === 1 ? "vino" : "vinos"}`}
                {page.totalPages > 1 && ` · página ${page.page} de ${page.totalPages}`}
              </p>
              <Suspense fallback={null}>
                <CatalogSort />
              </Suspense>
            </div>

            {page.items.length === 0 ? (
              <EmptyState
                icon={<Wine className="size-8" />}
                title="No encontramos vinos con esos filtros"
                description="Probá quitando algún filtro o buscá por varietal, región o maridaje."
                action={
                  <Link href="/vinos" className={buttonVariants({ variant: "dark", uppercase: true })}>
                    Ver todos los vinos
                  </Link>
                }
              />
            ) : (
              <>
                <WineGrid products={page.items} favoriteIds={favoriteIds} columns={3} />
                <Pagination page={page.page} totalPages={page.totalPages} buildHref={buildHref} />
              </>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
