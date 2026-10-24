import { fromCents, percentOfCents, sumCents } from "@/lib/money";

/**
 * Motor de precios. Toda la aritmética en centavos enteros y en un solo lugar:
 * el carrito, el checkout y el pedido usan exactamente esta función.
 */

export type PricingLine = {
  productId: string;
  quantity: number;
  unitPriceCents: number;
};

export type PricingInput = {
  lines: PricingLine[];
  /** Descuento automático de socio del Club (0-100). */
  memberDiscountPercent?: number;
  coupon?: { discountCents: number; freeShipping: boolean; code: string } | null;
  shippingCents?: number;
  /** Envío gratis a partir de este subtotal (después de descuentos). null = nunca. */
  freeShippingFromCents?: number | null;
  /** El plan del Club o el beneficio del socio cubren el envío. */
  shippingCoveredByBenefit?: boolean;
  /*
    Descuento por pagar con transferencia (0-100). Se aplica sobre los
    productos, no sobre el envío: el banco no abarata el flete.
  */
  transferDiscountPercent?: number;
  /*
    Descuento por llevarse varias botellas. Cuenta BOTELLAS y no líneas del
    carrito: un box de seis son seis botellas, no una. Contar líneas dejaría
    afuera justo al que compra un box, que es el que más lleva.
  */
  quantityDiscount?: {
    percent: number;
    minBottles: number;
    /** Si sólo corre en la primera compra de esa persona. */
    firstPurchaseOnly: boolean;
  } | null;
  /** Botellas del pedido, con los box ya expandidos a su contenido. */
  bottles?: number;
  /** Si quien compra nunca completó un pedido. */
  isFirstPurchase?: boolean;
};

export type PricingResult = {
  subtotalCents: number;
  memberDiscountCents: number;
  couponDiscountCents: number;
  quantityDiscountCents: number;
  transferDiscountCents: number;
  discountTotalCents: number;
  shippingCents: number;
  shippingFree: boolean;
  shippingFreeReason: "threshold" | "coupon" | "benefit" | null;
  totalCents: number;
  // Espejo en pesos para la UI y para persistir en el pedido
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
};

export function calculatePricing(input: PricingInput): PricingResult {
  const subtotalCents = sumCents(
    ...input.lines.map((l) => l.unitPriceCents * l.quantity),
  );

  const memberDiscountCents = input.memberDiscountPercent
    ? percentOfCents(subtotalCents, input.memberDiscountPercent)
    : 0;

  // El cupón se calcula sobre el subtotal ya afectado por el beneficio de socio,
  // para que los descuentos no se acumulen sobre una base inflada.
  const afterMember = subtotalCents - memberDiscountCents;
  const couponDiscountCents = Math.min(afterMember, input.coupon?.discountCents ?? 0);

  /*
    El descuento por transferencia va último y sobre lo que quedó, no sobre el
    precio de lista: si se calculara sobre el subtotal entero, alguien con
    cupón terminaría descontando dos veces la misma plata y el total podría
    quedar por debajo de lo que cuesta la mercadería.
  */
  const afterCoupon = afterMember - couponDiscountCents;

  /*
    Descuento por cantidad, antes del de transferencia y sobre lo que quedó.
    Los dos se suman —lo pidió el cliente— pero cada uno sobre el saldo del
    anterior, no sobre el precio de lista: con 10% y 20% el total es 28% y no
    30%. Sumarlos en crudo descontaría de más sobre una base que ya bajó.
  */
  const quantity = input.quantityDiscount;
  const alcanzaLaCantidad =
    !!quantity &&
    quantity.percent > 0 &&
    quantity.minBottles > 0 &&
    (input.bottles ?? 0) >= quantity.minBottles;
  const habilitadoPorCompra =
    !quantity?.firstPurchaseOnly || input.isFirstPurchase === true;

  const quantityDiscountCents =
    alcanzaLaCantidad && habilitadoPorCompra
      ? percentOfCents(afterCoupon, quantity.percent)
      : 0;

  const afterQuantity = afterCoupon - quantityDiscountCents;
  const transferDiscountCents = input.transferDiscountPercent
    ? percentOfCents(afterQuantity, input.transferDiscountPercent)
    : 0;

  const discountTotalCents =
    memberDiscountCents + couponDiscountCents + quantityDiscountCents + transferDiscountCents;
  const netCents = subtotalCents - discountTotalCents;

  let shippingCents = Math.max(0, input.shippingCents ?? 0);
  let shippingFreeReason: PricingResult["shippingFreeReason"] = null;

  if (input.shippingCoveredByBenefit) {
    shippingFreeReason = "benefit";
    shippingCents = 0;
  } else if (input.coupon?.freeShipping) {
    shippingFreeReason = "coupon";
    shippingCents = 0;
  } else if (
    input.freeShippingFromCents !== null &&
    input.freeShippingFromCents !== undefined &&
    /*
      El umbral se mide ANTES de los descuentos por cantidad y por
      transferencia. Si se midiera
      después, un carrito apenas arriba del mínimo perdería el envío gratis
      justo por elegir transferencia: ahorraría el 10% de la mercadería y
      pagaría el flete entero. Además es lo que ya cotizó el transportista,
      que no conoce el medio de pago, así que así los dos números coinciden.
    */
    afterCoupon >= input.freeShippingFromCents
  ) {
    shippingFreeReason = "threshold";
    shippingCents = 0;
  }

  const totalCents = netCents + shippingCents;

  return {
    subtotalCents,
    memberDiscountCents,
    couponDiscountCents,
    quantityDiscountCents,
    transferDiscountCents,
    discountTotalCents,
    shippingCents,
    shippingFree: shippingFreeReason !== null,
    shippingFreeReason,
    totalCents,
    subtotal: fromCents(subtotalCents),
    discountTotal: fromCents(discountTotalCents),
    shippingTotal: fromCents(shippingCents),
    total: fromCents(totalCents),
  };
}

/** Cuánto falta para alcanzar el envío gratis (null si ya lo alcanzó o no aplica). */
export function amountMissingForFreeShipping(
  netCents: number,
  freeShippingFromCents: number | null | undefined,
): number | null {
  if (!freeShippingFromCents) return null;
  const missing = freeShippingFromCents - netCents;
  return missing > 0 ? missing : null;
}

/**
 * La regla de descuento por cantidad, leída de los ajustes.
 *
 * Existe para que los tres lugares que calculan precios —el carrito, el
 * checkout y la creación del pedido— la armen igual. Si cada uno la leyera
 * por su cuenta, alcanzaría con que uno se olvidara de un campo para que el
 * carrito muestre un total y el pedido cobre otro.
 */
export function reglaDeCantidad(payments: {
  quantityDiscountPercent: number;
  quantityDiscountMinBottles: number;
  quantityDiscountFirstPurchaseOnly: boolean;
}): PricingInput["quantityDiscount"] {
  if (payments.quantityDiscountPercent <= 0 || payments.quantityDiscountMinBottles <= 0) {
    return null;
  }
  return {
    percent: payments.quantityDiscountPercent,
    minBottles: payments.quantityDiscountMinBottles,
    firstPurchaseOnly: payments.quantityDiscountFirstPurchaseOnly,
  };
}
