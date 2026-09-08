import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { listProducts } from "@/domain/catalog/service";
import { getSection } from "@/domain/cms/service";
import { getFavoriteIds } from "@/app/actions/favorites";
import { WineGrid } from "@/components/shop/wine-grid";
import { buttonVariants } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Container, Eyebrow, Heading, Prose } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Box",
  description:
    "Cajas armadas por nosotros: cada una con una idea detrás y más barata que comprar las botellas por separado.",
  alternates: { canonical: "/box" },
};

export const revalidate = 300;

/**
 * Los Box tienen su propia entrada en el menú porque son una decisión de
 * compra distinta: el cliente no viene a elegir una etiqueta sino a que
 * elijamos nosotros. El listado es el mismo catálogo filtrado por packs, así
 * que el stock sigue derivando de las botellas que componen cada caja.
 */
export default async function BoxPage() {
  const [page, favoriteIds, intro] = await Promise.all([
    listProducts({ soloPacks: true, perPage: 24, orden: "destacados" }),
    getFavoriteIds(),
    getSection("box.intro", "rich_text"),
  ]);

  return (
    <Container className="pb-section pt-4">
      <Eyebrow>{intro.eyebrow || "Tienda"}</Eyebrow>
      <Heading level={1} size="lg" className="mt-4 max-w-[22ch]">
        {intro.title || "Nuestros Box"}
      </Heading>
      <Prose className="mt-5">
        {intro.body ||
          "Cajas que armamos nosotros con una idea detrás: recorrer una región, comparar una uva, resolver un regalo. Cada una sale más barata que comprar las botellas por separado, y la disponibilidad depende del stock real de los vinos que la componen."}
      </Prose>

      <div className="mt-14">
        {page.items.length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="size-8" />}
            title="Todavía no hay box disponibles"
            description="Estamos armando las combinaciones. Mientras tanto, podés ver los vinos por separado."
            action={
              <Link href="/vinos" className={buttonVariants({ variant: "dark", uppercase: true })}>
                Ver los vinos
              </Link>
            }
          />
        ) : (
          <WineGrid products={page.items} favoriteIds={favoriteIds} columns={3} />
        )}
      </div>
    </Container>
  );
}
