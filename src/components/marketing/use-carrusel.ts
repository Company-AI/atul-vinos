"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Carrusel horizontal sobre un riel con scroll-snap.
 *
 * Lo comparten el hero y la banda promocional. Está acá y no duplicado porque
 * cada uno de sus detalles salió de un bug medido en producción, y tenerlo dos
 * veces garantiza que el próximo arreglo se aplique sólo en uno.
 *
 * Decisiones que parecen raras y no lo son:
 *
 * - El recorrido se anima cuadro por cuadro con requestAnimationFrame en lugar
 *   de pedirle al navegador `scroll-behavior: smooth`. Con esa propiedad Chrome
 *   deja animaciones pendientes que bloquean los desplazamientos siguientes: un
 *   salto de 1512px se detenía en 1257 y a partir de ahí toda asignación de
 *   scrollLeft quedaba sin efecto.
 * - Hay un cierre de seguridad. Chrome frena los cuadros cuando la ventana no
 *   se está componiendo —medido: uno por segundo—, y entonces el recorrido se
 *   queda a mitad de panel.
 * - `arrancar` cancela antes de arrancar. Si no, cada `mouseleave` sin su
 *   `mouseenter` dejaba un intervalo huérfano y el carrusel se aceleraba solo.
 * - El panel activo se observa, no se lleva en un contador: así los puntos
 *   siguen al dedo cuando alguien arrastra.
 */

const DURACION_MS = 480;

/* El prefijo `use` no es cosmético: React exige que los hooks lo lleven
   para poder verificar las reglas de hooks. */
export function useCarrusel({
  cantidad,
  autoplaySegundos,
  autoplay = true,
}: {
  cantidad: number;
  autoplaySegundos: number;
  autoplay?: boolean;
}) {
  const rielRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const cierreRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activo, setActivo] = useState(0);
  const [interactuado, setInteractuado] = useState(false);

  const varios = cantidad > 1;

  const cortar = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    if (cierreRef.current !== null) {
      clearTimeout(cierreRef.current);
      cierreRef.current = null;
    }
  }, []);

  const irA = useCallback(
    (i: number) => {
      const riel = rielRef.current;
      if (!riel) return;
      cortar();

      const destino = riel.clientWidth * i;
      const partida = riel.scrollLeft;
      const delta = destino - partida;
      if (Math.abs(delta) < 2) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        riel.scrollLeft = destino;
        return;
      }

      const arranque = performance.now();
      const cuadro = (ahora: number) => {
        const t = Math.min(1, (ahora - arranque) / DURACION_MS);
        // easeInOutCubic: arranca y frena suave, constante en el medio.
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        riel.scrollLeft = partida + delta * e;
        if (t < 1) animRef.current = requestAnimationFrame(cuadro);
        else {
          riel.scrollLeft = destino;
          animRef.current = null;
        }
      };
      animRef.current = requestAnimationFrame(cuadro);

      cierreRef.current = setTimeout(() => {
        if (animRef.current === null) return;
        cortar();
        if (rielRef.current) rielRef.current.scrollLeft = destino;
      }, DURACION_MS + 140);
    },
    [cortar],
  );

  /** Mueve un paso leyendo dónde está parado el riel, no el estado de React. */
  const mover = useCallback(
    (paso: number) => {
      const riel = rielRef.current;
      if (!riel) return;
      const actual = Math.round(riel.scrollLeft / riel.clientWidth);
      irA((actual + paso + cantidad) % cantidad);
    },
    [irA, cantidad],
  );

  const alArrastrar = useCallback(() => {
    cortar();
    setInteractuado(true);
  }, [cortar]);

  const alElegir = useCallback(
    (i: number) => {
      setInteractuado(true);
      irA(i);
    },
    [irA],
  );

  // Qué panel está a la vista.
  useEffect(() => {
    const riel = rielRef.current;
    if (!riel || !varios) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            const i = [...riel.children].indexOf(e.target);
            if (i >= 0) setActivo(i);
          }
        }
      },
      { root: riel, threshold: 0.6 },
    );
    for (const hijo of riel.children) obs.observe(hijo);
    return () => obs.disconnect();
  }, [varios, cantidad]);

  // Avance automático.
  useEffect(() => {
    if (!varios || !autoplay || interactuado) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const riel = rielRef.current;
    if (!riel) return;

    let id: ReturnType<typeof setInterval> | null = null;
    const frenar = () => {
      if (id !== null) {
        clearInterval(id);
        id = null;
      }
    };
    const arrancar = () => {
      frenar();
      id = setInterval(() => {
        const actual = Math.round(riel.scrollLeft / riel.clientWidth);
        irA((actual + 1) % cantidad);
      }, autoplaySegundos * 1000);
    };

    arrancar();
    riel.addEventListener("mouseenter", frenar);
    riel.addEventListener("mouseleave", arrancar);
    riel.addEventListener("focusin", frenar);
    return () => {
      frenar();
      riel.removeEventListener("mouseenter", frenar);
      riel.removeEventListener("mouseleave", arrancar);
      riel.removeEventListener("focusin", frenar);
    };
  }, [varios, autoplay, autoplaySegundos, cantidad, interactuado, irA]);

  useEffect(() => cortar, [cortar]);

  return { rielRef, activo, varios, irA, mover, alArrastrar, alElegir };
}
