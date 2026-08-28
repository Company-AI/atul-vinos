import { beforeEach, describe, expect, it } from "vitest";
import {
  availableOf, createCustomer, createPlanWithBox, createWine, prisma, resetDatabase,
} from "./helpers/factories";
import {
  cancelSubscription, changePlan, pauseSubscription, registerCycleFailure,
  registerCyclePayment, resumeSubscription,
} from "@/domain/subscriptions/service";
import { resolveBoxForPeriod, getBox } from "@/domain/subscriptions/boxes";

const CURRENT = new Date();
const PERIOD = { month: CURRENT.getMonth() + 1, year: CURRENT.getFullYear() };

async function setupSubscription(options: {
  onHand?: number;
  bottles?: number;
  price?: number;
} = {}) {
  const wineA = await createWine({ onHand: options.onHand ?? 100, name: "Malbec Club", price: 24500 });
  const wineB = await createWine({ onHand: options.onHand ?? 100, name: "Cabernet Club", price: 26500 });

  const { plan, box } = await createPlanWithBox({
    price: options.price ?? 62900,
    bottleCount: options.bottles ?? 2,
    freeShipping: true,
    boxItems: [
      { productId: wineA.id, quantity: 1 },
      { productId: wineB.id, quantity: 1 },
    ],
    periodMonth: PERIOD.month,
    periodYear: PERIOD.year,
  });

  const user = await createCustomer();
  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      status: "PENDING",
      amount: options.price ?? 62900,
      frequency: "MONTHLY",
      provider: "mock",
      externalId: `mock-sub-${plan.slug}`,
      shippingSnapshot: {
        firstName: "Test", lastName: "Cliente", phone: "351",
        street: "Calle", number: "1", city: "Río Cuarto",
        province: "Córdoba", postalCode: "5800",
      },
    },
  });

  return { subscription, plan, box, user, wineA, wineB };
}

beforeEach(async () => {
  await resetDatabase();
});

describe("CASO B — alta y primer cobro", () => {
  it("crea suscripción, ciclo y pedido, y reserva el stock del box", async () => {
    const { subscription, wineA, wineB } = await setupSubscription({ onHand: 50 });

    const result = await registerCyclePayment({
      subscriptionId: subscription.id,
      amount: 62900,
      externalPaymentId: "mock-pay-1",
      chargedAt: CURRENT,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const updated = await prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: { cycles: true, orders: true },
    });

    expect(updated?.status).toBe("ACTIVE");
    expect(updated?.cyclesCount).toBe(1);
    expect(updated?.cycles).toHaveLength(1);
    expect(updated?.orders).toHaveLength(1);
    expect(updated?.nextChargeAt).not.toBeNull();

    const order = updated!.orders[0];
    // El pedido del Club nace "A preparar" (spec §17).
    expect(order.status).toBe("PREPARING");
    expect(order.type).toBe("SUBSCRIPTION");
    expect(order.cycleId).toBe(result.data.cycleId);

    // Stock reservado, no descontado.
    expect(await availableOf(wineA.id)).toBe(49);
    expect(await availableOf(wineB.id)).toBe(49);
    const inventory = await prisma.inventory.findUnique({ where: { productId: wineA.id } });
    expect(inventory?.onHand).toBe(50);
    expect(inventory?.reserved).toBe(1);

    const movement = await prisma.inventoryMovement.findFirst({
      where: { orderId: order.id, type: "SUSCRIPCION" },
    });
    expect(movement).not.toBeNull();
  });

  it("guarda el snapshot del plan, del box y de los beneficios en el pedido", async () => {
    const { subscription, plan } = await setupSubscription();

    const result = await registerCyclePayment({
      subscriptionId: subscription.id, amount: 62900, externalPaymentId: "p1", chargedAt: CURRENT,
    });
    if (!result.ok) throw new Error(result.error);

    const order = await prisma.order.findFirst({ where: { subscriptionId: subscription.id } });
    const snapshot = order?.subscriptionSnapshot as Record<string, unknown>;

    expect(snapshot.planName).toBe(plan.name);
    expect(snapshot.freeShipping).toBe(true);
    expect(Array.isArray(snapshot.items)).toBe(true);
    expect((snapshot.items as unknown[]).length).toBe(2);
    expect((snapshot.benefits as unknown[]).length).toBeGreaterThan(0);
  });
});

describe("CASO C — renovación mensual", () => {
  it("agrega un ciclo y un pedido nuevos sin crear otra suscripción", async () => {
    const { subscription } = await setupSubscription();

    const first = await registerCyclePayment({
      subscriptionId: subscription.id, amount: 62900,
      externalPaymentId: "p1", chargedAt: CURRENT,
    });
    if (!first.ok) throw new Error(first.error);

    const nextMonth = new Date(CURRENT.getFullYear(), CURRENT.getMonth() + 1, 12);
    const second = await registerCyclePayment({
      subscriptionId: subscription.id, amount: 62900,
      externalPaymentId: "p2", chargedAt: nextMonth,
    });
    if (!second.ok) throw new Error(second.error);

    const subscriptions = await prisma.subscription.count();
    const cycles = await prisma.subscriptionCycle.count({ where: { subscriptionId: subscription.id } });
    const orders = await prisma.order.count({ where: { subscriptionId: subscription.id } });

    expect(subscriptions).toBe(1);
    expect(cycles).toBe(2);
    expect(orders).toBe(2);
    expect(second.data.orderId).not.toBe(first.data.orderId);

    const updated = await prisma.subscription.findUnique({ where: { id: subscription.id } });
    expect(updated?.cyclesCount).toBe(2);
  });

  it("es idempotente por período: el mismo cobro no duplica el pedido", async () => {
    const { subscription } = await setupSubscription();

    const first = await registerCyclePayment({
      subscriptionId: subscription.id, amount: 62900, externalPaymentId: "p1", chargedAt: CURRENT,
    });
    const repeat = await registerCyclePayment({
      subscriptionId: subscription.id, amount: 62900, externalPaymentId: "p1", chargedAt: CURRENT,
    });

    if (!first.ok || !repeat.ok) throw new Error("fallo el registro del ciclo");
    expect(repeat.data.duplicated).toBe(true);
    expect(repeat.data.orderId).toBe(first.data.orderId);

    expect(await prisma.order.count({ where: { subscriptionId: subscription.id } })).toBe(1);
    expect(await prisma.subscriptionCycle.count()).toBe(1);
  });
});

describe("CASO D — pago mensual rechazado", () => {
  it("marca el ciclo como fallido y NO genera pedido ni movimientos de stock", async () => {
    const { subscription, wineA } = await setupSubscription({ onHand: 30 });

    const result = await registerCycleFailure({
      subscriptionId: subscription.id,
      amount: 62900,
      reason: "cc_rejected_insufficient_amount",
      failedAt: CURRENT,
    });
    expect(result.ok).toBe(true);

    const updated = await prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: { cycles: true, orders: true },
    });

    expect(updated?.status).toBe("PAYMENT_FAILED");
    expect(updated?.cycles[0]?.status).toBe("PAYMENT_FAILED");
    expect(updated?.orders).toHaveLength(0);
    expect(await availableOf(wineA.id)).toBe(30);

    const payment = await prisma.payment.findFirst({
      where: { subscriptionId: subscription.id },
    });
    expect(payment?.status).toBe("REJECTED");
  });

  it("al recuperarse el pago genera el pedido del ciclo", async () => {
    const { subscription, wineA } = await setupSubscription({ onHand: 30 });

    await registerCycleFailure({
      subscriptionId: subscription.id, amount: 62900, failedAt: CURRENT,
      reason: "cc_rejected_insufficient_amount",
    });

    const recovered = await registerCyclePayment({
      subscriptionId: subscription.id, amount: 62900,
      externalPaymentId: "retry-1", chargedAt: CURRENT,
    });
    expect(recovered.ok).toBe(true);
    if (!recovered.ok) return;

    const updated = await prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: { cycles: true, orders: true },
    });

    expect(updated?.status).toBe("ACTIVE");
    expect(updated?.cycles).toHaveLength(1);
    expect(updated?.cycles[0]?.status).toBe("PAID");
    expect(updated?.orders).toHaveLength(1);
    expect(await availableOf(wineA.id)).toBe(29);
  });
});

describe("CASO E — cancelación", () => {
  it("mantiene el historial y no deja ciclos futuros", async () => {
    const { subscription } = await setupSubscription();

    await registerCyclePayment({
      subscriptionId: subscription.id, amount: 62900, externalPaymentId: "p1", chargedAt: CURRENT,
    });

    const result = await cancelSubscription(subscription.id, "Se muda al exterior");
    expect(result.ok).toBe(true);

    const updated = await prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: { cycles: true, orders: true, events: true },
    });

    expect(updated?.status).toBe("CANCELLED");
    expect(updated?.cancelledAt).not.toBeNull();
    expect(updated?.nextChargeAt).toBeNull();
    // El historial sigue completo.
    expect(updated?.cycles).toHaveLength(1);
    expect(updated?.orders).toHaveLength(1);
    expect(updated?.events.some((e) => e.type === "cancelled")).toBe(true);
  });
});

describe("CASO F — cambio del box del mes siguiente", () => {
  it("no modifica los pedidos históricos", async () => {
    const { subscription, plan, box, wineA } = await setupSubscription();

    const first = await registerCyclePayment({
      subscriptionId: subscription.id, amount: 62900, externalPaymentId: "p1", chargedAt: CURRENT,
    });
    if (!first.ok) throw new Error(first.error);

    const orderBefore = await prisma.order.findUnique({
      where: { id: first.data.orderId! },
      include: { items: true },
    });
    const snapshotBefore = JSON.stringify(orderBefore?.subscriptionSnapshot);
    const itemNamesBefore = orderBefore!.items.map((i) => i.name).sort();

    // El admin rearma el box: cambia productos y cantidades.
    const otherWine = await createWine({ onHand: 40, name: "Syrah Nuevo" });
    await prisma.subscriptionBoxItem.deleteMany({ where: { boxId: box!.id } });
    await prisma.subscriptionBoxItem.create({
      data: { boxId: box!.id, productId: otherWine.id, quantity: 3 },
    });
    await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data: { price: 99999, name: "Plan Renombrado" },
    });

    const orderAfter = await prisma.order.findUnique({
      where: { id: first.data.orderId! },
      include: { items: true },
    });

    expect(JSON.stringify(orderAfter?.subscriptionSnapshot)).toBe(snapshotBefore);
    expect(orderAfter!.items.map((i) => i.name).sort()).toEqual(itemNamesBefore);
    expect(orderAfter!.items.some((i) => i.name === "Syrah Nuevo")).toBe(false);
    // Y el stock reservado original sigue asignado al pedido histórico.
    expect(await availableOf(wineA.id)).toBe(99);
  });
});

describe("autogestión del socio", () => {
  it("pausa y reactiva conservando el historial", async () => {
    const { subscription } = await setupSubscription();
    await registerCyclePayment({
      subscriptionId: subscription.id, amount: 62900, externalPaymentId: "p1", chargedAt: CURRENT,
    });

    expect((await pauseSubscription(subscription.id)).ok).toBe(true);
    let updated = await prisma.subscription.findUnique({ where: { id: subscription.id } });
    expect(updated?.status).toBe("PAUSED");
    expect(updated?.pausedAt).not.toBeNull();

    expect((await resumeSubscription(subscription.id)).ok).toBe(true);
    updated = await prisma.subscription.findUnique({ where: { id: subscription.id } });
    expect(updated?.status).toBe("ACTIVE");
    expect(updated?.pausedAt).toBeNull();
  });

  it("no reactiva una suscripción cancelada", async () => {
    const { subscription } = await setupSubscription();
    await cancelSubscription(subscription.id);
    const result = await resumeSubscription(subscription.id);
    expect(result.ok).toBe(false);
  });

  it("el cambio de plan aplica desde el próximo ciclo", async () => {
    const { subscription } = await setupSubscription();
    const { plan: otherPlan } = await createPlanWithBox({ price: 128900, bottleCount: 6 });

    await registerCyclePayment({
      subscriptionId: subscription.id, amount: 62900, externalPaymentId: "p1", chargedAt: CURRENT,
    });

    const orderBefore = await prisma.order.findFirst({ where: { subscriptionId: subscription.id } });
    const snapshotBefore = JSON.stringify(orderBefore?.subscriptionSnapshot);

    const result = await changePlan(subscription.id, otherPlan.id, "admin@test.local");
    expect(result.ok).toBe(true);

    const updated = await prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: { events: true },
    });
    expect(updated?.planId).toBe(otherPlan.id);
    expect(Number(updated?.amount)).toBe(128900);
    expect(updated?.events.some((e) => e.type === "plan_changed")).toBe(true);

    // El pedido del mes en curso no cambia.
    const orderAfter = await prisma.order.findFirst({ where: { subscriptionId: subscription.id } });
    expect(JSON.stringify(orderAfter?.subscriptionSnapshot)).toBe(snapshotBefore);
  });

  it("un ciclo omitido se cobra pero no genera envío", async () => {
    const { subscription } = await setupSubscription();
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { skipNextCycle: true, status: "ACTIVE" },
    });

    const result = await registerCyclePayment({
      subscriptionId: subscription.id, amount: 62900, externalPaymentId: "p1", chargedAt: CURRENT,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.orderId).toBeNull();
    const cycle = await prisma.subscriptionCycle.findUnique({ where: { id: result.data.cycleId } });
    expect(cycle?.status).toBe("SKIPPED");

    const updated = await prisma.subscription.findUnique({ where: { id: subscription.id } });
    expect(updated?.skipNextCycle).toBe(false);
    expect(await prisma.order.count()).toBe(0);
  });
});

describe("box del mes", () => {
  it("calcula el stock necesario según los suscriptores activos", async () => {
    const { subscription, plan, wineA } = await setupSubscription({ onHand: 5 });
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "ACTIVE" },
    });

    // Un segundo socio del mismo plan.
    const otherUser = await createCustomer();
    await prisma.subscription.create({
      data: {
        userId: otherUser.id, planId: plan.id, status: "ACTIVE",
        amount: 62900, frequency: "MONTHLY", provider: "mock",
      },
    });

    const box = await getBox(plan.id, PERIOD.month, PERIOD.year);
    expect(box?.subscriberCount).toBe(2);

    const requirement = box?.requirements.find((r) => r.productId === wineA.id);
    expect(requirement?.needed).toBe(2);
    expect(requirement?.available).toBe(5);
    expect(requirement?.missing).toBe(0);
  });

  it("detecta el faltante cuando el stock no alcanza para todos los socios", async () => {
    const { plan, wineA } = await setupSubscription({ onHand: 1 });

    // Tres socios activos, una sola botella en stock.
    for (let i = 0; i < 3; i++) {
      const user = await createCustomer();
      await prisma.subscription.create({
        data: {
          userId: user.id, planId: plan.id, status: "ACTIVE",
          amount: 62900, frequency: "MONTHLY", provider: "mock",
        },
      });
    }

    const box = await getBox(plan.id, PERIOD.month, PERIOD.year);
    const requirement = box?.requirements.find((r) => r.productId === wineA.id);
    expect(requirement?.needed).toBe(3);
    expect(requirement?.missing).toBe(2);
    expect(box?.totalMissing).toBeGreaterThan(0);
  });

  it("si no hay box del mes usa el último publicado, sin dejar el pedido vacío", async () => {
    const { plan, box } = await setupSubscription();
    const future = new Date(CURRENT.getFullYear(), CURRENT.getMonth() + 3, 1);

    const resolved = await resolveBoxForPeriod(
      plan.id, future.getMonth() + 1, future.getFullYear(),
    );
    expect(resolved?.id).toBe(box!.id);
    expect(resolved?.items.length).toBe(2);
  });
});
