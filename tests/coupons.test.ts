import { beforeEach, describe, expect, it } from "vitest";
import { createCustomer, createWine, prisma, resetDatabase } from "./helpers/factories";
import { registerCouponUsage, validateCoupon } from "@/domain/promotions/coupons";
import { toCents } from "@/lib/money";

const baseContext = {
  subtotalCents: toCents(50000),
  userId: null,
  email: "cliente@test.local",
  isClubMember: false,
  productIds: [] as string[],
  categoryIds: [] as string[],
  isFirstPurchase: true,
};

beforeEach(async () => {
  await resetDatabase();
});

describe("validación de cupones", () => {
  it("aplica un porcentaje sobre el subtotal", async () => {
    await prisma.coupon.create({
      data: { code: "BIENVENIDO10", type: "PERCENT", value: 10, isActive: true },
    });

    const result = await validateCoupon("bienvenido10", baseContext);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.discountCents).toBe(toCents(5000));
  });

  it("aplica un monto fijo sin pasarse del subtotal", async () => {
    await prisma.coupon.create({
      data: { code: "FIJO", type: "FIXED", value: 80000, isActive: true },
    });

    const result = await validateCoupon("FIJO", baseContext);
    if (!result.ok) throw new Error(result.error);
    expect(result.data.discountCents).toBe(baseContext.subtotalCents);
  });

  it("rechaza un código inexistente", async () => {
    const result = await validateCoupon("NOEXISTE", baseContext);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("NOT_FOUND");
  });

  it("rechaza un código desactivado", async () => {
    await prisma.coupon.create({
      data: { code: "APAGADO", type: "PERCENT", value: 10, isActive: false },
    });
    const result = await validateCoupon("APAGADO", baseContext);
    expect(result.ok).toBe(false);
  });

  it("rechaza un código vencido", async () => {
    await prisma.coupon.create({
      data: {
        code: "VENCIDO", type: "PERCENT", value: 10, isActive: true,
        endsAt: new Date(Date.now() - 86_400_000),
      },
    });
    const result = await validateCoupon("VENCIDO", baseContext);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("EXPIRED");
  });

  it("rechaza un código que todavía no empezó", async () => {
    await prisma.coupon.create({
      data: {
        code: "FUTURO", type: "PERCENT", value: 10, isActive: true,
        startsAt: new Date(Date.now() + 86_400_000),
      },
    });
    const result = await validateCoupon("FUTURO", baseContext);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("NOT_STARTED");
  });

  it("respeta el mínimo de compra", async () => {
    await prisma.coupon.create({
      data: { code: "MINIMO", type: "FIXED", value: 8000, minPurchase: 80000, isActive: true },
    });
    const result = await validateCoupon("MINIMO", baseContext);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("MIN_PURCHASE");
  });

  it("respeta el máximo de usos totales", async () => {
    await prisma.coupon.create({
      data: { code: "AGOTADO", type: "PERCENT", value: 10, maxUses: 2, usedCount: 2, isActive: true },
    });
    const result = await validateCoupon("AGOTADO", baseContext);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("MAX_USES");
  });

  it("respeta el máximo de usos por cliente", async () => {
    const user = await createCustomer();
    const coupon = await prisma.coupon.create({
      data: { code: "UNAVEZ", type: "PERCENT", value: 10, maxUsesPerUser: 1, isActive: true },
    });
    await prisma.couponUsage.create({
      data: { couponId: coupon.id, userId: user.id, amount: 1000 },
    });

    const result = await validateCoupon("UNAVEZ", { ...baseContext, userId: user.id });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("MAX_USES_PER_USER");
  });

  it("el código de socios solo funciona con suscripción activa", async () => {
    await prisma.coupon.create({
      data: { code: "CLUB15", type: "PERCENT", value: 15, clubMembersOnly: true, isActive: true },
    });

    const rejected = await validateCoupon("CLUB15", baseContext);
    expect(rejected.ok).toBe(false);

    const accepted = await validateCoupon("CLUB15", { ...baseContext, isClubMember: true });
    expect(accepted.ok).toBe(true);
  });

  it("el código de primera compra se rechaza si ya compró", async () => {
    await prisma.coupon.create({
      data: { code: "PRIMERA", type: "PERCENT", value: 10, firstPurchaseOnly: true, isActive: true },
    });
    const result = await validateCoupon("PRIMERA", { ...baseContext, isFirstPurchase: false });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("FIRST_PURCHASE_ONLY");
  });

  it("el cupón de envío gratis no descuenta productos", async () => {
    await prisma.coupon.create({
      data: { code: "ENVIOGRATIS", type: "FREE_SHIPPING", value: 0, isActive: true },
    });
    const result = await validateCoupon("ENVIOGRATIS", baseContext);
    if (!result.ok) throw new Error(result.error);
    expect(result.data.freeShipping).toBe(true);
    expect(result.data.discountCents).toBe(0);
  });

  it("respeta el alcance por producto", async () => {
    const allowed = await createWine();
    const other = await createWine();
    const coupon = await prisma.coupon.create({
      data: { code: "SOLOUNO", type: "PERCENT", value: 10, isActive: true },
    });
    await prisma.couponProduct.create({
      data: { couponId: coupon.id, productId: allowed.id },
    });

    const outOfScope = await validateCoupon("SOLOUNO", {
      ...baseContext, productIds: [other.id],
    });
    expect(outOfScope.ok).toBe(false);
    if (!outOfScope.ok) expect(outOfScope.code).toBe("OUT_OF_SCOPE");

    const inScope = await validateCoupon("SOLOUNO", {
      ...baseContext, productIds: [allowed.id],
    });
    expect(inScope.ok).toBe(true);
  });
});

describe("registro de uso", () => {
  it("incrementa el contador una sola vez por pedido", async () => {
    const coupon = await prisma.coupon.create({
      data: { code: "UNICO", type: "PERCENT", value: 10, isActive: true },
    });
    const order = await prisma.order.create({
      data: {
        customerName: "Test", customerEmail: "t@test.local",
        shippingSnapshot: {}, total: 1000, subtotal: 1000,
      },
    });

    await registerCouponUsage({
      couponId: coupon.id, orderId: order.id, amountCents: toCents(100),
    });
    await registerCouponUsage({
      couponId: coupon.id, orderId: order.id, amountCents: toCents(100),
    });

    const updated = await prisma.coupon.findUnique({ where: { id: coupon.id } });
    const usages = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
    expect(updated?.usedCount).toBe(1);
    expect(usages).toBe(1);
  });
});
