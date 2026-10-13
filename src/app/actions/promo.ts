"use server";

import { headers } from "next/headers";
import { registrarBienvenida, type ResultadoDeBienvenida } from "@/domain/promotions/bienvenida";
import { clientIp, rateLimit } from "@/infra/security/rate-limit";

export type { ResultadoDeBienvenida as ClaimPromoResult };

/**
 * Entrada pública de la ventana de bienvenida.
 *
 * Lo único que hace de más que el dominio es el tope por IP: el formulario
 * escribe en la base sin que nadie haya iniciado sesión, así que sin tope
 * alcanza un script para llenar las tablas de usuarios y de suscriptores con
 * mails inventados.
 */
export async function claimPromo(input: {
  firstName: string;
  email: string;
  birthDate: string;
}): Promise<ResultadoDeBienvenida> {
  const limite = rateLimit(`promo:${clientIp(await headers())}`, {
    limit: 5,
    windowSeconds: 600,
  });
  if (!limite.allowed) {
    return { ok: false, error: "Probaste varias veces. Esperá un momento." };
  }

  return registrarBienvenida(input);
}
