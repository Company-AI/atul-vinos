"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

type SearchResults = {
  orders: { id: string; number: number; customerName: string; total: string; status: string }[];
  customers: { id: string; name: string; email: string }[];
  products: { id: string; name: string; sku: string }[];
  subscriptions: { id: string; number: number; customerName: string; planName: string }[];
};

const EMPTY: SearchResults = { orders: [], customers: [], products: [], subscriptions: [] };

/**
 * Buscador global del admin (spec §76): pedido #1050, nombre, email, SKU,
 * vino, tracking o suscripción. Atajo: /
 */
export function AdminSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        setResults(await res.json());
        setOpen(true);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query]);

  const total =
    results.orders.length + results.customers.length +
    results.products.length + results.subscriptions.length;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-sm border border-linen-300 bg-bone-pure px-2.5">
        <Search className="size-3.5 shrink-0 text-stone-400" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Buscar pedido, cliente, SKU, tracking…"
          aria-label="Buscar en el administrador"
          className="h-8 w-full bg-transparent text-[13px] outline-none placeholder:text-stone-400"
        />
        <kbd className="hidden shrink-0 rounded-xs border border-linen-300 px-1 text-[10px] text-stone-400 sm:block">
          /
        </kbd>
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[70vh] overflow-y-auto rounded-sm border border-linen-300 bg-bone-pure shadow-raised">
          {total === 0 ? (
            <p className="px-3 py-4 text-[13px] text-stone-500">Sin resultados para «{query}».</p>
          ) : (
            <>
              <Group title="Pedidos" items={results.orders.map((o) => ({
                key: o.id,
                href: `/admin/pedidos/${o.id}`,
                primary: `#${o.number} — ${o.customerName}`,
                secondary: `${o.total} · ${o.status}`,
              }))} />
              <Group title="Suscripciones" items={results.subscriptions.map((s) => ({
                key: s.id,
                href: `/admin/suscripciones/${s.id}`,
                primary: `#${s.number} — ${s.customerName}`,
                secondary: s.planName,
              }))} />
              <Group title="Clientes" items={results.customers.map((c) => ({
                key: c.id,
                href: `/admin/clientes/${c.id}`,
                primary: c.name,
                secondary: c.email,
              }))} />
              <Group title="Productos" items={results.products.map((p) => ({
                key: p.id,
                href: `/admin/productos/${p.id}`,
                primary: p.name,
                secondary: p.sku,
              }))} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  items,
}: {
  title: string;
  items: { key: string; href: string; primary: string; secondary: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="border-b border-linen-200 last:border-none">
      <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.16em] text-stone-500">
        {title}
      </p>
      <ul>
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className={cn(
                "block px-3 py-2 transition-colors hover:bg-linen-100",
              )}
            >
              <span className="block truncate text-[13px] text-carbon-900">{item.primary}</span>
              <span className="block truncate text-[12px] text-stone-500">{item.secondary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
