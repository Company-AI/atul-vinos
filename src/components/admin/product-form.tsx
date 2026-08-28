"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Plus, Star, Trash2, Upload } from "lucide-react";
import {
  archiveProduct, deleteProductImage, saveProduct, updateProductImages, uploadProductMedia,
} from "@/app/actions/admin-products";
import { cn } from "@/lib/cn";
import { formatARS } from "@/lib/money";
import { AdminCard } from "./admin-ui";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/ui/field";
import { ConfirmationModal } from "@/ui/modal";
import { toast } from "@/ui/toaster";

export type TaxonomyOption = { id: string; name: string };

export type WineTypeValue = "" | "TINTO" | "BLANCO" | "ROSADO" | "ESPUMANTE" | "NARANJO" | "DULCE";
export type IntensityValue = "" | "LIGERO" | "MEDIO" | "INTENSO";

export type ProductFormData = {
  id?: string;
  kind: "WINE" | "PACK";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  cost: string;
  wineType: WineTypeValue;
  vintage: string;
  volumeMl: string;
  alcoholPercent: string;
  servingTempC: string;
  tastingNotes: string;
  agingPotential: string;
  intensity: IntensityValue;
  winemaking: string;
  featured: boolean;
  isNew: boolean;
  bestSeller: boolean;
  sortOrder: string;
  seoTitle: string;
  seoDescription: string;
  categoryId: string;
  wineryId: string;
  regionId: string;
  lineId: string;
  grapeIds: string[];
  pairingIds: string[];
  tagIds: string[];
  minStock: string;
  location: string;
  packItems: { componentId: string; quantity: number }[];
  awards: { title: string; organization: string; year: string; score: string }[];
};

export type ProductImageData = {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
};

export function ProductForm({
  initial,
  taxonomies,
  images,
  videos,
  wines,
  canEditPrice,
  canArchive,
  inventory,
}: {
  initial: ProductFormData;
  taxonomies: {
    categories: TaxonomyOption[];
    wineries: TaxonomyOption[];
    regions: TaxonomyOption[];
    lines: TaxonomyOption[];
    grapes: TaxonomyOption[];
    pairings: TaxonomyOption[];
    tags: TaxonomyOption[];
  };
  images: ProductImageData[];
  videos: { id: string; url: string; label: string | null }[];
  wines: { id: string; name: string; sku: string; price: number; available: number }[];
  canEditPrice: boolean;
  canArchive: boolean;
  inventory: { onHand: number; reserved: number; available: number } | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [gallery, setGallery] = useState(images);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleMulti = (key: "grapeIds" | "pairingIds" | "tagIds", id: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter((v) => v !== id) : [...f[key], id],
    }));

  const numberOrNull = (value: string) => (value.trim() === "" ? null : Number(value));

  const submit = () =>
    startTransition(async () => {
      const result = await saveProduct({
        id: form.id,
        kind: form.kind,
        status: form.status,
        name: form.name,
        slug: form.slug || undefined,
        sku: form.sku,
        shortDescription: form.shortDescription || undefined,
        description: form.description || undefined,
        price: Number(form.price || 0),
        compareAtPrice: numberOrNull(form.compareAtPrice),
        cost: numberOrNull(form.cost),
        wineType: form.wineType === "" ? null : form.wineType,
        vintage: numberOrNull(form.vintage),
        volumeMl: numberOrNull(form.volumeMl),
        alcoholPercent: numberOrNull(form.alcoholPercent),
        servingTempC: form.servingTempC || undefined,
        tastingNotes: form.tastingNotes || undefined,
        agingPotential: form.agingPotential || undefined,
        intensity: form.intensity === "" ? null : form.intensity,
        winemaking: form.winemaking || undefined,
        featured: form.featured,
        isNew: form.isNew,
        bestSeller: form.bestSeller,
        sortOrder: Number(form.sortOrder || 0),
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        categoryId: form.categoryId || null,
        wineryId: form.wineryId || null,
        regionId: form.regionId || null,
        lineId: form.lineId || null,
        grapeIds: form.grapeIds,
        pairingIds: form.pairingIds,
        tagIds: form.tagIds,
        minStock: Number(form.minStock || 0),
        location: form.location || undefined,
        packItems: form.packItems,
        awards: form.awards
          .filter((a) => a.title.trim())
          .map((a) => ({
            title: a.title,
            organization: a.organization || undefined,
            year: a.year ? Number(a.year) : null,
            score: a.score || undefined,
          })),
      });

      if (result.ok) {
        toast.success(result.message);
        if (!form.id && result.productId) {
          router.push(`/admin/productos/${result.productId}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error);
      }
    });

  const upload = async (file: File, kind: "image" | "video") => {
    if (!form.id) {
      toast.error("Guardá el producto antes de subir archivos.");
      return;
    }
    setUploading(true);
    const data = new FormData();
    data.set("productId", form.id);
    data.set("kind", kind);
    data.set("file", file);
    const result = await uploadProductMedia(data);
    setUploading(false);
    if (result.ok) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const packTotal = form.packItems.reduce((acc, item) => {
    const wine = wines.find((w) => w.id === item.componentId);
    return acc + (wine ? wine.price * item.quantity : 0);
  }, 0);

  const packAvailable = form.packItems.length
    ? Math.min(
        ...form.packItems.map((item) => {
          const wine = wines.find((w) => w.id === item.componentId);
          return wine ? Math.floor(wine.available / item.quantity) : 0;
        }),
      )
    : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <AdminCard title="Datos básicos">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de producto" htmlFor="kind">
              <Select
                id="kind"
                value={form.kind}
                onChange={(e) => set("kind", e.target.value as "WINE" | "PACK")}
                disabled={Boolean(form.id)}
              >
                <option value="WINE">Vino</option>
                <option value="PACK">Pack</option>
              </Select>
            </Field>
            <Field label="Estado" htmlFor="status">
              <Select
                id="status"
                value={form.status}
                onChange={(e) => set("status", e.target.value as ProductFormData["status"])}
              >
                <option value="DRAFT">Borrador</option>
                <option value="ACTIVE">Publicado</option>
                <option value="ARCHIVED">Archivado</option>
              </Select>
            </Field>
            <Field label="Nombre" htmlFor="name" required className="sm:col-span-2">
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="SKU" htmlFor="sku" required>
              <Input id="sku" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
            </Field>
            <Field label="Slug" htmlFor="slug" hint="Se genera solo si lo dejás vacío.">
              <Input id="slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
            </Field>
            <Field label="Descripción corta" htmlFor="shortDescription" className="sm:col-span-2"
              hint="Una línea. Se usa en las cards y en los metadatos.">
              <Input
                id="shortDescription"
                maxLength={300}
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
              />
            </Field>
            <Field label="Descripción / historia del vino" htmlFor="description" className="sm:col-span-2">
              <Textarea
                id="description"
                className="min-h-40"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Precios">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Precio de venta" htmlFor="price" required>
              <Input
                id="price" type="number" min={0} step={100} value={form.price}
                disabled={!canEditPrice}
                onChange={(e) => set("price", e.target.value)}
              />
            </Field>
            <Field label="Precio anterior" htmlFor="compareAtPrice"
              hint="Si es mayor al precio, se muestra la oferta.">
              <Input
                id="compareAtPrice" type="number" min={0} step={100} value={form.compareAtPrice}
                disabled={!canEditPrice}
                onChange={(e) => set("compareAtPrice", e.target.value)}
              />
            </Field>
            <Field label="Costo" htmlFor="cost" hint="Interno. No se muestra en la tienda.">
              <Input
                id="cost" type="number" min={0} step={100} value={form.cost}
                onChange={(e) => set("cost", e.target.value)}
              />
            </Field>
          </div>
          {!canEditPrice && (
            <p className="mt-3 text-[12px] text-warning-500">
              Tu rol no puede modificar precios.
            </p>
          )}
        </AdminCard>

        {form.kind === "WINE" && (
          <AdminCard title="Ficha enológica">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tipo de vino" htmlFor="wineType">
                <Select id="wineType" value={form.wineType} onChange={(e) => set("wineType", e.target.value as WineTypeValue)}>
                  <option value="">—</option>
                  <option value="TINTO">Tinto</option>
                  <option value="BLANCO">Blanco</option>
                  <option value="ROSADO">Rosado</option>
                  <option value="ESPUMANTE">Espumante</option>
                  <option value="NARANJO">Naranjo</option>
                  <option value="DULCE">Dulce</option>
                </Select>
              </Field>
              <Field label="Cosecha" htmlFor="vintage">
                <Input id="vintage" type="number" min={1900} max={2100} value={form.vintage}
                  onChange={(e) => set("vintage", e.target.value)} />
              </Field>
              <Field label="Intensidad" htmlFor="intensity">
                <Select id="intensity" value={form.intensity} onChange={(e) => set("intensity", e.target.value as IntensityValue)}>
                  <option value="">—</option>
                  <option value="LIGERO">Ligero</option>
                  <option value="MEDIO">Medio</option>
                  <option value="INTENSO">Intenso</option>
                </Select>
              </Field>
              <Field label="Volumen (ml)" htmlFor="volumeMl">
                <Input id="volumeMl" type="number" min={0} value={form.volumeMl}
                  onChange={(e) => set("volumeMl", e.target.value)} />
              </Field>
              <Field label="Alcohol (% vol.)" htmlFor="alcoholPercent">
                <Input id="alcoholPercent" type="number" min={0} max={30} step={0.1}
                  value={form.alcoholPercent}
                  onChange={(e) => set("alcoholPercent", e.target.value)} />
              </Field>
              <Field label="Temperatura de servicio" htmlFor="servingTempC" hint="Ej.: 16–18 °C">
                <Input id="servingTempC" value={form.servingTempC}
                  onChange={(e) => set("servingTempC", e.target.value)} />
              </Field>
              <Field label="Guarda" htmlFor="agingPotential" hint="Ej.: 8 a 10 años">
                <Input id="agingPotential" value={form.agingPotential}
                  onChange={(e) => set("agingPotential", e.target.value)} />
              </Field>
              <Field label="Notas de cata" htmlFor="tastingNotes" className="sm:col-span-3">
                <Textarea id="tastingNotes" className="min-h-28" value={form.tastingNotes}
                  onChange={(e) => set("tastingNotes", e.target.value)} />
              </Field>
              <Field label="Elaboración" htmlFor="winemaking" className="sm:col-span-3">
                <Textarea id="winemaking" value={form.winemaking}
                  onChange={(e) => set("winemaking", e.target.value)} />
              </Field>
            </div>
          </AdminCard>
        )}

        {form.kind === "PACK" && (
          <AdminCard
            title="Composición del pack"
            description={`Disponibilidad derivada: ${packAvailable} packs · valor individual ${formatARS(packTotal)}`}
          >
            <ul className="space-y-2">
              {form.packItems.map((item, index) => (
                <li key={`${item.componentId}-${index}`} className="flex items-center gap-2">
                  <Select
                    value={item.componentId}
                    onChange={(e) => {
                      const next = [...form.packItems];
                      next[index] = { ...item, componentId: e.target.value };
                      set("packItems", next);
                    }}
                    className="flex-1"
                    aria-label="Vino del pack"
                  >
                    <option value="">Elegí un vino</option>
                    {wines.map((wine) => (
                      <option key={wine.id} value={wine.id}>
                        {wine.name} — {wine.sku} (disp. {wine.available})
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    aria-label="Cantidad"
                    className="w-20"
                    onChange={(e) => {
                      const next = [...form.packItems];
                      next[index] = { ...item, quantity: Number(e.target.value) || 1 };
                      set("packItems", next);
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Quitar del pack"
                    onClick={() => set("packItems", form.packItems.filter((_, i) => i !== index))}
                    className="rounded-sm p-2 text-stone-500 hover:text-danger-500"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>

            <Button
              size="sm"
              variant="subtle"
              className="mt-3"
              onClick={() => set("packItems", [...form.packItems, { componentId: "", quantity: 1 }])}
            >
              <Plus className="size-3.5" />
              Agregar vino
            </Button>

            <p className="mt-4 text-[12px] leading-relaxed text-stone-500">
              El pack no tiene stock propio: su disponibilidad se calcula con el stock real de cada
              vino que lo compone. Si falta uno, el pack deja de venderse automáticamente.
            </p>
          </AdminCard>
        )}

        <AdminCard title="Clasificación">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría" htmlFor="categoryId">
              <Select id="categoryId" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">—</option>
                {taxonomies.categories.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </Field>
            <Field label="Bodega / productor" htmlFor="wineryId">
              <Select id="wineryId" value={form.wineryId} onChange={(e) => set("wineryId", e.target.value)}>
                <option value="">—</option>
                {taxonomies.wineries.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </Field>
            <Field label="Región" htmlFor="regionId">
              <Select id="regionId" value={form.regionId} onChange={(e) => set("regionId", e.target.value)}>
                <option value="">—</option>
                {taxonomies.regions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </Field>
            <Field label="Línea" htmlFor="lineId">
              <Select id="lineId" value={form.lineId} onChange={(e) => set("lineId", e.target.value)}>
                <option value="">—</option>
                {taxonomies.lines.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </Field>
          </div>

          {(
            [
              { key: "grapeIds", label: "Varietales", options: taxonomies.grapes },
              { key: "pairingIds", label: "Maridajes", options: taxonomies.pairings },
              { key: "tagIds", label: "Etiquetas", options: taxonomies.tags },
            ] as const
          ).map((group) => (
            <fieldset key={group.key} className="mt-5">
              <legend className="mb-2 text-[11px] uppercase tracking-wider text-stone-500">
                {group.label}
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((option) => {
                  const active = form[group.key].includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleMulti(group.key, option.id)}
                      className={cn(
                        "h-7 rounded-pill border px-2.5 text-[12px] transition-colors",
                        active
                          ? "border-carbon-900 bg-carbon-900 text-bone"
                          : "border-linen-300 text-carbon-800 hover:border-stone-400",
                      )}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </AdminCard>

        <AdminCard title="Premios y reconocimientos">
          <ul className="space-y-2">
            {form.awards.map((award, index) => (
              <li key={index} className="grid gap-2 sm:grid-cols-[2fr_1.5fr_80px_100px_40px]">
                <Input
                  value={award.title}
                  placeholder="Medalla de Oro"
                  aria-label="Premio"
                  onChange={(e) => {
                    const next = [...form.awards];
                    next[index] = { ...award, title: e.target.value };
                    set("awards", next);
                  }}
                />
                <Input
                  value={award.organization}
                  placeholder="Organización"
                  aria-label="Organización"
                  onChange={(e) => {
                    const next = [...form.awards];
                    next[index] = { ...award, organization: e.target.value };
                    set("awards", next);
                  }}
                />
                <Input
                  value={award.year}
                  type="number"
                  placeholder="Año"
                  aria-label="Año"
                  onChange={(e) => {
                    const next = [...form.awards];
                    next[index] = { ...award, year: e.target.value };
                    set("awards", next);
                  }}
                />
                <Input
                  value={award.score}
                  placeholder="92 pts"
                  aria-label="Puntaje"
                  onChange={(e) => {
                    const next = [...form.awards];
                    next[index] = { ...award, score: e.target.value };
                    set("awards", next);
                  }}
                />
                <button
                  type="button"
                  aria-label="Quitar premio"
                  onClick={() => set("awards", form.awards.filter((_, i) => i !== index))}
                  className="rounded-sm p-2 text-stone-500 hover:text-danger-500"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="subtle"
            className="mt-3"
            onClick={() =>
              set("awards", [...form.awards, { title: "", organization: "", year: "", score: "" }])
            }
          >
            <Plus className="size-3.5" />
            Agregar premio
          </Button>
        </AdminCard>

        <AdminCard title="SEO">
          <div className="grid gap-4">
            <Field label="Título SEO" htmlFor="seoTitle" hint="Si lo dejás vacío se usa el nombre.">
              <Input id="seoTitle" maxLength={120} value={form.seoTitle}
                onChange={(e) => set("seoTitle", e.target.value)} />
            </Field>
            <Field label="Descripción SEO" htmlFor="seoDescription" hint="Hasta 160 caracteres es lo ideal.">
              <Textarea id="seoDescription" maxLength={320} value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)} />
            </Field>
          </div>
        </AdminCard>
      </div>

      {/* Columna derecha */}
      <div className="space-y-4">
        <AdminCard title="Publicación">
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 text-[13px] text-carbon-800">
              <Checkbox checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
              Destacado (aparece en la home)
            </label>
            <label className="flex items-center gap-2.5 text-[13px] text-carbon-800">
              <Checkbox checked={form.isNew} onChange={(e) => set("isNew", e.target.checked)} />
              Novedad
            </label>
            <label className="flex items-center gap-2.5 text-[13px] text-carbon-800">
              <Checkbox checked={form.bestSeller} onChange={(e) => set("bestSeller", e.target.checked)} />
              Más vendido
            </label>
            <Field label="Orden" htmlFor="sortOrder" hint="Menor número aparece primero.">
              <Input id="sortOrder" type="number" value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)} />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-linen-200 pt-4">
            <Button variant="dark" loading={pending} disabled={pending} onClick={submit}>
              {form.id ? "Guardar cambios" : "Crear producto"}
            </Button>
            {form.id && (
              <Link
                href={`/vinos/${form.slug}`}
                target="_blank"
                className="text-[12px] underline underline-offset-2 hover:text-wine-700"
              >
                Ver en la tienda
              </Link>
            )}
          </div>

          {form.id && canArchive && form.status !== "ARCHIVED" && (
            <Button
              variant="quiet"
              className="mt-2 text-danger-500"
              size="sm"
              onClick={() => setConfirmArchive(true)}
            >
              Archivar producto
            </Button>
          )}
        </AdminCard>

        {form.kind === "WINE" && (
          <AdminCard title="Stock" description={form.id ? undefined : "Se habilita al crear el producto."}>
            {inventory && (
              <dl className="mb-4 grid grid-cols-3 gap-2 border-b border-linen-200 pb-4 text-center">
                <div>
                  <dt className="text-[11px] uppercase text-stone-500">Físico</dt>
                  <dd className="text-[18px] tabular">{inventory.onHand}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase text-stone-500">Reservado</dt>
                  <dd className="text-[18px] tabular">{inventory.reserved}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase text-stone-500">Disponible</dt>
                  <dd className="text-[18px] tabular font-medium">{inventory.available}</dd>
                </div>
              </dl>
            )}
            <div className="grid gap-4">
              <Field label="Stock mínimo" htmlFor="minStock" hint="Umbral de alerta de reposición.">
                <Input id="minStock" type="number" min={0} value={form.minStock}
                  onChange={(e) => set("minStock", e.target.value)} />
              </Field>
              <Field label="Ubicación en depósito" htmlFor="location">
                <Input id="location" value={form.location}
                  onChange={(e) => set("location", e.target.value)} />
              </Field>
            </div>
            {form.id && (
              <Link
                href="/admin/stock"
                className="mt-4 inline-block text-[12px] underline underline-offset-2 hover:text-wine-700"
              >
                Registrar movimiento de stock
              </Link>
            )}
          </AdminCard>
        )}

        <AdminCard
          title="Imágenes"
          description="La primera es la principal. Arrastrá el orden con las flechas."
        >
          {!form.id ? (
            <p className="text-[13px] text-stone-500">
              Guardá el producto para poder subir imágenes.
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {gallery.map((image, index) => (
                  <li key={image.id} className="flex items-center gap-3 border border-linen-200 p-2">
                    <Image
                      src={image.url}
                      alt=""
                      width={40}
                      height={53}
                      className="h-14 w-10 shrink-0 bg-linen-100 object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <Input
                        value={image.alt}
                        placeholder="Texto alternativo (accesibilidad y SEO)"
                        aria-label="Texto alternativo"
                        className="h-8 text-[12px]"
                        onChange={(e) =>
                          setGallery((g) =>
                            g.map((img) => (img.id === image.id ? { ...img, alt: e.target.value } : img)),
                          )
                        }
                      />
                      <div className="mt-1.5 flex items-center gap-2">
                        {image.isPrimary ? (
                          <Badge tone="dark">Principal</Badge>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setGallery((g) =>
                                g.map((img) => ({ ...img, isPrimary: img.id === image.id })),
                              )
                            }
                            className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-carbon-900"
                          >
                            <Star className="size-3" />
                            Hacer principal
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() =>
                            setGallery((g) => {
                              const next = [...g];
                              [next[index - 1], next[index]] = [next[index], next[index - 1]];
                              return next.map((img, i) => ({ ...img, sortOrder: i }));
                            })
                          }
                          className="text-[11px] text-stone-500 hover:text-carbon-900 disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={index === gallery.length - 1}
                          onClick={() =>
                            setGallery((g) => {
                              const next = [...g];
                              [next[index + 1], next[index]] = [next[index], next[index + 1]];
                              return next.map((img, i) => ({ ...img, sortOrder: i }));
                            })
                          }
                          className="text-[11px] text-stone-500 hover:text-carbon-900 disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            startTransition(async () => {
                              const result = await deleteProductImage(image.id);
                              if (result.ok) {
                                setGallery((g) => g.filter((img) => img.id !== image.id));
                                toast.success(result.message);
                                router.refresh();
                              } else toast.error(result.error);
                            })
                          }
                          className="ml-auto text-[11px] text-stone-500 hover:text-danger-500"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(file, "image");
                    e.target.value = "";
                  }}
                />
                <Button
                  size="sm"
                  variant="subtle"
                  loading={uploading}
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload className="size-3.5" />
                  Subir imagen
                </Button>

                {gallery.length > 0 && (
                  <Button
                    size="sm"
                    variant="dark"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await updateProductImages({
                          productId: form.id!,
                          images: gallery.map((img, i) => ({
                            id: img.id,
                            sortOrder: i,
                            alt: img.alt,
                            isPrimary: img.isPrimary,
                          })),
                        });
                        if (result.ok) toast.success(result.message);
                        else toast.error(result.error);
                      })
                    }
                  >
                    Guardar galería
                  </Button>
                )}
              </div>

              <p className="mt-3 text-[12px] text-stone-500">
                Se sirven optimizadas en WebP/AVIF y en varios tamaños automáticamente.
              </p>
            </>
          )}
        </AdminCard>

        {videos.length > 0 && (
          <AdminCard title="Videos">
            <ul className="space-y-1.5">
              {videos.map((video) => (
                <li key={video.id} className="truncate text-[12px] text-stone-600">
                  {video.label ?? video.url}
                </li>
              ))}
            </ul>
          </AdminCard>
        )}
      </div>

      <ConfirmationModal
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title="¿Archivar este producto?"
        description="Deja de mostrarse en la tienda. Los pedidos históricos no se modifican."
        confirmLabel="Archivar"
        destructive
        loading={pending}
        onConfirm={() => {
          if (!form.id) return;
          startTransition(async () => {
            const result = await archiveProduct(form.id!);
            if (result.ok) {
              toast.success(result.message);
              setConfirmArchive(false);
              router.push("/admin/productos");
            } else {
              toast.error(result.error);
              setConfirmArchive(false);
            }
          });
        }}
      />
    </div>
  );
}
