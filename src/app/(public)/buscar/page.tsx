import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { listProducts } from "@/domain/catalog/service";
import { prisma } from "@/infra/db/prisma";
import { getFavoriteIds } from "@/app/actions/favorites";
import { WineGrid } from "@/components/shop/wine-grid";
import { buttonVariants } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Container, Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Buscar",
  robots: { index: false, follow: true },
};

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (query.length < 2) {
    return (
      <Container className="pb-section pt-4">
        <Eyebrow>Buscador</Eyebrow>
        <Heading level={1} size="md" className="mt-4 mb-10">¿Qué estás buscando?</Heading>
        <EmptyState
          icon={<Search className="size-8" />}
          title="Escribí al menos dos letras"
          description="Podés buscar por nombre, varietal, región, bodega o colección."
          action={
            <Link href="/vinos" className={buttonVariants({ variant: "dark", uppercase: true })}>
              Ver todos los vinos
            </Link>
          }
        />
      </Container>
    );
  }

  const [{ items, total }, posts, favoriteIds] = await Promise.all([
    listProducts({ q: query, perPage: 24 }),
    prisma.post.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { excerpt: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
    getFavoriteIds(),
  ]);

  return (
    <Container className="pb-section pt-4">
      <Eyebrow>Buscador</Eyebrow>
      <Heading level={1} size="md" className="mt-4">
        Resultados para «{query}»
      </Heading>
      <p className="mt-3 text-[14px] text-stone-500">
        {total} {total === 1 ? "vino" : "vinos"}
        {posts.length > 0 && ` · ${posts.length} ${posts.length === 1 ? "nota" : "notas"}`}
      </p>

      <div className="mt-12">
        {items.length === 0 ? (
          <EmptyState
            icon={<Search className="size-8" />}
            title="No encontramos vinos con ese término"
            description="Probá con un varietal (malbec, chardonnay), una región o un maridaje."
            action={
              <Link href="/vinos" className={buttonVariants({ variant: "dark", uppercase: true })}>
                Ver todos los vinos
              </Link>
            }
          />
        ) : (
          <WineGrid products={items} favoriteIds={favoriteIds} columns={4} />
        )}
      </div>

      {posts.length > 0 && (
        <section className="mt-20 border-t border-linen-200 pt-12">
          <Eyebrow>Historias</Eyebrow>
          <ul className="mt-6 space-y-4">
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/historias/${post.slug}`} className="block hover:text-wine-700">
                  <span className="font-display text-display-sm font-light">{post.title}</span>
                  {post.excerpt && (
                    <span className="mt-1 block text-[14px] text-stone-600">{post.excerpt}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
