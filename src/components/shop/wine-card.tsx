import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/domain/catalog/types";
import { WINE_TYPE_LABELS } from "@/domain/catalog/types";
import { cn } from "@/lib/cn";
import { Badge } from "@/ui/badge";
import { Price } from "@/ui/price";
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
      <div className="relative aspect-[3/4] overflow-hidden bg-linen-100">
        <Link href={`/vinos/${product.slug}`} className="block size-full" tabIndex={-1} aria-hidden>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-4 transition-transform duration-[620ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid size-full place-items-center text-stone-400">Sin imagen</div>
          )}
        </Link>

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
          className="absolute right-3 top-3"
        />

        {/* CTA: siempre visible en mobile, al hover en desktop */}
        <div className="absolute inset-x-3 bottom-3 lg:opacity-0 lg:transition-opacity lg:duration-[280ms] lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
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

        <h3 className="mt-2 font-display text-[19px] font-light leading-snug text-carbon-900">
          <Link href={`/vinos/${product.slug}`} className="hover:text-wine-700">
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
      </div>
    </article>
  );
}
