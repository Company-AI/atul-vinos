/**
 * Enciende el pago por transferencia con datos de relleno, para poder
 * recorrer el flujo antes de tener la cuenta real.
 *
 * POR QUÉ LOS VALORES SON OBVIAMENTE FALSOS
 *
 * Un CBU inventado que "parezca" real es peligroso: son 22 dígitos y hay
 * muchas combinaciones válidas, así que uno al azar puede corresponder a la
 * cuenta de un desconocido. Si eso llegara a un comprador, su plata se va a
 * otro lado y no hay forma de traerla. Por eso el CBU es todo ceros —no pasa
 * el dígito verificador de ningún banco— y el titular dice, con todas las
 * letras, que son datos de prueba.
 *
 * DOS CANDADOS
 *
 * 1. No corre si la tienda ya está abierta al público. Mientras MODO_APERTURA
 *    esté en 1 nadie de afuera llega al checkout; apagado, cualquiera podría
 *    toparse con estos datos.
 * 2. No pisa una cuenta ya cargada. Si alguien puso la real, el script se
 *    planta: su trabajo es destrabar una prueba, no deshacerla.
 *
 *   npx tsx prisma/ops/transferencia-de-prueba.ts
 */
import { PrismaClient } from "@prisma/client";
import { paymentSettings } from "../../src/domain/settings/schema";

const prisma = new PrismaClient();

const DE_PRUEBA = {
  transferEnabled: true,
  transferHolder: "DATOS DE PRUEBA — todavía no es la cuenta real",
  transferBank: "SIN BANCO (prueba)",
  transferAlias: "CARGAR.DATOS.REALES",
  transferCbu: "0000000000000000000000",
  transferCuit: "00-00000000-0",
};

async function main() {
  if (process.env.MODO_APERTURA !== "1") {
    throw new Error(
      "La tienda no está en modo construcción. Con el sitio abierto, un comprador " +
        "podría ver estos datos y transferir a la nada. Cargá la cuenta real desde " +
        "Configuración → Pagos.",
    );
  }

  const fila = await prisma.setting.findUnique({ where: { key: "payments" } });
  const antes = paymentSettings.parse(fila?.value ?? {});

  const yaHayCuenta =
    (antes.transferAlias.trim() || antes.transferCbu.trim()) &&
    antes.transferAlias !== DE_PRUEBA.transferAlias;
  if (yaHayCuenta) {
    console.log("Ya hay una cuenta cargada. No se toca nada.");
    return;
  }

  const despues = paymentSettings.parse({ ...antes, ...DE_PRUEBA });
  await prisma.setting.upsert({
    where: { key: "payments" },
    create: { key: "payments", group: "payments", value: despues as object, updatedBy: "ops/transferencia-de-prueba" },
    update: { value: despues as object, updatedBy: "ops/transferencia-de-prueba" },
  });

  console.log("Transferencia encendida CON DATOS DE PRUEBA:");
  console.log(`  titular  ${despues.transferHolder}`);
  console.log(`  alias    ${despues.transferAlias}`);
  console.log(`  CBU      ${despues.transferCbu}`);
  console.log("");
  console.log("ANTES DE ABRIR LA TIENDA hay que reemplazarlos en Configuración → Pagos,");
  console.log("o apagar «Ofrecer pago por transferencia».");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
