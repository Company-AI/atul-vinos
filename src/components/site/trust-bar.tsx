import { CreditCard, MessageCircle, ShieldCheck, Truck } from "lucide-react";

/**
 * Franja de confianza al pie del contenido.
 *
 * Resuelve las cuatro dudas que frenan una compra —cuánto sale el envío, con
 * qué puedo pagar, es seguro, a quién le escribo— sin obligar a entrar a
 * ninguna página.
 */
const ITEMS = [
  { Icon: Truck, texto: "Envío gratis en Río Cuarto" },
  { Icon: CreditCard, texto: "Todos los medios de pago" },
  { Icon: ShieldCheck, texto: "Compra segura" },
  { Icon: MessageCircle, texto: "¿Tenés dudas? Escribinos" },
] as const;

export function TrustBar() {
  return (
    <div className="border-t border-linen-200 bg-bone">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-10 gap-y-4 px-4 py-5 sm:px-6">
        {ITEMS.map(({ Icon, texto }) => (
          <div key={texto} className="flex items-center gap-2.5">
            <Icon className="size-[17px] shrink-0 text-wine-700" aria-hidden />
            <span className="text-[12px] uppercase tracking-[0.1em] text-carbon-800">{texto}</span>
          </div>
        ))}

        <p className="ml-auto hidden items-center gap-4 text-[12px] uppercase tracking-[0.16em] text-stone-500 lg:flex">
          <span aria-hidden className="h-px w-10 bg-linen-300" />
          El vino también une
        </p>
      </div>
    </div>
  );
}
