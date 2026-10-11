/*
  Lo que comparten el age gate y la ventana promocional.

  Vive aparte porque `age-gate.tsx` es componente de servidor y lee
  `next/headers`: importarlo desde un componente cliente para sacar una
  constante arrastra todo eso al bundle del navegador y el build falla.
*/

/** Cookie que recuerda que el visitante ya confirmó la edad. */
export const AGE_GATE_COOKIE = "bodega_age_ok";

/** El gate lo emite al confirmar; la ventana promocional lo espera. */
export const AGE_CONFIRMED_EVENT = "atul:edad-confirmada";
