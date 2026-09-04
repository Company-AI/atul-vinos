import { cache } from "react";
import { prisma } from "@/infra/db/prisma";
import { parseBlock, type BlockData, type BlockType } from "./blocks";
import { IS_DEMO } from "@/infra/demo/mode";
import { demoBanners, demoFaqs, demoPageSections, demoSection } from "@/infra/demo/content";

export type Section<T extends BlockType = BlockType> = {
  id: string;
  key: string;
  page: string;
  type: T;
  title: string | null;
  sortOrder: number;
  data: BlockData<T>;
};

/** Todas las secciones activas de una página, ordenadas. */
export const getPageSections = cache(async (page: string): Promise<Section[]> => {
  if (IS_DEMO) return demoPageSections(page);

  const rows = await prisma.cmsSection.findMany({
    where: { page, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    page: row.page,
    type: row.type as BlockType,
    title: row.title,
    sortOrder: row.sortOrder,
    data: parseBlock(row.type as BlockType, row.data),
  }));
});

/** Una sección puntual por clave (ej. "home.hero", "footer.main"). */
export const getSection = cache(
  async <T extends BlockType>(key: string, type: T): Promise<BlockData<T>> => {
    if (IS_DEMO) return parseBlock(type, demoSection(key));

    const row = await prisma.cmsSection.findUnique({ where: { key } });
    return parseBlock(type, row?.isActive === false ? {} : row?.data);
  },
);

export const getActiveBanners = cache(async (position = "top") => {
  if (IS_DEMO) return demoBanners(position);

  const now = new Date();
  return prisma.banner.findMany({
    where: {
      isActive: true,
      position,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { sortOrder: "asc" },
  });
});

export const getFaqs = cache(async (group?: string) =>
  IS_DEMO
    ? demoFaqs(group)
    : prisma.faq.findMany({
    where: { isActive: true, ...(group ? { group } : {}) },
    orderBy: { sortOrder: "asc" },
  }),
);
