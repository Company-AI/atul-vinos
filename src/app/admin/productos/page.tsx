import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { getAvailabilityMap } from "@/domain/inventory/availability";
import { WINE_TYPE_LABELS } from "@/domain/catalog/types";
import { TAXONOMIES, taxonomyPorUrl } from "@/domain/catalog/taxonomy-kinds";
import { formatARS } from "@/lib/money";
import { AdminCard, AdminPageHeader, AdminTable, Td } from "@/components/admin/admin-ui";
import { Badge } from "@/ui/badge";
import { buttonVariants } from "@/ui/button";
import { Input, Select } from "@/ui/field";

export const metadata: Metadata = { title: "Productos" };

type PageProps = {
  searchParams: Promise<{
    q?: string;
    estado?: string;
    clasificacion?: string;
    valor?: string;
  }>;
};

/**
 * Traduce ?clasificacion=varietales&valor=malbec a una condición de Prisma.
 *
 * Es el enlace que sale de la pantalla de Clasificación, donde cada valor
 * muestra cuántos productos lo usan: el número tiene que llevar a esos
 * productos y no a la lista entera.
 */
function filtroClasificacion(clasificacion?: string, valor?: string) {
  const kind = taxonomyPorUrl(clasificacion);
  if (!kind || !valor) return {};

  switch (kind) {
    case "category": return { category: { slug: valor } };
    case "winery": return { winery: { slug: valor } };
    case "region": return { region: { slug: valor } };
    case "line": return { line: { slug: valor } };
    case "grape": return { grapes: { some: { grape: { slug: valor } } } };
    case "pairing": return { pairings: { some: { pairing: { slug: valor } } } };
    case "tag": return { tags: { some: { tag: { slug: valor } } } };
  }
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const user = await requireStaff("products.view");
  const { q, estado, clasificacion, valor } = await searchParams;
  const kindFiltrado = taxonomyPorUrl(clasificacion);

  const products = await prisma.product.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(estado ? { status: estado as "DRAFT" | "ACTIVE" | "ARCHIVED" } : {}),
      // Los box tienen su propia sección: acá sólo vinos.
      kind: "WINE",
      ...filtroClasificacion(clasificacion, valor),
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      line: { select: { name: true } },
      region: { select: { name: true } },
      inventory: true,
    },
  });

  const availability = await getAvailabilityMap(products.map((p) => p.id));
  const canSeePrices = user.isSuperAdmin || user.permissions.has("products.price") || user.permissions.has("products.edit");

  return (
    <>
      <AdminPageHeader
        title="Productos"
        description={`${products.length} vinos en el catálogo`}
        actions={
          user.isSuperAdmin || user.permissions.has("products.edit") ? (
            <Link
              href="/admin/productos/nuevo"
              className={buttonVariants({ variant: "dark", size: "sm" })}
            >
              <Plus className="size-3.5" />
              Nuevo vino
            </Link>
          ) : null
        }
      />

      <form className="mb-4 flex flex-wrap items-end gap-2">
        {kindFiltrado && valor && (
          <>
            <input type="hidden" name="clasificacion" value={clasificacion} />
            <input type="hidden" name="valor" value={valor} />
          </>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-stone-500">Buscar</span>
          <Input name="q" defaultValue={q ?? ""} placeholder="Nombre o SKU" className="h-8 w-52 text-[13px]" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-stone-500">Estado</span>
          <Select name="estado" defaultValue={estado ?? ""} className="h-8 w-auto text-[13px]">
            <option value="">Todos</option>
            <option value="ACTIVE">Publicado</option>
            <option value="DRAFT">Borrador</option>
            <option value="ARCHIVED">Archivado</option>
          </Select>
        </label>
        <button
          type="submit"
          className={buttonVariants({ variant: "subtle", size: "sm" })}
        >
          Filtrar
        </button>
      </form>

      {kindFiltrado && valor && (
        <p className="mb-4 flex flex-wrap items-center gap-2 border border-linen-300 bg-linen-100 px-3 py-2 text-[13px] text-carbon-800">
          Sólo {TAXONOMIES[kindFiltrado].singular}{" "}
          <code className="text-[12px] text-stone-500">{valor}</code>
          <Link
            href="/admin/productos"
            className="underline underline-offset-4 hover:text-accent-700"
          >
            Ver todos
          </Link>
        </p>
      )}

      <AdminCard padded={false}>
        <AdminTable
          headers={[
            "", "Producto", "SKU", "Tipo", "Línea", "Región",
            ...(canSeePrices ? [{ label: "Precio", align: "right" as const }] : []),
            { label: "Disponible", align: "right" },
            "Estado", "Flags", { label: "", align: "right" },
          ]}
          empty={<p className="text-[13px] text-stone-500">No hay productos con esos filtros.</p>}
        >
          {products.map((product) => {
            const available = availability.get(product.id)?.available ?? 0;
            return (
              <tr key={product.id}>
                <Td className="w-10">
                  {product.images[0] && (
                    <Image
                      src={product.images[0].url}
                      alt=""
                      width={28}
                      height={37}
                      className="h-9 w-7 bg-linen-100 object-contain"
                    />
                  )}
                </Td>
                <Td>
                  <Link href={`/admin/productos/${product.id}`} className="hover:text-accent-700">
                    {product.name}
                    {product.vintage ? ` ${product.vintage}` : ""}
                  </Link>
                </Td>
                <Td className="text-stone-500">{product.sku}</Td>
                <Td>
                  <span className="text-stone-600">
                    {product.wineType ? WINE_TYPE_LABELS[product.wineType] : "—"}
                  </span>
                </Td>
                <Td className="text-stone-500">{product.line?.name ?? "—"}</Td>
                <Td className="text-stone-500">{product.region?.name ?? "—"}</Td>
                {canSeePrices && (
                  <Td align="right" className="whitespace-nowrap tabular">
                    {formatARS(product.price)}
                    {product.compareAtPrice && (
                      <span className="ml-1.5 text-[11px] text-stone-400 line-through">
                        {formatARS(product.compareAtPrice)}
                      </span>
                    )}
                  </Td>
                )}
                <Td align="right" className="tabular">{available}</Td>
                <Td>
                  <Badge
                    tone={
                      product.status === "ACTIVE" ? "success"
                        : product.status === "DRAFT" ? "warning" : "neutral"
                    }
                  >
                    {product.status === "ACTIVE" ? "Publicado"
                      : product.status === "DRAFT" ? "Borrador" : "Archivado"}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {product.featured && <Badge tone="outline">Destacado</Badge>}
                    {product.isNew && <Badge tone="outline">Novedad</Badge>}
                    {product.bestSeller && <Badge tone="outline">Más vendido</Badge>}
                  </div>
                </Td>
                <Td align="right">
                  <Link
                    href={`/admin/productos/${product.id}`}
                    className="text-[12px] underline underline-offset-2 hover:text-accent-700"
                  >
                    Editar
                  </Link>
                </Td>
              </tr>
            );
          })}
        </AdminTable>
      </AdminCard>
    </>
  );
}
