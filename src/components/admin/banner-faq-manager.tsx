"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteBanner, deleteFaq, saveBanner, saveFaq } from "@/app/actions/admin-cms";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/ui/field";
import { ConfirmationModal, Modal } from "@/ui/modal";
import { toast } from "@/ui/toaster";
import { AdminTable, Td } from "./admin-ui";

export type BannerRow = {
  id: string;
  message: string;
  linkUrl: string | null;
  linkLabel: string | null;
  position: string;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_BANNER = {
  id: undefined as string | undefined,
  message: "", linkUrl: "", linkLabel: "",
  position: "top" as "top" | "home" | "shop",
  startsAt: "", endsAt: "", isActive: true, sortOrder: "0",
};

export function BannerManager({ banners, canEdit }: { banners: BannerRow[]; canEdit: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<typeof EMPTY_BANNER | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      {canEdit && (
        <div className="mb-4">
          <Button variant="dark" size="sm" onClick={() => setForm({ ...EMPTY_BANNER })}>
            <Plus className="size-3.5" />
            Nuevo banner
          </Button>
        </div>
      )}

      <AdminTable
        headers={["Mensaje", "Ubicación", "Link", "Vigencia", "Estado", { label: "", align: "right" }]}
        empty={<p className="text-[13px] text-stone-500">No hay banners cargados.</p>}
      >
        {banners.map((banner) => (
          <tr key={banner.id}>
            <Td className="max-w-[320px]">{banner.message}</Td>
            <Td className="text-stone-600">
              {banner.position === "top" ? "Barra superior" : banner.position === "shop" ? "Tienda" : "Home"}
            </Td>
            <Td className="text-[12px] text-stone-500">
              {banner.linkUrl ? `${banner.linkLabel ?? "Ver"} → ${banner.linkUrl}` : "—"}
            </Td>
            <Td className="whitespace-nowrap text-[12px] text-stone-500">
              {banner.startsAt || banner.endsAt
                ? `${banner.startsAt ?? "—"} a ${banner.endsAt ?? "—"}`
                : "Sin límite"}
            </Td>
            <Td>
              <Badge tone={banner.isActive ? "success" : "neutral"}>
                {banner.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </Td>
            <Td align="right">
              {canEdit && (
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    aria-label="Editar banner"
                    onClick={() =>
                      setForm({
                        id: banner.id,
                        message: banner.message,
                        linkUrl: banner.linkUrl ?? "",
                        linkLabel: banner.linkLabel ?? "",
                        position: banner.position as "top" | "home" | "shop",
                        startsAt: banner.startsAt ?? "",
                        endsAt: banner.endsAt ?? "",
                        isActive: banner.isActive,
                        sortOrder: String(banner.sortOrder),
                      })
                    }
                    className="rounded-sm border border-linen-300 p-1 hover:border-stone-400"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Eliminar banner"
                    onClick={() => setToDelete(banner.id)}
                    className="rounded-sm border border-linen-300 p-1 text-stone-500 hover:border-danger-500 hover:text-danger-500"
                  >
                    <Trash2 className="size-3.5" />
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
        title={form?.id ? "Editar banner" : "Nuevo banner"}
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
                  const result = await saveBanner({
                    ...form,
                    sortOrder: Number(form.sortOrder || 0),
                    linkUrl: form.linkUrl || undefined,
                    linkLabel: form.linkLabel || undefined,
                    startsAt: form.startsAt || undefined,
                    endsAt: form.endsAt || undefined,
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
            <Field label="Mensaje" htmlFor="b-message" required className="sm:col-span-2">
              <Input id="b-message" value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </Field>
            <Field label="Ubicación" htmlFor="b-position">
              <Select id="b-position" value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value as typeof form.position })}>
                <option value="top">Barra superior</option>
                <option value="home">Home</option>
                <option value="shop">Tienda</option>
              </Select>
            </Field>
            <Field label="Orden" htmlFor="b-order">
              <Input id="b-order" type="number" value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
            </Field>
            <Field label="Texto del link" htmlFor="b-label">
              <Input id="b-label" value={form.linkLabel}
                onChange={(e) => setForm({ ...form, linkLabel: e.target.value })} />
            </Field>
            <Field label="URL" htmlFor="b-url">
              <Input id="b-url" value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
            </Field>
            <Field label="Desde" htmlFor="b-from">
              <Input id="b-from" type="date" value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            </Field>
            <Field label="Hasta" htmlFor="b-to">
              <Input id="b-to" type="date" value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2.5 text-[13px] sm:col-span-2">
              <Checkbox checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Activo
            </label>
          </div>
        )}
      </Modal>

      <ConfirmationModal
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Eliminar el banner?"
        confirmLabel="Eliminar"
        destructive
        loading={pending}
        onConfirm={() => {
          if (!toDelete) return;
          startTransition(async () => {
            const result = await deleteBanner(toDelete);
            if (result.ok) toast.success(result.message);
            else toast.error(result.error);
            setToDelete(null);
            router.refresh();
          });
        }}
      />
    </>
  );
}

export type FaqRow = {
  id: string;
  question: string;
  answer: string;
  group: string;
  sortOrder: number;
  isActive: boolean;
};

const EMPTY_FAQ = {
  id: undefined as string | undefined,
  question: "", answer: "", group: "general", sortOrder: "0", isActive: true,
};

const FAQ_GROUPS = {
  general: "General",
  envios: "Envíos",
  club: "Club",
  pagos: "Pagos",
} as const;

export function FaqManager({ faqs, canEdit }: { faqs: FaqRow[]; canEdit: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<typeof EMPTY_FAQ | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      {canEdit && (
        <div className="mb-4">
          <Button variant="dark" size="sm" onClick={() => setForm({ ...EMPTY_FAQ })}>
            <Plus className="size-3.5" />
            Nueva pregunta
          </Button>
        </div>
      )}

      <AdminTable
        headers={["Pregunta", "Grupo", { label: "Orden", align: "right" }, "Estado", { label: "", align: "right" }]}
        empty={<p className="text-[13px] text-stone-500">No hay preguntas cargadas.</p>}
      >
        {faqs.map((faq) => (
          <tr key={faq.id}>
            <Td className="max-w-[420px]">
              <span className="block">{faq.question}</span>
              <span className="block truncate text-[11px] text-stone-500">{faq.answer}</span>
            </Td>
            <Td className="text-stone-600">
              {FAQ_GROUPS[faq.group as keyof typeof FAQ_GROUPS] ?? faq.group}
            </Td>
            <Td align="right" className="tabular">{faq.sortOrder}</Td>
            <Td>
              <Badge tone={faq.isActive ? "success" : "neutral"}>
                {faq.isActive ? "Visible" : "Oculta"}
              </Badge>
            </Td>
            <Td align="right">
              {canEdit && (
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    aria-label="Editar pregunta"
                    onClick={() =>
                      setForm({
                        id: faq.id,
                        question: faq.question,
                        answer: faq.answer,
                        group: faq.group,
                        sortOrder: String(faq.sortOrder),
                        isActive: faq.isActive,
                      })
                    }
                    className="rounded-sm border border-linen-300 p-1 hover:border-stone-400"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Eliminar pregunta"
                    onClick={() => setToDelete(faq.id)}
                    className="rounded-sm border border-linen-300 p-1 text-stone-500 hover:border-danger-500 hover:text-danger-500"
                  >
                    <Trash2 className="size-3.5" />
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
        title={form?.id ? "Editar pregunta" : "Nueva pregunta"}
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
                  const result = await saveFaq({ ...form, sortOrder: Number(form.sortOrder || 0) });
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
            <Field label="Pregunta" htmlFor="f-q" required className="sm:col-span-2">
              <Input id="f-q" value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })} />
            </Field>
            <Field label="Respuesta" htmlFor="f-a" required className="sm:col-span-2">
              <Textarea id="f-a" className="min-h-32" value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })} />
            </Field>
            <Field label="Grupo" htmlFor="f-g">
              <Select id="f-g" value={form.group}
                onChange={(e) => setForm({ ...form, group: e.target.value })}>
                {Object.entries(FAQ_GROUPS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Orden" htmlFor="f-o">
              <Input id="f-o" type="number" value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2.5 text-[13px] sm:col-span-2">
              <Checkbox checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Visible en el sitio
            </label>
          </div>
        )}
      </Modal>

      <ConfirmationModal
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Eliminar la pregunta?"
        confirmLabel="Eliminar"
        destructive
        loading={pending}
        onConfirm={() => {
          if (!toDelete) return;
          startTransition(async () => {
            const result = await deleteFaq(toDelete);
            if (result.ok) toast.success(result.message);
            else toast.error(result.error);
            setToDelete(null);
            router.refresh();
          });
        }}
      />
    </>
  );
}
