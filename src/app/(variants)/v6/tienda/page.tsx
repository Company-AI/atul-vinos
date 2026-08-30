import type { Metadata } from "next";
import { getFilterOptions, listProducts } from "@/domain/catalog/service";
import { countActiveFilters, parseCatalogParams } from "@/domain/catalog/params";
import { CasaWineCard } from "@/components/variants/casa";
import { CasaFilters, CasaPagination } from "@/components/variants/casa-shop";
import { VContainer, VLabel, VTitle } from "@/components/variants/shared";
import { Reveal } from "@/ui/reveal";

export const metadata: Metadata = {
  title: "Tienda · Casa",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Tienda completa dentro de la variante: usa la misma capa de catálogo que
 * /vinos —mismos filtros, mismo orden, mismo paginado— pero con la
 * presentación de Casa. Lo que se compara acá es cómo se ve vendiendo.
 */
export default async function CasaTiendaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseCatalogParams(params, { perPage: 12 });

  const [page, options] = await Promise.all([listProducts(filters), getFilterOptions()]);
  const activeCount = countActiveFilters(filters);

  return (
    <>
      <section className="pb-14 pt-36">
        <VContainer size="wide">
          <Reveal>
            <VLabel style={{ color: "var(--v-accent)" }}>La tienda</VLabel>
            <VTitle level={1} className="mt-4 max-w-[20ch]">
              Todo lo que tenemos hoy.
            </VTitle>
            <p className="mt-6 text-[15px] leading-[1.75]" style={{ color: "var(--v-muted)", maxWidth: "60ch" }}>
              {page.total} {page.total === 1 ? "etiqueta disponible" : "etiquetas disponibles"}. Todas
              probadas antes de comprarlas, todas de Mendoza.
            </p>
          </Reveal>
        </VContainer>
      </section>

      <section className="pb-24">
        <VContainer size="wide">
          <div className="grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
            <CasaFilters options={options} filters={filters} params={params} activeCount={activeCount} />

            <div>
              {page.items.length === 0 ? (
                <div className="border-t py-20 text-center" style={{ borderColor: "var(--v-rule)" }}>
                  <VTitle style={{ fontSize: "calc(var(--v-title) * 0.7)" }}>
                    No encontramos nada con esos filtros.
                  </VTitle>
                  <p className="mt-4 text-[15px]" style={{ color: "var(--v-muted)" }}>
                    Probá quitando alguno para ampliar la búsqueda.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                    {page.items.map((product, i) => (
                      <CasaWineCard key={product.id} product={product} index={i} />
                    ))}
                  </div>

                  <CasaPagination page={page.page} totalPages={page.totalPages} params={params} />
                </>
              )}
            </div>
          </div>
        </VContainer>
      </section>
    </>
  );
}
