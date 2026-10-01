"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, Plus, Star, Trash2, X } from "lucide-react";
import {
  archiveProduct, deleteProductImage, saveProduct, updateProductImages, uploadProductMedia,
} from "@/app/actions/admin-products";
import { TAXONOMIES, type TaxonomyKind } from "@/domain/catalog/taxonomy-kinds";
import { cn } from "@/lib/cn";
import { formatARS } from "@/lib/money";
import { AdminCard } from "./admin-ui";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Label, Select, Textarea } from "@/ui/field";
import { ConfirmationModal } from "@/ui/modal";
import { toast } from "@/ui/toaster";

export type TaxonomyOption = { id: string; name: string };

/** Las siete listas con las que se clasifica un producto. */
export type TaxonomyLists = {
  categories: TaxonomyOption[];
  wineries: TaxonomyOption[];
  regions: TaxonomyOption[];
  lines: TaxonomyOption[];
  grapes: TaxonomyOption[];
  pairings: TaxonomyOption[];
  tags: TaxonomyOption[];
};

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
  taxonomies: TaxonomyLists;
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
  /* Sólo para pintar el borde de la zona de subida mientras se arrastra encima. */
  const [arrastrando, setArrastrando] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [gallery, setGallery] = useState(images);
  /*
    Archivos ya subidos al almacenamiento pero todavía sin fila en la base,
    porque el producto no existe. Se convierten en filas al guardar.
  */
  const [pendientes, setPendientes] = useState<{ url: string; kind: "image" | "video" }[]>([]);
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
        pendingMedia: pendientes,
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
        // Ya tienen fila propia: dejan de ser pendientes.
        setPendientes([]);
        if (!form.id && result.productId) {
          router.push(`/admin/productos/${result.productId}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error);
      }
    });

  /**
   * Sube una o varias imágenes.
   *
   * De a una y en orden, no todas en paralelo: el servidor procesa cada
   * archivo —lo guarda y después se sirve en varios tamaños— y disparar seis
   * subidas juntas desde la conexión de alguien no lo hace más rápido, sólo
   * más frágil. Si una falla, se avisa cuál y las demás siguen.
   */
  const subirVarias = async (archivos: FileList | null) => {
    const lista = Array.from(archivos ?? []);
    if (lista.length === 0) return;

    setUploading(true);
    let subidas = 0;

    for (const archivo of lista) {
      const data = new FormData();
      /*
        Sin producto todavía se manda vacío: el archivo se guarda igual y
        vuelve la URL, que queda en pendientes hasta que se guarde el
        producto. Antes esto obligaba a guardar un producto a medio llenar
        sólo para poder elegir una foto.
      */
      data.set("productId", form.id ?? "");
      data.set("kind", "image");
      data.set("file", archivo);

      const result = await uploadProductMedia(data);
      if (!result.ok) {
        toast.error(`${archivo.name}: ${result.error}`);
        continue;
      }
      subidas += 1;
      if (result.media) setPendientes((p) => [...p, result.media!]);
    }

    setUploading(false);
    if (subidas === 0) return;

    toast.success(subidas === 1 ? "Imagen subida." : `${subidas} imágenes subidas.`);
    // Con el producto ya creado la fila la escribió el servidor: hay que releerla.
    if (form.id) router.refresh();
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
            <p className="mt-3 text-[13px] text-warning-500">
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

            <p className="mt-4 text-[13px] leading-relaxed text-stone-500">
              El pack no tiene stock propio: su disponibilidad se calcula con el stock real de cada
              vino que lo compone. Si falta uno, el pack deja de venderse automáticamente.
            </p>
          </AdminCard>
        )}

        <AdminCard
          title="Clasificación"
          description="Los valores salen de las listas del catálogo; acá sólo se eligen."
          action={
            <Link
              href="/admin/clasificacion"
              target="_blank"
              className="text-[13px] underline underline-offset-2 hover:text-accent-700"
            >
              Administrar listas
            </Link>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { campo: "categoryId", lista: "categories", kind: "category", label: "Categoría" },
                { campo: "wineryId", lista: "wineries", kind: "winery", label: "Bodega / productor" },
                { campo: "regionId", lista: "regions", kind: "region", label: "Región" },
                { campo: "lineId", lista: "lines", kind: "line", label: "Línea" },
              ] as const
            ).map((grupo) => (
              <Field
                key={grupo.campo}
                label={grupo.label}
                htmlFor={grupo.campo}
                hint={taxonomies[grupo.lista].length === 0 ? sinCargar(grupo.kind) : undefined}
              >
                <Select
                  id={grupo.campo}
                  value={form[grupo.campo]}
                  disabled={taxonomies[grupo.lista].length === 0}
                  onChange={(e) => set(grupo.campo, e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {taxonomies[grupo.lista].map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </Select>
              </Field>
            ))}
          </div>

          {(
            [
              { key: "grapeIds", lista: "grapes", kind: "grape", label: "Varietales" },
              { key: "pairingIds", lista: "pairings", kind: "pairing", label: "Maridajes" },
              { key: "tagIds", lista: "tags", kind: "tag", label: "Etiquetas" },
            ] as const
          ).map((group) => (
            <SelectorMultiple
              key={group.key}
              label={group.label}
              kind={group.kind}
              opciones={taxonomies[group.lista]}
              elegidos={form[group.key]}
              onAlternar={(id) => toggleMulti(group.key, id)}
            />
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
        <AdminCard
          title="Imágenes"
          description="La marcada como principal es la que se ve en el listado de la tienda."
        >
          {/*
            La zona de subida va primero y ocupa lugar. Antes era un botón
            chico debajo de la lista: en un producto nuevo, donde la lista
            está vacía, no se veía dónde había que cargar las fotos.

            Se muestra también en productos nuevos porque subir ya no necesita
            que el producto exista. Lo que sí espera al guardado es reordenar
            y marcar la principal: eso opera sobre filas que todavía no hay.
          */}
          <input
            ref={fileInput}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              void subirVarias(e.target.files);
              e.target.value = "";
            }}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              void subirVarias(e.dataTransfer.files);
            }}
          >
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className={cn(
                "flex w-full flex-col items-center gap-1.5 rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors",
                arrastrando
                  ? "border-carbon-900 bg-linen-100"
                  : "border-linen-300 hover:border-stone-400 hover:bg-linen-100/60",
                uploading && "opacity-60",
              )}
            >
              <ImagePlus className="size-7 text-stone-500" aria-hidden />
              <span className="text-[15px] font-medium text-carbon-900">
                {uploading ? "Subiendo…" : "Subir imágenes"}
              </span>
              <span className="text-[13px] leading-relaxed text-stone-500">
                Arrastralas acá o hacé clic para elegirlas.
                <br />
                JPG, PNG o WebP. Podés elegir varias de una.
              </span>
            </button>
          </div>

          <p className="mt-2.5 text-[13px] leading-relaxed text-stone-500">
            Se sirven optimizadas en WebP/AVIF y en varios tamaños
            automáticamente.
          </p>

          <ul className="mt-4 space-y-2">
                {pendientes.map((m, i) => (
                  <li
                    key={`pendiente-${i}`}
                    className="flex items-center gap-3 border border-dashed border-clay-400 bg-warning-100/40 p-2"
                  >
                    {m.kind === "image" ? (
                      <Image
                        src={m.url}
                        alt=""
                        width={40}
                        height={53}
                        className="h-14 w-10 shrink-0 bg-linen-100 object-contain"
                      />
                    ) : (
                      <span className="grid h-14 w-10 shrink-0 place-items-center bg-linen-100 text-[13px] text-stone-500">
                        video
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-carbon-900">
                        {m.kind === "image" ? "Imagen lista" : "Video listo"}
                      </p>
                      <p className="mt-0.5 text-[13px] text-stone-500">
                        Se guarda con el producto. Todavía no está en la ficha.
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Descartar"
                      onClick={() => setPendientes((p) => p.filter((_, j) => j !== i))}
                      className="rounded-sm p-2 text-stone-500 hover:text-danger-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}

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
                        className="h-10 text-[13px]"
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
                            className="flex items-center gap-1 text-[13px] text-stone-500 hover:text-carbon-900"
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
                          className="text-[13px] text-stone-500 hover:text-carbon-900 disabled:opacity-40"
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
                          className="text-[13px] text-stone-500 hover:text-carbon-900 disabled:opacity-40"
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
                          className="ml-auto text-[13px] text-stone-500 hover:text-danger-500"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
          </ul>

          {gallery.length > 0 && (
            <Button
              size="sm"
              variant="dark"
              className="mt-3"
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
              Guardar orden y textos
            </Button>
          )}
        </AdminCard>

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
                className="text-[13px] underline underline-offset-2 hover:text-accent-700"
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
                  <dt className="text-[12px] uppercase text-stone-500">Físico</dt>
                  <dd className="text-[20px] tabular">{inventory.onHand}</dd>
                </div>
                <div>
                  <dt className="text-[12px] uppercase text-stone-500">Reservado</dt>
                  <dd className="text-[20px] tabular">{inventory.reserved}</dd>
                </div>
                <div>
                  <dt className="text-[12px] uppercase text-stone-500">Disponible</dt>
                  <dd className="text-[20px] tabular font-medium">{inventory.available}</dd>
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
                className="mt-4 inline-block text-[13px] underline underline-offset-2 hover:text-accent-700"
              >
                Registrar movimiento de stock
              </Link>
            )}
          </AdminCard>
        )}


        {videos.length > 0 && (
          <AdminCard title="Videos">
            <ul className="space-y-1.5">
              {videos.map((video) => (
                <li key={video.id} className="truncate text-[13px] text-stone-600">
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

/** "Todavía no hay varietales cargados." Con el género y el plural que van. */
function sinCargar(kind: TaxonomyKind): string {
  const { plural, articulo } = TAXONOMIES[kind];
  return `Todavía no hay ${plural.toLowerCase()} ${articulo === "la" ? "cargadas" : "cargados"}.`;
}

/**
 * Elegir varios valores de una lista: un desplegable y los elegidos abajo.
 *
 * Antes era una fila de botones con todos los valores a la vez. Con veintiún
 * maridajes eso es un muro en el que hay que buscar a ojo cuáles están
 * activados; acá lo elegido se lee de un vistazo porque es lo único que se
 * muestra.
 *
 * El desplegable es el nativo del sistema a propósito: trae la búsqueda por
 * teclado, el teclado de los celulares y el manejo de foco ya resueltos, que
 * es exactamente lo que suele quedar mal en una lista hecha a mano.
 *
 * No se pueden crear valores desde acá. Un valor nuevo toca la tienda entera
 * —aparece como filtro, agrupa productos— y crearlo al pasar, mientras se
 * carga un vino, es como se terminan teniendo tres maridajes casi iguales.
 * Para eso está Clasificación, con el enlace arriba de esta tarjeta.
 */
function SelectorMultiple({
  label,
  kind,
  opciones,
  elegidos,
  onAlternar,
}: {
  label: string;
  kind: TaxonomyKind;
  opciones: TaxonomyOption[];
  elegidos: string[];
  onAlternar: (id: string) => void;
}) {
  const config = TAXONOMIES[kind];
  const id = `multi-${kind}`;
  const disponibles = opciones.filter((o) => !elegidos.includes(o.id));
  /* Se recorre elegidos y no opciones: así los chips guardan el orden en que se agregaron. */
  const puestos = elegidos
    .map((eid) => opciones.find((o) => o.id === eid))
    .filter((o): o is TaxonomyOption => Boolean(o));

  const vacio = opciones.length === 0;
  const completo = !vacio && disponibles.length === 0;

  return (
    <div className="mt-5">
      <Label htmlFor={id}>{label}</Label>

      <Select
        id={id}
        value=""
        disabled={vacio || completo}
        onChange={(e) => {
          if (e.target.value) onAlternar(e.target.value);
        }}
      >
        <option value="">
          {vacio
            ? `No hay ${label.toLowerCase()} para elegir`
            : completo
              ? `Ya elegiste ${config.articulo === "la" ? "todas" : "todos"}`
              : `Agregar ${config.singular}…`}
        </option>
        {disponibles.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </Select>

      {puestos.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {puestos.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onAlternar(o.id)}
                aria-label={`Quitar ${o.name}`}
                className="flex h-8 items-center gap-1.5 rounded-pill border border-carbon-900 bg-carbon-900 pl-3 pr-2 text-[13px] text-bone transition-colors hover:bg-carbon-800"
              >
                {o.name}
                <X className="size-3.5 shrink-0 opacity-70" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {vacio && (
        <p className="mt-1.5 text-[13px] text-stone-500">
          {sinCargar(kind)}{" "}
          <Link
            href={`/admin/clasificacion?tipo=${config.url}`}
            target="_blank"
            className="underline underline-offset-2 hover:text-accent-700"
          >
            Cargalos en Clasificación
          </Link>
          .
        </p>
      )}
    </div>
  );
}
