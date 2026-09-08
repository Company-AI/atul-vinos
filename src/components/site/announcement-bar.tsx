"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type Announcement = {
  id: string;
  message: string;
  linkUrl: string | null;
  linkLabel: string | null;
};

/**
 * Barra de anuncios. Si hay más de uno, rota cada 7 segundos.
 * No hay cuenta regresiva ni urgencia forzada: solo información.
 */
export function AnnouncementBar({ items }: { items: Announcement[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, reduce ? 12000 : 7000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;
  const current = items[index];

  return (
    /*
      El anuncio de envíos y promos es información comercial, no un pie de
      página: va sobre el acento de la marca y con cuerpo suficiente para
      leerse de un vistazo. Antes iba a 12px sobre casi negro y se perdía.
    */
    <div className="bg-accent-700 text-bone-pure" role="region" aria-label="Anuncios">
      <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-2.5 px-gutter py-3 text-center">
        <p
          aria-live="polite"
          className="text-[13px] font-medium tracking-[0.02em] sm:text-[14px]"
        >
          {current.message}
          {current.linkUrl && current.linkLabel && (
            <>
              {" "}
              <Link
                href={current.linkUrl}
                className="underline decoration-bone-pure/50 underline-offset-[3px] transition-colors hover:decoration-bone-pure"
              >
                {current.linkLabel}
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
