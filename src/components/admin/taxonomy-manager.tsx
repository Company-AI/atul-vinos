"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteTaxonomy, saveTaxonomy } from "@/app/actions/admin-taxonomies";
import { TAXONOMIES, type TaxonomyKind } from "@/domain/catalog/taxonomy-kinds";
import { AdminCard, AdminTable, Td } from "./admin-ui";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/ui/field";
import { toast } from "@/ui/toaster";

/**
 * Una lista de clasificación del catálogo: alta, edición y baja.
 *
 * El mismo componente sirve para las siete listas. Qué campos se muestran sale
 * de TAXONOMIES, no de condicionales sueltos acá adentro: agregar una lista
 * nueva es agregar una entrada en esa tabla.
 */

export type TaxonomyRow = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  isActive?: boolean;
  imageUrl?: string | null;
  text?: string | null;
  province?: string | null;
  country?: string | null;
  sortOrder?: number;
  color?: string | null;
  icon?: string | null;
};

type Draft = {
  id?: string;
  name: string;
  slug: string;
  text: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: string;
  province: string;
  country: string;
  color: string;
  icon: string;
};

const VACIO: Draft = {
  name: "",
  slug: "",
  text: "",
  imageUrl: "",
  isActive: true,
  sortOrder: "0",
  province: "",
  country: "Argentina",
  color: "",
  icon: "",
};

export function TaxonomyManager({
  kind,
  rows,
  canEdit,
  canDelete,
}: {
  kind: TaxonomyKind;
  rows: TaxonomyRow[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<Draft | null>(null);

  const config = TAXONOMIES[kind];
  const { singular } = config;
  /* Varietal y maridaje son masculinos; el resto de las listas, femeninas. */
  const femenino = config.articulo === "la";
  const lo = femenino ? "la" : "lo";

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const abrirEdicion = (row: TaxonomyRow) =>
    setDraft({
      id: row.id,
      name: row.name,
      slug: row.slug,
      text: row.text ?? "",
      imageUrl: row.imageUrl ?? "",
      isActive: row.isActive ?? true,
      sortOrder: String(row.sortOrder ?? 0),
      province: row.province ?? "",
      country: row.country ?? "Argentina",
      color: row.color ?? "",
      icon: row.icon ?? "",
    });

  const guardar = () => {
    if (!draft) return;
    start(async () => {
      const result = await saveTaxonomy({ kind, ...draft });
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
        <Button onClick={() => setDraft({ ...VACIO })} variant="dark">
          <Plus className="size-4" aria-hidden />
          {config.articulo === "la" ? "Nueva" : "Nuevo"} {singular}
        </Button>
      )}

      {draft && (
        <AdminCard
          title={`${draft.id ? "Editar" : config.articulo === "la" ? "Nueva" : "Nuevo"} ${singular}`}
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
                placeholder={config.ejemplo}
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
                placeholder={config.ejemplo.toLowerCase().replace(/\s+/g, "-")}
              />
            </Field>

            {config.conZona && (
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

            {config.conOrden && (
              <Field
                label="Orden"
                htmlFor="tax-sort"
                hint="Más bajo aparece primero en la tienda."
              >
                <Input
                  id="tax-sort"
                  type="number"
                  min={0}
                  value={draft.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)}
                />
              </Field>
            )}

            {config.conIcono && (
              <Field
                label="Ícono"
                htmlFor="tax-icon"
                hint="Opcional. Un emoji o el nombre de un ícono."
              >
                <Input
                  id="tax-icon"
                  value={draft.icon}
                  onChange={(e) => set("icon", e.target.value)}
                  placeholder="🧀"
                />
              </Field>
            )}

            {config.conColor && (
              <Field label="Color" htmlFor="tax-color" hint="Opcional. Hexadecimal, con numeral.">
                <Input
                  id="tax-color"
                  value={draft.color}
                  onChange={(e) => set("color", e.target.value)}
                  placeholder="#7B2D3B"
                />
              </Field>
            )}

            {config.conImagen && (
              <Field label="Foto (URL)" htmlFor="tax-image" className="sm:col-span-2">
                <Input
                  id="tax-image"
                  value={draft.imageUrl}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  placeholder="/media/scenes/…"
                />
              </Field>
            )}

            {config.texto && (
              <Field
                label={config.texto.label}
                htmlFor="tax-text"
                className="sm:col-span-2"
                hint={config.texto.hint}
              >
                <Textarea
                  id="tax-text"
                  rows={4}
                  value={draft.text}
                  onChange={(e) => set("text", e.target.value)}
                />
              </Field>
            )}

            {config.conEstado && (
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={draft.isActive}
                    onChange={(e) => set("isActive", e.target.checked)}
                  />
                  {femenino ? "Activa" : "Activo"}
                </label>
                <p className="mt-1.5 pl-6.5 text-[12px] text-stone-500">
                  Si {lo} desactivás sale de los desplegables y de los filtros públicos, sin tocar
                  los productos ya cargados.
                </p>
              </div>
            )}
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
          ...(config.conZona ? ["Provincia"] : []),
          ...(config.conOrden ? [{ label: "Orden", align: "right" as const }] : []),
          { label: "Productos", align: "right" as const },
          ...(config.conEstado ? ["Estado"] : []),
          { label: "", align: "right" as const },
        ]}
        empty={`Todavía no hay ${config.plural.toLowerCase()} ${femenino ? "cargadas" : "cargados"}. Creá ${femenino ? "la primera" : "el primero"} con el botón de arriba.`}
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <Td>
              <span className="flex items-center gap-2 font-medium">
                {row.color && (
                  <span
                    aria-hidden
                    className="size-3 shrink-0 rounded-full border border-linen-300"
                    style={{ background: row.color }}
                  />
                )}
                {row.icon && <span aria-hidden>{row.icon}</span>}
                {row.name}
              </span>
            </Td>
            <Td>
              <code className="text-[12px] text-stone-500">{row.slug}</code>
            </Td>
            {config.conZona && <Td>{row.province || "—"}</Td>}
            {config.conOrden && (
              <Td align="right">
                <span className="tabular text-stone-500">{row.sortOrder ?? 0}</span>
              </Td>
            )}
            <Td align="right">
              {row.productCount > 0 ? (
                <Link
                  href={`/admin/productos?clasificacion=${config.url}&valor=${row.slug}`}
                  className="tabular underline underline-offset-4"
                >
                  {row.productCount}
                </Link>
              ) : (
                <span className="tabular text-stone-500">0</span>
              )}
            </Td>
            {config.conEstado && (
              <Td>
                <Badge tone={row.isActive ? "success" : "neutral"}>
                  {row.isActive ? "Activ" : "Inactiv"}
                  {femenino ? "a" : "o"}
                </Badge>
              </Td>
            )}
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
