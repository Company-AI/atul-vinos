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
        "absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full",
        "bg-bone-pure/90 text-carbon-900 shadow-raised transition-colors hover:bg-bone-pure",
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
 * Al tocarla se agranda al doble y el recuadro pasa a poder arrastrarse. Se
 * hace con el desplazamiento del navegador y no con una lupa propia: así el
 * teléfono aporta su gesto de siempre —arrastrar para recorrer, pellizcar
 * para acercar más— sin que haya que reimplementarlo peor.
 */
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
  const [acercada, setAcercada] = useState(false);
  const marco = useRef<HTMLDivElement>(null);

  // Cada foto se abre sin acercar: el estado anterior no tiene por qué heredarse.
  useEffect(() => {
    if (!abierta) setAcercada(false);
  }, [abierta]);
  useEffect(() => setAcercada(false), [foto.url]);

  const alternarAcercamiento = (e: React.MouseEvent<HTMLDivElement>) => {
    const caja = marco.current;
    if (!caja) return;
    if (acercada) {
      setAcercada(false);
      return;
    }
    /*
      Se acerca sobre el punto que se tocó y no sobre el centro: quien toca la
      parte de abajo de una contraetiqueta quiere leer eso, no el medio.
    */
    const r = caja.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setAcercada(true);
    requestAnimationFrame(() => {
      caja.scrollTo({
        left: px * (caja.scrollWidth - caja.clientWidth),
        top: py * (caja.scrollHeight - caja.clientHeight),
      });
    });
  };

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
            <Dialog.Close
              aria-label="Cerrar"
              className="rounded-full p-2 text-linen-200 transition-colors hover:bg-bone/10 hover:text-bone"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <div
            ref={marco}
            onClick={alternarAcercamiento}
            className={cn(
              "min-h-0 flex-1 overscroll-contain",
              acercada ? "cursor-zoom-out overflow-auto" : "cursor-zoom-in overflow-hidden",
            )}
          >
            <div className={cn("relative", acercada ? "h-[200%] w-[200%]" : "size-full")}>
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
                className="grid size-11 place-items-center rounded-full bg-bone/10 text-bone transition-colors hover:bg-bone/20"
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
            )}
            <p className="text-[13px] text-linen-300">
              {acercada ? "Tocá para alejar" : "Tocá la foto para acercar"}
            </p>
            {onMover && (
              <button
                type="button"
                onClick={() => onMover(1)}
                aria-label="Foto siguiente"
                className="grid size-11 place-items-center rounded-full bg-bone/10 text-bone transition-colors hover:bg-bone/20"
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
