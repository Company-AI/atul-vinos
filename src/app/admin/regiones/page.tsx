import type { Metadata } from "next";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { TaxonomyManager, type TaxonomyRow } from "@/components/admin/taxonomy-manager";

export const metadata: Metadata = { title: "Regiones" };

export default async function AdminRegionsPage() {
  const user = await requireStaff("products.view");

  const regions = await prisma.region.findMany({
    orderBy: [{ isActive: "desc" }, { province: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  const rows: TaxonomyRow[] = regions.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    isActive: r.isActive,
    productCount: r._count.products,
    imageUrl: r.imageUrl,
    province: r.province,
    country: r.country,
    text: r.description,
  }));

  return (
    <>
      <AdminPageHeader
        title="Regiones"
        description="Las zonas de donde traemos el vino, de Jujuy a la Patagonia. Cada región tiene que existir acá antes de poder asignarla a un producto."
      />

      <TaxonomyManager
        kind="region"
        rows={rows}
        canEdit={user.permissions.has("products.edit")}
        canDelete={user.permissions.has("products.delete")}
      />
    </>
  );
}
