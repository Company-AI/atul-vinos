"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { login, register } from "@/app/actions/auth";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input } from "@/ui/field";

export function LoginForm({ next, staff = false }: { next?: string; staff?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await login({ email, password, next });
          if (result.ok) {
            router.push(result.redirectTo);
            router.refresh();
          } else {
            setError(result.error);
          }
        });
      }}
      className="space-y-4"
    >
      <Field label="Email" htmlFor="email" required>
        <Input
          id="email" type="email" inputMode="email" autoComplete="email"
          autoFocus required value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label="Contraseña" htmlFor="password" required>
        <Input
          id="password" type="password" autoComplete="current-password"
          required value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      {error && (
        <p role="alert" className="border border-danger-500/30 bg-danger-100 px-3 py-2.5 text-[13px] text-danger-500">
          {error}
        </p>
      )}

      <Button type="submit" variant="dark" size="lg" block uppercase loading={pending} disabled={pending}>
        Ingresar
      </Button>

      {!staff && (
        <p className="pt-2 text-center text-[13px] text-stone-500">
          ¿Todavía no tenés cuenta?{" "}
          <Link
            href={`/registrarme${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="underline underline-offset-4 hover:text-carbon-900"
          >
            Creá una
          </Link>
        </p>
      )}
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "",
    acceptsMarketing: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await register({ ...form, next });
          if (result.ok) {
            router.push(result.redirectTo);
            router.refresh();
          } else {
            setError(result.error);
          }
        });
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="firstName" required>
          <Input
            id="firstName" autoComplete="given-name" autoFocus required
            value={form.firstName} onChange={(e) => set("firstName")(e.target.value)}
          />
        </Field>
        <Field label="Apellido" htmlFor="lastName" required>
          <Input
            id="lastName" autoComplete="family-name" required
            value={form.lastName} onChange={(e) => set("lastName")(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="email" required>
        <Input
          id="email" type="email" inputMode="email" autoComplete="email" required
          value={form.email} onChange={(e) => set("email")(e.target.value)}
        />
      </Field>

      <Field label="Teléfono" htmlFor="phone" hint="Opcional. Lo usamos solo por temas de tu pedido.">
        <Input
          id="phone" type="tel" inputMode="tel" autoComplete="tel"
          value={form.phone} onChange={(e) => set("phone")(e.target.value)}
        />
      </Field>

      <Field label="Contraseña" htmlFor="password" required hint="Mínimo 8 caracteres.">
        <Input
          id="password" type="password" autoComplete="new-password" required minLength={8}
          value={form.password} onChange={(e) => set("password")(e.target.value)}
        />
      </Field>

      <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-stone-600">
        <Checkbox
          checked={form.acceptsMarketing}
          onChange={(e) => set("acceptsMarketing")(e.target.checked)}
          className="mt-0.5"
        />
        Quiero recibir novedades, nuevas cosechas y beneficios.
      </label>

      {error && (
        <p role="alert" className="border border-danger-500/30 bg-danger-100 px-3 py-2.5 text-[13px] text-danger-500">
          {error}
        </p>
      )}

      <Button type="submit" variant="dark" size="lg" block uppercase loading={pending} disabled={pending}>
        Crear mi cuenta
      </Button>

      <p className="pt-2 text-center text-[13px] text-stone-500">
        ¿Ya tenés cuenta?{" "}
        <Link
          href={`/ingresar${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="underline underline-offset-4 hover:text-carbon-900"
        >
          Ingresá
        </Link>
      </p>
    </form>
  );
}
