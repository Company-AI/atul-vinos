"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteShippingZone, saveShippingZone, toggleCarrier,
} from "@/app/actions/admin-shipping";
import { AR_PROVINCES } from "@/lib/ar";
import { formatARS } from "@/lib/money";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input } from "@/ui/field";
import { ConfirmationModal, Modal } from "@/ui/modal";
import { toast } from "@/ui/toaster";
import { AdminCard, AdminTable, Td } from "./admin-ui";

export type RateRow = {
  id: string;
  name: string;
  price: number;
  freeFrom: number | null;
  etaMinDays: number | null;
  etaMaxDays: number | null;
  carrierCode: string | null;
  isActive: boolean;
};

export type ZoneRow = {
  id: string;
  name: string;
  provinces: string[];
  cities: string[];
  isActive: boolean;
  sortOrder: number;
  rates: RateRow[];
};

export type CarrierRow = {
  code: string;
  name: string;
  isActive: boolean;
  isImplemented: boolean;
  shipmentCount: number;
};

const EMPTY_ZONE = {
  id: undefined as string | undefined,
  name: "",
  provinces: [] as string[],
  cities: "",
  isActive: true,
  sortOrder: "0",
  rates: [
    { name: "Envío estándar", price: "8900", freeFrom: "", etaMinDays: "3", etaMaxDays: "5", carrierCode: "", isActive: true },
  ],
};

export function ShippingManager({
  zones,
  carriers,
  canEdit,
}: {
  zones: ZoneRow[];
  carriers: CarrierRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<typeof EMPTY_ZONE | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const openEdit = (zone: ZoneRow) =>
    setForm({
      id: zone.id,
      name: zone.name,
      provinces: zone.provinces,
      cities: zone.cities.join(", "),
      isActive: zone.isActive,
      sortOrder: String(zone.sortOrder),
      rates: zone.rates.map((rate) => ({
        name: rate.name,
        price: String(rate.price),
        freeFrom: rate.freeFrom ? String(rate.freeFrom) : "",
        etaMinDays: rate.etaMinDays !== null ? String(rate.etaMinDays) : "",
        etaMaxDays: rate.etaMaxDays !== null ? String(rate.etaMaxDays) : "",
        carrierCode: rate.carrierCode ?? "",
        isActive: rate.isActive,
      })),
    });

  return (
    <div className="space-y-4">
      <AdminCard
        title="Transportistas"
        description="El proveedor interno siempre está disponible; los externos se activan al cargar credenciales."
        padded={false}
      >
        <AdminTable
          headers={["Transportista", "Código", "Integración", { label: "Envíos", align: "right" }, "Estado", { label: "", align: "right" }]}
        >
          {carriers.map((carrier) => (
            <tr key={carrier.code}>
              <Td>{carrier.name}</Td>
              <Td className="text-[12px] tabular text-stone-500">{carrier.code}</Td>
              <Td>
                <Badge tone={carrier.isImplemented ? "success" : "warning"}>
                  {carrier.isImplemented ? "Operativa" : "Pendiente de credenciales"}
                </Badge>
              </Td>
              <Td align="right" className="tabular">{carrier.shipmentCount}</Td>
              <Td>
                <Badge tone={carrier.isActive ? "success" : "neutral"}>
                  {carrier.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </Td>
              <Td align="right">
                {canEdit && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await toggleCarrier(carrier.code);
                        if (result.ok) {
                          toast.success(result.message);
                          router.refresh();
                        } else toast.error(result.error);
                      })
                    }
                    className="text-[12px] underline underline-offset-2 hover:text-wine-700"
                  >
                    {carrier.isActive ? "Desactivar" : "Activar"}
                  </button>
                )}
              </Td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>

      <AdminCard
        title="Zonas y tarifas"
        description="Se evalúan en orden: la primera zona que coincide define las opciones de envío."
        padded={false}
        action={
          canEdit ? (
            <Button size="sm" variant="dark" onClick={() => setForm({ ...EMPTY_ZONE })}>
              <Plus className="size-3.5" />
              Nueva zona
            </Button>
          ) : null
        }
      >
        <div className="divide-y divide-linen-200">
          {zones.map((zone) => (
            <div key={zone.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium text-carbon-900">
                    {zone.name}
                    {!zone.isActive && <Badge tone="neutral" className="ml-2">Inactiva</Badge>}
                  </p>
                  <p className="mt-0.5 text-[12px] text-stone-500">
                    {zone.provinces.length === 0 && zone.cities.length === 0
                      ? "Resto del país (zona por defecto)"
                      : [
                          zone.provinces.length ? `Provincias: ${zone.provinces.join(", ")}` : null,
                          zone.cities.length ? `Localidades: ${zone.cities.join(", ")}` : null,
                        ].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label={`Editar ${zone.name}`}
                      onClick={() => openEdit(zone)}
                      className="rounded-sm border border-linen-300 p-1 hover:border-stone-400"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Eliminar ${zone.name}`}
                      onClick={() => setToDelete(zone.id)}
                      className="rounded-sm border border-linen-300 p-1 text-stone-500 hover:border-danger-500 hover:text-danger-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <ul className="mt-3 space-y-1.5">
                {zone.rates.map((rate) => (
                  <li key={rate.id} className="flex flex-wrap items-center gap-3 text-[13px]">
                    <span className="text-carbon-800">{rate.name}</span>
                    <span className="tabular text-carbon-900">
                      {rate.price === 0 ? "Sin cargo" : formatARS(rate.price)}
                    </span>
                    {rate.freeFrom && (
                      <span className="text-[12px] text-success-500">
                        gratis desde {formatARS(rate.freeFrom)}
                      </span>
                    )}
                    {rate.etaMinDays !== null && rate.etaMaxDays !== null && (
                      <span className="text-[12px] text-stone-500">
                        {rate.etaMinDays}–{rate.etaMaxDays} días
                      </span>
                    )}
                    {!rate.isActive && <Badge tone="neutral">Inactiva</Badge>}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {zones.length === 0 && (
            <p className="p-6 text-[13px] text-stone-500">
              Todavía no hay zonas configuradas. Sin zonas, el checkout no puede cotizar el envío.
            </p>
          )}
        </div>
      </AdminCard>

      <Modal
        open={form !== null}
        onOpenChange={(open) => !open && setForm(null)}
        title={form?.id ? `Editar ${form.name}` : "Nueva zona de envío"}
        size="lg"
        footer={
          <>
            <Button variant="subtle" onClick={() => setForm(null)} disabled={pending}>Cancelar</Button>
            <Button
              variant="dark"
              loading={pending}
              disabled={pending}
              onClick={() => {
                if (!form) return;
                startTransition(async () => {
                  const result = await saveShippingZone({
                    id: form.id,
                    name: form.name,
                    provinces: form.provinces,
                    cities: form.cities.split(",").map((c) => c.trim()).filter(Boolean),
                    isActive: form.isActive,
                    sortOrder: Number(form.sortOrder || 0),
                    rates: form.rates.map((rate) => ({
                      name: rate.name,
                      price: Number(rate.price || 0),
                      freeFrom: rate.freeFrom ? Number(rate.freeFrom) : null,
                      etaMinDays: rate.etaMinDays ? Number(rate.etaMinDays) : null,
                      etaMaxDays: rate.etaMaxDays ? Number(rate.etaMaxDays) : null,
                      carrierCode: rate.carrierCode || undefined,
                      isActive: rate.isActive,
                    })),
                  });
                  if (result.ok) {
                    toast.success(result.message);
                    setForm(null);
                    router.refresh();
                  } else toast.error(result.error);
                });
              }}
            >
              Guardar zona
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre de la zona" htmlFor="z-name" required>
                <Input id="z-name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Orden de evaluación" htmlFor="z-order"
                hint="Menor número se evalúa primero.">
                <Input id="z-order" type="number" value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              </Field>
              <Field label="Localidades" htmlFor="z-cities" className="sm:col-span-2"
                hint="Separadas por coma. Vacío = aplica a toda la provincia.">
                <Input id="z-cities" value={form.cities}
                  onChange={(e) => setForm({ ...form, cities: e.target.value })} />
              </Field>
            </div>

            <fieldset>
              <legend className="mb-2 text-[11px] uppercase tracking-wider text-stone-500">
                Provincias
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {AR_PROVINCES.map((province) => {
                  const active = form.provinces.includes(province);
                  return (
                    <button
                      key={province}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setForm({
                          ...form,
                          provinces: active
                            ? form.provinces.filter((p) => p !== province)
                            : [...form.provinces, province],
                        })
                      }
                      className={`h-7 rounded-pill border px-2.5 text-[12px] ${
                        active
                          ? "border-carbon-900 bg-carbon-900 text-bone"
                          : "border-linen-300 text-carbon-800"
                      }`}
                    >
                      {province}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-stone-500">
                Sin provincias ni localidades, la zona funciona como «resto del país».
              </p>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-[11px] uppercase tracking-wider text-stone-500">
                Tarifas
              </legend>
              <ul className="space-y-3">
                {form.rates.map((rate, index) => (
                  <li key={index} className="grid gap-2 border border-linen-200 p-3 sm:grid-cols-6">
                    <Input
                      value={rate.name} placeholder="Nombre" aria-label="Nombre de la tarifa"
                      className="sm:col-span-2"
                      onChange={(e) => {
                        const rates = [...form.rates];
                        rates[index] = { ...rate, name: e.target.value };
                        setForm({ ...form, rates });
                      }}
                    />
                    <Input
                      value={rate.price} type="number" placeholder="Precio" aria-label="Precio"
                      onChange={(e) => {
                        const rates = [...form.rates];
                        rates[index] = { ...rate, price: e.target.value };
                        setForm({ ...form, rates });
                      }}
                    />
                    <Input
                      value={rate.freeFrom} type="number" placeholder="Gratis desde"
                      aria-label="Gratis desde"
                      onChange={(e) => {
                        const rates = [...form.rates];
                        rates[index] = { ...rate, freeFrom: e.target.value };
                        setForm({ ...form, rates });
                      }}
                    />
                    <Input
                      value={rate.etaMinDays} type="number" placeholder="Días mín."
                      aria-label="Días mínimos"
                      onChange={(e) => {
                        const rates = [...form.rates];
                        rates[index] = { ...rate, etaMinDays: e.target.value };
                        setForm({ ...form, rates });
                      }}
                    />
                    <div className="flex gap-2">
                      <Input
                        value={rate.etaMaxDays} type="number" placeholder="Días máx."
                        aria-label="Días máximos"
                        onChange={(e) => {
                          const rates = [...form.rates];
                          rates[index] = { ...rate, etaMaxDays: e.target.value };
                          setForm({ ...form, rates });
                        }}
                      />
                      <button
                        type="button"
                        aria-label="Quitar tarifa"
                        onClick={() =>
                          setForm({ ...form, rates: form.rates.filter((_, i) => i !== index) })
                        }
                        className="rounded-sm p-2 text-stone-500 hover:text-danger-500"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                variant="subtle"
                className="mt-2"
                onClick={() =>
                  setForm({
                    ...form,
                    rates: [
                      ...form.rates,
                      { name: "", price: "0", freeFrom: "", etaMinDays: "", etaMaxDays: "", carrierCode: "", isActive: true },
                    ],
                  })
                }
              >
                <Plus className="size-3.5" /> Agregar tarifa
              </Button>
            </fieldset>

            <label className="flex items-center gap-2.5 text-[13px]">
              <Checkbox checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Zona activa
            </label>
          </div>
        )}
      </Modal>

      <ConfirmationModal
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Eliminar la zona?"
        description="Los pedidos ya generados no se modifican, pero el checkout deja de ofrecer estas tarifas."
        confirmLabel="Eliminar"
        destructive
        loading={pending}
        onConfirm={() => {
          if (!toDelete) return;
          startTransition(async () => {
            const result = await deleteShippingZone(toDelete);
            if (result.ok) toast.success(result.message);
            else toast.error(result.error);
            setToDelete(null);
            router.refresh();
          });
        }}
      />
    </div>
  );
}
