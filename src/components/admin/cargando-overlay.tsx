"use client";

/**
 * Velo de carga del panel.
 *
 * Aparece mientras se navega de una sección a otra. No es decoración: en el
 * admin casi todas las pantallas consultan la base, y sin una señal clara el
 * clic parece no haber hecho nada y la persona vuelve a hacer clic.
 *
 * La copa se llena de vino y se vacía, en bucle. Es la figura de la marca —la
 * misma del isotipo— y además sirve de barra de progreso aproximada: se ve
 * que algo avanza aunque no sepamos cuánto falta.
 *
 * El líquido sube dentro de un recorte con la forma del cáliz, así que ocupa
 * exactamente la copa y no un rectángulo. El ciclo nunca llega a copa vacía:
 * las navegaciones duran alrededor de un segundo y arrancar en cero dejaba
 * ver una copa vacía casi todo el tiempo. Con movimiento reducido no se anima
 * y queda llena a la mitad, que sigue leyéndose como "esperá".
 */
export function CargandoOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando"
      className="fixed inset-0 z-[90] grid place-items-center bg-carbon-950/70 backdrop-blur-[3px] animate-[fade-in_180ms_ease-out_forwards]"
    >
      <div className="flex flex-col items-center gap-5">
        <svg
          viewBox="0 0 64 88"
          className="h-20 w-auto"
          aria-hidden
          fill="none"
          stroke="currentColor"
        >
          <defs>
            {/*
              El cáliz, usado como recorte. El líquido se dibuja como un
              rectángulo grande que sube; este recorte es lo que le da la
              forma de copa.
            */}
            <clipPath id="caliz-atul">
              <path d="M14 6 H50 L47 30 Q47 44 32 48 Q17 44 17 30 Z" />
            </clipPath>
          </defs>

          {/* Vino: sube y baja en bucle dentro del cáliz. */}
          <g clipPath="url(#caliz-atul)">
            <rect
              x="10"
              y="6"
              width="44"
              height="44"
              data-copa
              className="fill-wine-500 [animation:copa-llenar_1600ms_ease-in-out_infinite]"
            />
          </g>

          {/* Contorno de la copa, encima del líquido. */}
          <g className="stroke-linen-200/80" strokeWidth="2" strokeLinecap="round">
            <path d="M14 6 H50 L47 30 Q47 44 32 48 Q17 44 17 30 Z" />
            <path d="M32 48 V74" />
            <path d="M20 78 H44" />
          </g>
        </svg>

        <p className="eyebrow text-linen-300/80">Cargando</p>
      </div>
    </div>
  );
}
