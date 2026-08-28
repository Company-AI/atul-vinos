import type { Metadata } from "next";
import { requireStaff } from "@/infra/auth/guards";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ProductForm, type ProductFormData } from "@/components/admin/product-form";
import { loadProductFormOptions } from "../options";

export const metadata: Metadata = { title: "Nuevo producto" };

const EMPTY: ProductFormData = {
  kind: "WINE",
  status: "DRAFT",
  name: "", slug: "", sku: "",
  shortDescription: "", description: "",
  price: "", compareAtPrice: "", cost: "",
  wineType: "", vintage: "", volumeMl: "", alcoholPercent: "",
  servingTempC: "", tastingNotes: "", agingPotential: "", intensity: "", winemaking: "",
  featured: false, isNew: true, bestSeller: false, sortOrder: "0",
  seoTitle: "", seoDescription: "",
  categoryId: "", wineryId: "", regionId: "", lineId: "",
  grapeIds: [], pairingIds: [], tagIds: [],
  minStock: "6", location: "",
  packItems: [], awards: [],
};

export default async function NewProductPage() {
  const user = await requireStaff("products.edit");
  const { taxonomies, wines } = await loadProductFormOptions();

  return (
    <>
      <AdminPageHeader
        breadcrumb={[{ label: "Productos", href: "/admin/productos" }]}
        title="Nuevo producto"
        description="Se crea como borrador: no se publica hasta que cambies el estado."
      />

      <ProductForm
        initial={EMPTY}
        taxonomies={taxonomies}
        wines={wines}
        images={[]}
        videos={[]}
        canEditPrice={user.isSuperAdmin || user.permissions.has("products.price")}
        canArchive={false}
        inventory={null}
      />
    </>
  );
}
