"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { formatARS } from "@/lib/money";

type SearchResults = {
  products: {
    slug: string; name: string; vintage: number | null; price: number;
    imageUrl: string | null; wineryName: string | null; regionName: string | null;
    kind: string; available: number;
  }[];
  posts: { title: string; slug: string; excerpt: string | null }[];
};

export function SearchOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ products: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) { setQuery(""); setResults({ products: [], posts: [] }); }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ products: [], posts: [] });
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (res.ok) setResults(await res.json());
      } catch {
        /* búsqueda cancelada */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query]);

  const hasResults = results.products.length > 0 || results.posts.length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-carbon-950/60 backdrop-blur-sm data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <Dialog.Content className="fixed inset-x-0 top-0 z-[70] bg-bone-pure shadow-overlay data-[state=open]:animate-[reveal-up_260ms_cubic-bezier(0.16,1,0.3,1)]">
          <Dialog.Title className="sr-only">Buscar en el sitio</Dialog.Title>
          <div className="mx-auto max-w-[1440px] px-gutter py-5">
            <div className="flex items-center gap-3 border-b border-linen-300 pb-4">
              <Search className="size-5 shrink-0 text-stone-500" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar vinos, varietales, regiones…"
                aria-label="Buscar"
                className="w-full bg-transparent font-display text-display-sm font-light text-carbon-900 outline-none placeholder:text-stone-400"
              />
              <Dialog.Close asChild>
                <button aria-label="Cerrar búsqueda" className="rounded-sm p-2 text-stone-500 hover:text-carbon-900">
                  <X className="size-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="max-h-[65vh] overflow-y-auto py-5">
              {query.trim().length < 2 && (
                <p className="text-sm text-stone-500">
                  Escribí al menos dos letras. Por ejemplo: <em>malbec</em>, <em>valle de uco</em> o <em>espumante</em>.
                </p>
              )}

              {loading && query.trim().length >= 2 && !hasResults && (
                <p className="text-sm text-stone-500">Buscando…</p>
              )}

              {!loading && query.trim().length >= 2 && !hasResults && (
                <p className="text-sm text-stone-500">
                  No encontramos resultados para «{query}». Probá con un varietal o una región.
                </p>
              )}

              {results.products.length > 0 && (
                <>
                  <p className="eyebrow mb-3 text-stone-500">Vinos</p>
                  <ul className="mb-6 divide-y divide-linen-200">
                    {results.products.map((p) => (
                      <li key={p.slug}>
                        <Link
                          href={`/vinos/${p.slug}`}
                          onClick={() => onOpenChange(false)}
                          className="flex items-center gap-4 py-3 transition-colors hover:bg-linen-100"
                        >
                          {p.imageUrl && (
                            <Image
                              src={p.imageUrl} alt="" width={40} height={53}
                              className="h-13 w-10 shrink-0 object-contain"
                            />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-carbon-900">
                              {p.name} {p.vintage ?? ""}
                            </span>
                            <span className="block truncate text-[13px] text-stone-500">
                              {[p.regionName, p.wineryName].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          <span className="shrink-0 text-sm tabular text-carbon-900">
                            {formatARS(p.price)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {results.posts.length > 0 && (
                <>
                  <p className="eyebrow mb-3 text-stone-500">Historias</p>
                  <ul className="divide-y divide-linen-200">
                    {results.posts.map((post) => (
                      <li key={post.slug}>
                        <Link
                          href={`/historias/${post.slug}`}
                          onClick={() => onOpenChange(false)}
                          className="block py-3 transition-colors hover:bg-linen-100"
                        >
                          <span className="block text-sm font-medium text-carbon-900">{post.title}</span>
                          {post.excerpt && (
                            <span className="mt-0.5 block truncate text-[13px] text-stone-500">
                              {post.excerpt}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {hasResults && (
                <Link
                  href={`/vinos?q=${encodeURIComponent(query)}`}
                  onClick={() => onOpenChange(false)}
                  className="mt-6 inline-block text-sm underline underline-offset-4 hover:text-wine-700"
                >
                  Ver todos los resultados en la tienda
                </Link>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
