import { prisma } from "@/infra/db/prisma";
import { getAvailabilityMap } from "@/domain/inventory/availability";
import { toNumber } from "@/lib/money";

/** Opciones compartidas por el formulario de alta y de edición de productos. */
export async function loadProductFormOptions(excludeProductId?: string) {
  const [categories, wineries, regions, lines, grapes, pairings, tags, wineRows] =
    await Promise.all([
      prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
      prisma.winery.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.wineLine.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
      prisma.grapeVariety.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.pairing.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.productTag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.product.findMany({
        where: {
          kind: "WINE",
          status: { not: "ARCHIVED" },
          ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
        },
        orderBy: { name: "asc" },
        select: { id: true, name: true, sku: true, price: true },
      }),
    ]);

  const availability = await getAvailabilityMap(wineRows.map((w) => w.id));

  return {
    taxonomies: { categories, wineries, regions, lines, grapes, pairings, tags },
    wines: wineRows.map((wine) => ({
      id: wine.id,
      name: wine.name,
      sku: wine.sku,
      price: toNumber(wine.price),
      available: availability.get(wine.id)?.available ?? 0,
    })),
  };
}
