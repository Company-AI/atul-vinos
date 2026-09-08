import { CreditCard, Tag, Truck } from "lucide-react";

/**
 * Franja superior de beneficios.
 *
 * Los tres avisos se ven a la vez, sin rotar: un carrusel acá esconde dos
 * tercios del mensaje justo en la banda más visible del sitio. El remate
 * manuscrito de la derecha se oculta en pantallas chicas, donde el espacio
 * lo necesitan los beneficios.
 */
const AVISOS = [
  {
    Icon: Truck,
    texto: "Envío gratis en Río Cuarto",
    detalle: "Recibí tus vinos en la puerta de tu casa.",
  },
  {
    Icon: Tag,
    texto: "10% off en tu segunda compra",
    detalle: "Seguimos brindando juntos.",
  },
  {
    Icon: CreditCard,
    texto: "Hasta 6 cuotas sin interés",
    detalle: "Con todas las tarjetas.",
  },
] as const;

export function PromoBar({
  remate,
  conDetalle = false,
}: {
  remate?: string;
  /** Muestra la segunda línea de cada aviso, como en la primera maqueta. */
  conDetalle?: boolean;
}) {
  return (
    <div className="bg-wine-700 text-bone-pure" role="region" aria-label="Beneficios">
      <div className="mx-auto flex max-w-[1600px] items-center overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-1 items-center justify-center gap-0 sm:justify-start">
          {AVISOS.map(({ Icon, texto }, i) => (
            <div
              key={texto}
              className={[
                "flex min-w-max items-center gap-2.5 px-4 py-2.5 sm:px-6",
                i > 0 ? "border-l border-bone-pure/15" : "",
              ].join(" ")}
            >
              <Icon className="size-[18px] shrink-0 opacity-90" strokeWidth={1.5} aria-hidden />
              <div className="leading-tight">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.09em] sm:text-[12px]">
                  {texto}
                </p>
                {conDetalle && (
                  <p className="mt-0.5 text-[11px] text-bone-pure/70">{AVISOS[i].detalle}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {remate && (
          <p className="script hidden shrink-0 pl-6 pr-2 text-[19px] text-bone-pure/90 lg:block">
            {remate}
          </p>
        )}
      </div>
    </div>
  );
}
