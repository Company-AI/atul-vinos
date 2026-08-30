import Link from "next/link";
import type { CatalogFilters } from "@/domain/catalog/types";
import type { FilterOptions } from "@/domain/catalog/service";
import { PARAM_KEYS } from "@/domain/catalog/params";
import { WINE_TYPE_LABELS } from "@/domain/catalog/types";
import { cn } from "@/lib/cn";
import { VLabel, VRule } from "./shared";

type Raw = Record<string, string | string[] | undefined>;

/**
 * Filtros de la tienda de Casa.
 *
 * Son links, no un formulario con estado: cada opción arma la URL resultante
 * en el servidor. Así la tienda entera sigue siendo server-rendered, funciona
 * sin JavaScript y cada combinación de filtros es una URL compartible.
 */

/** Arma la URL con una opción agregada o quitada del grupo. */
function toggleHref(params: Raw, key: string, value: string): string {
  const search = new URLSearchParams();

  for (const [k, v] of Object.entries(params)) {
    if (k === PARAM_KEYS.page) continue; // cualquier cambio de filtro vuelve a la primera página
    if (Array.isArray(v)) v.forEach((item) => search.append(k, item));
    else if (v) search.set(k, v);
  }

  const current = search.getAll(key);
  search.delete(key);
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  next.forEach((v) => search.append(key, v));

  const qs = search.toString();
  return qs ? `/v6/tienda?${qs}` : "/v6/tienda";
}

function FilterGroup({
  title,
  paramKey,
  options,
  params,
  active,
}: {
  title: string;
  paramKey: string;
  options: { label: string; value: string; count: number }[];
  params: Raw;
  active: string[];
}) {
  if (options.length === 0) return null;

  return (
    <div>
      <VLabel style={{ color: "var(--v-accent)" }}>{title}</VLabel>
      <ul className="mt-4 space-y-2.5">
        {options.map((option) => {
          const isOn = active.includes(option.value);
          return (
            <li key={option.value}>
              <Link
                href={toggleHref(params, paramKey, option.value)}
                aria-pressed={isOn}
                className={cn(
                  "flex items-baseline justify-between gap-3 text-[14px] transition-opacity duration-300 hover:opacity-100",
                  isOn ? "opacity-100" : "opacity-70",
                )}
                style={{ color: isOn ? "var(--v-accent)" : "var(--v-ink)" }}
              >
                <span className={isOn ? "underline underline-offset-4" : undefined}>{option.label}</span>
                <span className="tabular text-[12px]" style={{ color: "var(--v-muted)" }}>
                  {option.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <VRule className="mt-7" />
    </div>
  );
}

export function CasaFilters({
  options,
  filters,
  params,
  activeCount,
}: {
  options: FilterOptions;
  filters: CatalogFilters;
  params: Raw;
  activeCount: number;
}) {
  return (
    <aside aria-label="Filtros" className="space-y-7">
      <div className="flex items-baseline justify-between">
        <VLabel style={{ color: "var(--v-ink)" }}>Filtrar</VLabel>
        {activeCount > 0 && (
          <Link href="/v6/tienda" className="text-[13px] underline underline-offset-4" style={{ color: "var(--v-accent)" }}>
            Limpiar ({activeCount})
          </Link>
        )}
      </div>
      <VRule />

      <FilterGroup
        title="Tipo"
        paramKey={PARAM_KEYS.tipo}
        params={params}
        active={filters.tipo ?? []}
        options={options.types.map((t) => ({
          label: WINE_TYPE_LABELS[t.value] ?? t.value,
          value: t.value,
          count: t.count,
        }))}
      />

      <FilterGroup
        title="Varietal"
        paramKey={PARAM_KEYS.varietal}
        params={params}
        active={filters.varietal ?? []}
        options={options.grapes.map((g) => ({ label: g.name, value: g.slug, count: g.count }))}
      />

      <FilterGroup
        title="Bodega"
        paramKey={PARAM_KEYS.bodega}
        params={params}
        active={filters.bodega ?? []}
        options={options.wineries.map((w) => ({ label: w.name, value: w.slug, count: w.count }))}
      />

      <FilterGroup
        title="Región"
        paramKey={PARAM_KEYS.region}
        params={params}
        active={filters.region ?? []}
        options={options.regions.map((r) => ({ label: r.name, value: r.slug, count: r.count }))}
      />

      <FilterGroup
        title="Nivel"
        paramKey={PARAM_KEYS.linea}
        params={params}
        active={filters.linea ?? []}
        options={options.lines.map((l) => ({ label: l.name, value: l.slug, count: l.count }))}
      />
    </aside>
  );
}

/** Paginado en el lenguaje de la variante: versalitas y regla, sin botones. */
export function CasaPagination({
  page,
  totalPages,
  params,
}: {
  page: number;
  totalPages: number;
  params: Raw;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === PARAM_KEYS.page) continue;
      if (Array.isArray(v)) v.forEach((item) => search.append(k, item));
      else if (v) search.set(k, v);
    }
    if (target > 1) search.set(PARAM_KEYS.page, String(target));
    const qs = search.toString();
    return qs ? `/v6/tienda?${qs}` : "/v6/tienda";
  };

  return (
    <nav aria-label="Paginación" className="mt-16 flex items-center justify-between border-t pt-7" style={{ borderColor: "var(--v-rule)" }}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="v-label" style={{ color: "var(--v-accent)" }}>
          ← Anterior
        </Link>
      ) : (
        <span />
      )}

      <span className="v-label tabular" style={{ color: "var(--v-muted)" }}>
        Página {page} de {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="v-label" style={{ color: "var(--v-accent)" }}>
          Siguiente →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
