import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, ChevronRight, Thermometer, Wine } from "lucide-react";
import { getProductDetail, getRelatedProducts } from "@/domain/catalog/service";
import { INTENSITY_LABELS, WINE_TYPE_LABELS } from "@/domain/catalog/types";
import { getFavoriteIds } from "@/app/actions/favorites";
import { getSettings } from "@/domain/settings/service";
import { formatARS } from "@/lib/money";
import { AddToCartPanel } from "@/components/shop/add-to-cart";
import { FavoriteButton } from "@/components/shop/favorite-button";
import { ProductGallery } from "@/components/shop/product-gallery";
import { WineGrid } from "@/components/shop/wine-grid";
import { Badge } from "@/ui/badge";
import { Container, Divider, Eyebrow, Heading, Prose, Section } from "@/ui/layout";
import { Price } from "@/ui/price";
import { Reveal } from "@/ui/reveal";
import { StockIndicator } from "@/ui/stock-indicator";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetail(slug);
  if (!product) return { title: "Vino no encontrado" };

  const image = product.images[0]?.url;
  return {
    title: product.seoTitle || `${product.name} ${product.vintage ?? ""}`.trim(),
    description: product.seoDescription || product.shortDescription || undefined,
    alternates: { canonical: `/vinos/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductDetail(slug);
  if (!product || product.status !== "ACTIVE") notFound();

  const [related, favoriteIds, settings] = await Promise.all([
    getRelatedProducts(product.id, {
      regionId: product.regionId,
      lineId: product.lineId,
      grapeIds: product.grapes.map((g) => g.grapeId),
    }),
    getFavoriteIds(),
    getSettings(),
  ]);

  const available = product.availability.available;
  const isPack = product.kind === "PACK";

  const specs = [
    product.wineType && { label: "Tipo", value: WINE_TYPE_LABELS[product.wineType] },
    product.grapes.length > 0 && {
      label: product.grapes.length > 1 ? "Corte" : "Varietal",
      value: product.grapes
        .map((g) => (g.percent ? `${g.percent}% ${g.grape.name}` : g.grape.name))
        .join(" · "),
    },
    product.vintage && { label: "Cosecha", value: String(product.vintage) },
    product.region && {
      label: "Región",
      value: [product.region.name, product.region.province].filter(Boolean).join(", "),
    },
    product.winery && { label: "Bodega", value: product.winery.name },
    product.line && { label: "Línea", value: product.line.name },
    product.volumeMl && { label: "Volumen", value: `${product.volumeMl} ml` },
    product.alcoholPercent && { label: "Alcohol", value: `${product.alcoholPercent}% vol.` },
    product.intensity && { label: "Intensidad", value: INTENSITY_LABELS[product.intensity] },
    product.servingTempC && { label: "Temperatura de servicio", value: product.servingTempC },
    product.agingPotential && { label: "Guarda", value: product.agingPotential },
    { label: "SKU", value: product.sku },
  ].filter(Boolean) as { label: string; value: string }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.name}${product.vintage ? ` ${product.vintage}` : ""}`,
    description: product.shortDescription ?? product.description ?? undefined,
    sku: product.sku,
    image: product.images.map((i) => i.url),
    brand: { "@type": "Brand", name: product.winery?.name ?? settings.company.name },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: settings.company.currency,
      availability: available > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/vinos/${product.slug}`,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "/" },
      { "@type": "ListItem", position: 2, name: "Vinos", item: "/vinos" },
      { "@type": "ListItem", position: 3, name: product.name, item: `/vinos/${product.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <Container className="pt-2">
        <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-[12px] text-stone-500">
          <Link href="/" className="hover:text-carbon-900">Inicio</Link>
          <ChevronRight className="size-3" />
          <Link href={isPack ? "/packs" : "/vinos"} className="hover:text-carbon-900">
            {isPack ? "Packs" : "Vinos"}
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-carbon-800">{product.name}</span>
        </nav>
      </Container>

      {/* Ficha principal */}
      <Container className="pb-section-sm pt-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <ProductGallery
              images={product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))}
              productName={product.name}
              videoUrl={product.videos[0]?.url}
            />
          </div>

          <div className="lg:pt-6">
            <div className="flex flex-wrap items-center gap-2">
              {product.isNew && <Badge tone="dark">Novedad</Badge>}
              {product.bestSeller && <Badge tone="gold">Más vendido</Badge>}
              {product.tags.map((t) => (
                <Badge key={t.tagId} tone="outline">{t.tag.name}</Badge>
              ))}
            </div>

            <Eyebrow className="mt-6">
              {[
                product.wineType && WINE_TYPE_LABELS[product.wineType],
                product.region?.name,
                product.line?.name,
              ].filter(Boolean).join(" · ")}
            </Eyebrow>

            <div className="mt-3 flex items-start justify-between gap-4">
              <Heading level={1} size="md" className="max-w-[20ch]">
                {product.name}
                {product.vintage ? <span className="text-stone-500"> {product.vintage}</span> : null}
              </Heading>
              <FavoriteButton
                productId={product.id}
                productName={product.name}
                initialFavorite={favoriteIds.has(product.id)}
                className="mt-1 shrink-0 bg-linen-100"
              />
            </div>

            {product.shortDescription && (
              <p className="mt-5 max-w-[52ch] text-[16px] leading-relaxed text-stone-600">
                {product.shortDescription}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Price value={product.price} compareAt={product.compareAtPrice} size="lg" />
              <StockIndicator
                available={available}
                minStock={product.availability.minStock}
                showCount={available > 0 && available <= 12}
              />
            </div>

            {isPack && product.packItems.length > 0 && (
              <div className="mt-8 border border-linen-300 bg-linen-100 p-5">
                <p className="eyebrow mb-3 text-stone-500">Este pack incluye</p>
                <ul className="space-y-2.5">
                  {product.packItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-[14px]">
                      <Link
                        href={`/vinos/${item.component.slug}`}
                        className="text-carbon-900 hover:text-wine-700"
                      >
                        {item.quantity}× {item.component.name} {item.component.vintage ?? ""}
                      </Link>
                      <span className="shrink-0 tabular text-stone-500">
                        {formatARS(item.component.price)}
                      </span>
                    </li>
                  ))}
                </ul>
                {product.availability.limitedBy && available === 0 && (
                  <p className="mt-4 text-[13px] text-danger-500">
                    No podemos armar el pack: falta stock de {product.availability.limitedBy.name}.
                  </p>
                )}
              </div>
            )}

            <div className="mt-8">
              <AddToCartPanel productId={product.id} available={available} />
            </div>

            <ul className="mt-8 space-y-2 border-t border-linen-200 pt-6 text-[13px] text-stone-600">
              <li className="flex items-center gap-2">
                <Wine className="size-3.5 text-clay-500" />
                {settings.shipping.freeShippingFrom
                  ? `Envío sin cargo en compras desde ${formatARS(settings.shipping.freeShippingFrom)}`
                  : "Envíos a todo el país"}
              </li>
              {product.servingTempC && (
                <li className="flex items-center gap-2">
                  <Thermometer className="size-3.5 text-clay-500" />
                  Servir a {product.servingTempC}
                </li>
              )}
            </ul>
          </div>
        </div>
      </Container>

      {/* Notas de cata y relato */}
      {(product.tastingNotes || product.description) && (
        <Section tone="linen" density="compact">
          <Container>
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              {product.tastingNotes && (
                <Reveal>
                  <Eyebrow>Notas de cata</Eyebrow>
                  <Prose className="mt-5 text-[16px] text-carbon-800">
                    <p>{product.tastingNotes}</p>
                  </Prose>
                  {product.pairings.length > 0 && (
                    <div className="mt-8">
                      <Eyebrow>Maridaje</Eyebrow>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {product.pairings.map((p) => (
                          <li key={p.pairingId}>
                            <Link
                              href={`/vinos?maridaje=${p.pairing.slug}`}
                              className="inline-flex h-8 items-center rounded-pill border border-linen-300 px-3 text-[13px] text-carbon-800 transition-colors hover:border-carbon-600"
                            >
                              {p.pairing.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Reveal>
              )}

              {product.description && (
                <Reveal delay={0.1}>
                  <Eyebrow>La historia de este vino</Eyebrow>
                  <Prose className="mt-5">
                    {product.description.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
                  </Prose>
                  {product.winemaking && (
                    <>
                      <Eyebrow className="mt-8">Elaboración</Eyebrow>
                      <Prose className="mt-3">{product.winemaking}</Prose>
                    </>
                  )}
                </Reveal>
              )}
            </div>
          </Container>
        </Section>
      )}

      {/* Ficha técnica y premios */}
      <Section tone="light" density="compact">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <div>
              <Eyebrow>Ficha técnica</Eyebrow>
              <dl className="mt-6 grid gap-x-10 sm:grid-cols-2">
                {specs.map((spec) => (
                  <div key={spec.label} className="border-b border-linen-200 py-3">
                    <dt className="text-[12px] uppercase tracking-wider text-stone-500">{spec.label}</dt>
                    <dd className="mt-1 text-[14px] text-carbon-900">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {product.awards.length > 0 && (
              <div>
                <Eyebrow>Premios y reconocimientos</Eyebrow>
                <ul className="mt-6 space-y-4">
                  {product.awards.map((award) => (
                    <li key={award.id} className="flex gap-3 border-b border-linen-200 pb-4">
                      <Award className="mt-0.5 size-4 shrink-0 text-gold-500" />
                      <div>
                        <p className="text-[14px] font-medium text-carbon-900">{award.title}</p>
                        <p className="text-[13px] text-stone-500">
                          {[award.organization, award.year].filter(Boolean).join(" · ")}
                          {award.score ? ` · ${award.score}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* Relacionados */}
      {related.length > 0 && (
        <Section tone="linen">
          <Container>
            <Divider className="mb-12" />
            <Eyebrow>También te puede gustar</Eyebrow>
            <Heading size="sm" className="mt-4 mb-10">
              Vinos que suelen elegir junto a este
            </Heading>
            <WineGrid products={related} favoriteIds={favoriteIds} columns={4} />
          </Container>
        </Section>
      )}
    </>
  );
}
