import type { Settings } from "@/domain/settings/schema";

/**
 * Los datos de la cuenta a la que hay que transferir.
 *
 * Vive en el dominio y no en la pantalla porque lo consultan tres lugares que
 * tienen que decir exactamente lo mismo: el checkout (para ofrecer el medio),
 * la pantalla de estado (para mostrar a dónde girar) y la creación del pedido
 * (para decidir si corresponde el descuento).
 */
export type DatosDeTransferencia = {
  titular: string;
  banco: string;
  alias: string;
  cbu: string;
  cuit: string;
  /** Porcentaje de descuento por pagar así (0 = sin descuento). */
  descuentoPorcentaje: number;
};

/**
 * Devuelve los datos si el medio está en condiciones de ofrecerse, o null.
 *
 * No alcanza con que esté encendido: hace falta un alias o un CBU. Ofrecer
 * "pagá por transferencia" sin decir a qué cuenta deja a alguien con el
 * pedido hecho y sin forma de pagarlo, que es peor que no ofrecerlo.
 */
export function datosDeTransferencia(
  payments: Settings["payments"],
): DatosDeTransferencia | null {
  if (!payments.transferEnabled) return null;

  const alias = payments.transferAlias.trim();
  const cbu = payments.transferCbu.trim();
  if (!alias && !cbu) return null;

  return {
    titular: payments.transferHolder.trim(),
    banco: payments.transferBank.trim(),
    alias,
    cbu,
    cuit: payments.transferCuit.trim(),
    descuentoPorcentaje: payments.transferDiscountPercent,
  };
}
