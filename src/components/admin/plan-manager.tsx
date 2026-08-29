"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { savePlan } from "@/app/actions/admin-subscriptions";
import { formatARS } from "@/lib/money";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/ui/field";
import { Modal } from "@/ui/modal";
import { toast } from "@/ui/toaster";
import { AdminTable, Td } from "./admin-ui";

export type PlanRow = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  price: number;
  frequency: "MONTHLY" | "BIMONTHLY" | "QUARTERLY";
  bottleCount: number;
  imageUrl: string | null;
  perks: string[];
  shippingCost: number | null;
  freeShipping: boolean;
  trialDays: number | null;
  firstCycleDiscountPercent: number | null;
  isActive: boolean;
  featured: boolean;
  sortOrder: number;
  benefitIds: string[];
  subscriberCount: number;
};

const EMPTY = {
  id: undefined as string | undefined,
  name: "", slug: "", tagline: "", description: "",
  price: "", frequency: "MONTHLY" as PlanRow["frequency"], bottleCount: "3",
  imageUrl: "", perks: [""] as string[],
  shippingCost: "", freeShipping: false,
  trialDays: "", firstCycleDiscountPercent: "",
  isActive: true, featured: false, sortOrder: "0",
  benefitIds: [] as string[],
};

const FREQUENCIES = {
  MONTHLY: "Mensual",
  BIMONTHLY: "Cada dos meses",
  QUARTERLY: "Trimestral",
} as const;

export function PlanManager({
  plans,
  benefits,
  canEdit,
}: {
  plans: PlanRow[];
  benefits: { id: string; name: string; code: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const openEdit = (plan: PlanRow) =>
    setForm({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      tagline: plan.tagline ?? "",
      description: plan.description ?? "",
      price: String(plan.price),
      frequency: plan.frequency,
      bottleCount: String(plan.bottleCount),
      imageUrl: plan.imageUrl ?? "",
      perks: plan.perks.length ? plan.perks : [""],
      shippingCost: plan.shippingCost ? String(plan.shippingCost) : "",
      freeShipping: plan.freeShipping,
      trialDays: plan.trialDays ? String(plan.trialDays) : "",
      firstCycleDiscountPercent: plan.firstCycleDiscountPercent
        ? String(plan.firstCycleDiscountPercent)
        : "",
      isActive: plan.isActive,
      featured: plan.featured,
      sortOrder: String(plan.sortOrder),
      benefitIds: plan.benefitIds,
    });

  return (
    <>
      {canEdit && (
        <div className="mb-4">
          <Button variant="dark" size="sm" onClick={() => setForm({ ...EMPTY })}>
            <Plus className="size-3.5" />
            Nuevo plan
          </Button>
        </div>
      )}

      <AdminTable
        headers={[
          "Plan", "Frecuencia",
          { label: "Botellas", align: "right" },
          { label: "Precio", align: "right" },
          "Envío", { label: "Socios", align: "right" },
          "Estado", { label: "", align: "right" },
        ]}
        empty={<p className="text-[13px] text-stone-500">Todavía no hay planes.</p>}
      >
        {plans.map((plan) => (
          <tr key={plan.id}>
            <Td>
              <span className="font-medium">{plan.name}</span>
              {plan.featured && <Badge tone="gold" className="ml-2">Destacado</Badge>}
              {plan.tagline && (
                <span className="block text-[11px] text-stone-500">{plan.tagline}</span>
              )}
            </Td>
            <Td className="text-stone-600">{FREQUENCIES[plan.frequency]}</Td>
            <Td align="right" className="tabular">{plan.bottleCount}</Td>
            <Td align="right" className="whitespace-nowrap tabular">{formatARS(plan.price)}</Td>
            <Td className="text-stone-600">
              {plan.freeShipping ? "Sin cargo" : plan.shippingCost ? formatARS(plan.shippingCost) : "—"}
            </Td>
            <Td align="right" className="tabular">{plan.subscriberCount}</Td>
            <Td>
              <Badge tone={plan.isActive ? "success" : "neutral"}>
                {plan.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </Td>
            <Td align="right">
              {canEdit && (
                <button
                  type="button"
                  aria-label={`Editar ${plan.name}`}
                  onClick={() => openEdit(plan)}
                  className="rounded-sm border border-linen-300 p-1 hover:border-stone-400"
                >
                  <Pencil className="size-3.5" />
                </button>
              )}
            </Td>
          </tr>
        ))}
      </AdminTable>

      <Modal
        open={form !== null}
        onOpenChange={(open) => !open && setForm(null)}
        title={form?.id ? `Editar ${form.name}` : "Nuevo plan del Club"}
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
                  const result = await savePlan({
                    id: form.id,
                    name: form.name,
                    slug: form.slug || undefined,
                    tagline: form.tagline || undefined,
                    description: form.description || undefined,
                    price: Number(form.price || 0),
                    frequency: form.frequency,
                    bottleCount: Number(form.bottleCount || 1),
                    imageUrl: form.imageUrl || undefined,
                    perks: form.perks.filter((p) => p.trim()),
                    shippingCost: form.shippingCost ? Number(form.shippingCost) : null,
                    freeShipping: form.freeShipping,
                    trialDays: form.trialDays ? Number(form.trialDays) : null,
                    firstCycleDiscountPercent: form.firstCycleDiscountPercent
                      ? Number(form.firstCycleDiscountPercent)
                      : null,
                    isActive: form.isActive,
                    featured: form.featured,
                    sortOrder: Number(form.sortOrder || 0),
                    benefitIds: form.benefitIds,
                  });
                  if (result.ok) {
                    toast.success(result.message);
                    setForm(null);
                    router.refresh();
                  } else toast.error(result.error);
                });
              }}
            >
              Guardar plan
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="p-name" required className="sm:col-span-2">
              <Input id="p-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Bajada" htmlFor="p-tagline" className="sm:col-span-2"
              hint="Una línea. Se muestra debajo del nombre en la landing.">
              <Input id="p-tagline" value={form.tagline}
                onChange={(e) => set("tagline", e.target.value)} />
            </Field>
            <Field label="Precio mensual" htmlFor="p-price" required>
              <Input id="p-price" type="number" min={0} step={100} value={form.price}
                onChange={(e) => set("price", e.target.value)} />
            </Field>
            <Field label="Botellas por envío" htmlFor="p-bottles" required>
              <Input id="p-bottles" type="number" min={1} value={form.bottleCount}
                onChange={(e) => set("bottleCount", e.target.value)} />
            </Field>
            <Field label="Frecuencia" htmlFor="p-freq">
              <Select id="p-freq" value={form.frequency}
                onChange={(e) => set("frequency", e.target.value as PlanRow["frequency"])}>
                {Object.entries(FREQUENCIES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Costo de envío" htmlFor="p-ship" hint="Se ignora si el envío es sin cargo.">
              <Input id="p-ship" type="number" min={0} value={form.shippingCost}
                disabled={form.freeShipping}
                onChange={(e) => set("shippingCost", e.target.value)} />
            </Field>
            <Field label="Descuento del primer ciclo (%)" htmlFor="p-disc">
              <Input id="p-disc" type="number" min={0} max={100} value={form.firstCycleDiscountPercent}
                onChange={(e) => set("firstCycleDiscountPercent", e.target.value)} />
            </Field>
            <Field label="Días de prueba" htmlFor="p-trial">
              <Input id="p-trial" type="number" min={0} value={form.trialDays}
                onChange={(e) => set("trialDays", e.target.value)} />
            </Field>
            <Field label="Imagen" htmlFor="p-image" className="sm:col-span-2"
              hint="Ruta de /public o URL del bucket.">
              <Input id="p-image" value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)} />
            </Field>
            <Field label="Descripción" htmlFor="p-desc" className="sm:col-span-2">
              <Textarea id="p-desc" value={form.description}
                onChange={(e) => set("description", e.target.value)} />
            </Field>

            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-[11px] uppercase tracking-wider text-stone-500">
                Qué incluye (se muestra como lista en la card del plan)
              </legend>
              <ul className="space-y-2">
                {form.perks.map((perk, index) => (
                  <li key={index} className="flex gap-2">
                    <Input
                      value={perk}
                      aria-label={`Beneficio ${index + 1}`}
                      onChange={(e) => {
                        const next = [...form.perks];
                        next[index] = e.target.value;
                        set("perks", next);
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Quitar"
                      onClick={() => set("perks", form.perks.filter((_, i) => i !== index))}
                      className="rounded-sm p-2 text-stone-500 hover:text-danger-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="subtle" className="mt-2"
                onClick={() => set("perks", [...form.perks, ""])}>
                <Plus className="size-3.5" />
                Agregar línea
              </Button>
            </fieldset>

            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-[11px] uppercase tracking-wider text-stone-500">
                Beneficios que se aplican automáticamente
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {benefits.map((benefit) => {
                  const active = form.benefitIds.includes(benefit.id);
                  return (
                    <button
                      key={benefit.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        set(
                          "benefitIds",
                          active
                            ? form.benefitIds.filter((id) => id !== benefit.id)
                            : [...form.benefitIds, benefit.id],
                        )
                      }
                      className={`h-7 rounded-pill border px-2.5 text-[12px] ${
                        active
                          ? "border-carbon-900 bg-carbon-900 text-bone"
                          : "border-linen-300 text-carbon-800"
                      }`}
                    >
                      {benefit.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-2.5 sm:col-span-2">
              <label className="flex items-center gap-2.5 text-[13px]">
                <Checkbox checked={form.freeShipping}
                  onChange={(e) => set("freeShipping", e.target.checked)} />
                Envío sin cargo
              </label>
              <label className="flex items-center gap-2.5 text-[13px]">
                <Checkbox checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)} />
                Destacar como «el más elegido»
              </label>
              <label className="flex items-center gap-2.5 text-[13px]">
                <Checkbox checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)} />
                Activo y visible en la landing
              </label>
              <Field label="Orden" htmlFor="p-order" hint="Menor número aparece primero.">
                <Input id="p-order" type="number" value={form.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)} />
              </Field>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
