import { Clock, CreditCard, Gift, MapPin, Percent, Sparkles, Truck } from "lucide-react";
import type { BlockData } from "@/domain/cms/blocks";

/**
 * Franja superior de beneficios.
 *
 * Los avisos se ven todos a la vez, sin rotar: un carrusel acá esconde dos
 * tercios del mensaje justo en la banda más visible del sitio. El remate
 * manuscrito de la derecha se oculta en pantallas chicas, donde el espacio lo
 * necesitan los beneficios.
 *
 * El contenido viene del CMS y no está escrito acá. Son promesas comerciales
 * —cuotas, descuentos— que aparecen en todas las páginas y cambian sin previo
 * aviso; estaban duplicadas a mano y terminaron contradiciendo a la home, que
 * es justamente lo que esto evita.
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

  return (
    <div className="bg-accent-700 text-bone-pure" role="region" aria-label="Beneficios">
      <div className="mx-auto flex max-w-[1600px] items-center overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-1 items-center justify-center gap-0 sm:justify-start">
          {avisos.map((aviso, i) => {
            const Icono = ICONOS[aviso.icon];
            return (
              <div
                key={aviso.text}
                className={[
                  "flex min-w-max items-center gap-2.5 px-4 py-2.5 sm:px-6",
                  i > 0 ? "border-l border-bone-pure/15" : "",
                ].join(" ")}
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
              </div>
            );
          })}
        </div>

        {data.remate && (
          <p className="script hidden shrink-0 pl-6 pr-2 text-[19px] text-bone-pure/90 lg:block">
            {data.remate}
          </p>
        )}
      </div>
    </div>
  );
}
