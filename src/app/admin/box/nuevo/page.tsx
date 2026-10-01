import type { Metadata } from "next";
import { requireStaff } from "@/infra/auth/guards";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ProductForm, type ProductFormData } from "@/components/admin/product-form";
import { loadProductFormOptions } from "../../productos/options";

export const metadata: Metadata = { title: "Nuevo box" };

/*
  Mismo formulario que un vino, pero el tipo ya viene decidido por la ruta.
  Antes había que entrar por "Nuevo producto" y acordarse de cambiar un
  selector: si no te acordabas, cargabas medio box como si fuera un vino.
*/
const VACIO: ProductFormData = {
  kind: "PACK",
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
  minStock: "0", location: "",
  packItems: [], awards: [],
};

export default async function NewBoxPage() {
  const user = await requireStaff("products.edit");
  const { taxonomies, wines } = await loadProductFormOptions();

  return (
    <>
      <AdminPageHeader
        breadcrumb={[{ label: "Box", href: "/admin/box" }]}
        title="Nuevo box"
        description="Se crea como borrador: no se publica hasta que cambies el estado."
      />

      <ProductForm
        initial={VACIO}
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
