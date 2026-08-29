"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { saveBox } from "@/app/actions/admin-subscriptions";
import { formatARS } from "@/lib/money";
import { cn } from "@/lib/cn";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/ui/field";
import { toast } from "@/ui/toaster";
import { AdminCard, AdminTable, Td } from "./admin-ui";

export type BoxWine = {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  available: number;
};

export type BoxState = {
  planId: string;
  planName: string;
  subscriberCount: number;
  periodMonth: number;
  periodYear: number;
  name: string;
  curatorNote: string;
  isPublished: boolean;
  items: { productId: string; quantity: number }[];
};

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/**
 * Armado del box del mes (spec §16): productos, cantidades, costo interno,
 * valor comercial, stock necesario según suscriptores y faltante.
 */
export function BoxBuilder({
  initial,
  wines,
  canEdit,
}: {
  initial: BoxState;
  wines: BoxWine[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();

  const wineById = (id: string) => wines.find((w) => w.id === id);

  const estimatedCost = state.items.reduce(
    (acc, item) => acc + (wineById(item.productId)?.cost ?? 0) * item.quantity, 0,
  );
  const commercialValue = state.items.reduce(
    (acc, item) => acc + (wineById(item.productId)?.price ?? 0) * item.quantity, 0,
  );
  const bottles = state.items.reduce((acc, item) => acc + item.quantity, 0);

  const requirements = state.items.map((item) => {
    const wine = wineById(item.productId);
    const needed = item.quantity * state.subscriberCount;
    const available = wine?.available ?? 0;
    return {
      productId: item.productId,
      name: wine?.name ?? "—",
      sku: wine?.sku ?? "",
      perBox: item.quantity,
      needed,
      available,
      missing: Math.max(0, needed - available),
    };
  });

  const totalMissing = requirements.reduce((acc, r) => acc + r.missing, 0);

  const navigate = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.push(`?${next.toString()}`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        <AdminCard title="Período y plan">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Plan" htmlFor="box-plan">
              <Select
                id="box-plan"
                value={state.planId}
                onChange={(e) => navigate("plan", e.target.value)}
              >
                <option value={state.planId}>{state.planName}</option>
              </Select>
            </Field>
            <Field label="Mes" htmlFor="box-month">
              <Select
                id="box-month"
                value={String(state.periodMonth)}
                onChange={(e) => navigate("mes", e.target.value)}
              >
                {MONTHS.map((month, i) => (
                  <option key={month} value={i + 1}>{month}</option>
                ))}
              </Select>
            </Field>
            <Field label="Año" htmlFor="box-year">
              <Input
                id="box-year"
                type="number"
                value={state.periodYear}
                onChange={(e) => navigate("anio", e.target.value)}
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Vinos del box" description={`${bottles} botellas por caja`}>
          <ul className="space-y-2">
            {state.items.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <Select
                  value={item.productId}
                  aria-label="Vino"
                  className="flex-1"
                  disabled={!canEdit}
                  onChange={(e) => {
                    const next = [...state.items];
                    next[index] = { ...item, productId: e.target.value };
                    setState({ ...state, items: next });
                  }}
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
                  aria-label="Cantidad por caja"
                  className="w-20"
                  disabled={!canEdit}
                  onChange={(e) => {
                    const next = [...state.items];
                    next[index] = { ...item, quantity: Number(e.target.value) || 1 };
                    setState({ ...state, items: next });
                  }}
                />
                {canEdit && (
                  <button
                    type="button"
                    aria-label="Quitar del box"
                    onClick={() =>
                      setState({ ...state, items: state.items.filter((_, i) => i !== index) })
                    }
                    className="rounded-sm p-2 text-stone-500 hover:text-danger-500"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {canEdit && (
            <Button
              size="sm"
              variant="subtle"
              className="mt-3"
              onClick={() =>
                setState({ ...state, items: [...state.items, { productId: "", quantity: 1 }] })
              }
            >
              <Plus className="size-3.5" />
              Agregar vino
            </Button>
          )}
        </AdminCard>

        <AdminCard
          title="Stock necesario"
          description={`${state.subscriberCount} socios activos en este plan`}
          padded={false}
        >
          <AdminTable
            headers={[
              "Vino", { label: "Por caja", align: "right" },
              { label: "Necesario", align: "right" },
              { label: "Disponible", align: "right" },
              { label: "Faltan", align: "right" },
            ]}
            empty={<p className="text-[13px] text-stone-500">Agregá vinos para ver el cálculo.</p>}
          >
            {requirements.map((requirement) => (
              <tr key={requirement.productId} className={cn(requirement.missing > 0 && "bg-danger-100/40")}>
                <Td>
                  {requirement.name}
                  <span className="ml-1.5 text-[11px] text-stone-500">{requirement.sku}</span>
                </Td>
                <Td align="right" className="tabular">{requirement.perBox}</Td>
                <Td align="right" className="tabular">{requirement.needed}</Td>
                <Td align="right" className="tabular">{requirement.available}</Td>
                <Td align="right" className={cn("tabular", requirement.missing > 0 && "font-medium text-danger-500")}>
                  {requirement.missing > 0 ? requirement.missing : "—"}
                </Td>
              </tr>
            ))}
          </AdminTable>
        </AdminCard>
      </div>

      <div className="space-y-4">
        <AdminCard title="Resumen">
          <dl className="space-y-2.5 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-stone-500">Botellas por caja</dt>
              <dd className="tabular">{bottles}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Costo interno estimado</dt>
              <dd className="tabular">{formatARS(estimatedCost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Valor comercial</dt>
              <dd className="tabular">{formatARS(commercialValue)}</dd>
            </div>
            <div className="flex justify-between border-t border-linen-200 pt-2">
              <dt className="text-stone-500">Margen por caja</dt>
              <dd className="tabular">{formatARS(commercialValue - estimatedCost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Suscriptores activos</dt>
              <dd className="tabular">{state.subscriberCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Botellas totales necesarias</dt>
              <dd className="tabular">{bottles * state.subscriberCount}</dd>
            </div>
          </dl>

          {totalMissing > 0 && (
            <p className="mt-4 flex items-start gap-2 border border-danger-500/30 bg-danger-100 px-3 py-2.5 text-[12px] leading-relaxed text-danger-500">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              Faltan {totalMissing} botellas para cubrir a todos los socios. Registrá el ingreso en
              Stock o cambiá algún vino del box.
            </p>
          )}
        </AdminCard>

        <AdminCard title="Publicación">
          <div className="space-y-4">
            <Field label="Nombre del box" htmlFor="box-name" hint="Opcional. Ej.: «Selección de otoño».">
              <Input
                id="box-name"
                value={state.name}
                disabled={!canEdit}
                onChange={(e) => setState({ ...state, name: e.target.value })}
              />
            </Field>
            <Field
              label="Nota del enólogo"
              htmlFor="box-note"
              hint="La ven los socios en Mi Cuenta si el box está publicado."
            >
              <Textarea
                id="box-note"
                value={state.curatorNote}
                maxLength={1000}
                disabled={!canEdit}
                onChange={(e) => setState({ ...state, curatorNote: e.target.value })}
              />
            </Field>
            <label className="flex items-center gap-2.5 text-[13px]">
              <Checkbox
                checked={state.isPublished}
                disabled={!canEdit}
                onChange={(e) => setState({ ...state, isPublished: e.target.checked })}
              />
              Mostrar la selección a los socios
            </label>

            {canEdit && (
              <Button
                variant="dark"
                block
                loading={pending}
                disabled={pending || state.items.length === 0}
                onClick={() =>
                  startTransition(async () => {
                    const result = await saveBox({
                      planId: state.planId,
                      periodMonth: state.periodMonth,
                      periodYear: state.periodYear,
                      name: state.name || undefined,
                      curatorNote: state.curatorNote || undefined,
                      isPublished: state.isPublished,
                      items: state.items.filter((i) => i.productId),
                    });
                    if (result.ok) {
                      toast.success(result.message);
                      router.refresh();
                    } else toast.error(result.error);
                  })
                }
              >
                Guardar box
              </Button>
            )}

            <p className="text-[11px] leading-relaxed text-stone-500">
              Editar el box no cambia los pedidos ya generados: cada pedido guarda su propio
              snapshot con los vinos y precios del momento.
            </p>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
