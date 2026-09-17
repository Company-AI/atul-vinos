import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getShowcaseProducts, listProducts } from "@/domain/catalog/service";
import { getPageSections } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { getFavoriteIds } from "@/app/actions/favorites";
import { SectionRenderer } from "@/components/marketing/section-renderer";
import { CategoryCircles, type CategoryCircle } from "@/components/shop/category-circles";
import { CATEGORIAS_TIENDA, TODOS_LOS_VINOS } from "@/components/shop/categorias";
import { WineCardRow } from "@/components/shop/wine-card-row";
import { VarietalBlock } from "@/components/shop/varietal-block";
import { LogoStrip, type LogoBodega } from "@/components/shop/logo-strip";

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

/*
  Bodegas que trabajamos, para la tira que corta entre los dos bloques de
  varietal. Los logos son los oficiales de cada bodega, bajados de sus sitios.

  Están las 7 que pude conseguir del listado de stock. Faltan 17 y se agregan
  acá a medida que aparezcan: Antigal está, faltan CrowdFarming, Vista Grande,
  Humanao, Los Dragones, Malma, Terra Camiare, Domaine Bousquet, Familia
  Rubino, Finca Iral, Penedo Borges, Scotti Wines, Stella Crinita, El Mirlo,
  Riccitelli, Rocamadre, Urqo y Yanay.
*/
const BODEGAS: LogoBodega[] = [
  { nombre: "Miguel Minni", archivo: "/media/bodegas/miguel-minni.png" },
  { nombre: "Antigal", archivo: "/media/bodegas/antigal.png" },
  { nombre: "El Porvenir de Cafayate", archivo: "/media/bodegas/el-porvenir.png" },
  { nombre: "Bodega Renacer", archivo: "/media/bodegas/renacer.png" },
  { nombre: "Chañarmuyo", archivo: "/media/bodegas/chanarmuyo.png" },
  { nombre: "La Mala María", archivo: "/media/bodegas/la-mala-maria.png" },
  { nombre: "Otronia", archivo: "/media/bodegas/otronia.png" },
];


export default async function HomePage() {
  const [sections, settings, seleccion, malbec, cabernet, catalogo, favoriteIds] = await Promise.all([
    getPageSections("home"),
    getSettings(),
    // Tres botellas: es una selección, no una grilla. Si son ocho deja de
    // leerse como recomendación y pasa a ser catálogo, que ahora vive abajo.
    getShowcaseProducts("featured", 3),
    listProducts({ varietal: ["malbec"], perPage: 6, orden: "destacados" }),
    listProducts({
      varietal: ["cabernet-franc", "cabernet-sauvignon"],
      perPage: 6,
      orden: "destacados",
    }),
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
        Un bloque por varietal: la foto grande al costado y sus vinos al lado,
        en dos filas de tres.

        Hoy sólo Malbec llena las dos filas: son 14 de las 22 etiquetas del
        catálogo. Cabernet tiene tres botellas entre Franc y Sauvignon, así
        que su bloque muestra una fila. El componente renderiza lo que hay en
        vez de dejar huecos.
      */}
      <VarietalBlock
        titulo="Malbec"
        bajada="La uva que mejor conocemos."
        href="/vinos?varietal=malbec"
        imagen="/media/varietales/malbec.webp"
        productos={malbec.items}
        favoritos={favoriteIds}
      />

      <LogoStrip bodegas={BODEGAS} />

      <VarietalBlock
        titulo="Cabernet"
        bajada="Franc y Sauvignon, para salir del Malbec."
        href="/vinos?varietal=cabernet-franc"
        imagen="/media/varietales/cabernet.webp"
        productos={cabernet.items}
        favoritos={favoriteIds}
      />

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
      {/*
        Quiénes somos, a sangre.

        Antes era una caja con la foto a la izquierda y el texto a la derecha,
        las dos mitades iguales y un borde alrededor: se leía como un banner
        más. Ahora la foto ocupa la banda entera y el texto va en una tarjeta
        crema que se le monta encima, corrida hacia la derecha. La tarjeta
        arranca dentro de la foto, así que hay una sola pieza y no dos mitades
        pegadas.
      */}
      <section className="relative mt-20 overflow-hidden">
        <div className="relative min-h-[520px] lg:min-h-[560px]">
          <Image
            src="/media/scenes/cellar.jpg"
            alt="Sala de crianza con barricas de roble"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-carbon-950/70 via-carbon-950/30 to-carbon-950/10"
          />

          <div className="relative mx-auto flex h-full max-w-[1600px] items-center px-gutter py-16">
            <div className="ml-auto w-full max-w-[560px] rounded-md bg-bone-pure/95 p-9 backdrop-blur-sm lg:p-12">
              <p className="eyebrow text-accent-700">Quiénes somos</p>
              <h2 className="mt-5 font-display text-display-md font-light text-carbon-900">
                No vendemos nada que no probemos.
              </h2>
              <p className="mt-6 text-[15px] leading-[1.85] text-stone-600">
                Somos distribuidores: vamos a la bodega, probamos la añada que se va a vender y
                recién ahí compramos. Por eso el catálogo es corto y podemos defender cada
                botella que está en esta página.
              </p>
              <Link
                href="/quienes-somos"
                className="mt-8 inline-flex items-center gap-2 text-[13px] font-medium text-accent-700 transition-colors hover:text-accent-600"
              >
                Conocé cómo elegimos
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
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
