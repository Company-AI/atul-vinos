import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getShowcaseProducts, listProducts } from "@/domain/catalog/service";
import { getPageSections } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { getFavoriteIds } from "@/app/actions/favorites";
import { parseBlock } from "@/domain/cms/blocks";
import { WINE_TYPE_LABELS, type ProductCard } from "@/domain/catalog/types";
import { CATEGORIAS_TIENDA, TODOS_LOS_VINOS } from "@/components/shop/categorias";
import { AddToCartButton } from "@/components/shop/add-to-cart";
import { FavoriteButton } from "@/components/shop/favorite-button";
import { Button } from "@/ui/button";
import { Price } from "@/ui/price";
import { StockIndicator } from "@/ui/stock-indicator";
import { Reveal, stagger } from "@/ui/reveal";

export const revalidate = 300;

/*
  Maqueta 3. El rediseño se juega en cómo se muestra el catálogo, no en la
  paleta: los colores, la tipografía y los componentes son los de "/".

  Tres decisiones que la separan de las otras dos maquetas:

  1. El hero no es una foto con texto encima. Es tipografía sobre hueso y un
     packshot recortado al costado. Sale del mismo bloque del CMS, así que la
     copy se sigue editando en un solo lugar.
  2. El descubrimiento es un índice numerado con reglas finas, en vez de
     círculos con foto ("/") o pastillas ("/v2").
  3. La selección es asimétrica: una botella grande con su ficha y el resto
     como lista densa a dos columnas. Sin grilla de cards iguales.
*/

/** Numeración de dos dígitos para el índice y la lista. */
function orden(i: number) {
  return String(i + 1).padStart(2, "0");
}

/** Bajada de una botella: tipo · uva · región, lo que haya. */
function fichaCorta(p: ProductCard) {
  return [
    p.kind === "PACK"
      ? p.bottleCount && `${p.bottleCount} botellas`
      : p.wineType && WINE_TYPE_LABELS[p.wineType],
    p.kind === "WINE" ? p.grapes[0] : null,
    p.regionName,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default async function MaquetaTresPage() {
  const [sections, settings, seleccion, cajas, favoriteIds] = await Promise.all([
    getPageSections("home"),
    getSettings(),
    getShowcaseProducts("featured", 9),
    listProducts({ soloPacks: true, perPage: 4, orden: "destacados" }),
    getFavoriteIds(),
  ]);

  // La copy del hero es la misma del CMS; acá cambia sólo su composición.
  const bloqueHero = sections.find((s) => s.key === "home.hero");
  const hero = parseBlock("video_hero", bloqueHero?.data);

  const [pieza, ...resto] = seleccion;

  return (
    <>
      {/* ─── Hero tipográfico ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1440px] px-gutter pb-14 pt-12 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            {hero.eyebrow && (
              <Reveal as="p" className="eyebrow-rule text-stone-500">
                {hero.eyebrow}
              </Reveal>
            )}

            <Reveal variant="line" as="h1" delay={0.08} className="mt-7 font-display text-display-2xl font-medium text-carbon-900">
              {hero.title}
              {hero.titleAccent && (
                <>
                  <br />
                  <span className="accent-italic font-light text-carbon-800">
                    {hero.titleAccent}
                  </span>
                </>
              )}
            </Reveal>

            {hero.subtitle && (
              <Reveal as="p" delay={0.18} className="mt-7 max-w-[52ch] text-lead text-stone-600">
                {hero.subtitle}
              </Reveal>
            )}

            <Reveal delay={0.26} className="mt-9 flex flex-wrap items-center gap-3">
              {hero.ctaPrimary.label && (
                <Link href={hero.ctaPrimary.href}>
                  <Button variant="primary" size="lg" uppercase>
                    {hero.ctaPrimary.label}
                  </Button>
                </Link>
              )}
              {hero.ctaSecondary.label && (
                <Link href={hero.ctaSecondary.href}>
                  <Button variant="outline" size="lg" uppercase>
                    {hero.ctaSecondary.label}
                  </Button>
                </Link>
              )}
            </Reveal>
          </div>

          {/*
            La botella del hero sale del catálogo, no de un asset fijo: es el
            primer destacado, con su packshot real y su link a la ficha. Si
            cambia el destacado, cambia la portada.
          */}
          {pieza?.imageUrl && (
            <Reveal variant="mask" delay={0.12} className="lg:col-span-5">
              <Link
                href={`/vinos/${pieza.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-md bg-linen-100"
              >
                <Image
                  src={pieza.imageUrl}
                  alt={pieza.imageAlt ?? pieza.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  className="object-contain p-10 transition-transform duration-[620ms] ease-out-expo group-hover:scale-[1.03]"
                />
                <span className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
                  <span className="font-display text-[19px] font-light leading-snug text-carbon-900">
                    {pieza.name}
                  </span>
                  <span className="eyebrow shrink-0 text-accent-700">Ver ficha</span>
                </span>
              </Link>
            </Reveal>
          )}
        </div>
      </section>

      {/* ─── Índice de categorías ─────────────────────────────────────────── */}
      <section className="border-y border-linen-200 bg-bone-pure">
        <div className="mx-auto max-w-[1440px] px-gutter py-14 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-display-sm font-medium text-carbon-900">Índice</h2>
            <Link
              href={TODOS_LOS_VINOS.href}
              className="inline-flex items-center gap-2 text-[13px] text-accent-700 transition-colors hover:text-accent-600"
            >
              Ver el catálogo completo
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <ul className="mt-8 grid gap-x-14 sm:grid-cols-2">
            {CATEGORIAS_TIENDA.map((cat, i) => (
              <li key={cat.href} data-reveal style={stagger(i, 0.05)}>
                <Link
                  href={cat.href}
                  className="group flex items-center gap-5 border-t border-linen-200 py-5 transition-colors hover:border-accent-700"
                >
                  <span className="eyebrow w-6 shrink-0 tabular text-stone-600">{orden(i)}</span>

                  <span className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-bone">
                    <Image
                      src={cat.imageUrl}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-contain p-1.5"
                    />
                  </span>

                  <span className="flex-1 font-display text-[24px] font-light leading-none text-carbon-900 transition-colors group-hover:text-accent-700">
                    {cat.label}
                  </span>

                  <ArrowRight
                    className="size-4 shrink-0 text-stone-500 transition-transform duration-[280ms] group-hover:translate-x-1 group-hover:text-accent-700"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── La pieza: un solo vino con ficha ─────────────────────────────── */}
      {pieza && (
        <section className="mx-auto max-w-[1440px] px-gutter pt-16 lg:pt-24">
          <Reveal as="p" className="eyebrow-rule text-stone-500">
            La botella de esta semana
          </Reveal>

          <div className="mt-8 grid items-stretch gap-px overflow-hidden rounded-md border border-linen-200 bg-linen-200 lg:grid-cols-2">
            <div className="relative min-h-[340px] bg-bone-pure lg:min-h-[520px]">
              <Image
                src={pieza.imageUrl ?? "/media/categories/tintos.webp"}
                alt={pieza.imageAlt ?? pieza.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-12"
              />
              <FavoriteButton
                productId={pieza.id}
                productName={pieza.name}
                initialFavorite={favoriteIds.has(pieza.id)}
                className="absolute right-5 top-5"
              />
            </div>

            <div className="flex flex-col justify-center bg-bone-pure px-7 py-10 lg:px-14 lg:py-14">
              {fichaCorta(pieza) && (
                <p className="eyebrow text-stone-500">{fichaCorta(pieza)}</p>
              )}

              <h3 className="mt-4 font-display text-display-md font-light text-carbon-900">
                <Link href={`/vinos/${pieza.slug}`} className="hover:text-accent-700">
                  {pieza.name}
                  {pieza.vintage ? <span className="text-stone-500"> {pieza.vintage}</span> : null}
                </Link>
              </h3>

              {pieza.shortDescription && (
                <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.8] text-stone-600">
                  {pieza.shortDescription}
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Price value={pieza.price} compareAt={pieza.compareAtPrice} size="lg" />
                <StockIndicator available={pieza.available} minStock={pieza.minStock} />
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <AddToCartButton
                  productId={pieza.id}
                  available={pieza.available}
                  variant="primary"
                  size="lg"
                  uppercase
                  withIcon
                  label="Agregar al carrito"
                />
                <Link
                  href={`/vinos/${pieza.slug}`}
                  className="inline-flex items-center gap-2 text-[13px] text-accent-700 transition-colors hover:text-accent-600"
                >
                  Cómo lo elegimos
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── El resto: lista densa, no grilla de cards ────────────────────── */}
      {resto.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-gutter pt-16 lg:pt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-display-sm font-medium text-carbon-900">
              El resto de la selección
            </h2>
            <Link
              href="/vinos"
              className="inline-flex items-center gap-2 text-[13px] text-accent-700 transition-colors hover:text-accent-600"
            >
              Ver todos
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <ul className="mt-8 grid gap-x-14 lg:grid-cols-2">
            {resto.map((p, i) => {
              const enOferta = p.compareAtPrice !== null && p.compareAtPrice > p.price;
              return (
                <li
                  key={p.id}
                  data-reveal
                  style={stagger(i, 0.04)}
                  className="border-t border-linen-200 last:border-b lg:[&:nth-last-child(2)]:border-b"
                >
                  {/*
                    La fila envuelve en lugar de comprimirse. A 375px, con el
                    número, la miniatura y el bloque de precio en la misma
                    línea, al nombre le quedaban ~120px y quedaba cortado en
                    "Rutini Colecc…". Con flex-wrap el precio y el botón bajan
                    a una segunda línea en mobile y el nombre se lleva el ancho
                    que sobra; desde sm vuelven a la derecha, en una sola línea.
                    Una sola instancia de cada componente cliente: nada se
                    duplica para el otro breakpoint.
                  */}
                  <div className="group flex flex-wrap items-center gap-x-4 gap-y-3 py-4 sm:gap-x-5">
                    <span className="eyebrow w-6 shrink-0 tabular text-stone-600">
                      {orden(i + 1)}
                    </span>

                    <Link
                      href={`/vinos/${p.slug}`}
                      className="relative size-16 shrink-0 overflow-hidden rounded-sm bg-bone-pure sm:size-20"
                      tabIndex={-1}
                      aria-hidden
                    >
                      {p.imageUrl && (
                        <Image
                          src={p.imageUrl}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-contain p-2"
                        />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-[18px] font-light leading-snug text-carbon-900 sm:truncate">
                        <Link href={`/vinos/${p.slug}`} className="hover:text-accent-700">
                          {p.name}
                          {p.vintage ? <span className="text-stone-500"> {p.vintage}</span> : null}
                        </Link>
                      </h3>
                      <p className="mt-1 truncate text-[13px] text-stone-500">
                        {fichaCorta(p)}
                        {/* El granate sólo aparece cuando hay rebaja real. */}
                        {enOferta && (
                          <span className="ml-2 font-medium text-wine-600">Oferta</span>
                        )}
                      </p>
                    </div>

                    <div className="flex w-full items-center justify-between gap-3 pl-10 sm:w-auto sm:flex-col sm:items-end sm:gap-2 sm:pl-0">
                      <Price value={p.price} compareAt={p.compareAtPrice} size="sm" />
                      <AddToCartButton
                        productId={p.id}
                        available={p.available}
                        variant="subtle"
                        size="sm"
                        uppercase
                        label="Agregar"
                        outOfStockLabel="Sin stock"
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ─── Cajas: riel horizontal ───────────────────────────────────────── */}
      {cajas.items.length > 0 && (
        <section className="pt-16 lg:pt-24">
          <div className="mx-auto max-w-[1440px] px-gutter">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-display-sm font-medium text-carbon-900">
                  Cajas armadas
                </h2>
                <p className="mt-1.5 text-[14px] text-stone-600">
                  Cada foto muestra las botellas que vienen adentro.
                </p>
              </div>
              <Link
                href="/box"
                className="inline-flex items-center gap-2 text-[13px] text-accent-700 transition-colors hover:text-accent-600"
              >
                Ver todas
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>

          {/*
            Riel con snap en lugar de grilla: se ve que hay más de lo que entra
            en pantalla y no hay temporizador moviendo cosas bajo el cursor.
          */}
          <div className="rail-snap rail-aligned mt-8 gap-4 pb-3 pr-gutter sm:gap-5">
            {cajas.items.map((caja, i) => (
              <article
                key={caja.id}
                data-reveal
                style={stagger(i, 0.06)}
                className="w-[74vw] max-w-[340px] sm:w-[38vw] lg:w-[26%]"
              >
                <Link
                  href={`/vinos/${caja.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-md border border-linen-200 bg-bone-pure transition-colors hover:border-linen-300"
                >
                  <span className="relative block aspect-[3/4] overflow-hidden">
                    {caja.imageUrl && (
                      <Image
                        src={caja.imageUrl}
                        alt={caja.imageAlt ?? caja.name}
                        fill
                        sizes="(max-width: 640px) 74vw, 30vw"
                        className="object-cover transition-transform duration-[620ms] ease-out-expo group-hover:scale-[1.03]"
                      />
                    )}
                  </span>

                  <span className="flex flex-1 flex-col p-5">
                    <span className="eyebrow text-stone-500">
                      {caja.bottleCount ? `${caja.bottleCount} botellas` : "Caja"}
                    </span>
                    <span className="mt-2 font-display text-[19px] font-light leading-snug text-carbon-900">
                      {caja.name}
                    </span>
                    <span className="mt-3 flex items-center justify-between gap-3">
                      <Price value={caja.price} compareAt={caja.compareAtPrice} />
                      <ArrowRight
                        className="size-4 text-stone-500 transition-transform duration-[280ms] group-hover:translate-x-1 group-hover:text-accent-700"
                        aria-hidden
                      />
                    </span>
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ─── Quiénes somos: banda a sangre ────────────────────────────────── */}
      <section className="mt-16 border-y border-linen-200 bg-linen-100 lg:mt-24">
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-gutter py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
          <div className="lg:col-span-7">
            <Reveal as="p" className="eyebrow-rule text-stone-500">
              Quiénes somos
            </Reveal>
            <Reveal as="h2" delay={0.08} className="mt-6 font-display text-display-md font-light text-carbon-900">
              No vendemos nada que no probemos.
            </Reveal>
            <Reveal as="p" delay={0.14} className="mt-6 max-w-[58ch] text-[15px] leading-[1.85] text-stone-600">
              Somos distribuidores: vamos a la bodega, probamos la añada que se va a vender y
              recién ahí compramos. Por eso el catálogo es corto y podemos defender cada botella
              que está en esta página.
            </Reveal>
            <Reveal delay={0.2}>
              <Link
                href="/quienes-somos"
                className="mt-8 inline-flex items-center gap-2 text-[13px] text-accent-700 transition-colors hover:text-accent-600"
              >
                Conocé cómo elegimos
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Reveal>
          </div>

          <Reveal variant="mask" delay={0.1} className="lg:col-span-5">
            <span className="relative block aspect-[4/3] overflow-hidden rounded-md">
              <Image
                src="/media/scenes/cellar.jpg"
                alt="Sala de crianza con barricas de roble"
                fill
                sizes="(max-width: 1024px) 90vw, 40vw"
                className="object-cover"
              />
            </span>
          </Reveal>
        </div>
      </section>

      {/* ─── Firma ────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1440px] px-gutter py-20 text-center lg:py-28">
        <Reveal as="p" className="script text-[34px] text-accent-700 lg:text-[44px]">
          Más que vinos, encuentros
        </Reveal>
        <p className="eyebrow mt-5 text-stone-500">{settings.company.name}</p>
      </div>
    </>
  );
}
