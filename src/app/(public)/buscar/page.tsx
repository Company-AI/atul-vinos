import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { listProducts } from "@/domain/catalog/service";
import { prisma } from "@/infra/db/prisma";
import { IS_DEMO } from "@/infra/demo/mode";
import { demoPosts } from "@/infra/demo/content";
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

/** Las notas que matchean, con el mismo criterio que la query real. */
function buscarEnDemo(query: string) {
  const q = query.toLowerCase();
  return demoPosts()
    .filter((p) =>
      [p.title, p.excerpt ?? "", p.content].some((campo) => campo.toLowerCase().includes(q)),
    )
    .slice(0, 5);
}

/*
  El campo de búsqueda vive ACÁ y no sólo en la cabecera.

  La cabecera lo esconde por debajo de 768px (`hidden md:block`) y dentro de
  ese ancho deja nada mas la lupa, que linkea a esta pagina. Sin un campo
  propio, el telefono quedaba sin ninguna forma de buscar: se tocaba la lupa,
  se llegaba a "Escribí al menos dos letras" y no había dónde escribir. Lo
  reportó el cliente y se reprodujo en un teléfono emulado contra producción:
  el input de la cabecera medía 0x0 de ancho y de alto.

  Es un form de verdad con action a esta misma página, igual que el de la
  cabecera, así anda sin JavaScript y la búsqueda queda en una URL que se
  puede compartir.
*/
function CampoDeBusqueda({ query }: { query: string }) {
  return (
    <form action="/buscar" role="search" className="mt-6 flex max-w-[560px] gap-2">
      <label htmlFor="buscar" className="sr-only">
        Buscar
      </label>
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-stone-500"
          aria-hidden
        />
        <input
          id="buscar"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Buscar vinos, bodegas, cepas…"
          /*
            16px y no menos: por debajo de eso Safari en iPhone hace zoom solo
            al enfocar el campo y deja la página corrida para el costado.
          */
          className="h-12 w-full rounded-pill border border-linen-300 bg-bone-pure pl-11 pr-4 text-[16px] text-carbon-900 outline-none transition-colors placeholder:text-stone-500 focus:border-accent-700"
        />
      </div>
      <button type="submit" className={buttonVariants({ variant: "dark", uppercase: true })}>
        Buscar
      </button>
    </form>
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (query.length < 2) {
    return (
      <Container className="pb-section pt-4">
        <Eyebrow>Buscador</Eyebrow>
        <Heading level={1} size="md" className="mt-4">¿Qué estás buscando?</Heading>
        <CampoDeBusqueda query="" />
        <div className="mt-10" />
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
    IS_DEMO
      ? buscarEnDemo(query)
      : prisma.post.findMany({
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
      <CampoDeBusqueda query={query} />
      <p className="mt-6 text-[14px] text-stone-500">
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
                <Link href={`/historias/${post.slug}`} className="block hover:text-accent-700">
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
