import type { Metadata } from "next";
import Link from "next/link";
import { Wine } from "lucide-react";
import { listProducts } from "@/domain/catalog/service";
import { getFavoriteIds } from "@/app/actions/favorites";
import { WineGrid } from "@/components/shop/wine-grid";
import { buttonVariants } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Container, Eyebrow, Heading, Prose } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Ofertas",
  description: "Botellas con precio rebajado. El descuento se calcula sobre el precio de lista, no sobre uno inflado.",
  alternates: { canonical: "/ofertas" },
};

export const revalidate = 300;

/** Vista del catálogo filtrada; el menú lateral la lista como sección propia. */
export default async function OfertasPage() {
  const [page, favoriteIds] = await Promise.all([
    listProducts({ ofertas: true, orden: "precio-menor", perPage: 24 }),
    getFavoriteIds(),
  ]);

  return (
    <Container className="pb-section pt-10">
      <Eyebrow>Tienda</Eyebrow>
      <Heading level={1} size="lg" className="mt-4 max-w-[22ch]">
        Ofertas
      </Heading>
      <Prose className="mt-5">Botellas con precio rebajado. El descuento se calcula sobre el precio de lista, no sobre uno inflado.</Prose>

      <div className="mt-12">
        {page.items.length === 0 ? (
          <EmptyState
            icon={<Wine className="size-8" />}
            title="Todavía no hay nada acá"
            description="Cuando entre algo lo vas a encontrar en esta sección."
            action={
              <Link href="/vinos" className={buttonVariants({ variant: "dark", uppercase: true })}>
                Ver todo el catálogo
              </Link>
            }
          />
        ) : (
          <WineGrid products={page.items} favoriteIds={favoriteIds} columns={4} />
        )}
      </div>
    </Container>
  );
}
