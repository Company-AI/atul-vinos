"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

/**
 * Menú mobile de las variantes.
 *
 * Sin esto el header oculta la navegación por debajo de sm y el celular se
 * queda sin ningún camino: era el agujero más grande de las cuatro variantes
 * en pantalla chica. Hereda el color del header, así que sirve igual sobre el
 * hero oscuro que sobre fondo claro.
 */
export function VMobileNav({ items }: { items: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);

  // Con el panel abierto el fondo no debe scrollear detrás.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape cierra, como cualquier diálogo.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menú"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="-mr-2 p-2 sm:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex flex-col sm:hidden"
          style={{ backgroundColor: "var(--v-bg)", color: "var(--v-ink)" }}
        >
          <div className="flex items-center justify-end px-6 py-7">
            <button type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)} className="-mr-2 p-2">
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <nav aria-label="Principal" className="flex-1 px-6">
            <ul>
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="v-title-type block border-t py-6"
                    style={{ borderColor: "var(--v-rule)", fontSize: "calc(var(--v-title) * 0.62)" }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
