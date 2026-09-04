import { cache } from "react";
import type { Prisma, WineIntensity, WineType } from "@prisma/client";
import { prisma } from "@/infra/db/prisma";
import { IS_DEMO } from "@/infra/demo/mode";
import {
  demoFilterOptions,
  demoListProducts,
  demoProductDetail,
} from "@/infra/demo/catalog";
import { getAvailabilityMap } from "@/domain/inventory/availability";
import { toNumber } from "@/lib/money";
import type { CatalogFilters, CatalogSort, ProductCard } from "./types";

const cardSelect = {
  id: true, slug: true, name: true, sku: true, kind: true,
  price: true, compareAtPrice: true, shortDescription: true,
  wineType: true, vintage: true, volumeMl: true, intensity: true,
  featured: true, isNew: true, bestSeller: true,
  images: {
    where: { isPrimary: true }, take: 1,
    select: { url: true, alt: true },
  },
  region: { select: { name: true } },
  winery: { select: { name: true } },
  line: { select: { name: true } },
  grapes: { select: { grape: { select: { name: true } } } },
  tags: { select: { tag: { select: { name: true, slug: true } } } },
  packItems: { select: { quantity: true } },
} satisfies Prisma.ProductSelect;

type ProductRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard(row: ProductRow, available: number, minStock: number): ProductCard {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    kind: row.kind,
    price: toNumber(row.price),
    compareAtPrice: row.compareAtPrice ? toNumber(row.compareAtPrice) : null,
    imageUrl: row.images[0]?.url ?? null,
    imageAlt: row.images[0]?.alt ?? row.name,
    wineType: row.wineType,
    vintage: row.vintage,
    volumeMl: row.volumeMl,
    intensity: row.intensity,
    regionName: row.region?.name ?? null,
    wineryName: row.winery?.name ?? null,
    lineName: row.line?.name ?? null,
    grapes: row.grapes.map((g) => g.grape.name),
    tags: row.tags.map((t) => t.tag),
    shortDescription: row.shortDescription,
    featured: row.featured,
    isNew: row.isNew,
    bestSeller: row.bestSeller,
    available,
    minStock,
    bottleCount: row.kind === "PACK"
      ? row.packItems.reduce((acc, i) => acc + i.quantity, 0)
      : null,
  };
}

function buildWhere(filters: CatalogFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.q) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tastingNotes: { contains: q, mode: "insensitive" } },
        { region: { name: { contains: q, mode: "insensitive" } } },
        { winery: { name: { contains: q, mode: "insensitive" } } },
        { line: { name: { contains: q, mode: "insensitive" } } },
        { grapes: { some: { grape: { name: { contains: q, mode: "insensitive" } } } } },
      ],
    });
  }

  if (filters.tipo?.length) {
    and.push({ wineType: { in: filters.tipo as WineType[] } });
  }
  if (filters.intensidad?.length) {
    and.push({ intensity: { in: filters.intensidad as WineIntensity[] } });
  }
  if (filters.varietal?.length) {
    and.push({ grapes: { some: { grape: { slug: { in: filters.varietal } } } } });
  }
  if (filters.maridaje?.length) {
    and.push({ pairings: { some: { pairing: { slug: { in: filters.maridaje } } } } });
  }
  if (filters.region?.length) and.push({ region: { slug: { in: filters.region } } });
  if (filters.bodega?.length) and.push({ winery: { slug: { in: filters.bodega } } });
  if (filters.linea?.length) and.push({ line: { slug: { in: filters.linea } } });
  if (filters.cosecha?.length) and.push({ vintage: { in: filters.cosecha } });
  if (filters.precioMin !== undefined) and.push({ price: { gte: filters.precioMin } });
  if (filters.precioMax !== undefined) and.push({ price: { lte: filters.precioMax } });
  if (filters.soloPacks) and.push({ kind: "PACK" });
  if (filters.sinPacks) and.push({ kind: "WINE" });
  if (filters.destacados) and.push({ featured: true });
  if (filters.novedades) and.push({ isNew: true });

  if (and.length) where.AND = and;
  return where;
}

function buildOrderBy(sort: CatalogSort = "destacados"): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "precio-menor": return [{ price: "asc" }, { name: "asc" }];
    case "precio-mayor": return [{ price: "desc" }, { name: "asc" }];
    case "mas-vendidos": return [{ bestSeller: "desc" }, { featured: "desc" }, { name: "asc" }];
    case "novedades": return [{ isNew: "desc" }, { createdAt: "desc" }];
    default: return [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }];
  }
}

export type CatalogPage = {
  items: ProductCard[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export async function listProducts(filters: CatalogFilters = {}): Promise<CatalogPage> {
  if (IS_DEMO) return demoListProducts(filters);

  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(48, filters.perPage ?? 12);
  const where = buildWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: cardSelect,
      orderBy: buildOrderBy(filters.orden),
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  const availability = await getAvailabilityMap(rows.map((r) => r.id));

  return {
    items: rows.map((row) => {
      const a = availability.get(row.id);
      return toCard(row, a?.available ?? 0, a?.minStock ?? 0);
    }),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** Vinos para los bloques de la home (destacados, novedades, más vendidos, línea). */
export const getShowcaseProducts = cache(
  async (
    source: "featured" | "new" | "bestSellers" | "line",
    limit = 4,
    lineSlug?: string,
  ): Promise<ProductCard[]> => {
    const filters: CatalogFilters = { perPage: limit, sinPacks: false };
    if (source === "featured") { filters.destacados = true; filters.orden = "destacados"; }
    if (source === "new") { filters.novedades = true; filters.orden = "novedades"; }
    if (source === "bestSellers") filters.orden = "mas-vendidos";
    if (source === "line" && lineSlug) filters.linea = [lineSlug];
    const { items } = await listProducts(filters);
    return items;
  },
);

export const getProductDetail = cache(async (slug: string) => {
  if (IS_DEMO) return demoProductDetail(slug);

  const product = await prisma.product.findFirst({
    where: { slug, status: { not: "ARCHIVED" } },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      videos: true,
      region: true,
      winery: true,
      line: true,
      category: true,
      grapes: { include: { grape: true } },
      pairings: { include: { pairing: true } },
      tags: { include: { tag: true } },
      awards: { orderBy: { year: "desc" } },
      inventory: true,
      packItems: {
        include: {
          component: {
            select: {
              id: true, name: true, slug: true, sku: true, vintage: true, price: true,
              wineType: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
            },
          },
        },
      },
    },
  });
  if (!product) return null;

  const availability = await getAvailabilityMap([product.id]);
  return {
    ...product,
    price: toNumber(product.price),
    compareAtPrice: product.compareAtPrice ? toNumber(product.compareAtPrice) : null,
    alcoholPercent: product.alcoholPercent ? toNumber(product.alcoholPercent) : null,
    availability: availability.get(product.id) ?? { available: 0, onHand: 0, reserved: 0, minStock: 0 },
    packItems: product.packItems.map((pi) => ({
      ...pi,
      component: { ...pi.component, price: toNumber(pi.component.price) },
    })),
  };
});

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductDetail>>>;

/** "También te puede gustar": misma región/varietal/línea, excluyendo el actual. */
export async function getRelatedProducts(
  productId: string,
  opts: { regionId?: string | null; lineId?: string | null; grapeIds?: string[] },
  limit = 4,
): Promise<ProductCard[]> {
  const rows = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      id: { not: productId },
      OR: [
        ...(opts.regionId ? [{ regionId: opts.regionId }] : []),
        ...(opts.lineId ? [{ lineId: opts.lineId }] : []),
        ...(opts.grapeIds?.length
          ? [{ grapes: { some: { grapeId: { in: opts.grapeIds } } } }]
          : []),
      ],
    },
    select: cardSelect,
    orderBy: [{ featured: "desc" }, { bestSeller: "desc" }],
    take: limit,
  });

  const availability = await getAvailabilityMap(rows.map((r) => r.id));
  return rows.map((row) => {
    const a = availability.get(row.id);
    return toCard(row, a?.available ?? 0, a?.minStock ?? 0);
  });
}

/** Cross-selling del carrito: vinos que no están en el carrito. */
export async function getCrossSellProducts(
  excludeIds: string[],
  limit = 3,
): Promise<ProductCard[]> {
  const rows = await prisma.product.findMany({
    where: { status: "ACTIVE", kind: "WINE", id: { notIn: excludeIds.length ? excludeIds : ["-"] } },
    select: cardSelect,
    orderBy: [{ bestSeller: "desc" }, { featured: "desc" }],
    take: limit,
  });
  const availability = await getAvailabilityMap(rows.map((r) => r.id));
  return rows
    .map((row) => {
      const a = availability.get(row.id);
      return toCard(row, a?.available ?? 0, a?.minStock ?? 0);
    })
    .filter((p) => p.available > 0);
}

/** Opciones para el panel de filtros, con conteo real de productos activos. */
export const getFilterOptions = cache(async () => {
  if (IS_DEMO) return demoFilterOptions();

  const [types, grapes, regions, wineries, lines, pairings, vintages, priceRange] =
    await Promise.all([
      prisma.product.groupBy({
        by: ["wineType"],
        where: { status: "ACTIVE", wineType: { not: null } },
        _count: { _all: true },
      }),
      prisma.grapeVariety.findMany({
        where: { products: { some: { product: { status: "ACTIVE" } } } },
        select: { name: true, slug: true, _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.region.findMany({
        where: { products: { some: { status: "ACTIVE" } } },
        select: { name: true, slug: true, province: true, _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.winery.findMany({
        where: { products: { some: { status: "ACTIVE" } } },
        select: { name: true, slug: true, _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.wineLine.findMany({
        where: { products: { some: { status: "ACTIVE" } } },
        select: { name: true, slug: true, _count: { select: { products: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.pairing.findMany({
        where: { products: { some: { product: { status: "ACTIVE" } } } },
        select: { name: true, slug: true, _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE", vintage: { not: null } },
        distinct: ["vintage"],
        select: { vintage: true },
        orderBy: { vintage: "desc" },
      }),
      prisma.product.aggregate({
        where: { status: "ACTIVE" },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

  return {
    types: types.map((t) => ({ value: t.wineType!, count: t._count._all })),
    grapes: grapes.map((g) => ({ name: g.name, slug: g.slug, count: g._count.products })),
    regions: regions.map((r) => ({ name: r.name, slug: r.slug, province: r.province, count: r._count.products })),
    wineries: wineries.map((w) => ({ name: w.name, slug: w.slug, count: w._count.products })),
    lines: lines.map((l) => ({ name: l.name, slug: l.slug, count: l._count.products })),
    pairings: pairings.map((p) => ({ name: p.name, slug: p.slug, count: p._count.products })),
    vintages: vintages.map((v) => v.vintage!).filter(Boolean),
    priceMin: Math.floor(toNumber(priceRange._min.price) / 1000) * 1000,
    priceMax: Math.ceil(toNumber(priceRange._max.price) / 1000) * 1000,
  };
});

export type FilterOptions = Awaited<ReturnType<typeof getFilterOptions>>;
