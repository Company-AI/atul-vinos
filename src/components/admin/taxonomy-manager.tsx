"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteTaxonomy, saveRegion, saveWinery } from "@/app/actions/admin-taxonomies";
import { AdminCard, AdminTable, Td } from "./admin-ui";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/ui/field";
import { toast } from "@/ui/toaster";

export type TaxonomyRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  productCount: number;
  imageUrl: string | null;
  /** Sólo regiones. */
  province?: string | null;
  country?: string | null;
  /** story en bodegas, description en regiones. */
  text: string | null;
};

type Draft = {
  id?: string;
  name: string;
  slug: string;
  province: string;
  country: string;
  text: string;
  imageUrl: string;
  isActive: boolean;
};

const vacio: Draft = {
  name: "",
  slug: "",
  province: "",
  country: "Argentina",
  text: "",
  imageUrl: "",
  isActive: true,
};

export function TaxonomyManager({
  kind,
  rows,
  canEdit,
  canDelete,
}: {
  kind: "winery" | "region";
  rows: TaxonomyRow[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<Draft | null>(null);

  const esBodega = kind === "winery";
  const singular = esBodega ? "bodega" : "región";

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const abrirNueva = () => setDraft({ ...vacio });

  const abrirEdicion = (row: TaxonomyRow) =>
    setDraft({
      id: row.id,
      name: row.name,
      slug: row.slug,
      province: row.province ?? "",
      country: row.country ?? "Argentina",
      text: row.text ?? "",
      imageUrl: row.imageUrl ?? "",
      isActive: row.isActive,
    });

  const guardar = () => {
    if (!draft) return;
    start(async () => {
      const result = esBodega
        ? await saveWinery({
            id: draft.id,
            name: draft.name,
            slug: draft.slug,
            story: draft.text,
            imageUrl: draft.imageUrl,
            isActive: draft.isActive,
          })
        : await saveRegion({
            id: draft.id,
            name: draft.name,
            slug: draft.slug,
            province: draft.province,
            country: draft.country,
            description: draft.text,
            imageUrl: draft.imageUrl,
            isActive: draft.isActive,
          });

      if (result.ok) {
        toast.success(result.message);
        setDraft(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const borrar = (row: TaxonomyRow) => {
    if (!confirm(`¿Eliminar ${row.name}? No se puede deshacer.`)) return;
    start(async () => {
      const result = await deleteTaxonomy(kind, row.id);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {canEdit && !draft && (
        <Button onClick={abrirNueva} variant="dark">
          <Plus className="size-4" aria-hidden />
          Nueva {singular}
        </Button>
      )}

      {draft && (
        <AdminCard
          title={draft.id ? `Editar ${singular}` : `Nueva ${singular}`}
          action={
            <button type="button" onClick={() => setDraft(null)} aria-label="Cerrar" className="p-1.5">
              <X className="size-4" aria-hidden />
            </button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="tax-name">
              <Input
                id="tax-name"
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={esBodega ? "Bodega Colomé" : "Valle de Cafayate"}
              />
            </Field>

            <Field
              label="Slug"
              htmlFor="tax-slug"
              hint="Se usa en los filtros públicos. Vacío lo genera del nombre."
            >
              <Input
                id="tax-slug"
                value={draft.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder={esBodega ? "bodega-colome" : "valle-de-cafayate"}
              />
            </Field>

            {!esBodega && (
              <>
                <Field label="Provincia" htmlFor="tax-province">
                  <Input
                    id="tax-province"
                    value={draft.province}
                    onChange={(e) => set("province", e.target.value)}
                    placeholder="Salta"
                  />
                </Field>
                <Field label="País" htmlFor="tax-country">
                  <Input
                    id="tax-country"
                    value={draft.country}
                    onChange={(e) => set("country", e.target.value)}
                  />
                </Field>
              </>
            )}

            <Field label="Foto (URL)" htmlFor="tax-image" className="sm:col-span-2">
              <Input
                id="tax-image"
                value={draft.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                placeholder="/media/scenes/…"
              />
            </Field>

            <Field
              label={esBodega ? "Historia" : "Descripción"}
              htmlFor="tax-text"
              className="sm:col-span-2"
              hint={
                esBodega
                  ? "Aparece en la ficha de los vinos de esta bodega."
                  : "Qué caracteriza a la zona: altura, suelo, clima."
              }
            >
              <Textarea
                id="tax-text"
                rows={4}
                value={draft.text}
                onChange={(e) => set("text", e.target.value)}
              />
            </Field>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5 text-sm">
                <Checkbox
                  checked={draft.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                />
                Activa
              </label>
              <p className="mt-1.5 pl-6.5 text-[12px] text-stone-500">
                Si la desactivás sale de los desplegables y de los filtros públicos, sin tocar los
                productos ya cargados.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={guardar} loading={pending} variant="primary">
              Guardar
            </Button>
            <Button onClick={() => setDraft(null)} variant="quiet">
              Cancelar
            </Button>
          </div>
        </AdminCard>
      )}

      <AdminTable
        headers={[
          "Nombre",
          "Slug",
          ...(esBodega ? [] : ["Provincia"]),
          { label: "Productos", align: "right" as const },
          "Estado",
          { label: "", align: "right" as const },
        ]}
        empty={`Todavía no hay ${esBodega ? "bodegas" : "regiones"} cargadas.`}
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <Td>
              <span className="font-medium">{row.name}</span>
            </Td>
            <Td>
              <code className="text-[12px] text-stone-500">{row.slug}</code>
            </Td>
            {!esBodega && <Td>{row.province || "—"}</Td>}
            <Td align="right">
              {row.productCount > 0 ? (
                <Link
                  href={`/admin/productos?${esBodega ? "bodega" : "region"}=${row.slug}`}
                  className="tabular underline underline-offset-4"
                >
                  {row.productCount}
                </Link>
              ) : (
                <span className="tabular text-stone-500">0</span>
              )}
            </Td>
            <Td>
              <Badge tone={row.isActive ? "success" : "neutral"}>
                {row.isActive ? "Activa" : "Inactiva"}
              </Badge>
            </Td>
            <Td align="right">
              <div className="flex justify-end gap-1">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => abrirEdicion(row)}
                    aria-label={`Editar ${row.name}`}
                    className="rounded-sm p-2 hover:bg-linen-200"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => borrar(row)}
                    aria-label={`Eliminar ${row.name}`}
                    disabled={pending}
                    className="rounded-sm p-2 text-danger-500 hover:bg-danger-100 disabled:opacity-40"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                )}
              </div>
            </Td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
