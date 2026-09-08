import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/domain/catalog/types";
import { WINE_TYPE_LABELS } from "@/domain/catalog/types";
import { cn } from "@/lib/cn";
import { formatARS } from "@/lib/money";
import { AddToCartButton } from "./add-to-cart";
import { FavoriteButton } from "./favorite-button";

/**
 * Ficha horizontal: botella a la izquierda, datos a la derecha.
 *
 * Es la disposición de la tienda: la botella transparente se lee a cualquier
 * tamaño y el texto queda alineado en columna, así que cinco fichas entran en
 * una fila sin que el nombre se corte. Reutiliza los mismos botones de
 * carrito y favorito que la ficha vertical: la lógica no se duplica.
 */
export function WineCardRow({
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
  const enOferta = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const off = enOferta
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : null;

  const etiqueta = enOferta
    ? { texto: "Oferta", clase: "bg-wine-700 text-bone-pure" }
    : product.isNew
      ? { texto: "Nuevo", clase: "bg-carbon-900 text-bone-pure" }
      : product.featured
        ? { texto: "Destacado", clase: "bg-wine-700 text-bone-pure" }
        : null;

  const varietal =
    product.kind === "PACK"
      ? `${product.bottleCount} botellas`
      : product.grapes[0] ?? (product.wineType ? WINE_TYPE_LABELS[product.wineType] : null);

  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-md border border-linen-200 bg-bone-pure transition-colors hover:border-linen-300",
        className,
      )}
    >
      {etiqueta && (
        <span
          className={cn(
            "absolute left-0 top-3 z-10 rounded-r-sm px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]",
            etiqueta.clase,
          )}
        >
          {etiqueta.texto}
        </span>
      )}

      <div className="absolute right-2.5 top-2.5 z-10">
        <FavoriteButton
          productId={product.id}
          productName={product.name}
          initialFavorite={isFavorite}
        />
      </div>

      {/* Columna de la botella */}
      <Link
        href={`/vinos/${product.slug}`}
        tabIndex={-1}
        aria-hidden
        className="relative w-[38%] shrink-0 self-stretch"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 40vw, 16vw"
            className="object-contain p-4 transition-transform duration-[620ms] ease-out-expo group-hover:scale-[1.05]"
          />
        ) : (
          <div className="grid size-full place-items-center text-[11px] text-stone-400">
            Sin imagen
          </div>
        )}
      </Link>

      {/* Columna de datos */}
      <div className="flex min-w-0 flex-1 flex-col py-5 pr-4 pt-9">
        <h3 className="font-display text-[17px] font-medium leading-tight text-carbon-900">
          <Link href={`/vinos/${product.slug}`} className="hover:text-wine-700">
            {product.name}
          </Link>
        </h3>

        <p className="mt-1.5 text-[13px] leading-snug text-stone-600">
          {varietal}
          {product.regionName && (
            <>
              <br />
              {product.regionName}
            </>
          )}
        </p>

        <div className="mt-auto pt-4">
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="text-[17px] font-medium tabular text-carbon-900">
              {formatARS(product.price)}
            </span>
            {enOferta && (
              <>
                <span className="text-[12px] tabular text-stone-400 line-through">
                  {formatARS(product.compareAtPrice!)}
                </span>
                <span className="rounded-xs bg-wine-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-wine-700">
                  {off}% OFF
                </span>
              </>
            )}
          </p>

          <div className="mt-3">
            <AddToCartButton
              productId={product.id}
              available={product.available}
              label="Agregar"
              withIcon
              variant="primary"
              size="sm"
              block
            />
          </div>
        </div>
      </div>
    </article>
  );
}
