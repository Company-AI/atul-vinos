import { beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase } from "./helpers/factories";
import { esPrimeraCompra } from "@/domain/promotions/primera-compra";

/*
  El cupón de bienvenida es "sólo primera compra". Antes eso se medía nada más
  que por `userId`, así que a quien compraba como invitado le daba siempre que
  sí: alcanzaba con no iniciar sesión para volver a usarlo con el mismo mail.
  Estos casos son el agujero que eso dejaba.
*/

const EMAIL = "repetidor@test.local";

async function crearPedido(datos: {
  email: string;
  userId?: string | null;
  status: "DELIVERED" | "PAYMENT_PENDING" | "CANCELLED";
}) {
  await prisma.order.create({
    data: {
      status: datos.status,
      userId: datos.userId ?? null,
      guestEmail: datos.userId ? null : datos.email,
      customerName: "Repetidor",
      customerEmail: datos.email,
      customerPhone: "+54 9 351 555-0000",
      shippingSnapshot: {},
      subtotal: 10000,
      discountTotal: 0,
      shippingTotal: 0,
      total: 10000,
      currency: "ARS",
    },
  });
}

describe("primera compra", () => {
  beforeEach(resetDatabase);

  it("es la primera cuando no hay nada", async () => {
    expect(await esPrimeraCompra({ email: EMAIL })).toBe(true);
  });

  it("deja de serlo para un invitado que ya compró con ese mail", async () => {
    await crearPedido({ email: EMAIL, status: "DELIVERED" });
    expect(await esPrimeraCompra({ email: EMAIL })).toBe(false);
  });

  it("reconoce el mail aunque cambie la capitalización", async () => {
    await crearPedido({ email: EMAIL, status: "DELIVERED" });
    expect(await esPrimeraCompra({ email: "Repetidor@Test.Local" })).toBe(false);
  });

  it("un pedido que quedó esperando pago no gasta la primera compra", async () => {
    await crearPedido({ email: EMAIL, status: "PAYMENT_PENDING" });
    expect(await esPrimeraCompra({ email: EMAIL })).toBe(true);
  });

  it("un pedido cancelado tampoco", async () => {
    await crearPedido({ email: EMAIL, status: "CANCELLED" });
    expect(await esPrimeraCompra({ email: EMAIL })).toBe(true);
  });

  it("sin cuenta ni mail no se puede saber, y se asume que sí", async () => {
    expect(await esPrimeraCompra({})).toBe(true);
  });
});
