import type { ProductCard } from "@/domain/catalog/types";
import { cn } from "@/lib/cn";
import { Reveal } from "@/ui/reveal";
import { WineCard } from "./wine-card";

export function WineGrid({
  products,
  favoriteIds,
  columns = 4,
  animate = true,
  className,
}: {
  products: ProductCard[];
  favoriteIds?: Set<string>;
  columns?: 2 | 3 | 4;
  animate?: boolean;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid gap-x-6 gap-y-12",
        "grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
        columns === 4 && "md:grid-cols-3 lg:grid-cols-4",
        columns === 2 && "lg:grid-cols-2",
        className,
      )}
    >
      {products.map((product, i) => (
        <li key={product.id}>
          {animate ? (
            <Reveal delay={Math.min(i, 7) * 0.06}>
              <WineCard
                product={product}
                isFavorite={favoriteIds?.has(product.id)}
                priority={i < 4}
              />
            </Reveal>
          ) : (
            <WineCard
              product={product}
              isFavorite={favoriteIds?.has(product.id)}
              priority={i < 4}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
