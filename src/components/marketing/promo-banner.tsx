"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BlockData } from "@/domain/cms/blocks";

/**
 * Banda promocional a sangre, de uno o varios paneles.
 *
 * El mecanismo es un riel con scroll-snap, no un carrusel de transform. Eso
 * da tres cosas gratis: se arrastra con el dedo en el teléfono, funciona sin
 * JavaScript —los paneles quedan uno al lado del otro y se recorren— y el
 * navegador se encarga de la inercia y el frenado.
 *
 * El JavaScript sólo agrega los controles: puntos, flechas y el avance
 * automático opcional. Si no carga, el riel sigue siendo usable.
 *
 * El panel activo se detecta observando cuál está a la vista en lugar de
 * llevar un índice propio: así los puntos siguen al dedo cuando alguien
 * arrastra, que es el caso que un índice manual siempre pierde.
 */

const ALTURAS = {
  media: "min-h-[300px] sm:min-h-[340px] lg:min-h-[380px]",
  alta: "min-h-[380px] sm:min-h-[440px] lg:min-h-[500px]",
} as const;

export function PromoBanner({ data, id }: { data: BlockData<"promo_banner">; id?: string }) {
  const items = data.items.filter((i) => i.title.trim() !== "" || i.imageUrl !== "");
  const rielRef = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(0);
  const [interactuado, setInteractuado] = useState(false);
  /** Número de la última solicitud de movimiento, para descartar correcciones viejas. */
  const pedidoRef = useRef(0);

  const varios = items.length > 1;

  /*
    Cada panel mide exactamente el ancho del riel, así que la posición de uno
    es ancho × índice. Se calcula así y no con offsetLeft porque el riel no
    crea contexto de posicionamiento: el offsetParent de los paneles es la
    sección, y cualquier cambio de layout en el envoltorio corría la cuenta.
  */
  /*
    Mover el riel: se asigna scrollLeft y, pasada la animación, se comprueba
    que haya llegado.

    La clase `banner-rail` le pone scroll-behavior suave, así que la
    asignación anima. Pero Chrome no siempre termina el recorrido en un
    contenedor con scroll-snap: medido en producción, un salto de 1512px se
    quedaba en 1257 y ahí se detenía, dejando el panel cortado a la mitad.

    Por eso hay una comprobación al final, no una corrección en el medio. La
    diferencia importa: corregir a los 250ms —como hacía la versión anterior—
    pisaba una animación todavía en vuelo, que al retomar sumaba su propio
    recorrido desde la nueva posición y se pasaba un panel entero. A los
    900ms la animación ya terminó y no queda nada con qué chocar.

    `pedidoRef` descarta las comprobaciones que quedaron viejas: si mientras
    tanto alguien arrastró el riel o pidió otro panel, esta corrección ya no
    corresponde y se abandona en lugar de arrastrar al visitante de vuelta.
  */
  const irA = useCallback((i: number) => {
    const riel = rielRef.current;
    if (!riel) return;
    const destino = riel.clientWidth * i;
    const pedido = ++pedidoRef.current;

    riel.scrollLeft = destino;

    window.setTimeout(() => {
      const actual = rielRef.current;
      if (!actual || pedidoRef.current !== pedido) return;
      if (Math.abs(actual.scrollLeft - destino) > 4) actual.scrollLeft = destino;
    }, 900);
  }, []);

  /*
    Las flechas no miran el estado de React sino dónde está parado el riel.

    Con el índice del estado quedaban un paso atrasadas: el valor lo actualiza
    el IntersectionObserver después del scroll, así que el handler todavía
    tenía el del render anterior y el primer clic no movía al panel correcto.
    Leyendo scrollLeft no hay nada que pueda quedar viejo.
  */
  const mover = useCallback(
    (paso: number, total: number) => {
      const riel = rielRef.current;
      if (!riel) return;
      const ancho = riel.clientWidth;
      const actual = Math.round(riel.scrollLeft / ancho);
      irA((actual + paso + total) % total);
    },
    [irA],
  );

  // Qué panel está a la vista. Sigue al dedo, a las flechas y al autoplay por igual.
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
  }, [varios, items.length]);

  // Avance automático: opcional, se apaga apenas alguien toca algo y nunca
  // corre si el sistema pide movimiento reducido.
  useEffect(() => {
    if (!varios || !data.autoplay || interactuado) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const riel = rielRef.current;
    if (!riel) return;

    /*
      `arrancar` tiene que poder llamarse dos veces seguidas sin apilar
      temporizadores.

      Antes creaba uno nuevo sin cancelar el anterior y sólo guardaba el
      último id, así que cada `mouseleave` sin su `mouseenter` dejaba un
      intervalo huérfano corriendo para siempre: el carrusel se iba acelerando
      solo, saltando de panel cada menos tiempo. Se vio en producción pasando
      de panel a los 0,8 segundos en lugar de los 7 configurados.
    */
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
        irA((actual + 1) % items.length);
      }, data.autoplaySeconds * 1000);
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
  }, [varios, data.autoplay, data.autoplaySeconds, items.length, interactuado, irA]);

  if (items.length === 0) return null;

  const centrado = data.align === "center";

  return (
    <section
      id={id}
      className="relative mt-16"
      aria-roledescription={varios ? "carrusel" : undefined}
      aria-label="Novedades"
    >
      <div
        ref={rielRef}
        onPointerDown={() => {
          // Invalida la comprobación pendiente: si la persona arrastra, manda ella.
          pedidoRef.current += 1;
          setInteractuado(true);
        }}
        className="banner-rail flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <article
            key={`${item.title}-${i}`}
            aria-roledescription={varios ? "panel" : undefined}
            aria-label={varios ? `${i + 1} de ${items.length}` : undefined}
            className={cn(
              "relative w-full shrink-0 snap-start overflow-hidden bg-carbon-900",
              ALTURAS[data.height],
            )}
          >
            {item.imageUrl && (
              <Image
                src={item.imageUrl}
                alt={item.imageAlt}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
              />
            )}

            {/*
              Dos velos: uno lateral que sostiene el texto y una base oscura.
              Con foto clara el titular en crema se pierde, y estas bandas son
              justamente donde entran las fotos más luminosas.
            */}
            <span
              aria-hidden
              className={cn(
                "absolute inset-0",
                centrado
                  ? "bg-carbon-950/55"
                  : "bg-gradient-to-r from-carbon-950/85 via-carbon-950/55 to-carbon-950/10",
              )}
            />

            <div
              className={cn(
                "relative mx-auto flex h-full max-w-[1600px] flex-col justify-center px-gutter pt-14",
                varios ? "pb-20" : "pb-14",
                centrado && "items-center text-center",
              )}
            >
              {item.kicker && <p className="eyebrow text-clay-400">{item.kicker}</p>}

              <h2
                className={cn(
                  "mt-4 max-w-[20ch] font-display text-display-md font-light text-bone",
                  centrado && "mx-auto",
                )}
              >
                {item.title}
              </h2>

              {item.body && (
                <p
                  className={cn(
                    "mt-4 max-w-[46ch] text-[15px] leading-relaxed text-linen-200",
                    centrado && "mx-auto",
                  )}
                >
                  {item.body}
                </p>
              )}

              {item.ctaLabel && (
                <Link
                  href={item.ctaHref}
                  className="mt-7 inline-flex w-fit items-center gap-2 rounded-md bg-bone px-6 py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-carbon-900 transition-colors hover:bg-bone-pure"
                >
                  {item.ctaLabel}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      {varios && (
        /*
          Los controles van juntos abajo a la derecha, no pegados a los bordes.

          Con las flechas centradas en los laterales, la de la izquierda caía
          sobre el texto —el panel está alineado a la izquierda— y se comía la
          primera letra de cada renglón. Acá comparten la fila con los puntos,
          alineados al mismo contenedor que el contenido, y no pisan nada.
        */
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-[1600px] items-center justify-end gap-4 px-gutter pb-5">
            <div className="pointer-events-auto flex items-center gap-2.5">
              {items.map((item, i) => (
                <button
                  key={`punto-${i}`}
                  type="button"
                  aria-label={`Ir al panel ${i + 1}: ${item.title}`}
                  aria-current={i === activo}
                  onClick={() => {
                    setInteractuado(true);
                    irA(i);
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === activo ? "w-7 bg-bone" : "w-1.5 bg-bone/45 hover:bg-bone/75",
                  )}
                />
              ))}
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              {(
                [
                  ["anterior", ChevronLeft, -1],
                  ["siguiente", ChevronRight, 1],
                ] as const
              ).map(([etiqueta, Icono, paso]) => (
                <button
                  key={etiqueta}
                  type="button"
                  aria-label={`Panel ${etiqueta}`}
                  onClick={() => {
                    setInteractuado(true);
                    mover(paso, items.length);
                  }}
                  className="grid size-9 place-items-center rounded-full border border-bone/30 bg-carbon-950/40 text-bone backdrop-blur-sm transition-colors hover:bg-carbon-950/75"
                >
                  <Icono className="size-4" aria-hidden />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
