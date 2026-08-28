import { beforeEach, describe, expect, it } from "vitest";
import {
  createCartWith, createCustomer, createPlanWithBox, createShippingZone,
  createWine, prisma, resetDatabase,
} from "./helpers/factories";
import { createOrderFromCart } from "@/domain/orders/create";
import { processWebhook } from "@/domain/payments/service";

const contact = {
  firstName: "Ana", lastName: "López", email: "ana@test.local",
  phone: "+54 9 351 555-0000", documentId: "30111222",
};
const address = {
  street: "Belgrano", number: "455", city: "Río Cuarto",
  province: "Córdoba", postalCode: "5800",
};
const shipping = { methodName: "Estándar", price: 8900, carrierCode: "mock", serviceCode: "std" };

function event(resourceId: string, eventId: string) {
  return {
    providerCode: "mock",
    verification: {
      valid: true as const,
      eventId,
      eventType: "payment",
      resourceId,
    },
    rawBody: JSON.stringify({ id: eventId, type: "payment", data: { id: resourceId } }),
  };
}

beforeEach(async () => {
  await resetDatabase();
  await createShippingZone();
});

describe("procesamiento de webhooks", () => {
  it("confirma el pedido y registra el evento como procesado", async () => {
    const wine = await createWine({ onHand: 20 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 2 }]);
    const created = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    if (!created.ok) throw new Error(created.error);

    // El proveedor asigna su id al pago y lo aprueba.
    await prisma.payment.update({
      where: { id: created.data.paymentId },
      data: { externalId: "mock-pay-abc", externalStatus: "approved" },
    });

    const result = await processWebhook(event("mock-pay-abc", "evt-1"));
    expect(result.status).toBe("processed");

    const order = await prisma.order.findUnique({ where: { id: created.data.orderId } });
    expect(order?.status).toBe("STOCK_RESERVED");

    const stored = await prisma.webhookEvent.findFirst({ where: { eventId: "evt-1" } });
    expect(stored?.status).toBe("PROCESSED");
    expect(stored?.payload).toBeTruthy();
  });

  it("no procesa dos veces el mismo evento (idempotencia)", async () => {
    const wine = await createWine({ onHand: 20 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 2 }]);
    const created = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    if (!created.ok) throw new Error(created.error);

    await prisma.payment.update({
      where: { id: created.data.paymentId },
      data: { externalId: "mock-pay-dup", externalStatus: "approved" },
    });

    const first = await processWebhook(event("mock-pay-dup", "evt-dup"));
    const second = await processWebhook(event("mock-pay-dup", "evt-dup"));

    expect(first.status).toBe("processed");
    expect(second.status).toBe("duplicated");

    const inventory = await prisma.inventory.findUnique({ where: { productId: wine.id } });
    expect(inventory?.reserved).toBe(2);
    expect(await prisma.webhookEvent.count({ where: { eventId: "evt-dup" } })).toBe(1);
  });

  it("dos eventos distintos del mismo pago no duplican la reserva", async () => {
    const wine = await createWine({ onHand: 20 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 3 }]);
    const created = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    if (!created.ok) throw new Error(created.error);

    await prisma.payment.update({
      where: { id: created.data.paymentId },
      data: { externalId: "mock-pay-twice", externalStatus: "approved" },
    });

    await processWebhook(event("mock-pay-twice", "evt-a"));
    await processWebhook(event("mock-pay-twice", "evt-b"));

    const inventory = await prisma.inventory.findUnique({ where: { productId: wine.id } });
    expect(inventory?.reserved).toBe(3);
    const movements = await prisma.inventoryMovement.count({
      where: { orderId: created.data.orderId, type: "RESERVA" },
    });
    expect(movements).toBe(1);
  });

  it("un pago rechazado no reserva stock ni cambia el pedido", async () => {
    const wine = await createWine({ onHand: 20 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 2 }]);
    const created = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    if (!created.ok) throw new Error(created.error);

    await prisma.payment.update({
      where: { id: created.data.paymentId },
      data: { externalId: "mock-pay-rej", externalStatus: "rejected" },
    });

    const result = await processWebhook(event("mock-pay-rej", "evt-rej"));
    expect(result.status).toBe("processed");

    const order = await prisma.order.findUnique({ where: { id: created.data.orderId } });
    const payment = await prisma.payment.findUnique({ where: { id: created.data.paymentId } });
    const inventory = await prisma.inventory.findUnique({ where: { productId: wine.id } });

    expect(order?.status).toBe("PAYMENT_PENDING");
    expect(payment?.status).toBe("REJECTED");
    expect(inventory?.reserved).toBe(0);
  });

  it("ignora un pago sin pedido asociado, dejando constancia", async () => {
    const result = await processWebhook(event("mock-pay-huerfano", "evt-orphan"));
    expect(result.status).toBe("ignored");

    const stored = await prisma.webhookEvent.findFirst({ where: { eventId: "evt-orphan" } });
    expect(stored?.status).toBe("IGNORED");
  });

  it("genera el ciclo y el pedido del Club desde el webhook de suscripción", async () => {
    const wine = await createWine({ onHand: 30 });
    const now = new Date();
    const { plan } = await createPlanWithBox({
      price: 62900,
      boxItems: [{ productId: wine.id, quantity: 2 }],
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
    });
    const user = await createCustomer();
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id, planId: plan.id, status: "PENDING",
        amount: 62900, frequency: "MONTHLY", provider: "mock",
        externalId: "mock-sub-club", shippingSnapshot: {},
      },
    });

    // Id sintético del simulador: sim:<preapproval>:<decisión>
    const result = await processWebhook(event(`sim:mock-sub-club:approved`, "evt-sub-1"));
    expect(result.status).toBe("processed");

    const updated = await prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: { cycles: true, orders: true },
    });
    expect(updated?.status).toBe("ACTIVE");
    expect(updated?.cycles).toHaveLength(1);
    expect(updated?.orders).toHaveLength(1);
    expect(updated?.orders[0]?.status).toBe("PREPARING");

    const inventory = await prisma.inventory.findUnique({ where: { productId: wine.id } });
    expect(inventory?.reserved).toBe(2);
  });

  it("el rechazo de un cobro del Club no genera pedido", async () => {
    const wine = await createWine({ onHand: 30 });
    const now = new Date();
    const { plan } = await createPlanWithBox({
      price: 62900,
      boxItems: [{ productId: wine.id, quantity: 2 }],
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
    });
    const user = await createCustomer();
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id, planId: plan.id, status: "ACTIVE",
        amount: 62900, frequency: "MONTHLY", provider: "mock",
        externalId: "mock-sub-fail", shippingSnapshot: {},
      },
    });

    const result = await processWebhook(event("sim:mock-sub-fail:rejected", "evt-sub-fail"));
    expect(result.status).toBe("processed");

    const updated = await prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: { cycles: true, orders: true },
    });
    expect(updated?.status).toBe("PAYMENT_FAILED");
    expect(updated?.cycles[0]?.status).toBe("PAYMENT_FAILED");
    expect(updated?.orders).toHaveLength(0);

    const inventory = await prisma.inventory.findUnique({ where: { productId: wine.id } });
    expect(inventory?.reserved).toBe(0);
  });
});
