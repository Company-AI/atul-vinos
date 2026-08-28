"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/infra/db/prisma";
import { getSession } from "@/infra/auth/session";

export async function toggleFavorite(
  productId: string,
): Promise<{ ok: true; isFavorite: boolean } | { ok: false; error: string; needsAuth?: boolean }> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Ingresá a tu cuenta para guardar favoritos.", needsAuth: true };
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: session.userId, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { userId_productId: { userId: session.userId, productId } },
    });
    revalidatePath("/mi-cuenta/favoritos");
    return { ok: true, isFavorite: false };
  }

  await prisma.favorite.create({ data: { userId: session.userId, productId } });
  revalidatePath("/mi-cuenta/favoritos");
  return { ok: true, isFavorite: true };
}

export async function getFavoriteIds(): Promise<Set<string>> {
  const session = await getSession();
  if (!session) return new Set();
  const rows = await prisma.favorite.findMany({
    where: { userId: session.userId },
    select: { productId: true },
  });
  return new Set(rows.map((r) => r.productId));
}
