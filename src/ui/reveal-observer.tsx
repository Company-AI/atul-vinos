"use client";

import { useEffect } from "react";

/**
 * Un único IntersectionObserver para todos los `[data-reveal]` del documento.
 * Ver <Reveal /> en ./reveal.tsx.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      root.classList.remove("reveal-ready");
      return;
    }
    // Sin IntersectionObserver no ocultamos nada: la animación es una mejora,
    // nunca un requisito para leer la página.
    if (typeof IntersectionObserver === "undefined") {
      root.classList.remove("reveal-ready");
      return;
    }

    root.classList.add("reveal-ready");

    let revealedCount = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          revealedCount += 1;
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
    );

    const watch = (node: Element | Document) => {
      if (node instanceof Element && node.matches("[data-reveal]")) observer.observe(node);
      node.querySelectorAll("[data-reveal]:not([data-revealed])").forEach((el) => observer.observe(el));
    };

    watch(document);

    // Navegación cliente y contenido diferido: los nodos nuevos también entran.
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) watch(node as Element);
        }
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    /*
      Red de seguridad.

      Antes se desarmaba en cuanto UN elemento se revelaba, asumiendo que el
      observador andaba bien. Pero puede andar para unos y no para otros —así
      quedaron ocultas para siempre las fotos de las galerías—, y en ese caso
      nadie los rescataba.

      Ahora no desactiva nada: revisa a los rezagados y los revela de a uno.
      Si un elemento estuvo en viewport dos rondas seguidas y sigue sin
      revelarse, se lo marca a mano. La animación sigue funcionando para todo
      el resto y nada queda invisible.
    */
    const enVista = new WeakMap<Element, number>();
    let ticks = 0;

    const failsafe = window.setInterval(() => {
      ticks += 1;

      const pendientes = document.querySelectorAll("[data-reveal]:not([data-revealed])");
      if (pendientes.length === 0 || ticks > 20) {
        window.clearInterval(failsafe);
        return;
      }

      for (const el of pendientes) {
        const rect = el.getBoundingClientRect();
        const visible = rect.top < window.innerHeight && rect.bottom > 0;

        if (!visible) {
          enVista.delete(el);
          continue;
        }

        const rondas = (enVista.get(el) ?? 0) + 1;
        enVista.set(el, rondas);

        // Dos rondas a la vista sin que el observador lo tome: se revela igual.
        if (rondas >= 2) {
          el.setAttribute("data-revealed", "");
          observer.unobserve(el);
        }
      }
    }, 700);

    return () => {
      window.clearInterval(failsafe);
      observer.disconnect();
      mutations.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}

/**
 * Marca `reveal-ready` antes del primer paint: sin esto el contenido se vería
 * y saltaría a oculto. Sin JS la clase nunca se agrega y todo queda visible.
 */
export function RevealNoFlashScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("reveal-ready")}catch(e){}`,
      }}
    />
  );
}
