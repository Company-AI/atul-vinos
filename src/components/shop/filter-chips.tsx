import Link from "next/link";
import { cn } from "@/lib/cn";

export type FilterChip = { label: string; href: string };

/**
 * Fila de filtros en pastilla.
 *
 * Son links y no botones: cada filtro queda en una URL compartible y la fila
 * funciona sin JavaScript. Se recorre en horizontal cuando no entra, en lugar
 * de apilarse en varias líneas y empujar el catálogo hacia abajo.
 */
export function FilterChips({ items, activo }: { items: FilterChip[]; activo?: string }) {
  return (
    <nav aria-label="Filtros" className="border-b border-linen-200 bg-bone">
      <ul className="rail-snap rail-aligned items-center gap-2.5 py-5 pr-gutter">
        {items.map((item) => {
          const esActivo = item.label === activo;
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={esActivo ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-pill border px-4 text-[13px] transition-colors",
                  esActivo
                    ? "border-accent-700 bg-accent-700 text-bone-pure"
                    : "border-linen-300 bg-bone-pure text-carbon-800 hover:border-carbon-600",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
