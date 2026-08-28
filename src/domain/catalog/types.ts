import type { ProductKind, WineIntensity, WineType } from "@prisma/client";

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  kind: ProductKind;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  imageAlt: string | null;
  wineType: WineType | null;
  vintage: number | null;
  volumeMl: number | null;
  intensity: WineIntensity | null;
  regionName: string | null;
  wineryName: string | null;
  lineName: string | null;
  grapes: string[];
  tags: { name: string; slug: string }[];
  shortDescription: string | null;
  featured: boolean;
  isNew: boolean;
  bestSeller: boolean;
  available: number;
  minStock: number;
  bottleCount: number | null;
};

export type CatalogFilters = {
  q?: string;
  tipo?: string[];
  varietal?: string[];
  region?: string[];
  bodega?: string[];
  linea?: string[];
  maridaje?: string[];
  intensidad?: string[];
  cosecha?: number[];
  precioMin?: number;
  precioMax?: number;
  soloPacks?: boolean;
  sinPacks?: boolean;
  destacados?: boolean;
  novedades?: boolean;
  orden?: CatalogSort;
  page?: number;
  perPage?: number;
};

export const CATALOG_SORTS = {
  destacados: "Destacados",
  "precio-menor": "Precio: menor a mayor",
  "precio-mayor": "Precio: mayor a menor",
  "mas-vendidos": "Más vendidos",
  novedades: "Novedades",
} as const;

export type CatalogSort = keyof typeof CATALOG_SORTS;

export const WINE_TYPE_LABELS: Record<WineType, string> = {
  TINTO: "Tinto",
  BLANCO: "Blanco",
  ROSADO: "Rosado",
  ESPUMANTE: "Espumante",
  NARANJO: "Naranjo",
  DULCE: "Dulce",
};

export const INTENSITY_LABELS: Record<WineIntensity, string> = {
  LIGERO: "Ligero",
  MEDIO: "Medio",
  INTENSO: "Intenso",
};
