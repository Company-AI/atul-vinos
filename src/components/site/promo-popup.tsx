"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { buttonVariants } from "@/ui/button";
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
 * Ventana de bienvenida con el cupón de primera compra.
 *
 * Aparece después del age gate, nunca encima: compiten por la misma atención y
 * superponerlas haría que no se lea ninguna de las dos. Si el visitante ya
 * confirmó la edad en otra visita, se muestra directamente.
 */
export function PromoPopup({
  title,
  message,
  couponCode,
  ctaLabel,
  ctaHref,
  dismissLabel,
  imageUrl,
  rememberDays,
}: {
  title: string;
  message: string;
  couponCode: string;
  ctaLabel: string;
  ctaHref: string;
  dismissLabel: string;
  imageUrl: string;
  rememberDays: number;
}) {
  const [open, setOpen] = useState(false);
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

  const copiarCupon = async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
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
      className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={cerrar}
        className="absolute inset-0 bg-carbon-950/60"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-bone-pure shadow-2xl">
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-bone-pure/80 text-carbon-800 transition-colors hover:bg-bone"
        >
          <X className="size-4" aria-hidden />
        </button>

        {imageUrl && (
          <div className="relative h-40 w-full">
            <Image src={imageUrl} alt="" fill sizes="448px" className="object-cover" />
          </div>
        )}

        <div className="px-7 py-8 text-center">
          <h2 id="promo-title" className="font-display text-display-sm font-light text-carbon-900">
            {title}
          </h2>

          <p className="mt-3 text-[15px] leading-relaxed text-carbon-800">{message}</p>

          {couponCode && (
            <button
              type="button"
              onClick={copiarCupon}
              className="mt-6 w-full rounded-lg border border-dashed border-accent-700 bg-accent-50 py-3 font-mono text-lg tracking-widest text-accent-700 transition-colors hover:bg-accent-100"
            >
              {copiado ? "¡Copiado!" : couponCode}
            </button>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={ctaHref}
              onClick={cerrar}
              className={buttonVariants({ size: "lg", uppercase: true, block: true })}
            >
              {ctaLabel}
            </Link>
            <button
              type="button"
              onClick={cerrar}
              className="py-2 text-[13px] text-stone-500 underline-offset-4 hover:underline"
            >
              {dismissLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
