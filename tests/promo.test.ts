import { beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase } from "./helpers/factories";
import { registrarBienvenida } from "@/domain/promotions/bienvenida";

/*
  La ventana de bienvenida crea clientes sin contraseña: dejaron el mail para
  llevarse el cupón, no eligieron una clave. El riesgo de eso es dejarlos
  encerrados —no pueden registrarse porque el mail "ya existe", y no pueden
  ingresar porque no hay contraseña contra la cual validar—, así que lo que se
  prueba acá es que la cuenta se pueda terminar de abrir después.

  Se prueba el dominio y no la server action: la acción le agrega un tope por
  IP que necesita headers(), y eso vitest no lo puede montar.
*/

const MAYOR = "1990-05-01";

async function habilitarPromo(couponCode = "BIENVENIDOATUL10") {
  await prisma.setting.upsert({
    where: { key: "promo" },
    create: { key: "promo", group: "promo", value: { enabled: true, couponCode } },
    update: { value: { enabled: true, couponCode } },
  });
}

describe("ventana de bienvenida", () => {
  beforeEach(async () => {
    await resetDatabase();
    await habilitarPromo();
  });

  it("guarda el cliente, la fecha de nacimiento y la suscripción con consentimiento", async () => {
    const res = await registrarBienvenida({
      firstName: "Ana",
      email: "Ana@Test.Local",
      birthDate: MAYOR,
    });

    expect(res).toMatchObject({ ok: true, couponCode: "BIENVENIDOATUL10" });

    const user = await prisma.user.findUnique({ where: { email: "ana@test.local" } });
    expect(user?.firstName).toBe("Ana");
    expect(user?.passwordHash).toBeNull();
    expect(user?.birthDate?.toISOString().slice(0, 10)).toBe(MAYOR);

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

  it("no entrega el cupón a un menor, y no lo guarda", async () => {
    const hoy = new Date();
    const haceDiezAnios = new Date(
      Date.UTC(hoy.getUTCFullYear() - 10, hoy.getUTCMonth(), hoy.getUTCDate()),
    )
      .toISOString()
      .slice(0, 10);

    const res = await registrarBienvenida({
      firstName: "Pibe",
      email: "pibe@test.local",
      birthDate: haceDiezAnios,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.field).toBe("birthDate");
    expect(await prisma.user.findUnique({ where: { email: "pibe@test.local" } })).toBeNull();
  });

  it("rechaza una fecha que no existe", async () => {
    const res = await registrarBienvenida({
      firstName: "Juan",
      email: "juan@test.local",
      birthDate: "1990-02-31",
    });

    expect(res.ok).toBe(false);
    expect(await prisma.user.findUnique({ where: { email: "juan@test.local" } })).toBeNull();
  });

  it("completa la fecha si el cliente ya existía sin ella, sin pisarle el nombre", async () => {
    await prisma.user.create({
      data: { email: "vieja@test.local", firstName: "Nombre Elegido", lastName: "Pérez" },
    });

    const res = await registrarBienvenida({
      firstName: "Otro",
      email: "vieja@test.local",
      birthDate: MAYOR,
    });

    expect(res.ok).toBe(true);
    const user = await prisma.user.findUnique({ where: { email: "vieja@test.local" } });
    expect(user?.firstName).toBe("Nombre Elegido");
    expect(user?.birthDate?.toISOString().slice(0, 10)).toBe(MAYOR);
  });

  it("no entrega el cupón si la promoción está apagada", async () => {
    await prisma.setting.update({
      where: { key: "promo" },
      data: { value: { enabled: false, couponCode: "BIENVENIDOATUL10" } },
    });

    const res = await registrarBienvenida({
      firstName: "Dani",
      email: "dani@test.local",
      birthDate: MAYOR,
    });

    expect(res.ok).toBe(false);
    expect(await prisma.user.findUnique({ where: { email: "dani@test.local" } })).toBeNull();
  });
});
