import { NextResponse } from "next/server";
import { prisma } from "@/infra/db/prisma";
import { listProducts } from "@/domain/catalog/service";

/** Buscador global: vinos, varietales, regiones, bodegas, líneas y artículos. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ products: [], posts: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const [{ items }, posts] = await Promise.all([
    listProducts({ q, perPage: 6 }),
    prisma.post.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { excerpt: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { title: true, slug: true, excerpt: true },
      take: 3,
    }),
  ]);

  return NextResponse.json(
    {
      products: items.map((p) => ({
        slug: p.slug, name: p.name, vintage: p.vintage, price: p.price,
        imageUrl: p.imageUrl, wineryName: p.wineryName, regionName: p.regionName,
        kind: p.kind, available: p.available,
      })),
      posts,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
