"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Avisa al servidor que alguien abrió una página.
 *
 * No pinta nada: va montado en el layout público y manda un aviso por página
 * vista, incluida la navegación interna, que en Next no recarga nada y por eso
 * el servidor no se entera.
 *
 * Usa sendBeacon cuando está disponible porque sobrevive a que la persona se
 * vaya de la página en el mismo momento; si no, un fetch con keepalive. Los
 * dos son disparar y olvidarse: si falla, falla en silencio. Un contador que
 * rompe la navegación no sirve para nada.
 */
export function ContadorDeVisitas() {
  const pathname = usePathname();
  /*
    React en desarrollo monta los efectos dos veces, y volver a la misma ruta
    no debería contar de nuevo. Se recuerda la última ruta avisada.
  */
  const ultima = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || ultima.current === pathname) return;
    ultima.current = pathname;

    const aviso = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
      isMobile: window.matchMedia("(max-width: 767px)").matches,
    });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/visitas", new Blob([aviso], { type: "application/json" }));
      } else {
        void fetch("/api/visitas", {
          method: "POST",
          body: aviso,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // En silencio: medir no puede estorbar.
    }
  }, [pathname]);

  return null;
}
