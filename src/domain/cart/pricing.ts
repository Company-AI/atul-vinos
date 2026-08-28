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
};

export type PricingResult = {
  subtotalCents: number;
  memberDiscountCents: number;
  couponDiscountCents: number;
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

  const discountTotalCents = memberDiscountCents + couponDiscountCents;
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
    netCents >= input.freeShippingFromCents
  ) {
    shippingFreeReason = "threshold";
    shippingCents = 0;
  }

  const totalCents = netCents + shippingCents;

  return {
    subtotalCents,
    memberDiscountCents,
    couponDiscountCents,
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
