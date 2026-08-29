"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { saveCoupon, toggleCoupon } from "@/app/actions/admin-coupons";
import { formatARS } from "@/lib/money";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/ui/field";
import { Modal } from "@/ui/modal";
import { toast } from "@/ui/toaster";
import { AdminTable, Td } from "./admin-ui";

export type CouponRow = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: number;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  minPurchase: number | null;
  maxUses: number | null;
  maxUsesPerUser: number | null;
  usedCount: number;
  clubMembersOnly: boolean;
  firstPurchaseOnly: boolean;
  isActive: boolean;
  productIds: string[];
  categoryIds: string[];
  vigencia: string;
};

const EMPTY = {
  id: undefined as string | undefined,
  code: "", type: "PERCENT" as CouponRow["type"], value: "10",
  description: "", startsAt: "", endsAt: "",
  minPurchase: "", maxUses: "", maxUsesPerUser: "1",
  clubMembersOnly: false, firstPurchaseOnly: false, isActive: true,
  productIds: [] as string[], categoryIds: [] as string[],
};

export function CouponManager({
  coupons,
  categories,
  canEdit,
}: {
  coupons: CouponRow[];
  categories: { id: string; name: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const openEdit = (coupon: CouponRow) =>
    setForm({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      description: coupon.description ?? "",
      startsAt: coupon.startsAt ?? "",
      endsAt: coupon.endsAt ?? "",
      minPurchase: coupon.minPurchase ? String(coupon.minPurchase) : "",
      maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
      maxUsesPerUser: coupon.maxUsesPerUser ? String(coupon.maxUsesPerUser) : "",
      clubMembersOnly: coupon.clubMembersOnly,
      firstPurchaseOnly: coupon.firstPurchaseOnly,
      isActive: coupon.isActive,
      productIds: coupon.productIds,
      categoryIds: coupon.categoryIds,
    });

  const describe = (coupon: CouponRow) =>
    coupon.type === "PERCENT"
      ? `${coupon.value}%`
      : coupon.type === "FIXED"
        ? formatARS(coupon.value)
        : "Envío gratis";

  return (
    <>
      {canEdit && (
        <div className="mb-4">
          <Button variant="dark" size="sm" onClick={() => setForm({ ...EMPTY })}>
            <Plus className="size-3.5" />
            Nuevo cupón
          </Button>
        </div>
      )}

      <AdminTable
        headers={[
          "Código", "Descuento", "Vigencia",
          { label: "Mínimo", align: "right" },
          { label: "Usos", align: "right" },
          "Restricciones", "Estado", { label: "", align: "right" },
        ]}
        empty={<p className="text-[13px] text-stone-500">Todavía no hay cupones.</p>}
      >
        {coupons.map((coupon) => (
          <tr key={coupon.id}>
            <Td>
              <span className="font-medium tracking-wide">{coupon.code}</span>
              {coupon.description && (
                <span className="block text-[11px] text-stone-500">{coupon.description}</span>
              )}
            </Td>
            <Td>{describe(coupon)}</Td>
            <Td className="whitespace-nowrap text-stone-500">{coupon.vigencia}</Td>
            <Td align="right" className="tabular">
              {coupon.minPurchase ? formatARS(coupon.minPurchase) : "—"}
            </Td>
            <Td align="right" className="tabular">
              {coupon.usedCount}
              {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
            </Td>
            <Td>
              <div className="flex flex-wrap gap-1">
                {coupon.clubMembersOnly && <Badge tone="gold">Solo socios</Badge>}
                {coupon.firstPurchaseOnly && <Badge tone="outline">Primera compra</Badge>}
                {coupon.categoryIds.length > 0 && <Badge tone="outline">Por categoría</Badge>}
                {coupon.productIds.length > 0 && <Badge tone="outline">Por producto</Badge>}
              </div>
            </Td>
            <Td>
              <Badge tone={coupon.isActive ? "success" : "neutral"}>
                {coupon.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </Td>
            <Td align="right">
              {canEdit && (
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    aria-label={`Editar ${coupon.code}`}
                    onClick={() => openEdit(coupon)}
                    className="rounded-sm border border-linen-300 p-1 hover:border-stone-400"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await toggleCoupon(coupon.id);
                        if (result.ok) {
                          toast.success(result.message);
                          router.refresh();
                        } else toast.error(result.error);
                      })
                    }
                    className="text-[12px] underline underline-offset-2 hover:text-wine-700"
                  >
                    {coupon.isActive ? "Desactivar" : "Activar"}
                  </button>
                </div>
              )}
            </Td>
          </tr>
        ))}
      </AdminTable>

      <Modal
        open={form !== null}
        onOpenChange={(open) => !open && setForm(null)}
        title={form?.id ? `Editar ${form.code}` : "Nuevo cupón"}
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
                  const result = await saveCoupon({
                    id: form.id,
                    code: form.code,
                    type: form.type,
                    value: Number(form.value || 0),
                    description: form.description || undefined,
                    startsAt: form.startsAt || undefined,
                    endsAt: form.endsAt || undefined,
                    minPurchase: form.minPurchase ? Number(form.minPurchase) : null,
                    maxUses: form.maxUses ? Number(form.maxUses) : null,
                    maxUsesPerUser: form.maxUsesPerUser ? Number(form.maxUsesPerUser) : null,
                    clubMembersOnly: form.clubMembersOnly,
                    firstPurchaseOnly: form.firstPurchaseOnly,
                    isActive: form.isActive,
                    productIds: form.productIds,
                    categoryIds: form.categoryIds,
                  });
                  if (result.ok) {
                    toast.success(result.message);
                    setForm(null);
                    router.refresh();
                  } else toast.error(result.error);
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
            <Field label="Código" htmlFor="c-code" required hint="Se guarda en mayúsculas.">
              <Input
                id="c-code"
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
              />
            </Field>
            <Field label="Tipo" htmlFor="c-type">
              <Select
                id="c-type"
                value={form.type}
                onChange={(e) => set("type", e.target.value as CouponRow["type"])}
              >
                <option value="PERCENT">Porcentaje</option>
                <option value="FIXED">Monto fijo</option>
                <option value="FREE_SHIPPING">Envío gratis</option>
              </Select>
            </Field>

            {form.type !== "FREE_SHIPPING" && (
              <Field
                label={form.type === "PERCENT" ? "Porcentaje" : "Monto del descuento"}
                htmlFor="c-value"
                required
              >
                <Input
                  id="c-value"
                  type="number"
                  min={0}
                  value={form.value}
                  onChange={(e) => set("value", e.target.value)}
                />
              </Field>
            )}

            <Field label="Compra mínima" htmlFor="c-min" hint="Opcional.">
              <Input
                id="c-min"
                type="number"
                min={0}
                value={form.minPurchase}
                onChange={(e) => set("minPurchase", e.target.value)}
              />
            </Field>

            <Field label="Desde" htmlFor="c-from">
              <Input id="c-from" type="date" value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)} />
            </Field>
            <Field label="Hasta" htmlFor="c-to">
              <Input id="c-to" type="date" value={form.endsAt}
                onChange={(e) => set("endsAt", e.target.value)} />
            </Field>

            <Field label="Máximo de usos totales" htmlFor="c-max" hint="Vacío = sin límite.">
              <Input id="c-max" type="number" min={1} value={form.maxUses}
                onChange={(e) => set("maxUses", e.target.value)} />
            </Field>
            <Field label="Máximo por cliente" htmlFor="c-max-user">
              <Input id="c-max-user" type="number" min={1} value={form.maxUsesPerUser}
                onChange={(e) => set("maxUsesPerUser", e.target.value)} />
            </Field>

            <Field label="Descripción" htmlFor="c-desc" className="sm:col-span-2">
              <Textarea id="c-desc" value={form.description} maxLength={200}
                onChange={(e) => set("description", e.target.value)} />
            </Field>

            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-[11px] uppercase tracking-wider text-stone-500">
                Alcance por categoría
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((category) => {
                  const active = form.categoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        set(
                          "categoryIds",
                          active
                            ? form.categoryIds.filter((id) => id !== category.id)
                            : [...form.categoryIds, category.id],
                        )
                      }
                      className={`h-7 rounded-pill border px-2.5 text-[12px] ${
                        active
                          ? "border-carbon-900 bg-carbon-900 text-bone"
                          : "border-linen-300 text-carbon-800"
                      }`}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-stone-500">
                Sin selección, el cupón aplica a todo el catálogo.
              </p>
            </fieldset>

            <div className="space-y-2.5 sm:col-span-2">
              <label className="flex items-center gap-2.5 text-[13px]">
                <Checkbox
                  checked={form.clubMembersOnly}
                  onChange={(e) => set("clubMembersOnly", e.target.checked)}
                />
                Exclusivo para socios del Club
              </label>
              <label className="flex items-center gap-2.5 text-[13px]">
                <Checkbox
                  checked={form.firstPurchaseOnly}
                  onChange={(e) => set("firstPurchaseOnly", e.target.checked)}
                />
                Solo en la primera compra
              </label>
              <label className="flex items-center gap-2.5 text-[13px]">
                <Checkbox
                  checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                />
                Activo
              </label>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
