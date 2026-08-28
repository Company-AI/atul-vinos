import { CATALOG_SORTS, type CatalogFilters, type CatalogSort } from "./types";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const asArray = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : value.split(",");
  return list.map((v) => v.trim()).filter(Boolean);
};

const asNumber = (value: string | string[] | undefined): number | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

/** Nombres de parámetros en español, visibles en la URL. */
export const PARAM_KEYS = {
  q: "q",
  tipo: "tipo",
  varietal: "varietal",
  region: "region",
  bodega: "bodega",
  linea: "linea",
  maridaje: "maridaje",
  intensidad: "intensidad",
  cosecha: "cosecha",
  precioMin: "precio-min",
  precioMax: "precio-max",
  orden: "orden",
  page: "pagina",
} as const;

export function parseCatalogParams(
  params: RawSearchParams,
  defaults: Partial<CatalogFilters> = {},
): CatalogFilters {
  const ordenValue = params[PARAM_KEYS.orden];
  const ordenRaw = Array.isArray(ordenValue) ? ordenValue[0] : ordenValue;
  const orden: CatalogSort =
    ordenRaw && Object.hasOwn(CATALOG_SORTS, ordenRaw) ? (ordenRaw as CatalogSort) : "destacados";

  return {
    ...defaults,
    q: (Array.isArray(params.q) ? params.q[0] : params.q) || undefined,
    tipo: asArray(params[PARAM_KEYS.tipo]).map((t) => t.toUpperCase()),
    varietal: asArray(params[PARAM_KEYS.varietal]),
    region: asArray(params[PARAM_KEYS.region]),
    bodega: asArray(params[PARAM_KEYS.bodega]),
    linea: asArray(params[PARAM_KEYS.linea]),
    maridaje: asArray(params[PARAM_KEYS.maridaje]),
    intensidad: asArray(params[PARAM_KEYS.intensidad]).map((i) => i.toUpperCase()),
    cosecha: asArray(params[PARAM_KEYS.cosecha]).map(Number).filter(Number.isFinite),
    precioMin: asNumber(params[PARAM_KEYS.precioMin]),
    precioMax: asNumber(params[PARAM_KEYS.precioMax]),
    orden,
    page: asNumber(params[PARAM_KEYS.page]) ?? 1,
  };
}

/** Cuántos filtros activos hay (para el badge del botón en mobile). */
export function countActiveFilters(filters: CatalogFilters): number {
  return (
    (filters.tipo?.length ?? 0) +
    (filters.varietal?.length ?? 0) +
    (filters.region?.length ?? 0) +
    (filters.bodega?.length ?? 0) +
    (filters.linea?.length ?? 0) +
    (filters.maridaje?.length ?? 0) +
    (filters.intensidad?.length ?? 0) +
    (filters.cosecha?.length ?? 0) +
    (filters.precioMin !== undefined ? 1 : 0) +
    (filters.precioMax !== undefined ? 1 : 0)
  );
}
