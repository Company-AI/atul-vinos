import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { getAvailabilityMap } from "@/domain/inventory/availability";
import { toNumber } from "@/lib/money";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ProductForm, type ProductFormData } from "@/components/admin/product-form";
import { loadProductFormOptions } from "../options";

export const metadata: Metadata = { title: "Editar producto" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: PageProps) {
  const user = await requireStaff("products.view");
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      videos: true,
      grapes: true,
      pairings: true,
      tags: true,
      awards: { orderBy: { year: "desc" } },
      inventory: true,
      packItems: true,
    },
  });
  if (!product) notFound();

  const { taxonomies, wines } = await loadProductFormOptions(product.id);
  const availability = await getAvailabilityMap([product.id]);
  const stock = availability.get(product.id);

  const initial: ProductFormData = {
    id: product.id,
    kind: product.kind,
    status: product.status,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    price: String(toNumber(product.price)),
    compareAtPrice: product.compareAtPrice ? String(toNumber(product.compareAtPrice)) : "",
    cost: product.cost ? String(toNumber(product.cost)) : "",
    wineType: (product.wineType ?? "") as ProductFormData["wineType"],
    vintage: product.vintage ? String(product.vintage) : "",
    volumeMl: product.volumeMl ? String(product.volumeMl) : "",
    alcoholPercent: product.alcoholPercent ? String(toNumber(product.alcoholPercent)) : "",
    servingTempC: product.servingTempC ?? "",
    tastingNotes: product.tastingNotes ?? "",
    agingPotential: product.agingPotential ?? "",
    intensity: (product.intensity ?? "") as ProductFormData["intensity"],
    winemaking: product.winemaking ?? "",
    featured: product.featured,
    isNew: product.isNew,
    bestSeller: product.bestSeller,
    sortOrder: String(product.sortOrder),
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    categoryId: product.categoryId ?? "",
    wineryId: product.wineryId ?? "",
    regionId: product.regionId ?? "",
    lineId: product.lineId ?? "",
    grapeIds: product.grapes.map((g) => g.grapeId),
    pairingIds: product.pairings.map((p) => p.pairingId),
    tagIds: product.tags.map((t) => t.tagId),
    minStock: String(product.inventory?.minStock ?? 0),
    location: product.inventory?.location ?? "",
    packItems: product.packItems.map((item) => ({
      componentId: item.componentId,
      quantity: item.quantity,
    })),
    awards: product.awards.map((award) => ({
      title: award.title,
      organization: award.organization ?? "",
      year: award.year ? String(award.year) : "",
      score: award.score ?? "",
    })),
  };

  return (
    <>
      <AdminPageHeader
        breadcrumb={[{ label: "Productos", href: "/admin/productos" }]}
        title={product.name}
        description={`${product.sku} · ${product.kind === "PACK" ? "Pack" : "Vino"}`}
      />

      <ProductForm
        initial={initial}
        taxonomies={taxonomies}
        wines={wines}
        images={product.images.map((image) => ({
          id: image.id,
          url: image.url,
          alt: image.alt ?? "",
          isPrimary: image.isPrimary,
          sortOrder: image.sortOrder,
        }))}
        videos={product.videos.map((v) => ({ id: v.id, url: v.url, label: v.label }))}
        canEditPrice={user.isSuperAdmin || user.permissions.has("products.price")}
        canArchive={user.isSuperAdmin || user.permissions.has("products.delete")}
        inventory={
          stock && product.kind === "WINE"
            ? { onHand: stock.onHand, reserved: stock.reserved, available: stock.available }
            : null
        }
      />
    </>
  );
}
