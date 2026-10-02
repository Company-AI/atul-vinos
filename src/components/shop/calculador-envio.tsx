"use client";

import { useState, useTransition } from "react";
import { Truck } from "lucide-react";
import { cotizarEnvio } from "@/app/actions/envios";
import { AR_PROVINCES } from "@/lib/ar";
import { formatARS } from "@/lib/money";
import { cn } from "@/lib/cn";
import { Select } from "@/ui/field";
import type { ShippingQuote } from "@/domain/shipping/ports";

/**
 * "¿Cuánto me sale que llegue?", respondido en la ficha del producto.
 *
 * La pregunta aparece antes de comprar, no durante. Sin una respuesta acá, la
 * forma de averiguarlo era cargar el carrito, llegar al checkout y escribir la
 * dirección entera: tres pasos para un dato que decide la compra.
 *
 * Pide código postal y provincia. Sólo con el CP alcanzaría si tuviéramos la
 * tabla de códigos postales del país, que no tenemos; la provincia es la que
 * garantiza que la zona que se encuentre sea la correcta y no una cara de más.
 * Para las zonas que sí tienen rango de CP cargado —Río Cuarto, por ejemplo—
 * el código postal gana y la provincia ni se usa.
 */
export function CalculadorEnvio({ bottles = 1 }: { bottles?: number }) {
  const [cp, setCp] = useState("");
  const [provincia, setProvincia] = useState("");
  const [opciones, setOpciones] = useState<ShippingQuote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculando, start] = useTransition();

  const listo = cp.trim().length >= 4 && provincia !== "";

  const calcular = () => {
    if (!listo) return;
    start(async () => {
      const result = await cotizarEnvio({ postalCode: cp, province: provincia, bottles });
      if (result.ok) {
        setOpciones(result.opciones);
        setError(null);
      } else {
        setOpciones(null);
        setError(result.error);
      }
    });
  };

  return (
    <div className="mt-8 border-t border-linen-200 pt-6">
      <p className="flex items-center gap-2 text-[13px] font-medium text-carbon-900">
        <Truck className="size-4 text-clay-500" aria-hidden />
        Calculá el costo de envío
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-stone-500">Código postal</span>
          <input
            value={cp}
            onChange={(e) => setCp(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                calcular();
              }
            }}
            inputMode="numeric"
            maxLength={8}
            placeholder="5800"
            aria-label="Código postal"
            className="h-10 w-24 rounded-sm border border-linen-300 bg-bone-pure px-3 text-sm text-carbon-900 placeholder:text-stone-400 focus:border-carbon-900"
          />
        </label>

        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[12px] text-stone-500">Provincia</span>
          <Select
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            aria-label="Provincia"
            className="h-10 text-sm"
          >
            <option value="">Elegí…</option>
            {AR_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </label>

        <button
          type="button"
          onClick={calcular}
          disabled={!listo || calculando}
          className={cn(
            "h-10 shrink-0 rounded-sm px-4 text-[13px] font-medium transition-colors",
            listo && !calculando
              ? "bg-carbon-900 text-bone hover:bg-carbon-800"
              : "bg-linen-200 text-stone-400",
          )}
        >
          {calculando ? "Calculando…" : "Calcular"}
        </button>
      </div>

      {error && <p className="mt-3 text-[13px] text-danger-500">{error}</p>}

      {opciones && opciones.length > 0 && (
        <ul className="mt-4 space-y-2" aria-live="polite">
          {opciones.map((o) => (
            <li
              key={o.serviceCode}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-linen-200 pb-2 text-[13px] last:border-0"
            >
              <span className="text-carbon-800">
                {o.serviceName}
                {o.etaMinDays !== null && o.etaMaxDays !== null && (
                  <span className="ml-2 text-stone-500">
                    {o.etaMinDays === o.etaMaxDays
                      ? `${o.etaMaxDays} ${o.etaMaxDays === 1 ? "día" : "días"}`
                      : `${o.etaMinDays} a ${o.etaMaxDays} días`}
                  </span>
                )}
              </span>
              <span className={cn("tabular font-medium", o.price === 0 && "text-success-500")}>
                {o.price === 0 ? "Sin cargo" : formatARS(o.price)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {opciones && (
        <p className="mt-3 text-[12px] leading-relaxed text-stone-500">
          {/*
            El precio es por la cantidad que se está mirando. Si suma más
            botellas cambia, y los umbrales de envío gratis dependen del total
            del carrito: decirlo acá evita el reclamo en el checkout.
          */}
          Calculado para {bottles} {bottles === 1 ? "botella" : "botellas"}. El costo final se
          confirma en el checkout, con el total de tu pedido.
        </p>
      )}
    </div>
  );
}
