"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { DatosDeTransferencia } from "@/domain/payments/transferencia";
import { cn } from "@/lib/cn";

/**
 * La cuenta a la que hay que girar la plata.
 *
 * Con botón de copiar en los campos que son una tira de números: un CBU son
 * veintidós dígitos y copiarlos a mano es la forma más común de que una
 * transferencia termine en otro lado. El titular y el banco no se copian
 * porque se leen y se comparan, no se pegan.
 */
export function DatosParaTransferir({
  datos,
  className,
}: {
  datos: DatosDeTransferencia;
  className?: string;
}) {
  const filas = [
    { etiqueta: "Titular", valor: datos.titular, copiable: false },
    { etiqueta: "Banco", valor: datos.banco, copiable: false },
    { etiqueta: "Alias", valor: datos.alias, copiable: true },
    { etiqueta: "CBU", valor: datos.cbu, copiable: true },
    { etiqueta: "CUIT", valor: datos.cuit, copiable: true },
  ].filter((f) => f.valor.length > 0);

  return (
    <dl className={cn("divide-y divide-linen-200", className)}>
      {filas.map((fila) => (
        <div
          key={fila.etiqueta}
          className="flex items-center justify-between gap-4 py-2.5 text-[14px]"
        >
          <dt className="shrink-0 text-stone-500">{fila.etiqueta}</dt>
          <dd className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "truncate text-carbon-900",
                fila.copiable && "tabular font-medium",
              )}
            >
              {fila.valor}
            </span>
            {fila.copiable && <BotonCopiar valor={fila.valor} etiqueta={fila.etiqueta} />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function BotonCopiar({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /*
        Sin permiso de portapapeles —Safari viejo, http— no pasa nada: el
        número está a la vista y se puede seleccionar. Avisar de un error acá
        sólo asustaría a alguien que está por mandar plata.
      */
    }
  };

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={copiado ? `${etiqueta} copiado` : `Copiar ${etiqueta}`}
      className="shrink-0 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-linen-100 hover:text-carbon-900"
    >
      {copiado ? (
        <Check className="size-3.5 text-success-500" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}
