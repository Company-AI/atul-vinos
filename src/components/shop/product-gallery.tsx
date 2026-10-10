"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/cn";

export type GalleryImage = { id: string; url: string; alt: string | null };

type Pieza =
  | { tipo: "imagen"; id: string; url: string; alt: string | null }
  | { tipo: "video"; id: string; url: string };

/**
 * Galería de producto.
 *
 * Tres cosas que pidió el cliente y por qué están así:
 *
 * Flechas sobre la foto grande, no sólo las miniaturas de abajo. Un vino se
 * sube de frente y de contraetiqueta, y pasar de una a otra es el gesto más
 * frecuente de esta pantalla: tener que apuntarle a una miniatura de ochenta
 * píxeles para hacerlo es pedirle puntería a alguien que está mirando una
 * botella.
 *
 * Zoom al tocar la foto. La contraetiqueta trae la composición, el productor
 * y las advertencias en cuerpo chico; sin ampliarla no se lee, y es
 * exactamente lo que alguien quiere mirar antes de comprar.
 *
 * Deslizar con el dedo. En el teléfono las flechas quedan chicas y el gesto
 * natural es arrastrar; las flechas siguen ahí para quien use el mouse o el
 * teclado.
 */
export function ProductGallery({
  images,
  productName,
  videoUrl,
}: {
  images: GalleryImage[];
  productName: string;
  videoUrl?: string | null;
}) {
  const piezas: Pieza[] = [
    ...images.map((i) => ({ tipo: "imagen" as const, id: i.id, url: i.url, alt: i.alt })),
    ...(videoUrl ? [{ tipo: "video" as const, id: "video", url: videoUrl }] : []),
  ];

  const [activa, setActiva] = useState(0);
  const [ampliada, setAmpliada] = useState(false);

  const total = piezas.length;
  const actual = piezas[Math.min(activa, Math.max(0, total - 1))];

  /* Da la vuelta en las dos puntas: desde la última, la siguiente es la primera. */
  const mover = useCallback(
    (paso: number) => setActiva((i) => (total === 0 ? 0 : (i + paso + total) % total)),
    [total],
  );

  // Las flechas del teclado mueven la galería mientras no haya nada escribiéndose.
  useEffect(() => {
    if (total < 2 || ampliada) return;
    const alTeclear = (e: KeyboardEvent) => {
      const foco = document.activeElement?.tagName;
      if (foco === "INPUT" || foco === "TEXTAREA" || foco === "SELECT") return;
      if (e.key === "ArrowLeft") mover(-1);
      if (e.key === "ArrowRight") mover(1);
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [total, ampliada, mover]);

  /* Deslizar con el dedo. Cuarenta píxeles: menos que eso suele ser un toque mal apuntado. */
  const inicioX = useRef<number | null>(null);
  const alSoltar = (x: number) => {
    if (inicioX.current === null) return;
    const recorrido = x - inicioX.current;
    inicioX.current = null;
    if (Math.abs(recorrido) > 40) mover(recorrido < 0 ? 1 : -1);
  };

  if (total === 0) {
    return (
      <div className="grid aspect-[3/4] w-full place-items-center bg-linen-100 text-stone-400">
        Sin imagen
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="group relative aspect-[3/4] w-full overflow-hidden bg-bone-pure"
        onTouchStart={(e) => (inicioX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => alSoltar(e.changedTouches[0]?.clientX ?? 0)}
      >
        {actual.tipo === "video" ? (
          <video
            src={actual.url}
            controls
            playsInline
            className="size-full object-cover"
            aria-label={`Video de ${productName}`}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAmpliada(true)}
            aria-label="Ampliar la foto para ver el detalle"
            className="absolute inset-0 cursor-zoom-in"
          >
            <Image
              src={actual.url}
              alt={actual.alt ?? productName}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-10"
            />
            <span
              aria-hidden
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-pill bg-carbon-950/70 px-3 py-1.5 text-[12px] text-bone opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ZoomIn className="size-3.5" />
              Ampliar
            </span>
          </button>
        )}

        {total > 1 && (
          <>
            <Flecha hacia="anterior" onClick={() => mover(-1)} />
            <Flecha hacia="siguiente" onClick={() => mover(1)} />
            {/*
              El contador importa en el teléfono, donde las miniaturas quedan
              fuera de la vista al mirar la foto grande.
            */}
            <span className="pointer-events-none absolute bottom-3 left-3 rounded-pill bg-carbon-950/70 px-2.5 py-1 text-[12px] tabular text-bone">
              {activa + 1} / {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <ul className="flex gap-3" role="tablist" aria-label={`Imágenes de ${productName}`}>
          {piezas.map((pieza, i) => (
            <li key={pieza.id}>
              <button
                type="button"
                role="tab"
                aria-selected={i === activa}
                aria-label={pieza.tipo === "video" ? "Ver el video" : `Ver la imagen ${i + 1}`}
                onClick={() => setActiva(i)}
                className={cn(
                  "relative grid size-20 place-items-center overflow-hidden border bg-linen-100 transition-colors",
                  i === activa ? "border-carbon-900" : "border-linen-300 hover:border-stone-400",
                )}
              >
                {pieza.tipo === "video" ? (
                  <span className="text-[11px] uppercase tracking-wider">Video</span>
                ) : (
                  <Image src={pieza.url} alt="" fill sizes="80px" className="object-contain p-2" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {actual.tipo === "imagen" && (
        <Ampliador
          abierta={ampliada}
          onCerrar={() => setAmpliada(false)}
          foto={actual}
          productName={productName}
          posicion={`${activa + 1} / ${total}`}
          onMover={total > 1 ? mover : undefined}
        />
      )}
    </div>
  );
}

function Flecha({ hacia, onClick }: { hacia: "anterior" | "siguiente"; onClick: () => void }) {
  const Icono = hacia === "anterior" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={hacia === "anterior" ? "Foto anterior" : "Foto siguiente"}
      className={cn(
        "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full",
        "bg-bone-pure/85 text-carbon-900 shadow-raised backdrop-blur-sm",
        /*
          La transición cubre color, sombra y escala a la vez: el botón se
          agranda apenas y se asienta al apretarlo. Es el gesto que le dice a
          la mano que algo respondió, antes de que la foto cambie.
        */
        "transition-[transform,background-color,box-shadow] duration-200 ease-out",
        "hover:scale-110 hover:bg-bone-pure hover:shadow-overlay active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon-900 focus-visible:ring-offset-2",
        /*
          Siempre visibles en pantallas táctiles, donde no hay cursor que las
          revele; en escritorio aparecen al acercarse a la foto.
        */
        "opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100",
        hacia === "anterior" ? "left-3" : "right-3",
      )}
    >
      <Icono className="size-5" aria-hidden />
    </button>
  );
}

/**
 * La foto a pantalla completa, para leer la contraetiqueta.
 *
 * Tres niveles y no dos: la contraetiqueta de un vino trae la composición y
 * las advertencias en un cuerpo que al doble todavía cuesta. El primer paso
 * sirve para mirar la etiqueta entera, el segundo para leerla.
 *
 * El recorrido es el desplazamiento del navegador y no una lupa propia: así
 * el teléfono aporta sus gestos de siempre —arrastrar para recorrer,
 * pellizcar para acercar más— sin que haya que reimplementarlos peor.
 */

/* 1 = entera en pantalla. Los saltos son grandes a propósito: un acercamiento
   que no se nota obliga a tocar tres veces para llegar a algún lado. */
const NIVELES = [1, 2, 3.5] as const;

function Ampliador({
  abierta,
  onCerrar,
  foto,
  productName,
  posicion,
  onMover,
}: {
  abierta: boolean;
  onCerrar: () => void;
  foto: { url: string; alt: string | null };
  productName: string;
  posicion: string;
  onMover?: (paso: number) => void;
}) {
  const [nivel, setNivel] = useState(0);
  const marco = useRef<HTMLDivElement>(null);

  /*
    El acercamiento cambia de golpe, sin animar.

    Hubo una versión que lo animaba y daba un efecto raro: al pasar de foto
    con el acercamiento puesto, la siguiente aparecía agrandada y se achicaba
    sola. Parecía un fallo, y como la foto nueva entraba recortada, daba la
    impresión de que la flecha no había hecho nada.

    Un salto instantáneo no se confunde con nada: la foto está en un tamaño o
    está en el otro. Si más adelante vale la pena animarlo, hay que mirarlo
    en un teléfono de verdad antes de darlo por bueno.
  */

  // Cada foto se abre sin acercar: el estado anterior no tiene por qué heredarse.
  useEffect(() => {
    if (!abierta) setNivel(0);
  }, [abierta]);
  useEffect(() => setNivel(0), [foto.url]);

  const avanzarNivel = (e: React.MouseEvent<HTMLDivElement>) => {
    const caja = marco.current;
    if (!caja) return;

    /* Da la vuelta: del último acercamiento se sale a la foto entera. */
    const siguiente = (nivel + 1) % NIVELES.length;

    /*
      Dónde se tocó, en proporción del contenido —no de la ventana—. Hay que
      calcularlo antes de cambiar el nivel: después, el contenido ya es de
      otro tamaño y la cuenta daría otro punto.
    */
    const r = caja.getBoundingClientRect();
    const px = (caja.scrollLeft + e.clientX - r.left) / caja.scrollWidth;
    const py = (caja.scrollTop + e.clientY - r.top) / caja.scrollHeight;

    setNivel(siguiente);

    if (siguiente === 0) return;

    /*
      El marco se agranda con una transición, así que su tamaño nuevo todavía
      no está cuando termina este clic. Se espera un cuadro y recién ahí se
      centra el punto, con el destino ya calculado sobre la medida final.
    */
    requestAnimationFrame(() => {
      const escala = NIVELES[siguiente];
      const anchoFinal = caja.clientWidth * escala;
      const altoFinal = caja.clientHeight * escala;
      caja.scrollTo({
        left: px * anchoFinal - caja.clientWidth / 2,
        top: py * altoFinal - caja.clientHeight / 2,
      });
    });
  };

  const escala = NIVELES[nivel];
  const acercada = nivel > 0;
  const leyenda =
    nivel === 0
      ? "Tocá la foto para acercar"
      : nivel === NIVELES.length - 1
        ? "Tocá para volver al tamaño original"
        : "Tocá de nuevo para acercar más";

  return (
    <Dialog.Root open={abierta} onOpenChange={(v) => !v && onCerrar()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-carbon-950/95 data-[state=open]:animate-[fade-in_180ms_ease-out]" />
        <Dialog.Content
          className="fixed inset-0 z-[80] flex flex-col outline-none"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">{`Foto de ${productName} ampliada`}</Dialog.Title>

          <div className="flex shrink-0 items-center justify-between px-4 py-3 text-bone">
            <span className="tabular text-[13px] text-linen-300">{posicion}</span>
            <div className="flex items-center gap-3">
              {acercada && (
                <span className="tabular rounded-pill bg-bone/10 px-2.5 py-1 text-[12px] text-linen-200">
                  {escala}×
                </span>
              )}
              <Dialog.Close
                aria-label="Cerrar"
                className="rounded-full p-2 text-linen-200 transition-colors hover:bg-bone/10 hover:text-bone"
              >
                <X className="size-5" />
              </Dialog.Close>
            </div>
          </div>

          <div
            ref={marco}
            onClick={avanzarNivel}
            className={cn(
              "min-h-0 flex-1 overscroll-contain",
              acercada ? "overflow-auto" : "overflow-hidden",
              nivel === NIVELES.length - 1 ? "cursor-zoom-out" : "cursor-zoom-in",
            )}
          >
            <div
              className="relative"
              style={{ width: `${escala * 100}%`, height: `${escala * 100}%` }}
            >
              <Image
                src={foto.url}
                alt={foto.alt ?? productName}
                fill
                sizes="100vw"
                /* Calidad alta: con la de por defecto, la letra chica se empasta. */
                quality={90}
                className="object-contain p-4"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-center gap-6 px-4 py-4">
            {onMover && (
              <button
                type="button"
                onClick={() => onMover(-1)}
                aria-label="Foto anterior"
                className={cn(
                  "grid size-11 place-items-center rounded-full bg-bone/10 text-bone",
                  "transition-[transform,background-color] duration-200 ease-out",
                  "hover:scale-110 hover:bg-bone/25 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bone/70",
                )}
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
            )}
            <p className="min-w-[14rem] text-center text-[13px] text-linen-300">{leyenda}</p>
            {onMover && (
              <button
                type="button"
                onClick={() => onMover(1)}
                aria-label="Foto siguiente"
                className={cn(
                  "grid size-11 place-items-center rounded-full bg-bone/10 text-bone",
                  "transition-[transform,background-color] duration-200 ease-out",
                  "hover:scale-110 hover:bg-bone/25 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bone/70",
                )}
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
