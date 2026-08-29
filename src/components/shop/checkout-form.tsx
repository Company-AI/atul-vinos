"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Check, Loader2, Truck } from "lucide-react";
import { quoteShippingForCheckout, submitCheckout } from "@/app/actions/checkout";
import type { CartSummary } from "@/domain/cart/service";
import type { ShippingQuote } from "@/domain/shipping/ports";
import { AR_PROVINCES } from "@/lib/ar";
import { cn } from "@/lib/cn";
import { formatARS } from "@/lib/money";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/ui/field";
import { toast } from "@/ui/toaster";

type Errors = Record<string, string>;

const emptyAddress = {
  street: "", number: "", apartment: "", city: "", province: "", postalCode: "", reference: "",
};

export function CheckoutForm({
  cart,
  requireDocument,
  prefill,
  providerLabel,
}: {
  cart: CartSummary;
  requireDocument: boolean;
  prefill: {
    firstName?: string; lastName?: string; email?: string; phone?: string; documentId?: string;
    address?: Partial<typeof emptyAddress>;
  };
  providerLabel: string;
}) {
  const [contact, setContact] = useState({
    firstName: prefill.firstName ?? "",
    lastName: prefill.lastName ?? "",
    email: prefill.email ?? "",
    phone: prefill.phone ?? "",
    documentId: prefill.documentId ?? "",
  });
  const [address, setAddress] = useState({ ...emptyAddress, ...prefill.address });
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState({ ...emptyAddress, taxId: "" });
  const [note, setNote] = useState("");

  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<string>("");
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, startSubmit] = useTransition();

  const canQuote =
    address.city.trim().length > 1 &&
    address.province.length > 1 &&
    address.postalCode.trim().length >= 4;

  const fetchQuotes = useCallback(async () => {
    setQuoting(true);
    setQuoteError(null);
    const result = await quoteShippingForCheckout({
      province: address.province,
      city: address.city,
      postalCode: address.postalCode,
    });
    if (result.ok) {
      setQuotes(result.quotes);
      setSelectedQuote((current) =>
        result.quotes.some((q) => q.serviceCode === current)
          ? current
          : (result.quotes[0]?.serviceCode ?? ""),
      );
    } else {
      setQuotes([]);
      setSelectedQuote("");
      setQuoteError(result.error);
    }
    setQuoting(false);
  }, [address.city, address.province, address.postalCode]);

  useEffect(() => {
    if (!canQuote) return;
    const timer = setTimeout(fetchQuotes, 400);
    return () => clearTimeout(timer);
  }, [canQuote, fetchQuotes]);

  const quote = quotes.find((q) => q.serviceCode === selectedQuote);
  const shippingPrice = quote?.price ?? 0;
  const total = cart.pricing.subtotal - cart.pricing.discountTotal + shippingPrice;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    if (!quote) {
      setQuoteError("Elegí un método de envío para continuar.");
      return;
    }

    startSubmit(async () => {
      const result = await submitCheckout({
        contact: {
          ...contact,
          documentId: contact.documentId || undefined,
        },
        address: {
          ...address,
          province: address.province as (typeof AR_PROVINCES)[number],
          apartment: address.apartment || undefined,
          reference: address.reference || undefined,
        },
        billingSameAsShipping: billingSame,
        billing: billingSame
          ? undefined
          : {
              ...contact,
              ...billing,
              province: billing.province as (typeof AR_PROVINCES)[number],
              apartment: billing.apartment || undefined,
              reference: billing.reference || undefined,
            },
        shipping: {
          serviceCode: quote.serviceCode,
          methodName: quote.serviceName,
          price: quote.price,
          carrierCode: quote.providerCode,
        },
        customerNote: note || undefined,
      });

      if (result.ok) {
        // El pedido queda pendiente: el pago se confirma por webhook.
        window.location.href = result.redirectUrl;
      } else {
        if (result.field) setErrors({ [result.field]: result.error });
        toast.error(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
      <div className="space-y-12">
        {/* Contacto */}
        <section aria-labelledby="paso-contacto">
          <StepTitle id="paso-contacto" step={1} title="Tus datos" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="firstName" required error={errors["contact.firstName"]}>
              <Input
                id="firstName" autoComplete="given-name" required
                value={contact.firstName}
                onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
              />
            </Field>
            <Field label="Apellido" htmlFor="lastName" required error={errors["contact.lastName"]}>
              <Input
                id="lastName" autoComplete="family-name" required
                value={contact.lastName}
                onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
              />
            </Field>
            <Field label="Email" htmlFor="email" required error={errors["contact.email"]}
              hint="Te enviamos la confirmación y el seguimiento acá.">
              <Input
                id="email" type="email" inputMode="email" autoComplete="email" required
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
            </Field>
            <Field label="Teléfono" htmlFor="phone" required error={errors["contact.phone"]}>
              <Input
                id="phone" type="tel" inputMode="tel" autoComplete="tel" required
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              />
            </Field>
            <Field
              label="DNI"
              htmlFor="documentId"
              required={requireDocument}
              error={errors["contact.documentId"]}
              hint={requireDocument ? "Requerido por el transportista." : "Opcional."}
            >
              <Input
                id="documentId" inputMode="numeric" required={requireDocument}
                value={contact.documentId}
                onChange={(e) => setContact({ ...contact, documentId: e.target.value })}
              />
            </Field>
          </div>
        </section>

        {/* Envío */}
        <section aria-labelledby="paso-envio">
          <StepTitle id="paso-envio" step={2} title="Dónde lo entregamos" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Calle" htmlFor="street" required className="sm:col-span-2"
              error={errors["address.street"]}>
              <Input
                id="street" autoComplete="address-line1" required
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
              />
            </Field>
            <Field label="Número" htmlFor="number" required error={errors["address.number"]}>
              <Input
                id="number" required
                value={address.number}
                onChange={(e) => setAddress({ ...address, number: e.target.value })}
              />
            </Field>
            <Field label="Piso / departamento" htmlFor="apartment">
              <Input
                id="apartment" autoComplete="address-line2"
                value={address.apartment}
                onChange={(e) => setAddress({ ...address, apartment: e.target.value })}
              />
            </Field>
            <Field label="Localidad" htmlFor="city" required error={errors["address.city"]}>
              <Input
                id="city" autoComplete="address-level2" required
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
              />
            </Field>
            <Field label="Provincia" htmlFor="province" required error={errors["address.province"]}>
              <Select
                id="province" autoComplete="address-level1" required
                value={address.province}
                onChange={(e) => setAddress({ ...address, province: e.target.value })}
              >
                <option value="">Elegí una provincia</option>
                {AR_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="Código postal" htmlFor="postalCode" required
              error={errors["address.postalCode"]}>
              <Input
                id="postalCode" inputMode="numeric" autoComplete="postal-code" required
                value={address.postalCode}
                onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
              />
            </Field>
            <Field label="Referencia para la entrega" htmlFor="reference" className="sm:col-span-2"
              hint="Ej.: portón negro, timbre 2, dejar en portería.">
              <Input
                id="reference"
                value={address.reference}
                onChange={(e) => setAddress({ ...address, reference: e.target.value })}
              />
            </Field>
          </div>

          {/* Métodos de envío */}
          <div className="mt-8">
            <p className="eyebrow mb-3 text-stone-500">Método de envío</p>

            {!canQuote && (
              <p className="border border-dashed border-linen-300 px-4 py-5 text-[13px] text-stone-500">
                Completá localidad, provincia y código postal para ver las opciones de envío.
              </p>
            )}

            {canQuote && quoting && (
              <p className="flex items-center gap-2 px-1 py-4 text-[13px] text-stone-500">
                <Loader2 className="size-4 animate-spin" />
                Calculando el envío…
              </p>
            )}

            {canQuote && !quoting && quoteError && (
              <p role="alert" className="border border-danger-500/40 bg-danger-100 px-4 py-3 text-[13px] text-danger-500">
                {quoteError}
              </p>
            )}

            {!quoting && quotes.length > 0 && (
              <ul className="space-y-2">
                {quotes.map((q) => (
                  <li key={q.serviceCode}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 border px-4 py-3.5 transition-colors",
                        selectedQuote === q.serviceCode
                          ? "border-carbon-900 bg-bone-pure"
                          : "border-linen-300 hover:border-stone-400",
                      )}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={q.serviceCode}
                        checked={selectedQuote === q.serviceCode}
                        onChange={() => setSelectedQuote(q.serviceCode)}
                        className="size-4 accent-wine-700"
                      />
                      <span className="flex-1">
                        <span className="block text-[14px] font-medium text-carbon-900">
                          {q.serviceName}
                        </span>
                        <span className="block text-[13px] text-stone-500">
                          {q.etaMinDays !== null && q.etaMaxDays !== null
                            ? q.etaMinDays === 0
                              ? "Retiro disponible en 24 h"
                              : `Llega en ${q.etaMinDays} a ${q.etaMaxDays} días hábiles`
                            : "Plazo a confirmar"}
                        </span>
                      </span>
                      <span className="text-[14px] font-medium tabular text-carbon-900">
                        {q.price === 0 ? "Sin cargo" : formatARS(q.price)}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Facturación */}
          <div className="mt-8 border-t border-linen-200 pt-6">
            <label className="flex items-center gap-2.5 text-[14px] text-carbon-800">
              <Checkbox
                checked={billingSame}
                onChange={(e) => setBillingSame(e.target.checked)}
              />
              Los datos de facturación son los mismos que los de envío
            </label>

            {!billingSame && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="CUIT / CUIL" htmlFor="taxId" className="sm:col-span-2">
                  <Input
                    id="taxId" inputMode="numeric"
                    value={billing.taxId}
                    onChange={(e) => setBilling({ ...billing, taxId: e.target.value })}
                  />
                </Field>
                <Field label="Calle" htmlFor="b-street" required className="sm:col-span-2">
                  <Input
                    id="b-street" required
                    value={billing.street}
                    onChange={(e) => setBilling({ ...billing, street: e.target.value })}
                  />
                </Field>
                <Field label="Número" htmlFor="b-number" required>
                  <Input
                    id="b-number" required
                    value={billing.number}
                    onChange={(e) => setBilling({ ...billing, number: e.target.value })}
                  />
                </Field>
                <Field label="Localidad" htmlFor="b-city" required>
                  <Input
                    id="b-city" required
                    value={billing.city}
                    onChange={(e) => setBilling({ ...billing, city: e.target.value })}
                  />
                </Field>
                <Field label="Provincia" htmlFor="b-province" required>
                  <Select
                    id="b-province" required
                    value={billing.province}
                    onChange={(e) => setBilling({ ...billing, province: e.target.value })}
                  >
                    <option value="">Elegí una provincia</option>
                    {AR_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </Select>
                </Field>
                <Field label="Código postal" htmlFor="b-postalCode" required>
                  <Input
                    id="b-postalCode" inputMode="numeric" required
                    value={billing.postalCode}
                    onChange={(e) => setBilling({ ...billing, postalCode: e.target.value })}
                  />
                </Field>
              </div>
            )}
          </div>
        </section>

        {/* Pago */}
        <section aria-labelledby="paso-pago">
          <StepTitle id="paso-pago" step={3} title="Pago" />
          <div className="border border-linen-300 bg-bone-pure p-5">
            <p className="text-[14px] text-carbon-900">{providerLabel}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
              Al confirmar te llevamos a la plataforma de pago. Tu pedido queda reservado y se
              confirma cuando se acredita el cobro. No guardamos datos de tu tarjeta.
            </p>
          </div>

          <Field label="Comentarios para la bodega" htmlFor="note" className="mt-6"
            hint="Opcional. Ej.: es un regalo, incluir tarjeta.">
            <Textarea
              id="note" value={note} maxLength={500}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        </section>
      </div>

      {/* Resumen */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="border border-linen-200 bg-bone-pure p-6">
          <h2 className="font-display text-display-sm font-light text-carbon-900">Tu pedido</h2>

          <ul className="mt-5 divide-y divide-linen-200">
            {cart.lines.map((line) => (
              <li key={line.itemId} className="flex items-center gap-3 py-3">
                {line.imageUrl && (
                  <Image
                    src={line.imageUrl} alt="" width={40} height={53}
                    className="h-13 w-10 shrink-0 object-cover"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-carbon-900">
                    {line.quantity}× {line.name} {line.vintage ?? ""}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] tabular text-carbon-900">
                  {formatARS(line.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-linen-200 pt-4 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-stone-500">Subtotal</dt>
              <dd className="tabular">{formatARS(cart.pricing.subtotal)}</dd>
            </div>
            {cart.pricing.discountTotal > 0 && (
              <div className="flex justify-between">
                <dt className="text-stone-500">Descuentos</dt>
                <dd className="tabular text-success-500">−{formatARS(cart.pricing.discountTotal)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="flex items-center gap-1.5 text-stone-500">
                <Truck className="size-3.5" />
                Envío
              </dt>
              <dd className="tabular">
                {!quote ? "—" : quote.price === 0 ? "Sin cargo" : formatARS(quote.price)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-linen-200 pt-4">
            <span className="eyebrow text-stone-500">Total</span>
            <span className="text-2xl font-medium tabular text-carbon-900">{formatARS(total)}</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            uppercase
            className="mt-6"
            loading={submitting}
            disabled={submitting || !quote || cart.hasStockIssues}
          >
            {cart.hasStockIssues ? "Revisá el stock" : "Confirmar y pagar"}
          </Button>

          <ul className="mt-5 space-y-1.5 text-[12px] text-stone-500">
            <li className="flex items-center gap-1.5"><Check className="size-3" /> Pago procesado por {providerLabel}</li>
            <li className="flex items-center gap-1.5"><Check className="size-3" /> Embalaje reforzado para botellas</li>
            <li className="flex items-center gap-1.5"><Check className="size-3" /> Si algo llega roto, lo reponemos</li>
          </ul>

          <Link
            href="/carrito"
            className="mt-5 block text-center text-[13px] text-stone-500 underline underline-offset-4 hover:text-carbon-900"
          >
            Volver al carrito
          </Link>
        </div>
      </aside>
    </form>
  );
}

function StepTitle({ id, step, title }: { id: string; step: number; title: string }) {
  return (
    <div className="mb-6 flex items-baseline gap-3">
      <span className="font-display text-display-sm font-light text-clay-500">
        {String(step).padStart(2, "0")}
      </span>
      <h2 id={id} className="font-display text-display-sm font-light text-carbon-900">
        {title}
      </h2>
    </div>
  );
}
