"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { assertPermission } from "@/infra/auth/guards";
import { recordAudit } from "@/domain/audit/service";
import { slugify } from "@/lib/slug";

/**
 * Bodegas y regiones del catálogo.
 *
 * El formulario de productos las ofrece como listas desplegables, así que sin
 * esta pantalla no había forma de cargar un vino de una provincia nueva sin
 * tocar la base a mano.
 */

export type TaxonomyResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; error: string };

const winerySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Ingresá el nombre de la bodega."),
  slug: z.string().optional(),
  story: z.string().max(4000).optional(),
  imageUrl: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

const regionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Ingresá el nombre de la región."),
  slug: z.string().optional(),
  province: z.string().max(120).optional(),
  country: z.string().max(120).default("Argentina"),
  description: z.string().max(4000).optional(),
  imageUrl: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

/** El slug se usa en los filtros públicos (?bodega=…), así que debe ser único. */
async function uniqueSlug(
  table: "winery" | "region",
  preferred: string,
  currentId?: string,
): Promise<string> {
  const base = slugify(preferred) || "sin-nombre";
  let candidate = base;

  for (let i = 2; i < 60; i += 1) {
    const found =
      table === "winery"
        ? await prisma.winery.findUnique({ where: { slug: candidate }, select: { id: true } })
        : await prisma.region.findUnique({ where: { slug: candidate }, select: { id: true } });

    if (!found || found.id === currentId) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

function revalidateCatalog() {
  // El catálogo público y el formulario de productos leen estas listas.
  revalidatePath("/admin/bodegas");
  revalidatePath("/admin/regiones");
  revalidatePath("/admin/productos");
  revalidatePath("/vinos");
}

export async function saveWinery(input: z.input<typeof winerySchema>): Promise<TaxonomyResult> {
  let user;
  try {
    user = await assertPermission("products.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const parsed = winerySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }
  const data = parsed.data;
  const name = data.name.trim();

  const before = data.id
    ? await prisma.winery.findUnique({ where: { id: data.id } })
    : null;
  if (data.id && !before) return { ok: false, error: "No encontramos esa bodega." };

  const slug = await uniqueSlug("winery", data.slug?.trim() || name, data.id);

  const winery = await prisma.winery.upsert({
    where: { id: data.id ?? "nuevo" },
    create: {
      name,
      slug,
      story: data.story?.trim() || null,
      imageUrl: data.imageUrl?.trim() || null,
      isActive: data.isActive,
    },
    update: {
      name,
      slug,
      story: data.story?.trim() || null,
      imageUrl: data.imageUrl?.trim() || null,
      isActive: data.isActive,
    },
  });

  await recordAudit(user, {
    action: data.id ? "winery.update" : "winery.create",
    entityType: "Winery",
    entityId: winery.id,
    before: before ? { name: before.name, slug: before.slug, isActive: before.isActive } : undefined,
    after: { name, slug, isActive: data.isActive },
  });

  revalidateCatalog();
  return { ok: true, message: data.id ? "Bodega actualizada." : "Bodega creada.", id: winery.id };
}

export async function saveRegion(input: z.input<typeof regionSchema>): Promise<TaxonomyResult> {
  let user;
  try {
    user = await assertPermission("products.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const parsed = regionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }
  const data = parsed.data;
  const name = data.name.trim();

  const before = data.id ? await prisma.region.findUnique({ where: { id: data.id } }) : null;
  if (data.id && !before) return { ok: false, error: "No encontramos esa región." };

  const slug = await uniqueSlug("region", data.slug?.trim() || name, data.id);

  const payload = {
    name,
    slug,
    province: data.province?.trim() || null,
    country: data.country?.trim() || "Argentina",
    description: data.description?.trim() || null,
    imageUrl: data.imageUrl?.trim() || null,
    isActive: data.isActive,
  };

  const region = await prisma.region.upsert({
    where: { id: data.id ?? "nuevo" },
    create: payload,
    update: payload,
  });

  await recordAudit(user, {
    action: data.id ? "region.update" : "region.create",
    entityType: "Region",
    entityId: region.id,
    before: before
      ? { name: before.name, slug: before.slug, province: before.province, isActive: before.isActive }
      : undefined,
    after: { name, slug, province: payload.province, isActive: data.isActive },
  });

  revalidateCatalog();
  return { ok: true, message: data.id ? "Región actualizada." : "Región creada.", id: region.id };
}

/**
 * Baja de bodega o región.
 *
 * Nunca se borra algo que tenga productos colgando: dejaría fichas sin
 * procedencia y filtros públicos apuntando al vacío. En ese caso se desactiva,
 * que la saca de los desplegables sin tocar el histórico.
 */
export async function deleteTaxonomy(
  kind: "winery" | "region",
  id: string,
): Promise<TaxonomyResult> {
  let user;
  try {
    user = await assertPermission("products.delete");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const enUso = await prisma.product.count({
    where: kind === "winery" ? { wineryId: id } : { regionId: id },
  });

  if (enUso > 0) {
    const queHace = kind === "winery" ? "bodega" : "región";
    return {
      ok: false,
      error: `Esa ${queHace} tiene ${enUso} ${enUso === 1 ? "producto" : "productos"} asociados. Desactivala en lugar de borrarla: sale de los desplegables y las fichas mantienen su procedencia.`,
    };
  }

  const before =
    kind === "winery"
      ? await prisma.winery.findUnique({ where: { id } })
      : await prisma.region.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "No encontramos ese registro." };

  if (kind === "winery") await prisma.winery.delete({ where: { id } });
  else await prisma.region.delete({ where: { id } });

  await recordAudit(user, {
    action: kind === "winery" ? "winery.delete" : "region.delete",
    entityType: kind === "winery" ? "Winery" : "Region",
    entityId: id,
    before: { name: before.name, slug: before.slug },
  });

  revalidateCatalog();
  return { ok: true, message: kind === "winery" ? "Bodega eliminada." : "Región eliminada." };
}
