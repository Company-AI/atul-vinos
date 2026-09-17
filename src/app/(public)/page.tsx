import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getShowcaseProducts, listProducts } from "@/domain/catalog/service";
import { getPageSections } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { getFavoriteIds } from "@/app/actions/favorites";
import { SectionRenderer } from "@/components/marketing/section-renderer";
import { SectionBanners, type SectionBanner } from "@/components/marketing/section-banners";
import { CategoryCircles, type CategoryCircle } from "@/components/shop/category-circles";
import { CATEGORIAS_TIENDA, TODOS_LOS_VINOS } from "@/components/shop/categorias";
import { WineCardRow } from "@/components/shop/wine-card-row";
import { ProductRail } from "@/components/shop/product-rail";

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
  Las categorías salen de la lista compartida por las tres maquetas (ver
  components/shop/categorias.ts) y se muestran como círculos con el packshot
  real de cada tipo. "Todos" se agrega adelante y queda activo.
*/
const CATEGORIAS: CategoryCircle[] = [TODOS_LOS_VINOS, ...CATEGORIAS_TIENDA];

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
  const [sections, settings, seleccion, masVendidos, catalogo, favoriteIds] = await Promise.all([
    getPageSections("home"),
    getSettings(),
    // Tres botellas: es una selección, no una grilla. Si son ocho deja de
    // leerse como recomendación y pasa a ser catálogo, que ahora vive abajo.
    getShowcaseProducts("featured", 3),
    getShowcaseProducts("bestSellers", 10),
    /*
      El catálogo NO ordena por destacados: la tira de arriba también lo hace,
      así que abría con las mismas dos botellas a 400px de distancia y se leía
      como un error de render. Por precio ascendente entra por otro lado y
      además es el orden que más se usa en una tienda. Cambiarlo es cambiar
      este string.
    */
    listProducts({ sinPacks: true, orden: "precio-menor", perPage: 24 }),
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

      {/*
        Arriba va una recomendación corta, no el catálogo: tres botellas que
        alguien eligió esta semana. El catálogo completo está más abajo, después
        de las tiras.
      */}
      <section className="mx-auto max-w-[1600px] px-gutter pt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-display-sm font-medium text-carbon-900">
              Los seleccionados de la semana
            </h2>
            <p className="mt-1.5 text-[14px] text-stone-600">
              Tres que estamos tomando nosotros.
            </p>
          </div>
          <Link
            href="/vinos"
            className="inline-flex items-center gap-2 text-[13px] text-accent-700 transition-colors hover:text-accent-600"
          >
            Ver todos
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {seleccion.map((product, i) => (
            <WineCardRow
              key={product.id}
              product={product}
              isFavorite={favoriteIds.has(product.id)}
              priority={i < 3}
            />
          ))}
        </div>
      </section>

      {/*
        Promo fija al costado de un riel de productos.

        El panel de la izquierda no rota ni cambia solo: es una sola pieza que
        empuja a las cajas. A la derecha, los que más salen, en un riel que se
        arrastra. La imagen del panel es una de las cajas reales, no un montaje.
      */}
      {masVendidos.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-gutter pt-16">
          <div className="grid gap-7 lg:grid-cols-[360px_minmax(0,1fr)]">
            <Link
              href="/box"
              className="group relative hidden overflow-hidden rounded-md bg-carbon-900 lg:block"
            >
              <Image
                src="/media/packs/pack-regalo.webp"
                alt=""
                fill
                sizes="360px"
                className="object-cover opacity-[0.72] transition-transform duration-[700ms] ease-out-expo group-hover:scale-[1.04]"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-carbon-950/85 via-carbon-950/35 to-carbon-950/10"
              />
              <span className="absolute inset-x-6 bottom-7">
                <span className="eyebrow block text-linen-300">Cajas armadas</span>
                <span className="mt-2.5 block font-display text-[26px] font-light leading-tight text-bone">
                  Listas para regalar
                </span>
                <span className="mt-5 inline-flex items-center gap-2 rounded-md bg-bone px-4 py-2 text-[12px] font-medium text-carbon-900">
                  Ver los box
                  <ArrowRight className="size-3.5" aria-hidden />
                </span>
              </span>
            </Link>

            <div className="min-w-0">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-display-sm font-medium text-carbon-900">
                    Los que más salen
                  </h2>
                  <p className="mt-1.5 text-[14px] text-stone-600">
                    Lo que más nos piden, en orden.
                  </p>
                </div>
                <Link
                  href="/vinos"
                  className="inline-flex items-center gap-2 text-[13px] text-accent-700 transition-colors hover:text-accent-600"
                >
                  Ver todos
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>

              <div className="mt-7">
                <ProductRail productos={masVendidos} favoritos={favoriteIds} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/*
        Catálogo general, a tres columnas.

        Vuelve al ancho grande de la home: con tres columnas sobre 1600px cada
        una ronda los 490px, que es la medida para la que está pensada la
        ficha horizontal (reserva el 38% del ancho para la botella). A dos
        columnas sobre este ancho la foto quedaba enorme.
      */}
      {catalogo.items.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-gutter pt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-display-sm font-medium text-carbon-900">
                Nuestros vinos
              </h2>
              <p className="mt-1.5 text-[14px] text-stone-600">
                {/*
                  Sin promesa geográfica acá: hoy las 22 etiquetas son de
                  Mendoza (Valle de Uco, Luján de Cuyo, Gualtallary, Maipú y
                  La Consulta). Cuando entren vinos del norte y la Patagonia,
                  esta línea puede decirlo.
                */}
                {catalogo.total} etiquetas, probadas una por una antes de entrar.
              </p>
            </div>
            <Link
              href="/vinos"
              className="inline-flex items-center gap-2 text-[13px] text-accent-700 transition-colors hover:text-accent-600"
            >
              Ver el catálogo con filtros
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {catalogo.items.map((product) => (
              <WineCardRow
                key={product.id}
                product={product}
                isFavorite={favoriteIds.has(product.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/*
        Las tiras van después del catálogo y no en el medio: la página la
        manejan las grillas de producto, y las promos cierran en lugar de
        interrumpir.
      */}
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
