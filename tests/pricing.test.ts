import { describe, expect, it } from "vitest";
import { amountMissingForFreeShipping, calculatePricing } from "@/domain/cart/pricing";
import { toCents } from "@/lib/money";

describe("motor de precios", () => {
  it("suma el subtotal en centavos, sin errores de punto flotante", () => {
    const result = calculatePricing({
      lines: [
        { productId: "a", quantity: 3, unitPriceCents: toCents(12900) },
        { productId: "b", quantity: 1, unitPriceCents: toCents(24500) },
      ],
    });
    expect(result.subtotalCents).toBe(toCents(12900 * 3 + 24500));
    expect(result.subtotal).toBe(63200);
    expect(result.total).toBe(63200);
  });

  it("no arrastra el error clásico de 0.1 + 0.2 en los totales", () => {
    const result = calculatePricing({
      lines: [
        { productId: "a", quantity: 3, unitPriceCents: toCents(0.1) },
        { productId: "b", quantity: 1, unitPriceCents: toCents(0.2) },
      ],
    });
    expect(result.subtotal).toBe(0.5);
  });

  it("aplica el beneficio de socio antes del cupón", () => {
    const result = calculatePricing({
      lines: [{ productId: "a", quantity: 1, unitPriceCents: toCents(1000) }],
      memberDiscountPercent: 10,
      coupon: { discountCents: toCents(100), freeShipping: false, code: "X" },
    });
    expect(result.memberDiscountCents).toBe(toCents(100));
    expect(result.couponDiscountCents).toBe(toCents(100));
    expect(result.discountTotal).toBe(200);
    expect(result.total).toBe(800);
  });

  it("nunca deja el descuento por encima del subtotal", () => {
    const result = calculatePricing({
      lines: [{ productId: "a", quantity: 1, unitPriceCents: toCents(500) }],
      coupon: { discountCents: toCents(900), freeShipping: false, code: "X" },
    });
    expect(result.couponDiscountCents).toBe(toCents(500));
    expect(result.total).toBe(0);
  });

  it("libera el envío al alcanzar el umbral, sobre el neto de descuentos", () => {
    const withDiscount = calculatePricing({
      lines: [{ productId: "a", quantity: 1, unitPriceCents: 105_000_0 }], // $10.500... 
      memberDiscountPercent: 10,
      shippingCents: 8_900_0,
      freeShippingFromCents: 100_000_0,
    });
    // Neto = 1.050.000 - 105.000 = 945.000 < 1.000.000 → el envío se cobra
    expect(withDiscount.shippingFree).toBe(false);
    expect(withDiscount.shippingCents).toBe(89_000);
  });

  it("el cupón de envío gratis pisa el costo de envío", () => {
    const result = calculatePricing({
      lines: [{ productId: "a", quantity: 1, unitPriceCents: toCents(20000) }],
      coupon: { discountCents: 0, freeShipping: true, code: "ENVIOGRATIS" },
      shippingCents: toCents(8900),
    });
    expect(result.shippingFree).toBe(true);
    expect(result.shippingFreeReason).toBe("coupon");
    expect(result.total).toBe(20000);
  });

  it("el beneficio del plan tiene prioridad sobre cupón y umbral", () => {
    const result = calculatePricing({
      lines: [{ productId: "a", quantity: 1, unitPriceCents: toCents(20000) }],
      shippingCents: toCents(8900),
      shippingCoveredByBenefit: true,
      freeShippingFromCents: toCents(1000000),
    });
    expect(result.shippingFreeReason).toBe("benefit");
  });

  it("calcula cuánto falta para el envío gratis", () => {
    expect(amountMissingForFreeShipping(80_000, 100_000)).toBe(20_000);
    expect(amountMissingForFreeShipping(120_000, 100_000)).toBeNull();
    expect(amountMissingForFreeShipping(50_000, null)).toBeNull();
  });
});

describe("descuento por transferencia", () => {
  const unaBotella = [{ productId: "a", quantity: 1, unitPriceCents: toCents(38100) }];

  it("descuenta el porcentaje sobre los productos", () => {
    const r = calculatePricing({ lines: unaBotella, transferDiscountPercent: 10 });
    expect(r.transferDiscountCents).toBe(toCents(3810));
    expect(r.total).toBe(34290);
  });

  it("no abarata el envío: el banco no paga el flete", () => {
    const r = calculatePricing({
      lines: unaBotella,
      shippingCents: toCents(8900),
      transferDiscountPercent: 10,
    });
    // 38.100 − 10% = 34.290, más 8.900 de envío.
    expect(r.shippingTotal).toBe(8900);
    expect(r.total).toBe(43190);
  });

  it("se calcula sobre lo que queda después del cupón, no sobre el precio de lista", () => {
    const r = calculatePricing({
      lines: unaBotella,
      coupon: { discountCents: toCents(8100), freeShipping: false, code: "X" },
      transferDiscountPercent: 10,
    });
    // Sobre 30.000, no sobre 38.100: el 10% son 3.000, no 3.810.
    expect(r.transferDiscountCents).toBe(toCents(3000));
    expect(r.total).toBe(27000);
  });

  it("sin el dato, no descuenta nada", () => {
    const r = calculatePricing({ lines: unaBotella });
    expect(r.transferDiscountCents).toBe(0);
    expect(r.total).toBe(38100);
  });

  it("no hace perder el envío gratis a un carrito que ya lo había alcanzado", () => {
    const r = calculatePricing({
      lines: [{ productId: "a", quantity: 1, unitPriceCents: toCents(100000) }],
      shippingCents: toCents(8900),
      freeShippingFromCents: toCents(100000),
      transferDiscountPercent: 10,
    });
    // Queda en 90.000, pero el umbral se mide sobre los 100.000 de antes.
    expect(r.shippingFreeReason).toBe("threshold");
    expect(r.total).toBe(90000);
  });

  it("nunca deja el total por debajo de cero", () => {
    const r = calculatePricing({
      lines: [{ productId: "a", quantity: 1, unitPriceCents: toCents(1000) }],
      coupon: { discountCents: toCents(1000), freeShipping: false, code: "TODO" },
      transferDiscountPercent: 90,
    });
    expect(r.total).toBe(0);
  });
});
