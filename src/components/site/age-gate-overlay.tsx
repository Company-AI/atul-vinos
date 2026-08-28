"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { confirmAge } from "@/app/actions/age-gate";
import { Button } from "@/ui/button";

export function AgeGateOverlay({
  title, message, confirmLabel, exitLabel, legalNote,
  backgroundUrl, imageUrl, exitUrl, rememberDays, companyName, logoUrl,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  exitLabel: string;
  legalNote: string;
  backgroundUrl: string;
  imageUrl: string;
  exitUrl: string;
  rememberDays: number;
  companyName: string;
  logoUrl: string;
}) {
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();

  // Bloquea el scroll del fondo mientras el gate está visible.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  // Atrapa el foco: el gate es la única interacción posible.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const focusables = document.querySelectorAll<HTMLElement>("[data-age-gate-focus]");
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    startTransition(async () => {
      await confirmAge(rememberDays);
      setOpen(false);
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-message"
      className="on-dark fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto"
    >
      <div className="absolute inset-0 bg-carbon-950">
        {backgroundUrl && (
          <Image
            src={backgroundUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
          />
        )}
        <div className="absolute inset-0 scrim-full" />
      </div>

      <div className="relative mx-auto w-full max-w-lg px-6 py-16 text-center">
        {logoUrl && (
          <Image
            src={logoUrl}
            alt={companyName}
            width={200}
            height={40}
            priority
            className="mx-auto mb-12 h-10 w-auto"
          />
        )}

        {imageUrl && (
          <Image
            src={imageUrl}
            alt=""
            width={120}
            height={120}
            className="mx-auto mb-8 h-24 w-24 rounded-full object-cover"
          />
        )}

        <h1
          id="age-gate-title"
          className="font-display text-display-md font-light text-bone"
        >
          {title}
        </h1>

        <p
          id="age-gate-message"
          className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-linen-300"
        >
          {message}
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Button
            data-age-gate-focus
            autoFocus
            size="lg"
            uppercase
            loading={pending}
            disabled={pending}
            onClick={handleConfirm}
            className="bg-bone text-carbon-900 hover:bg-bone-pure"
          >
            {confirmLabel}
          </Button>
          <Button
            data-age-gate-focus
            variant="ghostLight"
            size="lg"
            uppercase
            disabled={pending}
            onClick={() => { window.location.href = exitUrl; }}
          >
            {exitLabel}
          </Button>
        </div>

        <p className="mt-10 text-[12px] leading-relaxed text-stone-400">{legalNote}</p>
      </div>
    </div>
  );
}
