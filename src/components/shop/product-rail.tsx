"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductCard } from "@/domain/catalog/types";
import { cn } from "@/lib/cn";
import { WineCardRow } from "./wine-card-row";

/**
 * Riel horizontal de productos con flechas.
 *
 * Se arrastra con el dedo o con la rueda y, en escritorio, con las dos
 * flechas. No rota solo: el visitante controla el ritmo y nada se mueve
 * debajo del cursor.
 *
 * Las flechas van sobre los bordes del riel, centradas en vertical, y se
 * apagan en los extremos en lugar de desaparecer: así el riel no se corre
 * cuando se llega al final. En pantallas sin mouse no aparecen —ahí se
 * arrastra con el dedo, que es más directo que apuntarle a un botón.
 */
export function ProductRail({
  productos,
  favoritos,
}: {
  productos: ProductCard[];
  favoritos: Set<string>;
}) {
  const riel = useRef<HTMLDivElement>(null);
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(false);

  const revisar = useCallback(() => {
    const el = riel.current;
    if (!el) return;
    setPuedeIzq(el.scrollLeft > 4);
    setPuedeDer(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    revisar();
    const el = riel.current;
    if (!el) return;
    el.addEventListener("scroll", revisar, { passive: true });
    window.addEventListener("resize", revisar);
    return () => {
      el.removeEventListener("scroll", revisar);
      window.removeEventListener("resize", revisar);
    };
  }, [revisar]);

  const mover = (signo: 1 | -1) => {
    const el = riel.current;
    if (!el) return;
    // Un paso = lo que se ve, menos una tarjeta: siempre queda una de guía.
    el.scrollBy({ left: signo * Math.max(280, el.clientWidth - 320), behavior: "smooth" });
  };

  const flecha = (activa: boolean, lado: "izq" | "der") =>
    cn(
      "absolute top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full border shadow-card transition-colors lg:grid",
      "size-10",
      lado === "izq" ? "-left-5" : "-right-5",
      activa
        ? "border-linen-200 bg-bone-pure text-carbon-800 hover:border-accent-700 hover:text-accent-700"
        : "cursor-default border-linen-200 bg-bone text-stone-300",
    );

  return (
    <div className="relative">
      <div
        ref={riel}
        className="rail-snap gap-5 pb-2"
        role="region"
        aria-label="Más vendidos"
      >
        {productos.map((p) => (
          <div key={p.id} className="w-[300px] shrink-0 sm:w-[340px]">
            <WineCardRow product={p} isFavorite={favoritos.has(p.id)} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => mover(-1)}
        disabled={!puedeIzq}
        aria-label="Anterior"
        className={flecha(puedeIzq, "izq")}
      >
        <ChevronLeft className="size-[18px]" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => mover(1)}
        disabled={!puedeDer}
        aria-label="Siguiente"
        className={flecha(puedeDer, "der")}
      >
        <ChevronRight className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}
