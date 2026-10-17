/**
 * Prende y apaga el cupón de bienvenida, y con él la ventana.
 *
 * Desde que la ventana mira el cupón de verdad, este interruptor decide las
 * dos cosas a la vez: con el cupón apagado la ventana no aparece, y con el
 * cupón prendido vuelve sola. Por eso conviene tenerlo a mano y no tener que
 * entrar al panel para probarlo.
 *
 * Sirve igual el día de la apertura: se corre "activar" y la tienda empieza
 * a ofrecer el 10% de primera compra sin tocar código ni desplegar.
 *
 *   npx tsx prisma/ops/cupon-de-bienvenida.ts estado
 *   npx tsx prisma/ops/cupon-de-bienvenida.ts activar
 *   npx tsx prisma/ops/cupon-de-bienvenida.ts desactivar
 *
 * Siempre imprime cómo quedó, así queda registrado en el log de la corrida
 * y se puede volver atrás sabiendo a qué estado volver.
 */
import { PrismaClient } from "@prisma/client";
import { promoSettings } from "../../src/domain/settings/schema";

const prisma = new PrismaClient();

type Accion = "estado" | "activar" | "desactivar";

async function main() {
  const accion = (process.argv[2] ?? "estado") as Accion;
  if (!["estado", "activar", "desactivar"].includes(accion)) {
    throw new Error(`No sé hacer "${accion}". Opciones: estado, activar, desactivar.`);
  }

  const fila = await prisma.setting.findUnique({ where: { key: "promo" } });
  const promo = promoSettings.parse(fila?.value ?? {});
  const code = promo.couponCode.trim().toUpperCase();

  if (!code) {
    throw new Error("La ventana no tiene ningún cupón configurado.");
  }

  const cupon = await prisma.coupon.findUnique({ where: { code } });
  if (!cupon) {
    throw new Error(
      `No existe el cupón ${code}. Corré primero "configurar-ventana-de-bienvenida".`,
    );
  }

  if (accion !== "estado") {
    await prisma.coupon.update({
      where: { code },
      data: { isActive: accion === "activar" },
    });
  }

  const despues = await prisma.coupon.findUnique({ where: { code } });
  const vigente = estaVigente(despues!);

  console.log(`Cupón ${code}`);
  console.log(`  activo        ${despues!.isActive ? "sí" : "no"}${accion === "estado" ? "" : `  (antes: ${cupon.isActive ? "sí" : "no"})`}`);
  console.log(`  desde         ${despues!.startsAt?.toISOString().slice(0, 10) ?? "—"}`);
  console.log(`  hasta         ${despues!.endsAt?.toISOString().slice(0, 10) ?? "—"}`);
  console.log(`  usos          ${despues!.usedCount}${despues!.maxUses ? ` de ${despues!.maxUses}` : " (sin tope)"}`);
  console.log(`  ventana web   ${vigente ? "SE MUESTRA" : "no se muestra"}`);
}

/** Mismo criterio que usa la tienda para decidir si muestra la ventana. */
function estaVigente(c: {
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  maxUses: number | null;
  usedCount: number;
}): boolean {
  const ahora = new Date();
  if (!c.isActive) return false;
  if (c.startsAt && c.startsAt > ahora) return false;
  if (c.endsAt && c.endsAt < ahora) return false;
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return false;
  return true;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
