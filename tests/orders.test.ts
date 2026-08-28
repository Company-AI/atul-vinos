import { beforeEach, describe, expect, it } from "vitest";
import {
  availableOf, createCartWith, createCustomer, createPack, createShippingZone,
  createWine, prisma, resetDatabase,
} from "./helpers/factories";
import { createOrderFromCart } from "@/domain/orders/create";
import { markOrderPaid, transitionOrder } from "@/domain/orders/fulfillment";
import { canTransition } from "@/domain/orders/status";

const contact = {
  firstName: "Juan", lastName: "Pérez",
  email: "juan@test.local", phone: "+54 9 351 555-1234",
  documentId: "30111222",
};

const address = {
  street: "Av. España", number: "1240", apartment: "",
  city: "Río Cuarto", province: "Córdoba", postalCode: "5800", reference: "",
};

const shipping = {
  methodName: "Estándar", price: 8900, carrierCode: "mock", serviceCode: "std",
};

beforeEach(async () => {
  await resetDatabase();
  await createShippingZone();
});

describe("creación de pedido", () => {
  it("crea el pedido en PAYMENT_PENDING sin tocar el stock", async () => {
    const wine = await createWine({ onHand: 20, price: 20000 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 2 }]);

    const result = await createOrderFromCart({
      cartToken: cart.token, contact, address, shipping,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await prisma.order.findUnique({
      where: { id: result.data.orderId },
      include: { items: true, payments: true },
    });

    expect(order?.status).toBe("PAYMENT_PENDING");
    expect(order?.items).toHaveLength(1);
    expect(Number(order?.total)).toBe(20000 * 2 + 8900);
    expect(order?.payments[0]?.status).toBe("PENDING");
    // El stock sigue intacto: la reserva ocurre al confirmarse el pago.
    expect(await availableOf(wine.id)).toBe(20);
  });

  it("guarda un snapshot de precio y nombre, inmune a cambios posteriores", async () => {
    const wine = await createWine({ onHand: 10, price: 15000, name: "Malbec Original" });
    const cart = await createCartWith([{ productId: wine.id, quantity: 1 }]);

    const result = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    await prisma.product.update({
      where: { id: wine.id },
      data: { price: 99000, name: "Malbec Renombrado" },
    });

    const item = await prisma.orderItem.findFirst({ where: { orderId: result.data.orderId } });
    expect(item?.name).toBe("Malbec Original 2022"); // incluye la cosecha
    expect(Number(item?.unitPrice)).toBe(15000);
  });

  it("rechaza el checkout si la cantidad supera el stock disponible", async () => {
    const wine = await createWine({ onHand: 3 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 5 }]);

    const result = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INSUFFICIENT_STOCK");
  });

  it("rechaza el checkout con carrito vacío", async () => {
    const cart = await createCartWith([]);
    const result = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("EMPTY_CART");
  });

  it("rechaza productos que dejaron de estar activos", async () => {
    const wine = await createWine({ onHand: 10 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 1 }]);
    await prisma.product.update({ where: { id: wine.id }, data: { status: "ARCHIVED" } });

    const result = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("PRODUCT_UNAVAILABLE");
  });

  it("guarda los componentes del pack en el snapshot del ítem", async () => {
    const a = await createWine({ onHand: 10, name: "Tinto A" });
    const b = await createWine({ onHand: 10, name: "Blanco B" });
    const pack = await createPack([
      { productId: a.id, quantity: 2 },
      { productId: b.id, quantity: 1 },
    ]);
    const cart = await createCartWith([{ productId: pack.id, quantity: 1 }]);

    const result = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const item = await prisma.orderItem.findFirst({ where: { orderId: result.data.orderId } });
    expect(item?.kind).toBe("PACK");
    expect(item?.packSnapshot).toHaveLength(2);
  });
});

describe("confirmación de pago (CASO A)", () => {
  it("reserva stock, cambia de estado y deja el pedido listo para preparar", async () => {
    const wine = await createWine({ onHand: 20, price: 20000 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 3 }]);
    const created = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const paid = await markOrderPaid({
      orderId: created.data.orderId,
      paymentId: created.data.paymentId,
      externalPaymentId: "mp-123",
      paymentMethod: "visa",
    });

    expect(paid.ok).toBe(true);
    const order = await prisma.order.findUnique({ where: { id: created.data.orderId } });
    expect(order?.status).toBe("STOCK_RESERVED");
    expect(order?.paidAt).not.toBeNull();

    // Reserva: el físico no cambia, el disponible baja.
    const inventory = await prisma.inventory.findUnique({ where: { productId: wine.id } });
    expect(inventory?.onHand).toBe(20);
    expect(inventory?.reserved).toBe(3);
    expect(await availableOf(wine.id)).toBe(17);

    const movement = await prisma.inventoryMovement.findFirst({
      where: { orderId: created.data.orderId, type: "RESERVA" },
    });
    expect(movement?.quantity).toBe(3);
  });

  it("expande el pack a sus componentes al reservar", async () => {
    const a = await createWine({ onHand: 10 });
    const b = await createWine({ onHand: 10 });
    const pack = await createPack([
      { productId: a.id, quantity: 2 },
      { productId: b.id, quantity: 1 },
    ]);
    const cart = await createCartWith([{ productId: pack.id, quantity: 2 }]);
    const created = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    if (!created.ok) throw new Error(created.error);

    await markOrderPaid({ orderId: created.data.orderId, paymentId: created.data.paymentId });

    expect(await availableOf(a.id)).toBe(10 - 4);
    expect(await availableOf(b.id)).toBe(10 - 2);
  });

  it("es idempotente: dos webhooks del mismo pago no reservan dos veces", async () => {
    const wine = await createWine({ onHand: 20 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 2 }]);
    const created = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    if (!created.ok) throw new Error(created.error);

    await markOrderPaid({ orderId: created.data.orderId, paymentId: created.data.paymentId });
    await markOrderPaid({ orderId: created.data.orderId, paymentId: created.data.paymentId });

    const inventory = await prisma.inventory.findUnique({ where: { productId: wine.id } });
    expect(inventory?.reserved).toBe(2);

    const movements = await prisma.inventoryMovement.count({
      where: { orderId: created.data.orderId, type: "RESERVA" },
    });
    expect(movements).toBe(1);
  });

  it("si falla la reserva, el pedido no queda a medias", async () => {
    const wine = await createWine({ onHand: 5 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 4 }]);
    const created = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    if (!created.ok) throw new Error(created.error);

    // Entre el checkout y el webhook, otro pedido se llevó el stock.
    await prisma.inventory.update({
      where: { productId: wine.id },
      data: { reserved: 5 },
    });

    const paid = await markOrderPaid({
      orderId: created.data.orderId,
      paymentId: created.data.paymentId,
    });

    expect(paid.ok).toBe(false);
    const order = await prisma.order.findUnique({ where: { id: created.data.orderId } });
    // La transacción se revirtió por completo.
    expect(order?.status).toBe("PAYMENT_PENDING");
    const event = await prisma.orderEvent.findFirst({
      where: { orderId: created.data.orderId, type: "note" },
    });
    expect(event?.message).toContain("Stock insuficiente");
  });
});

describe("estados del pedido", () => {
  it("solo permite transiciones válidas", () => {
    expect(canTransition("PAYMENT_PENDING", "PAID")).toBe(true);
    expect(canTransition("STOCK_RESERVED", "PREPARING")).toBe(true);
    expect(canTransition("PREPARING", "READY")).toBe(true);
    expect(canTransition("READY", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
    expect(canTransition("DELIVERED", "PREPARING")).toBe(false);
    expect(canTransition("CANCELLED", "PAID")).toBe(false);
    expect(canTransition("PAYMENT_PENDING", "SHIPPED")).toBe(false);
  });

  it("el despacho descuenta el stock físico y cierra la reserva", async () => {
    const wine = await createWine({ onHand: 20 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 2 }]);
    const created = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    if (!created.ok) throw new Error(created.error);

    await markOrderPaid({ orderId: created.data.orderId, paymentId: created.data.paymentId });
    await transitionOrder(created.data.orderId, "PREPARING");
    await transitionOrder(created.data.orderId, "READY");
    await transitionOrder(created.data.orderId, "SHIPPED");

    const inventory = await prisma.inventory.findUnique({ where: { productId: wine.id } });
    expect(inventory?.onHand).toBe(18);
    expect(inventory?.reserved).toBe(0);

    const order = await prisma.order.findUnique({ where: { id: created.data.orderId } });
    expect(order?.status).toBe("SHIPPED");
    expect(order?.shippedAt).not.toBeNull();
  });

  it("la cancelación libera la reserva sin tocar el stock físico", async () => {
    const wine = await createWine({ onHand: 20 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 4 }]);
    const created = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    if (!created.ok) throw new Error(created.error);

    await markOrderPaid({ orderId: created.data.orderId, paymentId: created.data.paymentId });
    expect(await availableOf(wine.id)).toBe(16);

    await transitionOrder(created.data.orderId, "CANCELLED", { message: "Pedido de prueba" });

    const inventory = await prisma.inventory.findUnique({ where: { productId: wine.id } });
    expect(inventory?.onHand).toBe(20);
    expect(inventory?.reserved).toBe(0);
    expect(await availableOf(wine.id)).toBe(20);
  });

  it("rechaza una transición inválida sin efectos colaterales", async () => {
    const wine = await createWine({ onHand: 10 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 1 }]);
    const created = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    if (!created.ok) throw new Error(created.error);

    const result = await transitionOrder(created.data.orderId, "DELIVERED");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INVALID_TRANSITION");

    const order = await prisma.order.findUnique({ where: { id: created.data.orderId } });
    expect(order?.status).toBe("PAYMENT_PENDING");
  });

  it("el reembolso de un pedido entregado devuelve mercadería si se pide", async () => {
    const wine = await createWine({ onHand: 20 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 2 }]);
    const created = await createOrderFromCart({ cartToken: cart.token, contact, address, shipping });
    if (!created.ok) throw new Error(created.error);

    await markOrderPaid({ orderId: created.data.orderId, paymentId: created.data.paymentId });
    await transitionOrder(created.data.orderId, "PREPARING");
    await transitionOrder(created.data.orderId, "READY");
    await transitionOrder(created.data.orderId, "SHIPPED");
    expect((await prisma.inventory.findUnique({ where: { productId: wine.id } }))?.onHand).toBe(18);

    await transitionOrder(created.data.orderId, "REFUNDED", { restock: true });
    expect((await prisma.inventory.findUnique({ where: { productId: wine.id } }))?.onHand).toBe(20);
  });
});

describe("cliente registrado", () => {
  it("asocia el pedido al usuario y guarda la dirección para reutilizarla", async () => {
    const user = await createCustomer();
    const wine = await createWine({ onHand: 10 });
    const cart = await createCartWith([{ productId: wine.id, quantity: 1 }], user.id);

    const created = await createOrderFromCart({
      cartToken: cart.token, userId: user.id, contact, address, shipping,
    });
    if (!created.ok) throw new Error(created.error);

    const order = await prisma.order.findUnique({ where: { id: created.data.orderId } });
    expect(order?.userId).toBe(user.id);
    expect(order?.addressId).not.toBeNull();

    const addresses = await prisma.address.count({ where: { userId: user.id } });
    expect(addresses).toBe(1);
  });
});
