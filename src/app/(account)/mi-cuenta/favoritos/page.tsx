import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { requireUser } from "@/infra/auth/guards";
import { listProducts } from "@/domain/catalog/service";
import { prisma } from "@/infra/db/prisma";
import { WineGrid } from "@/components/shop/wine-grid";
import { buttonVariants } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Mis favoritos",
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const user = await requireUser("/mi-cuenta/favoritos");

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { productId: true },
  });
  const ids = new Set(favorites.map((f) => f.productId));

  // Se reutiliza el catálogo para tener disponibilidad y precios ya resueltos.
  const { items } = await listProducts({ perPage: 48 });
  const products = items.filter((p) => ids.has(p.id));

  return (
    <>
      <Eyebrow>Mi cuenta</Eyebrow>
      <Heading level={1} size="md" className="mt-3 mb-10">Mis favoritos</Heading>

      {products.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-8" />}
          title="Todavía no guardaste favoritos"
          description="Tocá el corazón en cualquier vino para guardarlo y encontrarlo rápido después."
          action={
            <Link href="/vinos" className={buttonVariants({ variant: "dark", uppercase: true })}>
              Ver los vinos
            </Link>
          }
        />
      ) : (
        <WineGrid products={products} favoriteIds={ids} columns={3} />
      )}
    </>
  );
}
