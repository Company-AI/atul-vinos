"use client";

import { useState, useTransition } from "react";
import { sendContactMessage } from "@/app/actions/contact";
import { Button } from "@/ui/button";
import { Field, Input, Select, Textarea } from "@/ui/field";

const SUBJECTS = [
  "Consulta sobre un pedido",
  "Consulta sobre el Club",
  "Visitas y degustaciones",
  "Venta mayorista",
  "Otro",
];

export function ContactForm() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: SUBJECTS[0], message: "",
  });
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (status?.ok) {
    return (
      <div className="border border-success-500/30 bg-success-100 px-5 py-6">
        <p className="text-[15px] text-success-500">{status.message}</p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await sendContactMessage(form);
          setStatus(
            result.ok
              ? { ok: true, message: result.message }
              : { ok: false, message: result.error },
          );
        });
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="c-name" required>
          <Input id="c-name" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email" htmlFor="c-email" required>
          <Input id="c-email" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Teléfono" htmlFor="c-phone">
          <Input id="c-phone" type="tel" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Motivo" htmlFor="c-subject">
          <Select id="c-subject" value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Mensaje" htmlFor="c-message" required>
        <Textarea id="c-message" className="min-h-36" required value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })} />
      </Field>

      {status && !status.ok && (
        <p role="alert" className="border border-danger-500/30 bg-danger-100 px-3 py-2.5 text-[13px] text-danger-500">
          {status.message}
        </p>
      )}

      <Button type="submit" variant="dark" size="lg" uppercase loading={pending} disabled={pending}>
        Enviar consulta
      </Button>
    </form>
  );
}
