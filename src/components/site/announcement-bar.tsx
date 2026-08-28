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
    <div className="bg-carbon-950 text-bone" role="region" aria-label="Anuncios">
      <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-2 px-gutter py-2 text-center">
        <p aria-live="polite" className="text-[12px] tracking-wide text-linen-200">
          {current.message}
          {current.linkUrl && current.linkLabel && (
            <>
              {" "}
              <Link
                href={current.linkUrl}
                className="underline underline-offset-2 hover:text-bone-pure"
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
