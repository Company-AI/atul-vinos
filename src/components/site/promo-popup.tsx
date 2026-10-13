"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { claimPromo } from "@/app/actions/promo";
import { Button, buttonVariants } from "@/ui/button";
import { AGE_CONFIRMED_EVENT, AGE_GATE_COOKIE } from "@/components/site/age-gate-contrato";

/*
  Una sola llave y para siempre, sin vencimiento.

  Da igual si la persona completó los datos o si cerró la ventana: en los dos
  casos ya decidió. A quien se llevó el cupón volver a ofrecérselo sería
  prometerle algo que el checkout le va a rechazar —es uno por persona—, y a
  quien la cerró, insistirle.
*/
const VISTA_KEY = "atul:bienvenida-vista";

function yaFueVista(): boolean {
  try {
    return window.localStorage.getItem(VISTA_KEY) === "1";
  } catch {
    // Navegación privada o storage bloqueado: mostrarla es preferible a que
    // no aparezca nunca. Como mucho, alguien la ve dos veces.
    return false;
  }
}

function marcarComoVista(): void {
  try {
    window.localStorage.setItem(VISTA_KEY, "1");
  } catch {
    // Sin storage se vuelve a ofrecer. El cupón igual es uno por persona.
  }
}

function edadConfirmada(): boolean {
  return document.cookie.split("; ").some((c) => c.startsWith(`${AGE_GATE_COOKIE}=`));
}

/**
 * Ventana de bienvenida: pide el mail a cambio del cupón de primera compra.
 *
 * Aparece después del age gate, nunca encima: compiten por la misma atención y
 * superponerlas haría que no se lea ninguna de las dos.
 *
 * El cupón se muestra recién después de dejar los datos. Mostrarlo antes haría
 * que nadie complete el formulario, que es el punto de la ventana.
 */
export function PromoPopup({
  title,
  message,
  ctaLabel,
  ctaHref,
  dismissLabel,
  imageUrl,
  legalNote,
  minAge,
}: {
  title: string;
  message: string;
  ctaLabel: string;
  ctaHref: string;
  dismissLabel: string;
  imageUrl: string;
  legalNote: string;
  /** Edad mínima configurada: acota el calendario del campo de nacimiento. */
  minAge: number;
}) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [campoConError, setCampoConError] = useState("");
  const [cupon, setCupon] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (yaFueVista()) return;

    // Ya venía confirmado de una visita anterior: el gate no se va a mostrar.
    if (edadConfirmada()) {
      setOpen(true);
      return;
    }

    const alConfirmar = () => setOpen(true);
    window.addEventListener(AGE_CONFIRMED_EVENT, alConfirmar);
    return () => window.removeEventListener(AGE_CONFIRMED_EVENT, alConfirmar);
  }, []);

  const cerrar = useCallback(() => {
    setOpen(false);
    marcarComoVista();
  }, []);

  useEffect(() => {
    if (!open) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [open, cerrar]);

  if (!open) return null;

  /*
    El calendario no deja elegir una fecha que dé menos de la edad mínima.
    Es una comodidad, no un control: la decisión la toma el servidor, porque
    el atributo se saltea mandando el pedido a mano.
  */
  const hoy = new Date();
  const fechaTope = new Date(
    Date.UTC(hoy.getFullYear() - minAge, hoy.getMonth(), hoy.getDate()),
  )
    .toISOString()
    .slice(0, 10);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    setCampoConError("");
    const res = await claimPromo({ firstName, email, birthDate });
    setPending(false);
    if (res.ok) {
      setCupon(res.couponCode);
      marcarComoVista();
    } else {
      setError(res.error);
      setCampoConError(res.field ?? "");
    }
  };

  const copiarCupon = async () => {
    try {
      await navigator.clipboard.writeText(cupon);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles el código igual está a la vista.
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-title"
      className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto p-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={cerrar}
        className="absolute inset-0 bg-carbon-950/60 backdrop-blur-md"
      />

      <div className="relative my-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-bone-pure shadow-2xl sm:grid sm:grid-cols-2">
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-bone-pure/80 text-carbon-800 transition-colors hover:bg-bone"
        >
          <X className="size-4" aria-hidden />
        </button>

        {imageUrl && (
          <div className="relative h-44 w-full sm:h-full sm:min-h-[26rem]">
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="px-7 py-9 sm:px-9">
          <h2 id="promo-title" className="font-display text-display-sm font-light text-carbon-900">
            {title}
          </h2>

          <p className="mt-3 text-[15px] leading-relaxed text-carbon-800">{message}</p>

          {cupon ? (
            <div className="mt-7">
              <p className="text-[13px] uppercase tracking-[0.14em] text-stone-500">Tu cupón</p>
              <button
                type="button"
                onClick={copiarCupon}
                className="mt-2 w-full rounded-lg border border-dashed border-accent-700 bg-accent-50 py-3 font-mono text-lg tracking-widest text-accent-700 transition-colors hover:bg-accent-100"
              >
                {copiado ? "¡Copiado!" : cupon}
              </button>
              <Link
                href={ctaHref}
                onClick={cerrar}
                className={`mt-4 ${buttonVariants({ size: "lg", uppercase: true, block: true })}`}
              >
                {ctaLabel}
              </Link>
            </div>
          ) : (
            <form onSubmit={enviar} className="mt-7 space-y-4">
              <div>
                <label htmlFor="promo-nombre" className="text-[13px] text-carbon-800">
                  Tu nombre
                </label>
                <input
                  id="promo-nombre"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  aria-invalid={campoConError === "firstName" || undefined}
                  className={`mt-1 w-full rounded-lg border bg-bone px-3 py-2.5 text-[15px] outline-none focus:border-accent-700 ${
                    campoConError === "firstName" ? "border-red-700" : "border-linen-300"
                  }`}
                />
              </div>

              <div>
                <label htmlFor="promo-email" className="text-[13px] text-carbon-800">
                  Tu email
                </label>
                <input
                  id="promo-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={campoConError === "email" || undefined}
                  className={`mt-1 w-full rounded-lg border bg-bone px-3 py-2.5 text-[15px] outline-none focus:border-accent-700 ${
                    campoConError === "email" ? "border-red-700" : "border-linen-300"
                  }`}
                />
              </div>

              <div>
                <label htmlFor="promo-nacimiento" className="text-[13px] text-carbon-800">
                  Tu fecha de nacimiento
                </label>
                <input
                  id="promo-nacimiento"
                  type="date"
                  required
                  autoComplete="bday"
                  value={birthDate}
                  max={fechaTope}
                  min="1920-01-01"
                  onChange={(e) => setBirthDate(e.target.value)}
                  aria-describedby="promo-nacimiento-ayuda"
                  aria-invalid={campoConError === "birthDate" || undefined}
                  className={`mt-1 w-full rounded-lg border bg-bone px-3 py-2.5 text-[15px] outline-none focus:border-accent-700 ${
                    campoConError === "birthDate" ? "border-red-700" : "border-linen-300"
                  }`}
                />
                <p id="promo-nacimiento-ayuda" className="mt-1 text-[12px] text-stone-500">
                  Necesitamos confirmar que sos mayor de {minAge}.
                </p>
              </div>

              {error && (
                <p role="alert" className="text-[13px] text-red-700">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" uppercase block loading={pending} disabled={pending}>
                Quiero mi cupón
              </Button>

              <button
                type="button"
                onClick={cerrar}
                className="w-full py-1 text-[13px] text-stone-500 underline-offset-4 hover:underline"
              >
                {dismissLabel}
              </button>
            </form>
          )}

          {legalNote && (
            <p className="mt-6 text-[12px] leading-relaxed text-stone-500">{legalNote}</p>
          )}
        </div>
      </div>
    </div>
  );
}
