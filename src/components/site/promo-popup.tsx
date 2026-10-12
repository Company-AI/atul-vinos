"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { claimPromo } from "@/app/actions/promo";
import { Button, buttonVariants } from "@/ui/button";
import { AGE_CONFIRMED_EVENT, AGE_GATE_COOKIE } from "@/components/site/age-gate-contrato";

const DISMISS_KEY = "atul:promo-visto";

function yaFueVisto(): boolean {
  try {
    const hasta = window.localStorage.getItem(DISMISS_KEY);
    return hasta !== null && Number(hasta) > Date.now();
  } catch {
    // Navegación privada o storage bloqueado: mostrarlo de nuevo es preferible
    // a que no aparezca nunca.
    return false;
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
  rememberDays,
  legalNote,
}: {
  title: string;
  message: string;
  ctaLabel: string;
  ctaHref: string;
  dismissLabel: string;
  imageUrl: string;
  rememberDays: number;
  legalNote: string;
}) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [cupon, setCupon] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (yaFueVisto()) return;

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
    try {
      const hasta = Date.now() + rememberDays * 24 * 60 * 60 * 1000;
      window.localStorage.setItem(DISMISS_KEY, String(hasta));
    } catch {
      // Sin storage se vuelve a ofrecer en la próxima visita. No es grave.
    }
  }, [rememberDays]);

  useEffect(() => {
    if (!open) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [open, cerrar]);

  if (!open) return null;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    const res = await claimPromo({ firstName, email });
    setPending(false);
    if (res.ok) setCupon(res.couponCode);
    else setError(res.error);
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
        className="absolute inset-0 bg-carbon-950/60"
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
                  className="mt-1 w-full rounded-lg border border-linen-300 bg-bone px-3 py-2.5 text-[15px] outline-none focus:border-accent-700"
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
                  className="mt-1 w-full rounded-lg border border-linen-300 bg-bone px-3 py-2.5 text-[15px] outline-none focus:border-accent-700"
                />
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
