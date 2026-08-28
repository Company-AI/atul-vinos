"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { MovementType } from "@prisma/client";
import { Plus, Settings2 } from "lucide-react";
import { createStockMovement, updateMinStock } from "@/app/actions/admin-stock";
import { cn } from "@/lib/cn";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Field, Input, Select, Textarea } from "@/ui/field";
import { Modal } from "@/ui/modal";
import { toast } from "@/ui/toaster";
import { AdminTable, Td } from "./admin-ui";

export type StockRow = {
  productId: string;
  name: string;
  sku: string;
  onHand: number;
  reserved: number;
  available: number;
  minStock: number;
  location: string | null;
  clubNeeded: number;
};

const MOVEMENT_OPTIONS: { value: MovementType; label: string; help: string }[] = [
  { value: "ENTRADA", label: "Entrada", help: "Ingreso de mercadería: suma al stock físico." },
  { value: "AJUSTE", label: "Ajuste por conteo", help: "Fija el stock físico al valor real contado. Requiere motivo." },
  { value: "ROTURA", label: "Rotura", help: "Descuenta del stock físico." },
  { value: "MERMA", label: "Merma", help: "Descuenta del stock físico." },
  { value: "DEVOLUCION", label: "Devolución", help: "Reingreso de mercadería devuelta." },
  { value: "LIBERACION", label: "Liberar reserva", help: "Libera unidades reservadas sin descontar físico." },
];

export function StockTable({ rows }: { rows: StockRow[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [movementFor, setMovementFor] = useState<StockRow | null>(null);
  const [settingsFor, setSettingsFor] = useState<StockRow | null>(null);
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState<{ type: MovementType; quantity: string; comment: string }>({
    type: "ENTRADA", quantity: "", comment: "",
  });
  const [settingsForm, setSettingsForm] = useState({ minStock: "", location: "" });

  const filter = params.get("filtro");

  const setFilter = (value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("filtro", value);
    else next.delete("filtro");
    router.push(`?${next.toString()}`);
  };

  const openMovement = (row: StockRow) => {
    setForm({ type: "ENTRADA", quantity: "", comment: "" });
    setMovementFor(row);
  };

  const openSettings = (row: StockRow) => {
    setSettingsForm({ minStock: String(row.minStock), location: row.location ?? "" });
    setSettingsFor(row);
  };

  const selectedOption = MOVEMENT_OPTIONS.find((o) => o.value === form.type);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { value: null, label: "Todos" },
          { value: "bajo", label: "Stock bajo" },
          { value: "sin-stock", label: "Sin stock" },
          { value: "club", label: "Comprometido con el Club" },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              "h-8 rounded-sm border px-3 text-[12px] transition-colors",
              filter === option.value || (!filter && option.value === null)
                ? "border-carbon-900 bg-carbon-900 text-bone"
                : "border-linen-300 text-carbon-800 hover:border-stone-400",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <AdminTable
        headers={[
          "Producto", "SKU", "Ubicación",
          { label: "Físico", align: "right" },
          { label: "Reservado", align: "right" },
          { label: "Disponible", align: "right" },
          { label: "Mínimo", align: "right" },
          { label: "Club", align: "right" },
          "Estado",
          { label: "", align: "right" },
        ]}
        empty={<p className="text-[13px] text-stone-500">No hay productos con ese filtro.</p>}
      >
        {rows.map((row) => {
          const critical = row.available <= 0;
          const low = !critical && row.available <= row.minStock;
          const clubShort = row.clubNeeded > row.available;

          return (
            <tr key={row.productId} className={cn(critical && "bg-danger-100/40")}>
              <Td>
                <Link
                  href={`/admin/productos/${row.productId}`}
                  className="hover:text-wine-700"
                >
                  {row.name}
                </Link>
              </Td>
              <Td className="text-stone-500">{row.sku}</Td>
              <Td className="text-stone-500">{row.location ?? "—"}</Td>
              <Td align="right" className="tabular">{row.onHand}</Td>
              <Td align="right" className="tabular text-stone-500">{row.reserved}</Td>
              <Td align="right" className="tabular font-medium">{row.available}</Td>
              <Td align="right" className="tabular text-stone-500">{row.minStock}</Td>
              <Td align="right" className={cn("tabular", clubShort && "text-danger-500")}>
                {row.clubNeeded > 0 ? row.clubNeeded : "—"}
              </Td>
              <Td>
                {critical ? (
                  <Badge tone="danger">Sin stock</Badge>
                ) : low ? (
                  <Badge tone="warning">Reponer</Badge>
                ) : clubShort ? (
                  <Badge tone="info">Falta para el Club</Badge>
                ) : (
                  <Badge tone="success">OK</Badge>
                )}
              </Td>
              <Td align="right">
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    aria-label={`Registrar movimiento de ${row.name}`}
                    onClick={() => openMovement(row)}
                    className="rounded-sm border border-linen-300 p-1 text-carbon-800 hover:border-stone-400"
                  >
                    <Plus className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Editar mínimo y ubicación de ${row.name}`}
                    onClick={() => openSettings(row)}
                    className="rounded-sm border border-linen-300 p-1 text-carbon-800 hover:border-stone-400"
                  >
                    <Settings2 className="size-3.5" />
                  </button>
                </div>
              </Td>
            </tr>
          );
        })}
      </AdminTable>

      {/* Movimiento */}
      <Modal
        open={movementFor !== null}
        onOpenChange={(open) => !open && setMovementFor(null)}
        title={movementFor ? `Movimiento de stock — ${movementFor.name}` : ""}
        description={
          movementFor
            ? `Físico ${movementFor.onHand} · reservado ${movementFor.reserved} · disponible ${movementFor.available}`
            : undefined
        }
        footer={
          <>
            <Button variant="subtle" onClick={() => setMovementFor(null)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="dark"
              loading={pending}
              disabled={pending || form.quantity === ""}
              onClick={() => {
                if (!movementFor) return;
                startTransition(async () => {
                  const result = await createStockMovement({
                    productId: movementFor.productId,
                    type: form.type,
                    quantity: Number(form.quantity),
                    comment: form.comment || undefined,
                  });
                  if (result.ok) {
                    toast.success(result.message);
                    setMovementFor(null);
                    router.refresh();
                  } else {
                    toast.error(result.error);
                  }
                });
              }}
            >
              Registrar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Tipo de movimiento" htmlFor="movement-type" hint={selectedOption?.help}>
            <Select
              id="movement-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as MovementType })}
            >
              {MOVEMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>

          <Field
            label={form.type === "AJUSTE" ? "Stock físico real contado" : "Cantidad"}
            htmlFor="movement-quantity"
            required
          >
            <Input
              id="movement-quantity"
              type="number"
              inputMode="numeric"
              min={0}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </Field>

          <Field
            label="Motivo"
            htmlFor="movement-comment"
            required={form.type === "AJUSTE"}
            hint="Queda en el historial del producto."
          >
            <Textarea
              id="movement-comment"
              value={form.comment}
              maxLength={300}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      {/* Mínimo y ubicación */}
      <Modal
        open={settingsFor !== null}
        onOpenChange={(open) => !open && setSettingsFor(null)}
        title={settingsFor ? `Configuración de stock — ${settingsFor.name}` : ""}
        size="sm"
        footer={
          <>
            <Button variant="subtle" onClick={() => setSettingsFor(null)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="dark"
              loading={pending}
              disabled={pending}
              onClick={() => {
                if (!settingsFor) return;
                startTransition(async () => {
                  const result = await updateMinStock({
                    productId: settingsFor.productId,
                    minStock: Number(settingsForm.minStock),
                    location: settingsForm.location,
                  });
                  if (result.ok) {
                    toast.success(result.message);
                    setSettingsFor(null);
                    router.refresh();
                  } else {
                    toast.error(result.error);
                  }
                });
              }}
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Stock mínimo" htmlFor="min-stock" hint="Por debajo de este valor se muestra la alerta.">
            <Input
              id="min-stock"
              type="number"
              min={0}
              value={settingsForm.minStock}
              onChange={(e) => setSettingsForm({ ...settingsForm, minStock: e.target.value })}
            />
          </Field>
          <Field label="Ubicación en depósito" htmlFor="location" hint="Ej.: A-02-01">
            <Input
              id="location"
              value={settingsForm.location}
              onChange={(e) => setSettingsForm({ ...settingsForm, location: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
