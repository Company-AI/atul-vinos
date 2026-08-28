"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { subscribeToPlan } from "@/app/actions/subscriptions";
import { AR_PROVINCES } from "@/lib/ar";
import { Button } from "@/ui/button";
import { Field, Input, Select } from "@/ui/field";
import { toast } from "@/ui/toaster";

export function SubscribeForm({
  planId,
  prefill,
}: {
  planId: string;
  prefill: {
    firstName?: string; lastName?: string; email?: string; phone?: string; documentId?: string;
    street?: string; number?: string; apartment?: string; city?: string;
    province?: string; postalCode?: string; reference?: string;
  };
}) {
  const router = useRouter();
  const [contact, setContact] = useState({
    firstName: prefill.firstName ?? "",
    lastName: prefill.lastName ?? "",
    email: prefill.email ?? "",
    phone: prefill.phone ?? "",
    documentId: prefill.documentId ?? "",
  });
  const [address, setAddress] = useState({
    street: prefill.street ?? "",
    number: prefill.number ?? "",
    apartment: prefill.apartment ?? "",
    city: prefill.city ?? "",
    province: prefill.province ?? "",
    postalCode: prefill.postalCode ?? "",
    reference: prefill.reference ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await subscribeToPlan({
            planId,
            contact: { ...contact, documentId: contact.documentId || undefined },
            address: {
              ...address,
              province: address.province as (typeof AR_PROVINCES)[number],
              apartment: address.apartment || undefined,
              reference: address.reference || undefined,
            },
          });

          if (!result.ok) {
            setError(result.error);
            toast.error(result.error);
            return;
          }
          if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
          } else {
            router.push("/mi-cuenta/suscripcion");
          }
        });
      }}
      className="space-y-10"
    >
      <fieldset>
        <legend className="eyebrow mb-5 text-stone-500">Tus datos</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="s-firstName" required>
            <Input
              id="s-firstName" autoComplete="given-name" required value={contact.firstName}
              onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
            />
          </Field>
          <Field label="Apellido" htmlFor="s-lastName" required>
            <Input
              id="s-lastName" autoComplete="family-name" required value={contact.lastName}
              onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
            />
          </Field>
          <Field label="Email" htmlFor="s-email" required>
            <Input
              id="s-email" type="email" autoComplete="email" required value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
            />
          </Field>
          <Field label="Teléfono" htmlFor="s-phone" required>
            <Input
              id="s-phone" type="tel" autoComplete="tel" required value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            />
          </Field>
          <Field label="DNI" htmlFor="s-documentId" hint="Opcional, ayuda en la entrega.">
            <Input
              id="s-documentId" inputMode="numeric" value={contact.documentId}
              onChange={(e) => setContact({ ...contact, documentId: e.target.value })}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-5 text-stone-500">Dónde recibís tu caja</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Calle" htmlFor="s-street" required className="sm:col-span-2">
            <Input
              id="s-street" autoComplete="address-line1" required value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
            />
          </Field>
          <Field label="Número" htmlFor="s-number" required>
            <Input
              id="s-number" required value={address.number}
              onChange={(e) => setAddress({ ...address, number: e.target.value })}
            />
          </Field>
          <Field label="Piso / departamento" htmlFor="s-apartment">
            <Input
              id="s-apartment" value={address.apartment}
              onChange={(e) => setAddress({ ...address, apartment: e.target.value })}
            />
          </Field>
          <Field label="Localidad" htmlFor="s-city" required>
            <Input
              id="s-city" autoComplete="address-level2" required value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
            />
          </Field>
          <Field label="Provincia" htmlFor="s-province" required>
            <Select
              id="s-province" required value={address.province}
              onChange={(e) => setAddress({ ...address, province: e.target.value })}
            >
              <option value="">Elegí una provincia</option>
              {AR_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Código postal" htmlFor="s-postalCode" required>
            <Input
              id="s-postalCode" inputMode="numeric" autoComplete="postal-code" required
              value={address.postalCode}
              onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
            />
          </Field>
          <Field label="Referencia" htmlFor="s-reference" className="sm:col-span-2"
            hint="Opcional. Ej.: dejar en portería.">
            <Input
              id="s-reference" value={address.reference}
              onChange={(e) => setAddress({ ...address, reference: e.target.value })}
            />
          </Field>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="border border-danger-500/30 bg-danger-100 px-4 py-3 text-[13px] text-danger-500">
          {error}
        </p>
      )}

      <div>
        <Button
          type="submit" variant="primary" size="lg" block uppercase
          loading={pending} disabled={pending}
        >
          Autorizar el débito mensual
        </Button>
        <p className="mt-4 text-[12px] leading-relaxed text-stone-500">
          Vas a autorizar un débito automático mensual. La suscripción queda activa cuando se
          acredita el primer cobro. Podés pausarla o cancelarla en cualquier momento desde Mi Cuenta.
          No guardamos datos de tu tarjeta.
        </p>
      </div>
    </form>
  );
}
