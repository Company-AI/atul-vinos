/**
 * Deja los datos de contacto como se muestran hoy en el sitio.
 *
 * Existe porque los defaults del código sólo valen cuando la base todavía no
 * tiene nada guardado. En una instalación andando, la fila `company` de
 * `Setting` le gana al default: cambiar el valor en el schema no mueve ni un
 * teléfono en producción. Esto toca esa fila.
 *
 * Qué hace, y nada más que eso: pone el teléfono visible igual al número de
 * WhatsApp. No borra la dirección —la etiqueta del correo y el remito la
 * necesitan como remitente—, simplemente el sitio dejó de publicarla.
 *
 * Es idempotente: correrlo dos veces deja lo mismo.
 *
 *   npx tsx prisma/ops/contacto.ts
 *
 * Con un número distinto al del código:
 *
 *   CONTACTO_TELEFONO="+54 9 351 123-4567" CONTACTO_WHATSAPP="5493511234567" \
 *     npx tsx prisma/ops/contacto.ts
 */
import { PrismaClient } from "@prisma/client";
import { companySettings } from "../../src/domain/settings/schema";

const prisma = new PrismaClient();

async function main() {
  const defaults = companySettings.parse({});

  const telefono = process.env.CONTACTO_TELEFONO?.trim() || defaults.phone;
  const whatsapp = (process.env.CONTACTO_WHATSAPP?.trim() || defaults.whatsapp).replace(/\D/g, "");
  const email = process.env.CONTACTO_EMAIL?.trim() || defaults.email;

  if (!whatsapp) {
    throw new Error("El WhatsApp quedó vacío: sin número no hay por dónde escribir.");
  }

  const fila = await prisma.setting.findUnique({ where: { key: "company" } });
  if (!fila) {
    throw new Error(
      "No existe la fila `company` en Setting: la base todavía no se inicializó.",
    );
  }

  const antes = fila.value as Record<string, unknown>;
  const despues = { ...antes, phone: telefono, whatsapp, email };

  // El schema completo valida: si algo quedó mal tipado, se ve acá y no en la web.
  companySettings.parse(despues);

  await prisma.setting.update({
    where: { key: "company" },
    data: { value: despues, updatedBy: "ops/contacto" },
  });

  console.log("Contacto actualizado:");
  for (const campo of ["phone", "whatsapp", "email"] as const) {
    const cambio = antes[campo] === despues[campo] ? "(sin cambios)" : `(antes: ${antes[campo]})`;
    console.log(`  ${campo.padEnd(9)} ${despues[campo]}  ${cambio}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
