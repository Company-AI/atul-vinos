import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/domain/catalog/types";
import { WINE_TYPE_LABELS } from "@/domain/catalog/types";
import { cn } from "@/lib/cn";
import { Badge } from "@/ui/badge";
import { Price } from "@/ui/price";
import { FormasDePago } from "@/ui/formas-de-pago";
import { StockIndicator } from "@/ui/stock-indicator";
import { AddToCartButton } from "./add-to-cart";
import { FavoriteButton } from "./favorite-button";

/**
 * Card de vino. Foto grande, poco texto, sin sombras en reposo.
 * El CTA aparece al hover en desktop y está siempre visible en mobile.
 */
export function WineCard({
  product,
  isFavorite = false,
  priority = false,
  className,
}: {
  product: ProductCard;
  isFavorite?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const meta = [
    product.kind === "PACK"
      ? `${product.bottleCount} botellas`
      : product.wineType && WINE_TYPE_LABELS[product.wineType],
    product.kind === "WINE" ? product.grapes[0] : null,
    product.regionName,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative aspect-[3/4] overflow-hidden bg-bone-pure">
        <div className="block size-full">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-6 transition-transform duration-[620ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            />
          ) : (
            <div className="grid size-full place-items-center text-stone-400">Sin imagen</div>
          )}
        </div>

        {/* Distintivos */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.isNew && <Badge tone="dark">Novedad</Badge>}
          {product.bestSeller && <Badge tone="gold">Más vendido</Badge>}
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <Badge tone="wine">Oferta</Badge>
          )}
        </div>

        <FavoriteButton
          productId={product.id}
          productName={product.name}
          initialFavorite={isFavorite}
          className="absolute right-3 top-3 z-10"
        />

        {/* CTA: siempre visible en mobile, al hover en desktop */}
        <div className="absolute inset-x-3 bottom-3 z-10 lg:opacity-0 lg:transition-opacity lg:duration-[280ms] lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
          <AddToCartButton
            productId={product.id}
            available={product.available}
            variant="dark"
            size="sm"
            block
            uppercase
            label="Agregar"
            outOfStockLabel="Sin stock"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {meta && <p className="eyebrow text-stone-500">{meta}</p>}

        {/*
          El enlace del título se estira sobre toda la tarjeta con un ::after.

          Antes sólo entraban al vino la foto y las letras del título: el
          varietal, la región, el precio y las cuotas no hacían nada. Medido
          punto por punto en un teléfono, el 54% de la superficie de la
          tarjeta no respondía, y el cliente lo reporto como "hay que tocar
          justo en lugares específicos".

          Se estira el enlace que ya existe en vez de envolver todo en otro:
          un <a> alrededor de la tarjeta entera se lee como un solo bloque de
          texto larguísimo en un lector de pantalla, y además no puede
          contener al botón de agregar.

          El carrito y el corazón llevan z-10 para quedar por encima del
          ::after y seguir siendo ellos mismos.
        */}
        <h3 className="mt-2 font-display text-[19px] font-light leading-snug text-carbon-900">
          <Link
            href={`/vinos/${product.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:text-accent-700"
          >
            {product.name}
            {product.vintage ? <span className="text-stone-500"> {product.vintage}</span> : null}
          </Link>
        </h3>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <Price value={product.price} compareAt={product.compareAtPrice} />
          {product.available <= Math.max(product.minStock, 6) && (
            <StockIndicator available={product.available} minStock={product.minStock} />
          )}
        </div>

        <FormasDePago value={product.price} size="sm" className="mt-1.5" />
      </div>
    </article>
  );
}
