"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { FilterOptions } from "@/domain/catalog/service";
import { PARAM_KEYS } from "@/domain/catalog/params";
import { INTENSITY_LABELS, WINE_TYPE_LABELS } from "@/domain/catalog/types";
import { cn } from "@/lib/cn";
import { formatARS } from "@/lib/money";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Drawer } from "@/ui/modal";
import { Input } from "@/ui/field";

type Group = { key: string; label: string; options: { value: string; label: string; count?: number }[] };

/**
 * Filtros controlados por la URL: compartibles, navegables con el botón atrás
 * y renderizables en el servidor. En mobile viven en un bottom sheet.
 */
export function WineFilters({
  options,
  activeCount,
  resultCount,
}: {
  options: FilterOptions;
  activeCount: number;
  resultCount: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block" aria-label="Filtros">
        <FilterPanel options={options} activeCount={activeCount} />
      </aside>

      {/* Mobile */}
      <div className="lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setMobileOpen(true)}>
          <SlidersHorizontal className="size-4" />
          Filtrar
          {activeCount > 0 && <Badge tone="dark">{activeCount}</Badge>}
        </Button>

        <Drawer
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          side="bottom"
          title="Filtrar vinos"
          footer={
            <Button variant="dark" size="lg" block uppercase onClick={() => setMobileOpen(false)}>
              Ver {resultCount} {resultCount === 1 ? "vino" : "vinos"}
            </Button>
          }
        >
          <div className="p-5">
            <FilterPanel options={options} activeCount={activeCount} />
          </div>
        </Drawer>
      </div>
    </>
  );
}

function FilterPanel({ options, activeCount }: { options: FilterOptions; activeCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [priceMin, setPriceMin] = useState(searchParams.get(PARAM_KEYS.precioMin) ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get(PARAM_KEYS.precioMax) ?? "");

  const navigate = useCallback(
    (params: URLSearchParams) => {
      params.delete(PARAM_KEYS.page);
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [router],
  );

  const toggle = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.getAll(key);
      params.delete(key);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      for (const v of next) params.append(key, v);
      navigate(params);
    },
    [navigate, searchParams],
  );

  const applyPrice = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(PARAM_KEYS.precioMin);
    params.delete(PARAM_KEYS.precioMax);
    if (priceMin) params.set(PARAM_KEYS.precioMin, priceMin);
    if (priceMax) params.set(PARAM_KEYS.precioMax, priceMax);
    navigate(params);
  }, [navigate, priceMin, priceMax, searchParams]);

  const clearAll = useCallback(() => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    const orden = searchParams.get(PARAM_KEYS.orden);
    if (q) params.set("q", q);
    if (orden) params.set(PARAM_KEYS.orden, orden);
    setPriceMin("");
    setPriceMax("");
    navigate(params);
  }, [navigate, searchParams]);

  const groups: Group[] = [
    {
      key: PARAM_KEYS.tipo,
      label: "Tipo",
      options: options.types.map((t) => ({
        value: t.value,
        label: WINE_TYPE_LABELS[t.value],
        count: t.count,
      })),
    },
    {
      key: PARAM_KEYS.varietal,
      label: "Varietal",
      options: options.grapes.map((g) => ({ value: g.slug, label: g.name, count: g.count })),
    },
    {
      key: PARAM_KEYS.region,
      label: "Región",
      options: options.regions.map((r) => ({ value: r.slug, label: r.name, count: r.count })),
    },
    {
      key: PARAM_KEYS.bodega,
      label: "Bodega / productor",
      options: options.wineries.map((w) => ({ value: w.slug, label: w.name, count: w.count })),
    },
    {
      key: PARAM_KEYS.linea,
      label: "Línea",
      options: options.lines.map((l) => ({ value: l.slug, label: l.name, count: l.count })),
    },
    {
      key: PARAM_KEYS.intensidad,
      label: "Intensidad",
      options: (["LIGERO", "MEDIO", "INTENSO"] as const).map((i) => ({
        value: i,
        label: INTENSITY_LABELS[i],
      })),
    },
    {
      key: PARAM_KEYS.cosecha,
      label: "Cosecha",
      options: options.vintages.map((v) => ({ value: String(v), label: String(v) })),
    },
    {
      key: PARAM_KEYS.maridaje,
      label: "Maridaje",
      options: options.pairings.map((p) => ({ value: p.slug, label: p.name, count: p.count })),
    },
  ];

  return (
    <div className={cn("space-y-7", pending && "opacity-60 transition-opacity")}>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1.5 text-[13px] text-stone-600 underline underline-offset-4 hover:text-carbon-900"
        >
          <X className="size-3.5" />
          Limpiar filtros ({activeCount})
        </button>
      )}

      {groups
        .filter((group) => group.options.length > 0)
        .map((group) => (
        <fieldset key={group.key} className="border-t border-linen-200 pt-5">
          <legend className="eyebrow mb-3 text-stone-500">{group.label}</legend>
          <ul className="space-y-2">
            {group.options.map((option) => {
              const checked = searchParams.getAll(group.key).includes(option.value);
              const id = `${group.key}-${option.value}`;
              return (
                <li key={id}>
                  <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 text-[14px]">
                    <input
                      id={id}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(group.key, option.value)}
                      className="size-4 shrink-0 rounded-xs border border-linen-300 accent-wine-700"
                    />
                    <span className={cn("flex-1", checked ? "text-carbon-900" : "text-stone-600")}>
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span className="text-[12px] tabular text-stone-400">{option.count}</span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}

      <fieldset className="border-t border-linen-200 pt-5">
        <legend className="eyebrow mb-3 text-stone-500">Precio</legend>
        <p className="mb-3 text-[12px] text-stone-500">
          Desde {formatARS(options.priceMin)} hasta {formatARS(options.priceMax)}
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Mín."
            aria-label="Precio mínimo"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="h-10"
          />
          <span className="text-stone-400">—</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Máx."
            aria-label="Precio máximo"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="h-10"
          />
        </div>
        <Button variant="subtle" size="sm" block className="mt-2" onClick={applyPrice}>
          Aplicar precio
        </Button>
      </fieldset>
    </div>
  );
}
