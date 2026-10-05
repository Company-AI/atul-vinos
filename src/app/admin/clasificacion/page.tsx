import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { cn } from "@/lib/cn";
import {
  TAXONOMIES,
  TAXONOMY_KINDS,
  taxonomyPorUrl,
  type TaxonomyKind,
} from "@/domain/catalog/taxonomy-kinds";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { TaxonomyManager, type TaxonomyRow } from "@/components/admin/taxonomy-manager";

export const metadata: Metadata = { title: "Clasificación" };

type PageProps = { searchParams: Promise<{ tipo?: string }> };

/**
 * Las listas con las que se clasifica el catálogo, todas en una pantalla.
 *
 * Están juntas porque son la misma tarea y porque se usan juntas: al cargar un
 * vino hay que elegir categoría, bodega, región, varietal y maridaje, y si
 * falta alguno conviene poder crearlo sin recorrer cinco secciones del menú.
 *
 * Cada solapa es una navegación, no un estado del navegador: así los números
 * de la derecha —cuántos productos usan cada valor— se recalculan al cambiar
 * de lista en vez de quedar viejos.
 */

/** Cuántos valores tiene cada lista. Es lo que se muestra en las solapas. */
async function contarTodas(): Promise<Record<TaxonomyKind, number>> {
  const [category, grape, pairing, line, tag, winery, region] = await Promise.all([
    prisma.category.count(),
    prisma.grapeVariety.count(),
    prisma.pairing.count(),
    prisma.wineLine.count(),
    prisma.productTag.count(),
    prisma.winery.count(),
    prisma.region.count(),
  ]);
  return { category, grape, pairing, line, tag, winery, region };
}

async function cargarFilas(kind: TaxonomyKind): Promise<TaxonomyRow[]> {
  switch (kind) {
    case "category": {
      const filas = await prisma.category.findMany({
        orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { products: true } } },
      });
      return filas.map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        isActive: f.isActive,
        sortOrder: f.sortOrder,
        imageUrl: f.imageUrl,
        text: f.description,
        productCount: f._count.products,
      }));
    }
    case "grape": {
      const filas = await prisma.grapeVariety.findMany({
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        include: { _count: { select: { products: true } } },
      });
      return filas.map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        isActive: f.isActive,
        text: f.description,
        productCount: f._count.products,
      }));
    }
    case "pairing": {
      const filas = await prisma.pairing.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { products: true } } },
      });
      return filas.map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        icon: f.icon,
        productCount: f._count.products,
      }));
    }
    case "line": {
      const filas = await prisma.wineLine.findMany({
        orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { products: true } } },
      });
      return filas.map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        isActive: f.isActive,
        sortOrder: f.sortOrder,
        imageUrl: f.imageUrl,
        text: f.description,
        productCount: f._count.products,
      }));
    }
    case "tag": {
      const filas = await prisma.productTag.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { products: true } } },
      });
      return filas.map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        color: f.color,
        productCount: f._count.products,
      }));
    }
    case "winery": {
      const filas = await prisma.winery.findMany({
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        include: { _count: { select: { products: true } } },
      });
      return filas.map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        isActive: f.isActive,
        imageUrl: f.imageUrl,
        text: f.story,
        productCount: f._count.products,
      }));
    }
    case "region": {
      const filas = await prisma.region.findMany({
        orderBy: [{ isActive: "desc" }, { province: "asc" }, { name: "asc" }],
        include: { _count: { select: { products: true } } },
      });
      return filas.map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        isActive: f.isActive,
        province: f.province,
        country: f.country,
        imageUrl: f.imageUrl,
        text: f.description,
        productCount: f._count.products,
      }));
    }
  }
}

export default async function ClasificacionPage({ searchParams }: PageProps) {
  const user = await requireStaff("products.view");
  const { tipo } = await searchParams;
  const kind = taxonomyPorUrl(tipo) ?? "category";
  const config = TAXONOMIES[kind];

  const [totales, rows] = await Promise.all([contarTodas(), cargarFilas(kind)]);

  return (
    <>
      <AdminPageHeader
        title="Clasificación"
        description="Las listas con las que se arma la ficha de un producto y con las que filtra la tienda. Un valor tiene que existir acá para poder elegirlo al cargar un vino."
      />

      <nav aria-label="Listas de clasificación" className="mb-6 flex flex-wrap gap-1.5">
        {TAXONOMY_KINDS.map((k) => {
          const c = TAXONOMIES[k];
          const activa = k === kind;
          return (
            <Link
              key={k}
              href={`/admin/clasificacion?tipo=${c.url}`}
              aria-current={activa ? "page" : undefined}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-pill border px-3 text-[13px] transition-colors",
                activa
                  ? "border-carbon-900 bg-carbon-900 text-bone"
                  : "border-linen-300 text-carbon-800 hover:border-stone-400",
              )}
            >
              {c.plural}
              <span className={cn("tabular text-[11px]", activa ? "text-linen-300" : "text-stone-500")}>
                {totales[k]}
              </span>
            </Link>
          );
        })}
      </nav>

      <p className="mb-5 max-w-[70ch] text-[13px] leading-relaxed text-stone-500">
        {config.descripcion}
      </p>

      <TaxonomyManager
        kind={kind}
        rows={rows}
        canEdit={user.isSuperAdmin || user.permissions.has("products.edit")}
        canDelete={user.isSuperAdmin || user.permissions.has("products.delete")}
      />
    </>
  );
}
