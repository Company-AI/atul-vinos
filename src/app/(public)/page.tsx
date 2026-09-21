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
import { LogoStrip, type LogoBodega } from "@/components/shop/logo-strip";
import { buttonVariants } from "@/ui/button";

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
  Bodegas que trabajamos, para la tira que cierra el recorrido de producto.
  Los logos son los oficiales, bajados del sitio de cada bodega.

  Van 15 de las 24 del listado de stock. Las que faltan no tienen sitio
  propio —se venden por Instagram o por vinotecas— y hay que pedirle el
  archivo a cada una: Vista Grande, Scotti Wines, Stella Crinita, Los
  Dragones, El Mirlo, Rocamadre, Urqo y Yanay. "CrowdFarming (autor)" no es
  una bodega, es la vía por la que entra, así que no lleva logo.

  Varios venían en blanco sobre transparente, pensados para fondo oscuro, y
  se invirtieron para que se lean sobre crema: Otronia, El Porvenir, Familia
  Rubino y Humanao.
*/
const BODEGAS: LogoBodega[] = [
  { nombre: "Miguel Minni", archivo: "/media/bodegas/miguel-minni.png" },
  { nombre: "Antigal", archivo: "/media/bodegas/antigal.png" },
  { nombre: "El Porvenir de Cafayate", archivo: "/media/bodegas/el-porvenir.png" },
  { nombre: "Bodega Renacer", archivo: "/media/bodegas/renacer.png" },
  { nombre: "Chañarmuyo", archivo: "/media/bodegas/chanarmuyo.png" },
  { nombre: "Humanao", archivo: "/media/bodegas/humanao.png" },
  { nombre: "La Mala María", archivo: "/media/bodegas/la-mala-maria.png" },
  { nombre: "Malma", archivo: "/media/bodegas/malma.png" },
  { nombre: "Terra Camiare", archivo: "/media/bodegas/terra-camiare.png" },
  { nombre: "Domaine Bousquet", archivo: "/media/bodegas/domaine-bousquet.png" },
  { nombre: "Familia Rubino", archivo: "/media/bodegas/familia-rubino.png" },
  { nombre: "Finca Iral", archivo: "/media/bodegas/finca-iral.png" },
  { nombre: "Penedo Borges", archivo: "/media/bodegas/penedo-borges.png" },
  { nombre: "Matías Riccitelli", archivo: "/media/bodegas/riccitelli.png" },
  { nombre: "Otronia", archivo: "/media/bodegas/otronia.png" },
];


export default async function HomePage() {
  const [sections, settings, seleccion, catalogo, favoriteIds] = await Promise.all([
    getPageSections("home"),
    getSettings(),
    // Tres botellas: es una selección, no una grilla. Si son ocho deja de
    // leerse como recomendación y pasa a ser catálogo, que ahora vive abajo.
    getShowcaseProducts("featured", 3),
    /*
      El catálogo NO ordena por destacados: la tira de arriba también lo hace,
      así que abría con las mismas dos botellas a 400px de distancia y se leía
      como un error de render. Por precio ascendente entra por otro lado y
      además es el orden que más se usa en una tienda. Cambiarlo es cambiar
      este string.
    */
    listProducts({ sinPacks: true, orden: "precio-menor", perPage: 9 }),
    getFavoriteIds(),
  ]);

  // Del CMS vienen el hero y el renglón de novedades; el resto de la home es
  // estructura de tienda y no se edita por bloque.
  const hero = sections.filter((s) => s.key === "home.hero");
  /*
    El corte entre la selección y el catálogo. Hay dos piezas cargadas —la
    banda con foto y el renglón fino— y se elige cuál va prendiendo y
    apagando secciones en el admin, sin tocar código. Si quedan las dos
    activas se muestran en el orden que tengan.
  */
  const corte = sections.filter(
    (s) => s.key === "home.banner" || s.key === "home.novedades",
  );

  return (
    <>
      <SectionRenderer
        sections={hero}
        logoUrl={settings.company.logoLightUrl}
        isotipoUrl={settings.company.isotipoLightUrl}
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
        Corte entre la selección y el catálogo: un renglón que se desplaza con
        las novedades del mes. Sale del CMS, así que cambia sin tocar código.

        Antes acá iban dos bloques por varietal —Malbec y Cabernet, cada uno
        con su foto grande y sus botellas— pero repetían fichas que el
        catálogo de abajo ya muestra, y el patrón no escalaba: de las 22
        etiquetas, 14 son Malbec, así que ningún otro varietal llenaba sus
        filas.
      */}
      <SectionRenderer sections={corte} />

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

          {/*
            La home muestra tres filas y corta. Antes listaba el catálogo
            entero y la página se iba a más del doble de largo; el resto vive
            en /vinos, que además tiene los filtros.
          */}
          {catalogo.total > catalogo.items.length && (
            <div className="mt-10 flex justify-center">
              <Link
                href="/vinos"
                className={buttonVariants({ variant: "outline", size: "lg", uppercase: true })}
              >
                Ver todos los vinos
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          )}
        </section>
      )}

      {/*
        Las bodegas cierran el recorrido de producto: quién está detrás de lo
        que se acaba de mirar, justo antes de quiénes somos y los datos.
      */}
      <LogoStrip bodegas={BODEGAS} />

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
