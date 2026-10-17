/**
 * Carga la cuenta a la que los compradores transfieren, y enciende el medio.
 *
 * Los valores llegan por variables de entorno y NO están en el código. Son
 * el nombre, el CUIT y el CBU de una persona: aunque se publiquen en el
 * checkout, dejarlos escritos en el repositorio los mete en el historial de
 * git para siempre, incluso después de que cambien de cuenta.
 *
 * Valida los dígitos verificadores antes de guardar. No es un trámite: un
 * CBU con un dígito cambiado suele seguir siendo un CBU válido de OTRA
 * cuenta, así que el error no rebota en ningún lado —la plata del comprador
 * llega a un desconocido y no vuelve—. Es el único momento en que se puede
 * atajar.
 *
 *   TRANSFER_TITULAR="Marian Fariña" \
 *   TRANSFER_BANCO="Banco Ciudad" \
 *   TRANSFER_ALIAS="ATUL.VINOS" \
 *   TRANSFER_CBU="0290107310000596083475" \
 *   TRANSFER_CUIT="23311044834" \
 *     npx tsx prisma/ops/datos-de-transferencia.ts
 *
 * No recibe el número de caja de ahorro a propósito: con el alias y el CBU
 * alcanza para transferir, y publicar además el número de cuenta es un dato
 * de más dando vueltas sin ninguna ganancia.
 */
import { PrismaClient } from "@prisma/client";
import { paymentSettings } from "../../src/domain/settings/schema";
import { cbuValido, cuitValido, formatearCuit } from "../../src/lib/cbu";

const prisma = new PrismaClient();

/**
 * Los datos pueden llegar sueltos (cómodo a mano) o en un token base64, que
 * es como los manda el workflow: así viajan en una sola pieza sin comillas
 * que puedan romper el comando que corre por SSH.
 */
function leerEntrada(): Record<string, string> {
  const b64 = process.env.DATOS_B64?.trim();
  if (b64) {
    try {
      return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    } catch {
      throw new Error("DATOS_B64 no se pudo decodificar.");
    }
  }
  return {
    titular: process.env.TRANSFER_TITULAR ?? "",
    banco: process.env.TRANSFER_BANCO ?? "",
    alias: process.env.TRANSFER_ALIAS ?? "",
    cbu: process.env.TRANSFER_CBU ?? "",
    cuit: process.env.TRANSFER_CUIT ?? "",
  };
}

async function main() {
  const entrada = leerEntrada();
  const titular = (entrada.titular ?? "").trim();
  const banco = (entrada.banco ?? "").trim();
  const alias = (entrada.alias ?? "").trim().toUpperCase();
  const cbu = (entrada.cbu ?? "").replace(/\D/g, "");
  const cuitCrudo = (entrada.cuit ?? "").trim();

  if (!titular) throw new Error("Falta el titular: es lo que la persona compara con su banco.");
  if (!alias && !cbu) throw new Error("Hace falta al menos el alias o el CBU.");

  if (cbu && !cbuValido(cbu)) {
    throw new Error(
      `El CBU ${cbu} no es válido: no cierran los dígitos verificadores, o el código ` +
        `de banco no existe. Revisalo contra el resumen antes de publicarlo: un CBU ` +
        `mal tipeado manda la plata a otra cuenta y no vuelve.`,
    );
  }

  if (cuitCrudo && !cuitValido(cuitCrudo)) {
    throw new Error(`El CUIT ${cuitCrudo} no es válido: no cierra el dígito verificador.`);
  }

  const fila = await prisma.setting.findUnique({ where: { key: "payments" } });
  const antes = paymentSettings.parse(fila?.value ?? {});

  const despues = paymentSettings.parse({
    ...antes,
    transferEnabled: true,
    transferHolder: titular,
    transferBank: banco,
    transferAlias: alias,
    transferCbu: cbu,
    transferCuit: cuitCrudo ? formatearCuit(cuitCrudo) : "",
  });

  await prisma.setting.upsert({
    where: { key: "payments" },
    create: { key: "payments", group: "payments", value: despues as object, updatedBy: "ops/datos-de-transferencia" },
    update: { value: despues as object, updatedBy: "ops/datos-de-transferencia" },
  });

  console.log("Cuenta para transferencias actualizada:");
  console.log(`  titular   ${despues.transferHolder}`);
  console.log(`  banco     ${despues.transferBank || "(sin cargar)"}`);
  console.log(`  alias     ${despues.transferAlias}`);
  console.log(`  CBU       ${despues.transferCbu}  (verificadores OK)`);
  console.log(`  CUIT      ${despues.transferCuit || "(sin cargar)"}`);
  console.log(`  medio     ${despues.transferEnabled ? "ENCENDIDO" : "apagado"}`);
  if (antes.transferAlias && antes.transferAlias !== despues.transferAlias) {
    console.log(`\n  (antes figuraba el alias ${antes.transferAlias})`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
