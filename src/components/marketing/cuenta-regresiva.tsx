"use client";

import { useEffect, useState } from "react";

/**
 * Cuenta regresiva hasta un instante fijo.
 *
 * El primer render no muestra números sino guiones, a propósito. El servidor y
 * el navegador tienen relojes distintos, así que calcular el tiempo restante en
 * los dos lados produce dos resultados y React protesta por la diferencia. Con
 * el hueco ya dibujado —mismo ancho, mismas cajas— el cambio de guiones a
 * números no mueve nada de lugar.
 *
 * Los números van en cifras tabulares: si no, cada segundo cambia el ancho del
 * dígito y el bloque entero tiembla.
 */

type Restante = { dias: number; horas: number; minutos: number; segundos: number };

function calcular(objetivo: number): Restante | null {
  const ms = objetivo - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
  };
}

export function CuentaRegresiva({
  targetAt,
  finalText,
}: {
  targetAt: string;
  finalText: string;
}) {
  const objetivo = new Date(targetAt).getTime();
  const valida = Number.isFinite(objetivo);

  const [montado, setMontado] = useState(false);
  const [restante, setRestante] = useState<Restante | null>(null);

  useEffect(() => {
    if (!valida) return;
    setMontado(true);
    setRestante(calcular(objetivo));
    const id = setInterval(() => setRestante(calcular(objetivo)), 1000);
    return () => clearInterval(id);
  }, [objetivo, valida]);

  // Sin fecha cargada no se inventa una cuenta: no se muestra nada.
  if (!valida) return null;

  if (montado && restante === null) {
    return (
      <p className="font-display text-display-md font-light text-bone">{finalText}</p>
    );
  }

  const bloques = [
    { valor: restante?.dias, etiqueta: "días" },
    { valor: restante?.horas, etiqueta: "horas" },
    { valor: restante?.minutos, etiqueta: "min" },
    { valor: restante?.segundos, etiqueta: "seg" },
  ];

  return (
    <div
      className="flex items-start justify-center gap-5 sm:gap-9"
      role="timer"
      aria-label="Tiempo restante para la apertura"
    >
      {bloques.map((b, i) => (
        <div key={b.etiqueta} className="flex items-start gap-5 sm:gap-9">
          {i > 0 && (
            <span aria-hidden className="mt-1 h-12 w-px bg-bone/20 sm:mt-2 sm:h-16" />
          )}
          <div className="text-center">
            <span className="block font-display text-[42px] font-light leading-none tabular text-bone sm:text-[64px]">
              {b.valor === undefined ? "––" : String(b.valor).padStart(2, "0")}
            </span>
            <span className="eyebrow mt-3 block text-linen-200/90">{b.etiqueta}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
