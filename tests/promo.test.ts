import { beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase } from "./helpers/factories";
import { claimPromo } from "@/app/actions/promo";

/*
  La ventana promocional crea clientes sin contraseña: dejaron el mail para
  llevarse el cupón, no eligieron una clave. El riesgo de eso es dejarlos
  encerrados —no pueden registrarse porque el mail "ya existe", y no pueden
  ingresar porque no hay contraseña contra la cual validar—, así que lo que se
  prueba acá es que la cuenta se pueda terminar de abrir después.
*/

async function habilitarPromo(couponCode = "BIENVENIDO10") {
  await prisma.setting.upsert({
    where: { key: "promo" },
    create: {
      key: "promo",
      group: "promo",
      value: { enabled: true, couponCode },
    },
    update: { value: { enabled: true, couponCode } },
  });
}

describe("ventana promocional", () => {
  beforeEach(async () => {
    await resetDatabase();
    await habilitarPromo();
  });

  it("guarda el cliente y la suscripción con consentimiento", async () => {
    const res = await claimPromo({ firstName: "Ana", email: "Ana@Test.Local" });

    expect(res).toMatchObject({ ok: true, couponCode: "BIENVENIDO10" });

    const user = await prisma.user.findUnique({ where: { email: "ana@test.local" } });
    expect(user?.firstName).toBe("Ana");
    expect(user?.passwordHash).toBeNull();

    const sub = await prisma.newsletterSubscriber.findUnique({
      where: { email: "ana@test.local" },
    });
    expect(sub?.consent).toBe(true);
    expect(sub?.consentAt).not.toBeNull();
  });

  /*
    Que la persona pueda registrarse después no se prueba acá: `register` llama
    a headers() y necesita un request de Next, que vitest no monta. Se verifica
    a mano sobre /registrarme.
  */

  it("no entrega el cupón si la promoción está apagada", async () => {
    await prisma.setting.update({
      where: { key: "promo" },
      data: { value: { enabled: false, couponCode: "BIENVENIDO10" } },
    });

    const res = await claimPromo({ firstName: "Dani", email: "dani@test.local" });

    expect(res.ok).toBe(false);
    expect(await prisma.user.findUnique({ where: { email: "dani@test.local" } })).toBeNull();
  });
});
