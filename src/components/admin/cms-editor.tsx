"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { saveCmsSection } from "@/app/actions/admin-cms";
import { BLOCK_LABELS, type BlockType } from "@/domain/cms/blocks";
import { cn } from "@/lib/cn";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/ui/field";
import { toast } from "@/ui/toaster";
import { AdminCard } from "./admin-ui";

export type SectionRow = {
  id: string;
  key: string;
  page: string;
  type: BlockType;
  title: string | null;
  isActive: boolean;
  sortOrder: number;
  data: Record<string, unknown>;
  updatedBy: string | null;
};

type Data = Record<string, unknown>;

/** Campos por tipo de bloque. Evita un page builder libre (spec §44). */
const FIELDS: Record<BlockType, { key: string; label: string; kind: "text" | "textarea" | "select"; options?: string[]; hint?: string }[]> = {
  video_hero: [
    { key: "eyebrow", label: "Volanta", kind: "text" },
    { key: "title", label: "Título", kind: "textarea" },
    { key: "titleAccent", label: "Segunda línea (itálica)", kind: "text", hint: "Se compone debajo del título." },
    { key: "subtitle", label: "Bajada", kind: "textarea" },
    { key: "overlay", label: "Oscurecimiento", kind: "select", options: ["scrim-bottom", "scrim-full", "scrim-side", "none"] },
    { key: "align", label: "Alineación", kind: "select", options: ["center", "left"] },
    { key: "height", label: "Altura", kind: "select", options: ["full", "tall", "medium"] },
    { key: "scale", label: "Escala del título", kind: "select", options: ["page", "hero"] },
    { key: "scrollCue", label: "Indicador de scroll", kind: "text", hint: "Texto corto al pie. Vacío lo oculta." },
  ],
  editorial: [
    { key: "eyebrow", label: "Volanta", kind: "text" },
    { key: "title", label: "Título", kind: "textarea" },
    { key: "body", label: "Texto", kind: "textarea", hint: "Separá párrafos con una línea en blanco." },
    { key: "quote", label: "Cita destacada", kind: "text" },
    { key: "mediaSide", label: "Lado de la foto", kind: "select", options: ["right", "left"] },
    { key: "tone", label: "Fondo", kind: "select", options: ["light", "linen", "dark"] },
    { key: "layout", label: "Composición", kind: "select", options: ["split", "fullBleed", "centered"] },
  ],
  showcase: [
    { key: "eyebrow", label: "Volanta", kind: "text" },
    { key: "title", label: "Título", kind: "textarea" },
    { key: "body", label: "Texto", kind: "textarea" },
    { key: "tone", label: "Fondo", kind: "select", options: ["light", "linen", "dark"] },
  ],
  club_teaser: [
    { key: "eyebrow", label: "Volanta", kind: "text" },
    { key: "title", label: "Título", kind: "textarea" },
    { key: "body", label: "Texto", kind: "textarea" },
  ],
  steps: [
    { key: "eyebrow", label: "Volanta", kind: "text" },
    { key: "title", label: "Título", kind: "textarea" },
    { key: "body", label: "Texto", kind: "textarea" },
    { key: "tone", label: "Fondo", kind: "select", options: ["light", "linen", "dark"] },
  ],
  featured_wines: [
    { key: "eyebrow", label: "Volanta", kind: "text" },
    { key: "title", label: "Título", kind: "textarea" },
    { key: "body", label: "Texto", kind: "textarea" },
    { key: "source", label: "Qué mostrar", kind: "select", options: ["featured", "new", "bestSellers", "line"] },
    { key: "lineSlug", label: "Slug de la línea", kind: "text", hint: "Solo si elegís «line»." },
    { key: "tone", label: "Fondo", kind: "select", options: ["light", "linen", "dark"] },
  ],
  faq: [
    { key: "eyebrow", label: "Volanta", kind: "text" },
    { key: "title", label: "Título", kind: "textarea" },
    { key: "group", label: "Grupo de preguntas", kind: "select", options: ["general", "envios", "club", "pagos"] },
  ],
  footer: [
    { key: "tagline", label: "Bajada de marca", kind: "textarea" },
    { key: "newsletterTitle", label: "Título del newsletter", kind: "text" },
    { key: "newsletterBody", label: "Texto del newsletter", kind: "textarea" },
    { key: "responsibleNote", label: "Consumo responsable", kind: "textarea" },
  ],
  rich_text: [
    { key: "eyebrow", label: "Volanta", kind: "text" },
    { key: "title", label: "Título", kind: "textarea" },
    { key: "body", label: "Texto", kind: "textarea" },
    { key: "tone", label: "Fondo", kind: "select", options: ["light", "linen", "dark"] },
  ],
  statement: [
    { key: "eyebrow", label: "Volanta", kind: "text" },
    { key: "text", label: "Declaración", kind: "textarea", hint: "Corta: se compone muy grande." },
    { key: "textAccent", label: "Cierre en itálica", kind: "text" },
    { key: "attribution", label: "Firma", kind: "text" },
    { key: "backgroundUrl", label: "Foto de fondo (URL)", kind: "text", hint: "Opcional. Se usa muy tenue." },
    { key: "tone", label: "Fondo", kind: "select", options: ["dark", "linen", "light"] },
  ],
  figures: [
    { key: "eyebrow", label: "Volanta", kind: "text" },
    { key: "title", label: "Título", kind: "textarea" },
    { key: "imageUrl", label: "Foto de apoyo (URL)", kind: "text", hint: "Opcional. La usan las variantes que acompañan las cifras con una imagen." },
    { key: "imageAlt", label: "Texto alternativo", kind: "text" },
    { key: "tone", label: "Fondo", kind: "select", options: ["linen", "light", "dark"] },
  ],
  split_sticky: [
    { key: "eyebrow", label: "Volanta", kind: "text" },
    { key: "title", label: "Título", kind: "textarea" },
    { key: "mediaSide", label: "Lado de la foto", kind: "select", options: ["left", "right"] },
    { key: "tone", label: "Fondo", kind: "select", options: ["light", "linen", "dark"] },
  ],
  gallery: [
    { key: "eyebrow", label: "Volanta", kind: "text" },
    { key: "title", label: "Título", kind: "textarea" },
    { key: "body", label: "Texto", kind: "textarea" },
    { key: "tone", label: "Fondo", kind: "select", options: ["light", "linen", "dark"] },
  ],
};

const HAS_MEDIA: BlockType[] = ["video_hero", "editorial", "club_teaser", "split_sticky"];
const HAS_CTA: BlockType[] = ["video_hero", "editorial", "showcase", "club_teaser", "featured_wines", "statement", "split_sticky"];

export function CmsEditor({ sections, canEdit }: { sections: SectionRow[]; canEdit: boolean }) {
  const pages = [...new Set(sections.map((s) => s.page))];
  const [openPage, setOpenPage] = useState(pages[0] ?? "");

  return (
    <div className="space-y-6">
      {pages.map((page) => (
        <div key={page}>
          <button
            type="button"
            onClick={() => setOpenPage(openPage === page ? "" : page)}
            className="mb-3 flex w-full items-center justify-between border-b border-linen-300 pb-2 text-left"
          >
            <span className="text-[13px] font-medium uppercase tracking-wider text-carbon-900">
              {page === "home" ? "Home" : page === "club" ? "Club" : page === "global" ? "Global" : page}
            </span>
            <ChevronDown
              className={cn("size-4 text-stone-500 transition-transform", openPage === page && "rotate-180")}
            />
          </button>

          {openPage === page && (
            <div className="space-y-3">
              {sections
                .filter((s) => s.page === page)
                .map((section) => (
                  <SectionEditor key={section.id} section={section} canEdit={canEdit} />
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SectionEditor({ section, canEdit }: { section: SectionRow; canEdit: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Data>(section.data);
  const [isActive, setIsActive] = useState(section.isActive);
  const [pending, startTransition] = useTransition();

  const fields = FIELDS[section.type] ?? [];
  const media = (data.media ?? {}) as Data;
  const ctaPrimary = (data.ctaPrimary ?? data.cta ?? {}) as Data;
  const ctaKey = data.ctaPrimary !== undefined ? "ctaPrimary" : "cta";
  const bullets = (data.bullets ?? []) as string[];
  const steps = (data.steps ?? []) as { title: string; body: string }[];
  const items = (data.items ?? []) as { title: string; subtitle: string; imageUrl: string; href: string }[];

  const setField = (key: string, value: unknown) => setData((d) => ({ ...d, [key]: value }));
  const setMedia = (key: string, value: string) =>
    setData((d) => ({ ...d, media: { ...((d.media ?? {}) as Data), [key]: value } }));
  const setCta = (key: string, value: string, target = ctaKey) =>
    setData((d) => ({ ...d, [target]: { ...((d[target] ?? {}) as Data), [key]: value } }));

  return (
    <AdminCard
      title={section.title ?? section.key}
      description={`${BLOCK_LABELS[section.type]} · ${section.key}`}
      action={
        <div className="flex items-center gap-2">
          <Badge tone={isActive ? "success" : "neutral"}>{isActive ? "Visible" : "Oculta"}</Badge>
          <Button size="sm" variant="subtle" onClick={() => setOpen(!open)}>
            {open ? "Cerrar" : "Editar"}
          </Button>
        </div>
      }
    >
      {open && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <Field
                key={field.key}
                label={field.label}
                htmlFor={`${section.id}-${field.key}`}
                hint={field.hint}
                className={field.kind === "textarea" ? "sm:col-span-2" : undefined}
              >
                {field.kind === "select" ? (
                  <Select
                    id={`${section.id}-${field.key}`}
                    value={String(data[field.key] ?? "")}
                    disabled={!canEdit}
                    onChange={(e) => setField(field.key, e.target.value)}
                  >
                    {field.options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                ) : field.kind === "textarea" ? (
                  <Textarea
                    id={`${section.id}-${field.key}`}
                    value={String(data[field.key] ?? "")}
                    disabled={!canEdit}
                    onChange={(e) => setField(field.key, e.target.value)}
                  />
                ) : (
                  <Input
                    id={`${section.id}-${field.key}`}
                    value={String(data[field.key] ?? "")}
                    disabled={!canEdit}
                    onChange={(e) => setField(field.key, e.target.value)}
                  />
                )}
              </Field>
            ))}
          </div>

          {HAS_MEDIA.includes(section.type) && (
            <fieldset className="border-t border-linen-200 pt-4">
              <legend className="mb-3 text-[11px] uppercase tracking-wider text-stone-500">
                Fotografía y video
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Imagen / poster" htmlFor={`${section.id}-img`}
                  hint="Ruta de /public o URL del bucket.">
                  <Input id={`${section.id}-img`} value={String(media.imageUrl ?? "")}
                    disabled={!canEdit}
                    onChange={(e) => { setMedia("imageUrl", e.target.value); setMedia("posterUrl", e.target.value); }} />
                </Field>
                <Field label="Texto alternativo" htmlFor={`${section.id}-alt`}>
                  <Input id={`${section.id}-alt`} value={String(media.imageAlt ?? "")}
                    disabled={!canEdit}
                    onChange={(e) => setMedia("imageAlt", e.target.value)} />
                </Field>
                <Field label="Video desktop (mp4)" htmlFor={`${section.id}-vd`}
                  hint="Vacío = solo fotografía.">
                  <Input id={`${section.id}-vd`} value={String(media.videoDesktopUrl ?? "")}
                    disabled={!canEdit}
                    onChange={(e) => setMedia("videoDesktopUrl", e.target.value)} />
                </Field>
                <Field label="Video mobile (mp4)" htmlFor={`${section.id}-vm`}
                  hint="Sin esta fuente, en mobile se muestra la foto.">
                  <Input id={`${section.id}-vm`} value={String(media.videoMobileUrl ?? "")}
                    disabled={!canEdit}
                    onChange={(e) => setMedia("videoMobileUrl", e.target.value)} />
                </Field>
              </div>
            </fieldset>
          )}

          {HAS_CTA.includes(section.type) && (
            <fieldset className="border-t border-linen-200 pt-4">
              <legend className="mb-3 text-[11px] uppercase tracking-wider text-stone-500">
                Botones
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Texto del botón" htmlFor={`${section.id}-cta-label`}>
                  <Input id={`${section.id}-cta-label`} value={String(ctaPrimary.label ?? "")}
                    disabled={!canEdit}
                    onChange={(e) => setCta("label", e.target.value)} />
                </Field>
                <Field label="Link" htmlFor={`${section.id}-cta-href`}>
                  <Input id={`${section.id}-cta-href`} value={String(ctaPrimary.href ?? "")}
                    disabled={!canEdit}
                    onChange={(e) => setCta("href", e.target.value)} />
                </Field>

                {section.type === "video_hero" && (
                  <>
                    <Field label="Botón secundario" htmlFor={`${section.id}-cta2-label`}>
                      <Input
                        id={`${section.id}-cta2-label`}
                        value={String(((data.ctaSecondary ?? {}) as Data).label ?? "")}
                        disabled={!canEdit}
                        onChange={(e) => setCta("label", e.target.value, "ctaSecondary")}
                      />
                    </Field>
                    <Field label="Link secundario" htmlFor={`${section.id}-cta2-href`}>
                      <Input
                        id={`${section.id}-cta2-href`}
                        value={String(((data.ctaSecondary ?? {}) as Data).href ?? "")}
                        disabled={!canEdit}
                        onChange={(e) => setCta("href", e.target.value, "ctaSecondary")}
                      />
                    </Field>
                  </>
                )}
              </div>
            </fieldset>
          )}

          {section.type === "club_teaser" && (
            <ListEditor
              legend="Qué incluye"
              values={bullets}
              disabled={!canEdit}
              onChange={(next) => setField("bullets", next)}
            />
          )}

          {section.type === "steps" && (
            <fieldset className="border-t border-linen-200 pt-4">
              <legend className="mb-3 text-[11px] uppercase tracking-wider text-stone-500">Pasos</legend>
              <ul className="space-y-3">
                {steps.map((step, index) => (
                  <li key={index} className="grid gap-2 sm:grid-cols-[1fr_2fr_40px]">
                    <Input value={step.title} placeholder="Título" disabled={!canEdit}
                      onChange={(e) => {
                        const next = [...steps];
                        next[index] = { ...step, title: e.target.value };
                        setField("steps", next);
                      }} />
                    <Input value={step.body} placeholder="Descripción" disabled={!canEdit}
                      onChange={(e) => {
                        const next = [...steps];
                        next[index] = { ...step, body: e.target.value };
                        setField("steps", next);
                      }} />
                    <button type="button" aria-label="Quitar paso" disabled={!canEdit}
                      onClick={() => setField("steps", steps.filter((_, i) => i !== index))}
                      className="rounded-sm p-2 text-stone-500 hover:text-danger-500">
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              {canEdit && (
                <Button size="sm" variant="subtle" className="mt-2"
                  onClick={() => setField("steps", [...steps, { title: "", body: "" }])}>
                  <Plus className="size-3.5" /> Agregar paso
                </Button>
              )}
            </fieldset>
          )}

          {section.type === "showcase" && (
            <fieldset className="border-t border-linen-200 pt-4">
              <legend className="mb-3 text-[11px] uppercase tracking-wider text-stone-500">
                Colecciones
              </legend>
              <ul className="space-y-3">
                {items.map((item, index) => (
                  <li key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_1.2fr_1fr_40px]">
                    <Input value={item.title} placeholder="Título" disabled={!canEdit}
                      onChange={(e) => {
                        const next = [...items];
                        next[index] = { ...item, title: e.target.value };
                        setField("items", next);
                      }} />
                    <Input value={item.subtitle} placeholder="Bajada" disabled={!canEdit}
                      onChange={(e) => {
                        const next = [...items];
                        next[index] = { ...item, subtitle: e.target.value };
                        setField("items", next);
                      }} />
                    <Input value={item.imageUrl} placeholder="Imagen" disabled={!canEdit}
                      onChange={(e) => {
                        const next = [...items];
                        next[index] = { ...item, imageUrl: e.target.value };
                        setField("items", next);
                      }} />
                    <Input value={item.href} placeholder="Link" disabled={!canEdit}
                      onChange={(e) => {
                        const next = [...items];
                        next[index] = { ...item, href: e.target.value };
                        setField("items", next);
                      }} />
                    <button type="button" aria-label="Quitar" disabled={!canEdit}
                      onClick={() => setField("items", items.filter((_, i) => i !== index))}
                      className="rounded-sm p-2 text-stone-500 hover:text-danger-500">
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              {canEdit && (
                <Button size="sm" variant="subtle" className="mt-2"
                  onClick={() =>
                    setField("items", [...items, { title: "", subtitle: "", imageUrl: "", href: "/vinos" }])
                  }>
                  <Plus className="size-3.5" /> Agregar colección
                </Button>
              )}
            </fieldset>
          )}

          {canEdit && (
            <div className="flex flex-wrap items-center gap-3 border-t border-linen-200 pt-4">
              <Button
                variant="dark"
                size="sm"
                loading={pending}
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await saveCmsSection({
                      id: section.id,
                      title: section.title ?? undefined,
                      isActive,
                      sortOrder: section.sortOrder,
                      data,
                    });
                    if (result.ok) {
                      toast.success(result.message);
                      router.refresh();
                    } else toast.error(result.error);
                  })
                }
              >
                Guardar sección
              </Button>
              <label className="flex items-center gap-2.5 text-[13px]">
                <Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Sección visible en el sitio
              </label>
              {section.updatedBy && (
                <span className="text-[11px] text-stone-500">
                  Última edición: {section.updatedBy}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </AdminCard>
  );
}

function ListEditor({
  legend,
  values,
  disabled,
  onChange,
}: {
  legend: string;
  values: string[];
  disabled: boolean;
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className="border-t border-linen-200 pt-4">
      <legend className="mb-3 text-[11px] uppercase tracking-wider text-stone-500">{legend}</legend>
      <ul className="space-y-2">
        {values.map((value, index) => (
          <li key={index} className="flex gap-2">
            <Input
              value={value}
              disabled={disabled}
              aria-label={`${legend} ${index + 1}`}
              onChange={(e) => {
                const next = [...values];
                next[index] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              aria-label="Quitar"
              disabled={disabled}
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="rounded-sm p-2 text-stone-500 hover:text-danger-500"
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      {!disabled && (
        <Button size="sm" variant="subtle" className="mt-2" onClick={() => onChange([...values, ""])}>
          <Plus className="size-3.5" /> Agregar
        </Button>
      )}
    </fieldset>
  );
}
