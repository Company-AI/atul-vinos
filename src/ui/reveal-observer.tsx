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
      Red de seguridad. Si el observador no entrega callbacks —pestaña que no
      compone frames, fallo del motor, una extensión de por medio— el contenido
      quedaría invisible de forma permanente.

      El chequeo es un sondeo acotado y no se apoya en scroll ni en
      requestAnimationFrame: son justamente las señales que se pausan cuando la
      página no compone, es decir el escenario que hay que cubrir. Mientras
      haya elementos marcados dentro del viewport y ninguno se haya revelado,
      se apaga el sistema entero. Preferimos perder la animación antes que
      perder el contenido.
    */
    let ticks = 0;
    const failsafe = window.setInterval(() => {
      ticks += 1;

      // Con un solo revelado sabemos que el observador funciona: no miramos más.
      if (revealedCount > 0 || ticks > 15) {
        window.clearInterval(failsafe);
        return;
      }

      const pending = document.querySelectorAll("[data-reveal]:not([data-revealed])");
      const anyVisible = [...pending].some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      });

      if (!anyVisible) return;

      window.clearInterval(failsafe);
      observer.disconnect();
      mutations.disconnect();
      root.classList.remove("reveal-ready");
    }, 1000);

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
