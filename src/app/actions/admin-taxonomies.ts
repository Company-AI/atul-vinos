"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { assertPermission } from "@/infra/auth/guards";
import { recordAudit } from "@/domain/audit/service";
import { slugify } from "@/lib/slug";
import { TAXONOMIES, type TaxonomyKind } from "@/domain/catalog/taxonomy-kinds";

/**
 * Alta, edición y baja de las clasificaciones del catálogo.
 *
 * Las siete listas —categorías, varietales, maridajes, líneas, etiquetas,
 * bodegas y regiones— se administran con las mismas tres operaciones. Lo único
 * que cambia es a qué columnas va a parar cada campo, y eso vive en los
 * adaptadores de abajo: un objeto por tabla, cada uno con su consulta tipada.
 *
 * Antes sólo había bodegas y regiones, cada una con su función. Con siete
 * listas eso eran veintiún funciones casi iguales.
 */

export type TaxonomyResult =
  | { ok: true; message: string; id?: string; name?: string }
  | { ok: false; error: string };

const schema = z.object({
  kind: z.enum(["category", "grape", "pairing", "line", "tag", "winery", "region"]),
  id: z.string().optional(),
  name: z.string().min(2, "El nombre necesita al menos dos letras."),
  slug: z.string().optional(),
  text: z.string().max(4000).optional(),
  imageUrl: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  province: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  color: z.string().max(40).optional(),
  icon: z.string().max(80).optional(),
});

export type TaxonomyInput = z.input<typeof schema>;

/** El borrador ya normalizado, antes de repartirse en las columnas de cada tabla. */
type Datos = {
  name: string;
  slug: string;
  text: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  province: string | null;
  country: string;
  color: string | null;
  icon: string | null;
};

type Fila = { id: string; name: string; slug: string };

type Adaptador = {
  porSlug(slug: string): Promise<{ id: string } | null>;
  porId(id: string): Promise<Fila | null>;
  crear(d: Datos): Promise<Fila>;
  actualizar(id: string, d: Datos): Promise<Fila>;
  borrar(id: string): Promise<unknown>;
  /** Cuántos productos quedarían sin esta clasificación si se borrara. */
  enUso(id: string): Promise<number>;
};

const seleccion = { id: true, name: true, slug: true } as const;

const ADAPTADORES: Record<TaxonomyKind, Adaptador> = {
  category: {
    porSlug: (slug) => prisma.category.findUnique({ where: { slug }, select: { id: true } }),
    porId: (id) => prisma.category.findUnique({ where: { id }, select: seleccion }),
    crear: (d) =>
      prisma.category.create({
        data: {
          name: d.name,
          slug: d.slug,
          description: d.text,
          imageUrl: d.imageUrl,
          sortOrder: d.sortOrder,
          isActive: d.isActive,
        },
        select: seleccion,
      }),
    actualizar: (id, d) =>
      prisma.category.update({
        where: { id },
        data: {
          name: d.name,
          slug: d.slug,
          description: d.text,
          imageUrl: d.imageUrl,
          sortOrder: d.sortOrder,
          isActive: d.isActive,
        },
        select: seleccion,
      }),
    borrar: (id) => prisma.category.delete({ where: { id } }),
    enUso: (id) => prisma.product.count({ where: { categoryId: id } }),
  },

  grape: {
    porSlug: (slug) => prisma.grapeVariety.findUnique({ where: { slug }, select: { id: true } }),
    porId: (id) => prisma.grapeVariety.findUnique({ where: { id }, select: seleccion }),
    crear: (d) =>
      prisma.grapeVariety.create({
        data: { name: d.name, slug: d.slug, description: d.text, isActive: d.isActive },
        select: seleccion,
      }),
    actualizar: (id, d) =>
      prisma.grapeVariety.update({
        where: { id },
        data: { name: d.name, slug: d.slug, description: d.text, isActive: d.isActive },
        select: seleccion,
      }),
    borrar: (id) => prisma.grapeVariety.delete({ where: { id } }),
    enUso: (id) => prisma.productGrape.count({ where: { grapeId: id } }),
  },

  pairing: {
    porSlug: (slug) => prisma.pairing.findUnique({ where: { slug }, select: { id: true } }),
    porId: (id) => prisma.pairing.findUnique({ where: { id }, select: seleccion }),
    crear: (d) =>
      prisma.pairing.create({
        data: { name: d.name, slug: d.slug, icon: d.icon },
        select: seleccion,
      }),
    actualizar: (id, d) =>
      prisma.pairing.update({
        where: { id },
        data: { name: d.name, slug: d.slug, icon: d.icon },
        select: seleccion,
      }),
    borrar: (id) => prisma.pairing.delete({ where: { id } }),
    enUso: (id) => prisma.productPairing.count({ where: { pairingId: id } }),
  },

  line: {
    porSlug: (slug) => prisma.wineLine.findUnique({ where: { slug }, select: { id: true } }),
    porId: (id) => prisma.wineLine.findUnique({ where: { id }, select: seleccion }),
    crear: (d) =>
      prisma.wineLine.create({
        data: {
          name: d.name,
          slug: d.slug,
          description: d.text,
          imageUrl: d.imageUrl,
          sortOrder: d.sortOrder,
          isActive: d.isActive,
        },
        select: seleccion,
      }),
    actualizar: (id, d) =>
      prisma.wineLine.update({
        where: { id },
        data: {
          name: d.name,
          slug: d.slug,
          description: d.text,
          imageUrl: d.imageUrl,
          sortOrder: d.sortOrder,
          isActive: d.isActive,
        },
        select: seleccion,
      }),
    borrar: (id) => prisma.wineLine.delete({ where: { id } }),
    enUso: (id) => prisma.product.count({ where: { lineId: id } }),
  },

  tag: {
    porSlug: (slug) => prisma.productTag.findUnique({ where: { slug }, select: { id: true } }),
    porId: (id) => prisma.productTag.findUnique({ where: { id }, select: seleccion }),
    crear: (d) =>
      prisma.productTag.create({
        data: { name: d.name, slug: d.slug, color: d.color },
        select: seleccion,
      }),
    actualizar: (id, d) =>
      prisma.productTag.update({
        where: { id },
        data: { name: d.name, slug: d.slug, color: d.color },
        select: seleccion,
      }),
    borrar: (id) => prisma.productTag.delete({ where: { id } }),
    enUso: (id) => prisma.productTagLink.count({ where: { tagId: id } }),
  },

  winery: {
    porSlug: (slug) => prisma.winery.findUnique({ where: { slug }, select: { id: true } }),
    porId: (id) => prisma.winery.findUnique({ where: { id }, select: seleccion }),
    crear: (d) =>
      prisma.winery.create({
        data: {
          name: d.name,
          slug: d.slug,
          story: d.text,
          imageUrl: d.imageUrl,
          isActive: d.isActive,
        },
        select: seleccion,
      }),
    actualizar: (id, d) =>
      prisma.winery.update({
        where: { id },
        data: {
          name: d.name,
          slug: d.slug,
          story: d.text,
          imageUrl: d.imageUrl,
          isActive: d.isActive,
        },
        select: seleccion,
      }),
    borrar: (id) => prisma.winery.delete({ where: { id } }),
    enUso: (id) => prisma.product.count({ where: { wineryId: id } }),
  },

  region: {
    porSlug: (slug) => prisma.region.findUnique({ where: { slug }, select: { id: true } }),
    porId: (id) => prisma.region.findUnique({ where: { id }, select: seleccion }),
    crear: (d) =>
      prisma.region.create({
        data: {
          name: d.name,
          slug: d.slug,
          province: d.province,
          country: d.country,
          description: d.text,
          imageUrl: d.imageUrl,
          isActive: d.isActive,
        },
        select: seleccion,
      }),
    actualizar: (id, d) =>
      prisma.region.update({
        where: { id },
        data: {
          name: d.name,
          slug: d.slug,
          province: d.province,
          country: d.country,
          description: d.text,
          imageUrl: d.imageUrl,
          isActive: d.isActive,
        },
        select: seleccion,
      }),
    borrar: (id) => prisma.region.delete({ where: { id } }),
    enUso: (id) => prisma.product.count({ where: { regionId: id } }),
  },
};

/** El slug viaja en la URL de los filtros públicos, así que no puede repetirse. */
async function slugLibre(kind: TaxonomyKind, preferido: string, idActual?: string) {
  const base = slugify(preferido) || "sin-nombre";
  let candidato = base;

  for (let i = 2; i < 60; i += 1) {
    const existente = await ADAPTADORES[kind].porSlug(candidato);
    if (!existente || existente.id === idActual) return candidato;
    candidato = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/*
  "Varietal creado" pero "Bodega creada". El género sale del artículo que ya
  declara cada lista, así que no hay un segundo lugar donde equivocarse.
*/
function aviso(kind: TaxonomyKind, participio: "cread" | "actualizad" | "eliminad") {
  const { singular, articulo } = TAXONOMIES[kind];
  const nombre = singular[0].toUpperCase() + singular.slice(1);
  return `${nombre} ${participio}${articulo === "la" ? "a" : "o"}.`;
}

const esDuplicado = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2002";

function revalidar() {
  // La pantalla, el formulario de productos y los filtros públicos leen estas listas.
  revalidatePath("/admin/clasificacion");
  revalidatePath("/admin/productos");
  revalidatePath("/vinos");
}

export async function saveTaxonomy(input: TaxonomyInput): Promise<TaxonomyResult> {
  let user;
  try {
    user = await assertPermission("products.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }

  const { kind, id } = parsed.data;
  const config = TAXONOMIES[kind];
  const adaptador = ADAPTADORES[kind];

  const anterior = id ? await adaptador.porId(id) : null;
  if (id && !anterior) return { ok: false, error: `No encontramos esa ${config.singular}.` };

  const name = parsed.data.name.trim();
  const limpio = (valor: string | undefined) => valor?.trim() || null;

  const datos: Datos = {
    name,
    slug: await slugLibre(kind, parsed.data.slug?.trim() || name, id),
    text: limpio(parsed.data.text),
    imageUrl: limpio(parsed.data.imageUrl),
    isActive: parsed.data.isActive,
    sortOrder: parsed.data.sortOrder,
    province: limpio(parsed.data.province),
    country: parsed.data.country?.trim() || "Argentina",
    color: limpio(parsed.data.color),
    icon: limpio(parsed.data.icon),
  };

  let fila: Fila;
  try {
    fila = id ? await adaptador.actualizar(id, datos) : await adaptador.crear(datos);
  } catch (error) {
    /*
      Varietales, maridajes y etiquetas tienen el nombre único en la base. El
      slug ya se resolvió más arriba, así que un choque acá es siempre un
      nombre repetido.
    */
    if (esDuplicado(error)) {
      return { ok: false, error: `Ya existe ${config.articulo} ${config.singular} «${name}».` };
    }
    throw error;
  }

  await recordAudit(user, {
    action: id ? `${kind}.update` : `${kind}.create`,
    entityType: kind,
    entityId: fila.id,
    before: anterior ? { name: anterior.name, slug: anterior.slug } : undefined,
    after: { name: fila.name, slug: fila.slug },
  });

  revalidar();
  return {
    ok: true,
    id: fila.id,
    name: fila.name,
    message: aviso(kind, id ? "actualizad" : "cread"),
  };
}

/**
 * Baja de una clasificación.
 *
 * Nunca se borra algo que tenga productos colgando. En las listas que se
 * pueden desactivar esa es la salida —sale de los desplegables y de los
 * filtros, y las fichas ya cargadas no se tocan—. En las que no, hay que
 * sacarla de los productos primero: borrarla directamente arrastraría las
 * asignaciones sin avisar.
 */
export async function deleteTaxonomy(
  kind: TaxonomyKind,
  id: string,
): Promise<TaxonomyResult> {
  let user;
  try {
    user = await assertPermission("products.delete");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const config = TAXONOMIES[kind];
  const adaptador = ADAPTADORES[kind];

  const cuantos = await adaptador.enUso(id);
  if (cuantos > 0) {
    const productos = `${cuantos} ${cuantos === 1 ? "producto" : "productos"}`;
    /* El imperativo con pronombre pegado pierde la tilde: desactivá → desactivala. */
    const la = config.articulo === "la" ? "la" : "lo";
    return {
      ok: false,
      error: config.conEstado
        ? `Está en ${productos}. Desactiva${la} en lugar de borrar${la}: sale de los desplegables y las fichas no se tocan.`
        : `Está en ${productos}. Saca${la} de esos productos y después borra${la}.`,
    };
  }

  const anterior = await adaptador.porId(id);
  if (!anterior) return { ok: false, error: "No encontramos ese registro." };

  await adaptador.borrar(id);

  await recordAudit(user, {
    action: `${kind}.delete`,
    entityType: kind,
    entityId: id,
    before: { name: anterior.name, slug: anterior.slug },
  });

  revalidar();
  return { ok: true, message: aviso(kind, "eliminad") };
}
