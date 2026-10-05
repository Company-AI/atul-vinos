"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { quoteShipping } from "@/domain/shipping/service";
import { clientIp, rateLimit } from "@/infra/security/rate-limit";
import { isValidPostalCode } from "@/lib/ar";
import type { ShippingQuote } from "@/domain/shipping/ports";

/**
 * Cotización de envío desde la ficha de un producto.
 *
 * Es la misma cotización que hace el checkout, pero sin carrito: se pregunta
 * por una cantidad concreta de botellas antes de que exista un pedido. Lo pide
 * la gente antes de comprar —"¿cuánto me sale que llegue?"— y no tenerlo
 * significa que abandonan el carrito para averiguarlo.
 *
 * No toma el envío gratis de un plan del Club ni de un cupón: eso depende de
 * quién sea y de qué más tenga en el carrito, y prometerlo acá sería prometer
 * un precio que después puede no estar.
 */

export type CotizacionResult =
  | { ok: true; opciones: ShippingQuote[] }
  | { ok: false; error: string };

const schema = z.object({
  postalCode: z.string().refine(isValidPostalCode, "Revisá el código postal."),
  province: z.string().min(2, "Elegí la provincia."),
  /* Un pedido de más de 60 botellas no es una venta de tienda: es mayorista. */
  bottles: z.number().int().min(1).max(60).default(1),
});

export async function cotizarEnvio(input: z.input<typeof schema>): Promise<CotizacionResult> {
  // Es público y consulta la base: se limita por IP como el resto de los formularios.
  const limite = rateLimit(`cotizar:${clientIp(await headers())}`, {
    limit: 30,
    windowSeconds: 60,
  });
  if (!limite.allowed) {
    return { ok: false, error: "Esperá un momento y volvé a probar." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }

  const { postalCode, province, bottles } = parsed.data;

  const opciones = await quoteShipping({
    destination: { postalCode, province, city: "" },
    bottles,
    /*
      Sin carrito no hay monto, y va en cero a propósito: los umbrales de
      "envío gratis desde $X" no se pueden dar por cumplidos antes de saber
      cuánto va a gastar. Mostrar el precio lleno y que después salga gratis
      es una sorpresa buena; al revés es una mentira.
    */
    netAmount: 0,
  });

  if (opciones.length === 0) {
    return {
      ok: false,
      error: "Todavía no tenemos tarifa para esa zona. Escribinos y lo resolvemos.",
    };
  }

  return { ok: true, opciones };
}
