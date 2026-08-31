import type { Metadata } from "next";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { TaxonomyManager, type TaxonomyRow } from "@/components/admin/taxonomy-manager";

export const metadata: Metadata = { title: "Bodegas" };

export default async function AdminWineriesPage() {
  const user = await requireStaff("products.view");

  const wineries = await prisma.winery.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  const rows: TaxonomyRow[] = wineries.map((w) => ({
    id: w.id,
    name: w.name,
    slug: w.slug,
    isActive: w.isActive,
    productCount: w._count.products,
    imageUrl: w.imageUrl,
    text: w.story,
  }));

  return (
    <>
      <AdminPageHeader
        title="Bodegas"
        description="Las casas que representamos. El formulario de productos las ofrece como lista desplegable, así que una bodega tiene que existir acá antes de poder cargarle vinos."
      />

      <TaxonomyManager
        kind="winery"
        rows={rows}
        canEdit={user.permissions.has("products.edit")}
        canDelete={user.permissions.has("products.delete")}
      />
    </>
  );
}
