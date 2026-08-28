import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { listProducts } from "@/domain/catalog/service";
import { getFavoriteIds } from "@/app/actions/favorites";
import { WineGrid } from "@/components/shop/wine-grid";
import { buttonVariants } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Container, Eyebrow, Heading, Prose } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Packs y estuches",
  description:
    "Packs de vinos armados por nosotros: degustación, asado, regalo. Con descuento sobre la compra individual.",
  alternates: { canonical: "/packs" },
};

export default async function PacksPage() {
  const [page, favoriteIds] = await Promise.all([
    listProducts({ soloPacks: true, perPage: 24, orden: "destacados" }),
    getFavoriteIds(),
  ]);

  return (
    <Container className="pb-section pt-4">
      <Eyebrow>Tienda</Eyebrow>
      <Heading level={1} size="lg" className="mt-4 max-w-[22ch]">
        Packs y estuches
      </Heading>
      <Prose className="mt-5">
        Combinaciones que armamos nosotros, con descuento respecto de comprar cada botella por
        separado. La disponibilidad depende del stock real de cada vino que los compone.
      </Prose>

      <div className="mt-14">
        {page.items.length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="size-8" />}
            title="Todavía no hay packs disponibles"
            description="Estamos armando nuevas combinaciones. Mientras tanto, podés ver los vinos por separado."
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
