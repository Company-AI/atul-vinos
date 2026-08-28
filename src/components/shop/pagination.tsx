import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Paginación con links reales (crawleables y funcionales sin JS). */
export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav aria-label="Paginación" className="mt-16 flex items-center justify-center gap-1">
      {page > 1 && (
        <Link
          href={buildHref(page - 1)}
          rel="prev"
          aria-label="Página anterior"
          className="grid size-9 place-items-center rounded-sm border border-linen-300 text-carbon-800 transition-colors hover:border-carbon-600"
        >
          <ChevronLeft className="size-4" />
        </Link>
      )}

      {pages.map((p, i) => {
        const showGap = i > 0 && p - pages[i - 1] > 1;
        return (
          <span key={p} className="flex items-center gap-1">
            {showGap && <span className="px-1 text-stone-400">…</span>}
            <Link
              href={buildHref(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "grid size-9 place-items-center rounded-sm border text-[13px] tabular transition-colors",
                p === page
                  ? "border-carbon-900 bg-carbon-900 text-bone"
                  : "border-linen-300 text-carbon-800 hover:border-carbon-600",
              )}
            >
              {p}
            </Link>
          </span>
        );
      })}

      {page < totalPages && (
        <Link
          href={buildHref(page + 1)}
          rel="next"
          aria-label="Página siguiente"
          className="grid size-9 place-items-center rounded-sm border border-linen-300 text-carbon-800 transition-colors hover:border-carbon-600"
        >
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
