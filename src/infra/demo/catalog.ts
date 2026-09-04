import type { ProductKind, WineIntensity, WineType } from "@prisma/client";
import { PACKS, WINES } from "../../../prisma/seed/wines";
import type { CatalogFilters, ProductCard } from "@/domain/catalog/types";
import type { Availability } from "@/domain/inventory/availability";
import { slugify } from "@/lib/slug";

/**
 * Catálogo del modo demo, armado desde prisma/seed/wines.
 *
 * Replica el filtrado, el orden y el paginado de listProducts() sobre datos
 * en memoria. No busca ser exhaustivo: cubre los filtros que usa el catálogo
 * público, que es lo que se muestra en el demo.
 */

const stockFalso = (i: number) => 40 + ((i * 7) % 60);

function vinoACard(w: (typeof WINES)[number], i: number): ProductCard {
  return {
    id: `demo-wine-${w.slug}`,
    slug: w.slug,
    name: w.name,
    sku: w.sku,
    kind: "WINE" as ProductKind,
    price: w.price,
    compareAtPrice: null,
    imageUrl: `/media/wines/${w.image}.png`,
    imageAlt: `Botella de ${w.name}`,
    wineType: (w.wineType ?? null) as WineType | null,
    vintage: null,
    volumeMl: w.volumeMl ?? null,
    intensity: (w.intensity ?? null) as WineIntensity | null,
    regionName: w.region ?? null,
    wineryName: w.winery ?? null,
    lineName: w.line ?? null,
    grapes: w.grapes.map((g) => g.name),
    tags: w.tags.map((t) => ({ name: t, slug: slugify(t) })),
    shortDescription: w.shortDescription ?? null,
    featured: Boolean(w.featured),
    isNew: Boolean((w as { isNew?: boolean }).isNew),
    bestSeller: Boolean(w.bestSeller),
    available: stockFalso(i),
    minStock: w.stock?.minStock ?? 0,
    bottleCount: null,
  };
}

function packACard(p: (typeof PACKS)[number], i: number): ProductCard {
  return {
    id: `demo-pack-${p.slug}`,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    kind: "PACK" as ProductKind,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    imageUrl: `/media/packs/${p.image}.jpg`,
    imageAlt: p.name,
    wineType: null,
    vintage: null,
    volumeMl: null,
    intensity: null,
    regionName: null,
    wineryName: null,
    lineName: null,
    grapes: [],
    tags: p.tags.map((t) => ({ name: t, slug: slugify(t) })),
    shortDescription: p.shortDescription ?? null,
    featured: Boolean(p.featured),
    isNew: false,
    bestSeller: Boolean(p.bestSeller),
    available: 12 + ((i * 5) % 20),
    minStock: 4,
    bottleCount: p.components.reduce((acc, c) => acc + c.quantity, 0),
  };
}

export const DEMO_PRODUCTS: ProductCard[] = [
  ...WINES.map(vinoACard),
  ...PACKS.map(packACard),
];

const enLista = (valores: string[] | undefined, candidato: string | null) =>
  !valores || valores.length === 0 || (candidato ? valores.includes(slugify(candidato)) : false);

export function demoListProducts(filters: CatalogFilters = {}) {
  let items = [...DEMO_PRODUCTS];

  if (filters.q) {
    const q = filters.q.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.wineryName ?? "").toLowerCase().includes(q),
    );
  }

  if (filters.tipo?.length) items = items.filter((p) => p.wineType && filters.tipo!.includes(p.wineType));
  if (filters.region?.length) items = items.filter((p) => enLista(filters.region, p.regionName));
  if (filters.bodega?.length) items = items.filter((p) => enLista(filters.bodega, p.wineryName));
  if (filters.linea?.length) items = items.filter((p) => enLista(filters.linea, p.lineName));
  if (filters.varietal?.length) {
    items = items.filter((p) => p.grapes.some((g) => filters.varietal!.includes(slugify(g))));
  }
  if (filters.intensidad?.length) {
    items = items.filter((p) => p.intensity && filters.intensidad!.includes(p.intensity));
  }
  if (filters.soloPacks) items = items.filter((p) => p.kind === "PACK");
  if (filters.sinPacks) items = items.filter((p) => p.kind === "WINE");
  if (filters.destacados) items = items.filter((p) => p.featured);
  if (filters.novedades) items = items.filter((p) => p.isNew);
  if (filters.precioMin != null) items = items.filter((p) => p.price >= filters.precioMin!);
  if (filters.precioMax != null) items = items.filter((p) => p.price <= filters.precioMax!);

  switch (filters.orden) {
    case "precio-menor": items.sort((a, b) => a.price - b.price); break;
    case "precio-mayor": items.sort((a, b) => b.price - a.price); break;
    case "mas-vendidos": items.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller)); break;
    case "novedades": items.sort((a, b) => Number(b.isNew) - Number(a.isNew)); break;
    default: items.sort((a, b) => Number(b.featured) - Number(a.featured));
  }

  const total = items.length;
  const perPage = Math.min(48, filters.perPage ?? 12);
  const page = Math.max(1, filters.page ?? 1);

  return {
    items: items.slice((page - 1) * perPage, page * perPage),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** Facetas para los filtros, derivadas del catálogo en memoria. */
export function demoFilterOptions() {
  const contar = <T extends string>(valores: (T | null)[]) => {
    const mapa = new Map<string, number>();
    for (const v of valores) if (v) mapa.set(v, (mapa.get(v) ?? 0) + 1);
    return mapa;
  };

  const tipos = contar(DEMO_PRODUCTS.map((p) => p.wineType));
  const regiones = contar(DEMO_PRODUCTS.map((p) => p.regionName));
  const bodegas = contar(DEMO_PRODUCTS.map((p) => p.wineryName));
  const lineas = contar(DEMO_PRODUCTS.map((p) => p.lineName));
  const uvas = contar(DEMO_PRODUCTS.flatMap((p) => p.grapes));
  const maridajes = contar(WINES.flatMap((w) => w.pairings));

  const lista = (m: Map<string, number>) =>
    [...m.entries()]
      .map(([name, count]) => ({ name, slug: slugify(name), count }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

  const precios = DEMO_PRODUCTS.map((p) => p.price);

  return {
    types: [...tipos.entries()].map(([value, count]) => ({ value: value as WineType, count })),
    grapes: lista(uvas),
    regions: lista(regiones).map((r) => ({ ...r, province: null as string | null })),
    wineries: lista(bodegas),
    lines: lista(lineas),
    pairings: lista(maridajes),
    vintages: [] as number[],
    priceMin: Math.floor(Math.min(...precios) / 1000) * 1000,
    priceMax: Math.ceil(Math.max(...precios) / 1000) * 1000,
  };
}

/**
 * Ficha de producto para el demo.
 *
 * Reproduce la forma que devuelve getProductDetail() con `include`, para que
 * la página del vino no tenga que saber si hay base. Los packs resuelven sus
 * componentes contra el mismo catálogo en memoria.
 */
export function demoProductDetail(slug: string) {
  const wine = WINES.find((w) => w.slug === slug);
  const pack = PACKS.find((p) => p.slug === slug);
  if (!wine && !pack) return null;

  const card = DEMO_PRODUCTS.find((p) => p.slug === slug)!;
  const base = {
    id: card.id,
    slug: card.slug,
    name: card.name,
    sku: card.sku,
    kind: card.kind,
    status: "ACTIVE" as const,
    price: card.price,
    compareAtPrice: card.compareAtPrice,
    shortDescription: card.shortDescription,
    wineType: card.wineType,
    vintage: null as number | null,
    volumeMl: card.volumeMl,
    intensity: card.intensity,
    featured: card.featured,
    isNew: card.isNew,
    bestSeller: card.bestSeller,
    images: card.imageUrl
      ? [{ id: `${card.id}-img`, url: card.imageUrl, alt: card.imageAlt, isPrimary: true, sortOrder: 0, width: 1000, height: 1000, productId: card.id }]
      : [],
    videos: [] as { id: string; url: string; posterUrl: string | null }[],
    region: card.regionName ? { id: `demo-r-${slugify(card.regionName)}`, name: card.regionName, slug: slugify(card.regionName), province: null, country: "Argentina", description: null, imageUrl: null, isActive: true } : null,
    regionId: card.regionName ? `demo-r-${slugify(card.regionName)}` : null,
    winery: card.wineryName ? { id: `demo-w-${slugify(card.wineryName)}`, name: card.wineryName, slug: slugify(card.wineryName), story: null, imageUrl: null, isActive: true } : null,
    line: card.lineName ? { id: `demo-l-${slugify(card.lineName)}`, name: card.lineName, slug: slugify(card.lineName), description: null, sortOrder: 0, isActive: true } : null,
    lineId: card.lineName ? `demo-l-${slugify(card.lineName)}` : null,
    category: null,
    grapes: card.grapes.map((name, i) => ({
      productId: card.id,
      grapeId: `demo-g-${slugify(name)}`,
      grape: { id: `demo-g-${slugify(name)}`, name, slug: slugify(name), description: null },
      percent: wine?.grapes[i]?.percent ?? null,
    })),
    pairings: (wine?.pairings ?? []).map((name) => ({
      productId: card.id,
      pairingId: `demo-p-${slugify(name)}`,
      pairing: { id: `demo-p-${slugify(name)}`, name, slug: slugify(name), icon: null },
    })),
    tags: card.tags.map((t) => ({
      productId: card.id,
      tagId: `demo-t-${t.slug}`,
      tag: { id: `demo-t-${t.slug}`, ...t },
    })),
    awards: [] as {
      id: string;
      productId: string;
      title: string;
      organization: string | null;
      year: number | null;
      score: string | null;
    }[],
    availability: {
      available: card.available,
      onHand: card.available,
      reserved: 0,
      minStock: card.minStock,
    } as Availability,
    seoTitle: null as string | null,
    seoDescription: null as string | null,
  };

  if (wine) {
    return {
      ...base,
      description: wine.description ?? null,
      tastingNotes: wine.tastingNotes ?? null,
      servingTempC: wine.servingTempC ?? null,
      agingPotential: wine.agingPotential ?? null,
      alcoholPercent: null as number | null,
      winemaking: null as string | null,
      packItems: [] as ReturnType<typeof packItemsDemo>,
    };
  }

  return {
    ...base,
    description: pack!.description ?? null,
    tastingNotes: null as string | null,
    servingTempC: null as string | null,
    agingPotential: null as string | null,
    alcoholPercent: null as number | null,
    winemaking: null as string | null,
    packItems: packItemsDemo(pack!, base.id),
  };
}

/** Componentes de un pack, resueltos contra el mismo catálogo en memoria. */
function packItemsDemo(pack: (typeof PACKS)[number], packId: string) {
  return pack.components.map((c, i) => {
    const comp = DEMO_PRODUCTS.find((p) => p.slug === c.slug);
    return {
      id: `${packId}-item-${i}`,
      productId: packId,
      componentId: comp?.id ?? `demo-missing-${i}`,
      quantity: c.quantity,
      component: {
        id: comp?.id ?? `demo-missing-${i}`,
        name: comp?.name ?? c.slug,
        slug: c.slug,
        sku: comp?.sku ?? "",
        vintage: null as number | null,
        price: comp?.price ?? 0,
        wineType: comp?.wineType ?? null,
        images: comp?.imageUrl ? [{ url: comp.imageUrl, alt: comp.imageAlt }] : [],
      },
    };
  });
}

/**
 * Conteos de taxonomía para las anotaciones de Terroir (/v4), que muestra
 * cuántas regiones, bodegas y etiquetas hay en catálogo.
 */
export function demoTaxonomy() {
  const regiones = [...new Set(WINES.map((w) => w.region).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), "es"),
  );
  const bodegas = new Set(WINES.map((w) => w.winery).filter(Boolean));

  return {
    regions: regiones.map((name) => ({ name: String(name) })),
    wineryCount: bodegas.size,
    labelCount: WINES.length,
  };
}
