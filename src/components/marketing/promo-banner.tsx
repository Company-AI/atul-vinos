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
  /*
    Tira fina, a la altura de la tira de bodegas (~183px). A este alto el
    texto no entra apilado: el titular, la bajada y el botón pasan a
    componerse en fila, usando el ancho en lugar de la altura.
  */
  baja: "min-h-[172px] sm:min-h-[188px] lg:min-h-[200px]",
  media: "min-h-[300px] sm:min-h-[340px] lg:min-h-[380px]",
  alta: "min-h-[380px] sm:min-h-[440px] lg:min-h-[500px]",
} as const;

export function PromoBanner({ data, id }: { data: BlockData<"promo_banner">; id?: string }) {
  const items = data.items.filter((i) => i.title.trim() !== "" || i.imageUrl !== "");
  const rielRef = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(0);
  const [interactuado, setInteractuado] = useState(false);
  /** Cuadro pendiente de la animación en curso, para poder interrumpirla. */
  const animRef = useRef<number | null>(null);
  /** Cierre de seguridad por si los cuadros se frenan a mitad de recorrido. */
  const cierreRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const varios = items.length > 1;

  /*
    Cada panel mide exactamente el ancho del riel, así que la posición de uno
    es ancho × índice. Se calcula así y no con offsetLeft porque el riel no
    crea contexto de posicionamiento: el offsetParent de los paneles es la
    sección, y cualquier cambio de layout en el envoltorio corría la cuenta.
  */
  /*
    El recorrido se anima acá, cuadro por cuadro, en lugar de pedírselo al
    navegador.

    `scroll-behavior: smooth` parecía lo correcto y resultó ser la causa de
    todo: Chrome deja animaciones pendientes que bloquean los desplazamientos
    siguientes, y el riel terminaba clavado a mitad de panel. Cualquier
    corrección posterior chocaba con esas animaciones y saltaba de a dos.

    Con requestAnimationFrame el control es propio: se interrumpe cuando hace
    falta, termina siempre en el píxel exacto del panel, y si el navegador
    frena los cuadros —pestaña en segundo plano— simplemente no se mueve, que
    es inofensivo. Con movimiento reducido va directo, sin recorrido.
  */
  const irA = useCallback((i: number) => {
    const riel = rielRef.current;
    if (!riel) return;

    const cortar = () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      if (cierreRef.current !== null) {
        clearTimeout(cierreRef.current);
        cierreRef.current = null;
      }
    };
    cortar();

    const destino = riel.clientWidth * i;
    const partida = riel.scrollLeft;
    const delta = destino - partida;
    if (Math.abs(delta) < 2) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      riel.scrollLeft = destino;
      return;
    }

    const DURACION = 480;
    const arranque = performance.now();

    const cuadro = (ahora: number) => {
      const t = Math.min(1, (ahora - arranque) / DURACION);
      // easeInOutCubic: arranca y frena suave, constante en el medio.
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      riel.scrollLeft = partida + delta * e;

      if (t < 1) {
        animRef.current = requestAnimationFrame(cuadro);
      } else {
        riel.scrollLeft = destino;
        animRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(cuadro);

    /*
      Cierre de seguridad. Chrome frena los cuadros cuando la ventana no se
      está componiendo —medido: uno por segundo—, y entonces el recorrido se
      queda a mitad de panel. Pasado el tiempo de la animación se corta y se
      va al destino.

      Esto no tiene la carrera que tenían los intentos anteriores: la única
      animación que puede estar tocando el riel es la nuestra, y la cancelamos
      antes de asignar. No hay nada del navegador con qué chocar.
    */
    cierreRef.current = setTimeout(() => {
      if (animRef.current === null) return;
      cortar();
      const actual = rielRef.current;
      if (actual) actual.scrollLeft = destino;
    }, DURACION + 140);
  }, []);

  // Si el componente se va con algo pendiente, se cancela.
  useEffect(
    () => () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
      if (cierreRef.current !== null) clearTimeout(cierreRef.current);
    },
    [],
  );

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
  /*
    En la tira fina el contenido se compone en fila —texto a la izquierda,
    botón a la derecha— porque apilado no entra: medido, kicker + titular +
    bajada + botón suman unos 177px y la banda tiene 152 de alto útil.
  */
  const compacta = data.height === "baja";

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
          // Si la persona arrastra, manda ella: se corta la animación en curso.
          if (animRef.current !== null) {
            cancelAnimationFrame(animRef.current);
            animRef.current = null;
          }
          if (cierreRef.current !== null) {
            clearTimeout(cierreRef.current);
            cierreRef.current = null;
          }
          setInteractuado(true);
        }}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                /*
                  Todas las fotos se piden de entrada, no a demanda.

                  Con carga diferida el panel puede aparecer antes que su
                  imagen y se ve una banda oscura vacía. Acá el panel aparece
                  solo, por el giro automático, así que nadie provoca la carga
                  a tiempo: medido en producción, el panel de las cuotas seguía
                  sin foto después de cuarenta segundos en la página.

                  Sólo la primera lleva `priority`, que además la precarga; las
                  otras se descargan sin prioridad mientras la primera se ve.
                */
                loading={i === 0 ? undefined : "eager"}
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
                "relative mx-auto flex h-full max-w-[1600px] px-gutter",
                compacta
                  ? "items-center justify-between gap-6 py-6"
                  : cn(
                      "flex-col justify-center pt-14",
                      varios ? "pb-20" : "pb-14",
                      centrado && "items-center text-center",
                    ),
              )}
            >
              <div className={cn("min-w-0", !compacta && centrado && "contents")}>
                {item.kicker && <p className="eyebrow text-clay-400">{item.kicker}</p>}

                <h2
                  className={cn(
                    "font-display font-light text-bone",
                    compacta
                      ? "mt-1.5 text-[20px] leading-tight sm:text-[24px]"
                      : "mt-4 max-w-[20ch] text-display-md",
                    !compacta && centrado && "mx-auto",
                  )}
                >
                  {item.title}
                </h2>

                {item.body && (
                  <p
                    className={cn(
                      "text-linen-200",
                      compacta
                        ? "mt-1.5 hidden max-w-[60ch] text-[13px] leading-snug sm:block"
                        : "mt-4 max-w-[46ch] text-[15px] leading-relaxed",
                      !compacta && centrado && "mx-auto",
                    )}
                  >
                    {item.body}
                  </p>
                )}
              </div>

              {item.ctaLabel && (
                <Link
                  href={item.ctaHref}
                  className={cn(
                    "inline-flex w-fit shrink-0 items-center gap-2 rounded-md bg-bone font-medium uppercase tracking-[0.08em] text-carbon-900 transition-colors hover:bg-bone-pure",
                    compacta
                      ? "mr-14 px-4 py-2.5 text-[12px]"
                      : "mt-7 px-6 py-3 text-[13px]",
                  )}
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
          <div className={cn("mx-auto flex max-w-[1600px] items-center justify-end gap-4 px-gutter", compacta ? "pb-3" : "pb-5")}>
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

            {/*
              En la tira fina las flechas no entran: la banda mide 200px y el
              botón ya ocupa la derecha. Quedan los puntos, que además de
              indicar en cuál va sirven para saltar de panel. El giro
              automático y el arrastre siguen funcionando igual.
            */}
            <div className={cn("pointer-events-auto items-center gap-2", compacta ? "hidden" : "flex")}>
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
