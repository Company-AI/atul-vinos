/**
 * Deja andando la ventana de bienvenida sobre una base que ya existe.
 *
 * Hace falta porque los defaults del código sólo valen cuando la base todavía
 * no guardó nada: en una instalación andando, las filas de `Setting` le ganan
 * al schema, y el cupón directamente no existe hasta que alguien lo crea.
 *
 * Tres cosas, y ninguna pisa lo que el admin haya editado a mano:
 *
 *   1. Crea o actualiza el cupón de bienvenida.
 *   2. Enciende la ventana y le apunta ese cupón.
 *   3. Baja el age gate a preguntar una vez por día.
 *
 * Es idempotente: correrlo dos veces deja lo mismo.
 *
 *   npx tsx prisma/ops/bienvenida.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  ageGateSettings, clubSettings, companySettings, promoSettings,
} from "../../src/domain/settings/schema";

const prisma = new PrismaClient();

async function main() {
  const promoDefaults = promoSettings.parse({});
  const ageDefaults = ageGateSettings.parse({});
  const codigo = (process.env.CUPON_BIENVENIDA?.trim() || promoDefaults.couponCode).toUpperCase();

  if (!codigo) {
    throw new Error("No hay código de cupón: sin eso la ventana entrega un vacío.");
  }

  /*
    `update` no toca `usedCount` ni los usos ya registrados: si el cupón venía
    circulando, repetir el script no le regala un uso a nadie. Tampoco toca
    `value`, para que una promoción que el negocio haya subido al 15% no
    vuelva sola al 10%.
  */
  const cupon = await prisma.coupon.upsert({
    where: { code: codigo },
    create: {
      code: codigo,
      type: "PERCENT",
      value: 10,
      description: "10% en la primera compra — ventana de bienvenida",
      firstPurchaseOnly: true,
      maxUsesPerUser: 1,
      isActive: true,
    },
    update: {
      // Las reglas sí se reafirman: son las que lo hacen "uno por persona".
      firstPurchaseOnly: true,
      maxUsesPerUser: 1,
      isActive: true,
      endsAt: null,
    },
  });
  console.log(
    `Cupón ${cupon.code}: ${Number(cupon.value)}% · sólo primera compra · ` +
      `1 por persona · usado ${cupon.usedCount} ${cupon.usedCount === 1 ? "vez" : "veces"}`,
  );

  await ajustarGrupo("promo", promoSettings, (actual) => ({
    ...actual,
    enabled: true,
    couponCode: codigo,
    // Sólo si nadie eligió otra: una imagen cargada a mano manda.
    imageUrl: actual.imageUrl || promoDefaults.imageUrl,
  }));

  await ajustarGrupo("ageGate", ageGateSettings, (actual) => ({
    ...actual,
    rememberDays: ageDefaults.rememberDays,
  }));

  // El Club no se lanza todavía: fuera del pie, del menú y de /club.
  await ajustarGrupo("club", clubSettings, (actual) => ({ ...actual, enabled: false }));

  /*
    "Atul S.R.L." era un valor de relleno del armado y no es la razón social
    real. Sólo se corrige si quedó ese texto: si alguien ya cargó la buena,
    no se la pisa.
  */
  await ajustarGrupo("company", companySettings, (actual) => ({
    ...actual,
    legalName:
      actual.legalName === "Atul S.R.L."
        ? companySettings.parse({}).legalName
        : actual.legalName,
  }));
}

/** Lee el grupo, le aplica el cambio, lo valida y lo guarda. */
async function ajustarGrupo<T extends { parse: (v: unknown) => Record<string, unknown> }>(
  key: string,
  schema: T,
  cambiar: (actual: Record<string, unknown>) => Record<string, unknown>,
) {
  /*
    Que la fila no exista es normal, no un error: el sitio arranca con los
    defaults del código y sólo escribe el grupo cuando alguien lo guarda
    desde el admin. En ese caso se parte de los defaults y se crea.
  */
  const fila = await prisma.setting.findUnique({ where: { key } });
  const antes = schema.parse(fila?.value ?? {});
  const despues = schema.parse(cambiar(antes));

  await prisma.setting.upsert({
    where: { key },
    create: { key, group: key, value: despues as object, updatedBy: "ops/bienvenida" },
    update: { value: despues as object, updatedBy: "ops/bienvenida" },
  });

  const cambios = Object.keys(despues).filter(
    (k) => JSON.stringify(antes[k]) !== JSON.stringify(despues[k]),
  );
  console.log(
    cambios.length === 0
      ? `${key}: sin cambios`
      : `${key}: ${cambios.map((k) => `${k} = ${JSON.stringify(despues[k])}`).join(", ")}`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
