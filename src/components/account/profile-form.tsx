"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { changePassword } from "@/app/actions/auth";
import { updateProfile } from "@/app/actions/account";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input } from "@/ui/field";
import { toast } from "@/ui/toaster";

export function ProfileForm({
  userId,
  initial,
}: {
  userId: string;
  initial: {
    firstName: string; lastName: string; email: string;
    phone: string | null; documentId: string | null; acceptsMarketing: boolean;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: initial.firstName,
    lastName: initial.lastName,
    phone: initial.phone ?? "",
    documentId: initial.documentId ?? "",
    acceptsMarketing: initial.acceptsMarketing,
  });
  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const [pendingProfile, startProfile] = useTransition();
  const [pendingPassword, startPassword] = useTransition();

  return (
    <div className="space-y-12">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          startProfile(async () => {
            const result = await updateProfile(form);
            if (result.ok) {
              toast.success(result.message);
              router.refresh();
            } else {
              toast.error(result.error);
            }
          });
        }}
      >
        <h2 className="eyebrow mb-5 text-stone-500">Datos personales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="p-firstName" required>
            <Input
              id="p-firstName" required value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </Field>
          <Field label="Apellido" htmlFor="p-lastName" required>
            <Input
              id="p-lastName" required value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </Field>
          <Field label="Email" htmlFor="p-email" hint="Para cambiarlo, escribinos.">
            <Input id="p-email" value={initial.email} disabled />
          </Field>
          <Field label="Teléfono" htmlFor="p-phone">
            <Input
              id="p-phone" type="tel" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="DNI" htmlFor="p-documentId">
            <Input
              id="p-documentId" inputMode="numeric" value={form.documentId}
              onChange={(e) => setForm({ ...form, documentId: e.target.value })}
            />
          </Field>
        </div>

        <label className="mt-5 flex items-start gap-2.5 text-[14px] text-carbon-800">
          <Checkbox
            checked={form.acceptsMarketing}
            onChange={(e) => setForm({ ...form, acceptsMarketing: e.target.checked })}
            className="mt-0.5"
          />
          Quiero recibir novedades, nuevas cosechas y beneficios.
        </label>

        <Button
          type="submit" variant="dark" className="mt-6"
          loading={pendingProfile} disabled={pendingProfile}
        >
          Guardar cambios
        </Button>
      </form>

      <form
        className="border-t border-linen-200 pt-10"
        onSubmit={(e) => {
          e.preventDefault();
          startPassword(async () => {
            const result = await changePassword({
              userId,
              currentPassword: passwords.current,
              newPassword: passwords.next,
            });
            if (result.ok) {
              toast.success("Contraseña actualizada.");
              setPasswords({ current: "", next: "" });
            } else {
              toast.error(result.error);
            }
          });
        }}
      >
        <h2 className="eyebrow mb-5 text-stone-500">Cambiar contraseña</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contraseña actual" htmlFor="p-current" required>
            <Input
              id="p-current" type="password" autoComplete="current-password" required
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            />
          </Field>
          <Field label="Nueva contraseña" htmlFor="p-next" required hint="Mínimo 8 caracteres.">
            <Input
              id="p-next" type="password" autoComplete="new-password" required minLength={8}
              value={passwords.next}
              onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
            />
          </Field>
        </div>
        <Button
          type="submit" variant="outline" className="mt-6"
          loading={pendingPassword}
          disabled={pendingPassword || !passwords.current || passwords.next.length < 8}
        >
          Cambiar contraseña
        </Button>
      </form>
    </div>
  );
}
