import { Clock, CreditCard, Gift, MapPin, Percent, Sparkles, Truck } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BlockData } from "@/domain/cms/blocks";

/**
 * Franja superior de beneficios.
 *
 * Se desplaza sola, de derecha a izquierda, para que los avisos vayan
 * apareciendo sin que nadie tenga que tocar nada. Lo pidió el cliente: "que
 * corra y no que la gente tenga que clickear para cambiar".
 *
 * No lleva JavaScript. Es una animación CSS sobre un riel que contiene la
 * lista dos veces: se traslada -50%, que es exactamente una copia, así que el
 * reinicio cae en un punto idéntico al de partida y el bucle no tiene
 * costura. La segunda copia va oculta para lectores de pantalla, que si no
 * leerían todo dos veces.
 *
 * Si el navegador pide movimiento reducido, la animación no corre y queda una
 * tira que se arrastra con el dedo: el contenido sigue accesible, sólo deja de
 * moverse solo. El interruptor del admin hace lo mismo a voluntad.
 *
 * El contenido viene del CMS y no está escrito acá. Son promesas comerciales
 * —cuotas, descuentos— que aparecen en todas las páginas y cambian sin previo
 * aviso; estaban duplicadas a mano y terminaron contradiciendo a la home.
 */

const ICONOS = {
  none: null,
  truck: Truck,
  percent: Percent,
  card: CreditCard,
  gift: Gift,
  sparkle: Sparkles,
  clock: Clock,
  pin: MapPin,
} as const;

/*
  Con tres avisos cortos una sola pasada de la lista es más angosta que la
  pantalla, y entonces el bucle deja un hueco a la derecha. Repetirla hasta
  pasar el ancho evita medir nada en el navegador.
*/
const REPETICIONES = 3;

/** Multiplica la duración. Más alto, más lento. */
const RITMO = { lenta: 1.5, normal: 1, rapida: 0.65 } as const;

/*
  Segundos por aviso a velocidad normal. La duración total se calcula con esto
  y no es un número fijo: así el ritmo de lectura se mantiene igual tanto con
  tres avisos como con ocho.

  5,5 da unos 47 píxeles por segundo, que es el rango cómodo para leer algo
  que se mueve. A 4,5 daba 57 y había que apurarse.
*/
const SEGUNDOS_POR_AVISO = 5.5;

export function PromoBar({
  data,
  conDetalle = false,
}: {
  data: BlockData<"benefits_bar">;
  /** Muestra la segunda línea de cada aviso, como en la primera maqueta. */
  conDetalle?: boolean;
}) {
  const avisos = data.items.filter((i) => i.text.trim() !== "");
  if (avisos.length === 0) return null;

  const enMovimiento = data.enMovimiento && avisos.length > 1;
  const secuencia = enMovimiento
    ? Array.from({ length: REPETICIONES }, () => avisos).flat()
    : avisos;
  const duracion = `${(secuencia.length * SEGUNDOS_POR_AVISO * RITMO[data.speed]).toFixed(0)}s`;

  const lista = (copia: boolean) => (
    <ul
      className="flex items-center"
      aria-hidden={copia || undefined}
      data-ticker-copia={copia || undefined}
    >
      {secuencia.map((aviso, i) => {
        const Icono = ICONOS[aviso.icon];
        return (
          <li
            key={`${copia ? "c" : "o"}-${i}`}
            className={cn(
              "flex min-w-max items-center gap-2.5 px-4 py-2.5 sm:px-6",
              i > 0 && "border-l border-bone-pure/15",
            )}
          >
            {Icono && (
              <Icono className="size-[18px] shrink-0 opacity-90" strokeWidth={1.5} aria-hidden />
            )}
            <div className="leading-tight">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.09em] sm:text-[12px]">
                {aviso.text}
              </p>
              {conDetalle && aviso.detail && (
                <p className="mt-0.5 text-[11px] text-bone-pure/70">{aviso.detail}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="bg-accent-700 text-bone-pure" role="region" aria-label="Beneficios">
      <div className="mx-auto flex max-w-[1600px] items-center">
        <div className="ticker-viewport min-w-0 flex-1">
          {enMovimiento ? (
            <div
              className="ticker-track"
              style={{ "--ticker-duration": duracion } as React.CSSProperties}
            >
              {lista(false)}
              {lista(true)}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center sm:justify-start">
              {lista(false)}
            </div>
          )}
        </div>

        {/*
          El remate queda fuera del riel: es la firma de la marca, no un aviso,
          y si se desplazara con el resto perdería el lugar fijo que le da
          sentido. Se oculta en pantallas chicas, donde el espacio lo necesitan
          los beneficios.
        */}
        {data.remate && (
          <p className="script hidden shrink-0 border-l border-bone-pure/15 py-2.5 pl-6 pr-4 text-[19px] text-bone-pure/90 lg:block">
            {data.remate}
          </p>
        )}
      </div>
    </div>
  );
}
