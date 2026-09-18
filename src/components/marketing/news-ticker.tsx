import Link from "next/link";
import { Clock, CreditCard, Gift, MapPin, Percent, Sparkles, Truck } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BlockData } from "@/domain/cms/blocks";

/**
 * Renglón de novedades que se desplaza solo.
 *
 * Corta entre dos secciones de producto y lleva lo que la tienda quiera
 * empujar ese mes: promos, cuotas, envío sin cargo, un lanzamiento. Todo sale
 * del CMS; acá no hay ningún texto escrito a mano.
 *
 * No lleva JavaScript. El desplazamiento es una animación CSS sobre un riel
 * que contiene la lista dos veces: se traslada -50%, que es exactamente una
 * copia, así que el reinicio cae en un punto idéntico al de partida y el
 * bucle no tiene costura. La segunda copia va oculta para lectores de
 * pantalla, que si no leerían todo dos veces.
 *
 * Si el navegador pide movimiento reducido, la animación no corre y queda una
 * tira horizontal que se arrastra con el dedo o el trackpad: el contenido
 * sigue siendo accesible, sólo deja de moverse solo.
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
  Segundos por vuelta completa. Es duración fija, no velocidad: con muchos
  ítems el riel es más largo y por lo tanto pasa más rápido. Si se cargan
  ocho o diez novedades conviene bajar a "lenta".
*/
const DURACION = { lenta: "64s", normal: "42s", rapida: "28s" } as const;

const TONOS = {
  accent: "bg-accent-700 text-linen-100",
  wine: "bg-wine-600 text-linen-100",
  carbon: "bg-carbon-900 text-linen-200",
  linen: "bg-linen-200 text-carbon-800",
} as const;

export function NewsTicker({ data }: { data: BlockData<"news_ticker"> }) {
  const items = data.items.filter((i) => i.text.trim() !== "");
  if (items.length === 0) return null;

  const lista = (copia: boolean) => (
    <ul
      className="flex items-center"
      aria-hidden={copia || undefined}
      data-ticker-copia={copia || undefined}
    >
      {items.map((item, i) => {
        const Icono = ICONOS[item.icon];
        const contenido = (
          <>
            {Icono && <Icono className="size-[15px] shrink-0 opacity-80" aria-hidden />}
            <span>{item.text}</span>
          </>
        );

        return (
          <li key={`${copia ? "c" : "o"}-${i}`} className="flex shrink-0 items-center">
            {item.href ? (
              <Link
                href={item.href}
                tabIndex={copia ? -1 : undefined}
                className="flex items-center gap-2.5 px-7 py-3.5 text-[13px] tracking-[0.02em] underline-offset-4 transition-opacity hover:opacity-80 hover:underline"
              >
                {contenido}
              </Link>
            ) : (
              <span className="flex items-center gap-2.5 px-7 py-3.5 text-[13px] tracking-[0.02em]">
                {contenido}
              </span>
            )}

            {/* Rombo separador: marca el corte sin cerrar el renglón. */}
            <span
              aria-hidden
              className="size-[5px] rotate-45 bg-current opacity-35"
            />
          </li>
        );
      })}
    </ul>
  );

  return (
    <section aria-label="Novedades" className={cn("mt-16 overflow-hidden", TONOS[data.tone])}>
      <div className="ticker-viewport">
        <div
          className="ticker-track"
          style={{ "--ticker-duration": DURACION[data.speed] } as React.CSSProperties}
        >
          {lista(false)}
          {lista(true)}
        </div>
      </div>
    </section>
  );
}
