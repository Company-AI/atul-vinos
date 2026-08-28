"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteAddress, saveAddress } from "@/app/actions/account";
import { AR_PROVINCES } from "@/lib/ar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input } from "@/ui/field";
import { ConfirmationModal, Modal } from "@/ui/modal";
import { toast } from "@/ui/toaster";

export type AddressData = {
  id: string;
  label: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  documentId: string | null;
  street: string;
  number: string;
  apartment: string | null;
  city: string;
  province: string;
  postalCode: string;
  reference: string | null;
  isDefaultShipping: boolean;
};

const empty = {
  id: undefined as string | undefined,
  label: "", firstName: "", lastName: "", phone: "", documentId: "",
  street: "", number: "", apartment: "", city: "", province: "",
  postalCode: "", reference: "", isDefaultShipping: false,
};

export function AddressManager({
  addresses,
  defaults,
}: {
  addresses: AddressData[];
  defaults: { firstName: string; lastName: string; phone: string | null };
}) {
  const router = useRouter();
  const [form, setForm] = useState<typeof empty | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const openNew = () =>
    setForm({
      ...empty,
      firstName: defaults.firstName,
      lastName: defaults.lastName,
      phone: defaults.phone ?? "",
      isDefaultShipping: addresses.length === 0,
    });

  const openEdit = (address: AddressData) =>
    setForm({
      id: address.id,
      label: address.label ?? "",
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone ?? "",
      documentId: address.documentId ?? "",
      street: address.street,
      number: address.number,
      apartment: address.apartment ?? "",
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      reference: address.reference ?? "",
      isDefaultShipping: address.isDefaultShipping,
    });

  const set = (key: keyof typeof empty) => (value: string | boolean) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <>
      <div className="mb-6">
        <Button variant="dark" onClick={openNew}>
          <Plus className="size-4" />
          Agregar dirección
        </Button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <li key={address.id} className="border border-linen-200 bg-bone-pure p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[14px] font-medium text-carbon-900">
                  {address.label || `${address.street} ${address.number}`}
                </p>
                {address.isDefaultShipping && (
                  <Badge tone="neutral" className="mt-1.5">Predeterminada</Badge>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Editar dirección"
                  onClick={() => openEdit(address)}
                  className="rounded-sm p-1.5 text-stone-500 transition-colors hover:text-carbon-900"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Eliminar dirección"
                  onClick={() => setToDelete(address.id)}
                  className="rounded-sm p-1.5 text-stone-500 transition-colors hover:text-danger-500"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>

            <address className="mt-3 text-[13px] not-italic leading-relaxed text-stone-600">
              {address.firstName} {address.lastName}<br />
              {address.street} {address.number}
              {address.apartment ? `, ${address.apartment}` : ""}<br />
              {address.city}, {address.province} ({address.postalCode})
              {address.phone ? <><br />{address.phone}</> : null}
            </address>
          </li>
        ))}
      </ul>

      {/* Formulario */}
      <Modal
        open={form !== null}
        onOpenChange={(open) => !open && setForm(null)}
        title={form?.id ? "Editar dirección" : "Nueva dirección"}
        size="lg"
        footer={
          <>
            <Button variant="subtle" onClick={() => setForm(null)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="dark"
              loading={pending}
              disabled={pending}
              onClick={() => {
                if (!form) return;
                startTransition(async () => {
                  const result = await saveAddress({
                    ...form,
                    province: form.province as (typeof AR_PROVINCES)[number],
                  });
                  if (result.ok) {
                    toast.success(result.message);
                    setForm(null);
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
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre de la dirección" htmlFor="a-label" className="sm:col-span-2"
              hint="Ej.: Casa, Trabajo.">
              <Input id="a-label" value={form.label} onChange={(e) => set("label")(e.target.value)} />
            </Field>
            <Field label="Nombre" htmlFor="a-firstName" required>
              <Input id="a-firstName" value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} />
            </Field>
            <Field label="Apellido" htmlFor="a-lastName" required>
              <Input id="a-lastName" value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} />
            </Field>
            <Field label="Teléfono" htmlFor="a-phone">
              <Input id="a-phone" type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
            </Field>
            <Field label="DNI" htmlFor="a-documentId">
              <Input id="a-documentId" inputMode="numeric" value={form.documentId} onChange={(e) => set("documentId")(e.target.value)} />
            </Field>
            <Field label="Calle" htmlFor="a-street" required className="sm:col-span-2">
              <Input id="a-street" value={form.street} onChange={(e) => set("street")(e.target.value)} />
            </Field>
            <Field label="Número" htmlFor="a-number" required>
              <Input id="a-number" value={form.number} onChange={(e) => set("number")(e.target.value)} />
            </Field>
            <Field label="Piso / departamento" htmlFor="a-apartment">
              <Input id="a-apartment" value={form.apartment} onChange={(e) => set("apartment")(e.target.value)} />
            </Field>
            <Field label="Localidad" htmlFor="a-city" required>
              <Input id="a-city" value={form.city} onChange={(e) => set("city")(e.target.value)} />
            </Field>
            <Field label="Provincia" htmlFor="a-province" required>
              <select
                id="a-province"
                value={form.province}
                onChange={(e) => set("province")(e.target.value)}
                className="h-11 w-full rounded-sm border border-linen-300 bg-bone-pure px-3 text-sm"
              >
                <option value="">Elegí una provincia</option>
                {AR_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Código postal" htmlFor="a-postalCode" required>
              <Input id="a-postalCode" inputMode="numeric" value={form.postalCode} onChange={(e) => set("postalCode")(e.target.value)} />
            </Field>
            <Field label="Referencia" htmlFor="a-reference" className="sm:col-span-2">
              <Input id="a-reference" value={form.reference} onChange={(e) => set("reference")(e.target.value)} />
            </Field>
            <label className="flex items-center gap-2.5 text-[14px] text-carbon-800 sm:col-span-2">
              <Checkbox
                checked={form.isDefaultShipping}
                onChange={(e) => set("isDefaultShipping")(e.target.checked)}
              />
              Usar como dirección predeterminada de envío
            </label>
          </div>
        )}
      </Modal>

      <ConfirmationModal
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Eliminar esta dirección?"
        description="No afecta a los pedidos ya realizados."
        confirmLabel="Eliminar"
        destructive
        loading={pending}
        onConfirm={() => {
          if (!toDelete) return;
          startTransition(async () => {
            const result = await deleteAddress(toDelete);
            if (result.ok) {
              toast.success(result.message);
              setToDelete(null);
              router.refresh();
            } else {
              toast.error(result.error);
              setToDelete(null);
            }
          });
        }}
      />
    </>
  );
}
