"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { assertPermission } from "@/infra/auth/guards";
import { recordAudit } from "@/domain/audit/service";
import { getStorage } from "@/infra/storage/registry";
import {
  ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES,
} from "@/domain/storage/ports";
import { slugify, uniqueSlug } from "@/lib/slug";

export type ProductActionResult =
  | { ok: true; message: string; productId?: string }
  | { ok: false; error: string };

const WINE_TYPES = ["TINTO", "BLANCO", "ROSADO", "ESPUMANTE", "NARANJO", "DULCE"] as const;
const INTENSITIES = ["LIGERO", "MEDIO", "INTENSO"] as const;
const STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

const productSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(["WINE", "PACK"]).default("WINE"),
  status: z.enum(STATUSES).default("DRAFT"),
  name: z.string().min(2, "Ingresá el nombre."),
  slug: z.string().optional(),
  sku: z.string().min(2, "Ingresá el SKU."),
  shortDescription: z.string().max(300).optional(),
  description: z.string().max(6000).optional(),
  price: z.number().min(0, "El precio no puede ser negativo."),
  compareAtPrice: z.number().min(0).nullable().optional(),
  cost: z.number().min(0).nullable().optional(),
  wineType: z.enum(WINE_TYPES).nullable().optional(),
  vintage: z.number().int().min(1900).max(2100).nullable().optional(),
  volumeMl: z.number().int().min(0).nullable().optional(),
  alcoholPercent: z.number().min(0).max(30).nullable().optional(),
  servingTempC: z.string().max(40).optional(),
  tastingNotes: z.string().max(3000).optional(),
  agingPotential: z.string().max(120).optional(),
  intensity: z.enum(INTENSITIES).nullable().optional(),
  winemaking: z.string().max(3000).optional(),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  seoTitle: z.string().max(120).optional(),
  seoDescription: z.string().max(320).optional(),
  categoryId: z.string().nullable().optional(),
  wineryId: z.string().nullable().optional(),
  regionId: z.string().nullable().optional(),
  lineId: z.string().nullable().optional(),
  grapeIds: z.array(z.string()).default([]),
  pairingIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  minStock: z.number().int().min(0).default(0),
  location: z.string().max(40).optional(),
  packItems: z
    .array(z.object({ componentId: z.string(), quantity: z.number().int().min(1) }))
    .default([]),
  awards: z
    .array(
      z.object({
        title: z.string().min(1),
        organization: z.string().optional(),
        year: z.number().int().min(1900).max(2100).nullable().optional(),
        score: z.string().max(40).optional(),
      }),
    )
    .default([]),
});

export async function saveProduct(
  input: z.input<typeof productSchema>,
): Promise<ProductActionResult> {
  let user;
  try {
    user = await assertPermission("products.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos del producto." };
  }
  const data = parsed.data;

  if (data.kind === "PACK" && data.packItems.length === 0) {
    return { ok: false, error: "Un pack necesita al menos un vino que lo componga." };
  }

  // Cambiar precios exige un permiso propio (spec §55).
  if (data.id) {
    const current = await prisma.product.findUnique({
      where: { id: data.id },
      select: { price: true },
    });
    const priceChanged = current && Number(current.price) !== data.price;
    if (priceChanged) {
      try {
        await assertPermission("products.price");
      } catch {
        return { ok: false, error: "Tu rol no puede modificar precios." };
      }
    }
  }

  const skuOwner = await prisma.product.findUnique({ where: { sku: data.sku.trim() } });
  if (skuOwner && skuOwner.id !== data.id) {
    return { ok: false, error: `El SKU ${data.sku} ya está usado por ${skuOwner.name}.` };
  }

  const slug =
    data.slug?.trim() ||
    (await uniqueSlug(`${data.name}${data.vintage ? ` ${data.vintage}` : ""}`, async (candidate) => {
      const existing = await prisma.product.findUnique({ where: { slug: candidate } });
      return Boolean(existing && existing.id !== data.id);
    }));

  const common = {
    kind: data.kind,
    status: data.status,
    name: data.name.trim(),
    slug: slugify(slug),
    sku: data.sku.trim(),
    shortDescription: data.shortDescription?.trim() || null,
    description: data.description?.trim() || null,
    price: data.price,
    compareAtPrice: data.compareAtPrice ?? null,
    cost: data.cost ?? null,
    wineType: data.kind === "PACK" ? null : data.wineType ?? null,
    vintage: data.vintage ?? null,
    volumeMl: data.volumeMl ?? null,
    alcoholPercent: data.alcoholPercent ?? null,
    servingTempC: data.servingTempC?.trim() || null,
    tastingNotes: data.tastingNotes?.trim() || null,
    agingPotential: data.agingPotential?.trim() || null,
    intensity: data.intensity ?? null,
    winemaking: data.winemaking?.trim() || null,
    featured: data.featured,
    isNew: data.isNew,
    bestSeller: data.bestSeller,
    sortOrder: data.sortOrder,
    seoTitle: data.seoTitle?.trim() || null,
    seoDescription: data.seoDescription?.trim() || null,
    categoryId: data.categoryId || null,
    wineryId: data.wineryId || null,
    regionId: data.regionId || null,
    lineId: data.lineId || null,
  };

  try {
    const productId = await prisma.$transaction(async (tx) => {
      const before = data.id
        ? await tx.product.findUnique({ where: { id: data.id }, select: { price: true, name: true } })
        : null;

      const product = data.id
        ? await tx.product.update({ where: { id: data.id }, data: common })
        : await tx.product.create({ data: common });

      // Taxonomías: se reemplazan por completo, es más simple y predecible.
      await tx.productGrape.deleteMany({ where: { productId: product.id } });
      await tx.productPairing.deleteMany({ where: { productId: product.id } });
      await tx.productTagLink.deleteMany({ where: { productId: product.id } });

      if (data.grapeIds.length) {
        await tx.productGrape.createMany({
          data: data.grapeIds.map((grapeId) => ({ productId: product.id, grapeId })),
        });
      }
      if (data.pairingIds.length) {
        await tx.productPairing.createMany({
          data: data.pairingIds.map((pairingId) => ({ productId: product.id, pairingId })),
        });
      }
      if (data.tagIds.length) {
        await tx.productTagLink.createMany({
          data: data.tagIds.map((tagId) => ({ productId: product.id, tagId })),
        });
      }

      // Premios: se reemplazan por completo.
      await tx.award.deleteMany({ where: { productId: product.id } });
      if (data.awards.length) {
        await tx.award.createMany({
          data: data.awards.map((award) => ({
            productId: product.id,
            title: award.title.trim(),
            organization: award.organization?.trim() || null,
            year: award.year ?? null,
            score: award.score?.trim() || null,
          })),
        });
      }

      // Inventario: solo los vinos tienen stock propio.
      if (data.kind === "WINE") {
        await tx.inventory.upsert({
          where: { productId: product.id },
          create: {
            productId: product.id,
            onHand: 0,
            minStock: data.minStock,
            location: data.location?.trim() || null,
          },
          update: { minStock: data.minStock, location: data.location?.trim() || null },
        });
      }

      // Composición del pack.
      if (data.kind === "PACK") {
        await tx.packItem.deleteMany({ where: { packId: product.id } });
        await tx.packItem.createMany({
          data: data.packItems.map((item) => ({
            packId: product.id,
            componentId: item.componentId,
            quantity: item.quantity,
          })),
        });
      }

      await recordAudit(user, {
        action: data.id
          ? before && Number(before.price) !== data.price
            ? "product.price.update"
            : "product.update"
          : "product.create",
        entityType: "Product",
        entityId: product.id,
        before: before ? { price: Number(before.price), name: before.name } : undefined,
        after: { price: data.price, name: data.name },
      });

      return product.id;
    });

    revalidatePath("/admin/productos");
    revalidatePath(`/admin/productos/${productId}`);
    revalidatePath("/vinos");
    return {
      ok: true,
      message: data.id ? "Producto actualizado." : "Producto creado.",
      productId,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No pudimos guardar el producto.",
    };
  }
}

export async function archiveProduct(productId: string): Promise<ProductActionResult> {
  let user;
  try {
    user = await assertPermission("products.delete");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const usedInPacks = await prisma.packItem.count({ where: { componentId: productId } });
  if (usedInPacks > 0) {
    return {
      ok: false,
      error: "Este vino forma parte de un pack. Quitalo del pack antes de archivarlo.",
    };
  }

  await prisma.product.update({
    where: { id: productId },
    data: { status: "ARCHIVED", archivedAt: new Date(), featured: false, isNew: false, bestSeller: false },
  });

  await recordAudit(user, {
    action: "product.archive",
    entityType: "Product",
    entityId: productId,
    after: { status: "ARCHIVED" },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/vinos");
  return { ok: true, message: "Producto archivado. Ya no se muestra en la tienda." };
}

/** Subida de imágenes con validación de tipo y tamaño. */
export async function uploadProductMedia(formData: FormData): Promise<ProductActionResult> {
  let user;
  try {
    user = await assertPermission("products.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const productId = String(formData.get("productId") ?? "");
  const kind = String(formData.get("kind") ?? "image");
  const file = formData.get("file");

  if (!productId) return { ok: false, error: "Falta el producto." };
  if (!(file instanceof File)) return { ok: false, error: "Elegí un archivo." };

  const isVideo = kind === "video";
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `El archivo supera el máximo de ${Math.round(maxBytes / 1024 / 1024)} MB.`,
    };
  }
  if (!isVideo && !ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return { ok: false, error: "Formato no permitido. Usá JPG, PNG, WebP o AVIF." };
  }
  if (isVideo && !file.type.startsWith("video/")) {
    return { ok: false, error: "El archivo no es un video." };
  }

  const storage = getStorage();
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const body = Buffer.from(await file.arrayBuffer());

  const stored = await storage.put({
    folder: `productos/${productId}`,
    filename: `${nanoid(10)}.${extension}`,
    contentType: file.type,
    body,
  });

  if (isVideo) {
    await prisma.productVideo.create({
      data: { productId, url: stored.url, label: file.name },
    });
  } else {
    const count = await prisma.productImage.count({ where: { productId } });
    await prisma.productImage.create({
      data: {
        productId,
        url: stored.url,
        alt: null,
        isPrimary: count === 0,
        sortOrder: count,
      },
    });
  }

  await recordAudit(user, {
    action: "product.update",
    entityType: "Product",
    entityId: productId,
    after: { media: stored.key },
  });

  revalidatePath(`/admin/productos/${productId}`);
  return { ok: true, message: isVideo ? "Video subido." : "Imagen subida." };
}

export async function updateProductImages(input: {
  productId: string;
  images: { id: string; sortOrder: number; alt: string; isPrimary: boolean }[];
}): Promise<ProductActionResult> {
  try {
    await assertPermission("products.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  await prisma.$transaction(
    input.images.map((image) =>
      prisma.productImage.update({
        where: { id: image.id },
        data: {
          sortOrder: image.sortOrder,
          alt: image.alt.trim() || null,
          isPrimary: image.isPrimary,
        },
      }),
    ),
  );

  revalidatePath(`/admin/productos/${input.productId}`);
  revalidatePath("/vinos");
  return { ok: true, message: "Galería actualizada." };
}

export async function deleteProductImage(imageId: string): Promise<ProductActionResult> {
  try {
    await assertPermission("products.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return { ok: false, error: "La imagen ya no existe." };

  await prisma.productImage.delete({ where: { id: imageId } });

  // Si borramos la principal, asciende la siguiente.
  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({
      where: { productId: image.productId },
      orderBy: { sortOrder: "asc" },
    });
    if (next) {
      await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
  }

  if (image.url.startsWith("/uploads/")) {
    await getStorage().delete(image.url.slice(1));
  }

  revalidatePath(`/admin/productos/${image.productId}`);
  return { ok: true, message: "Imagen eliminada." };
}
