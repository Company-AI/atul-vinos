/**
 * Deja /quienes-somos abriendo con la foto y la presentación de Marian y Maxi.
 *
 * El cliente avisó dos cosas: que el ítem "Quiénes somos" del menú no llevaba
 * a su foto ni a su texto —estaban sólo en la home— y que había que sacar las
 * bodegas que figuran en esa página porque no las trabajan.
 *
 * La presentación y el orden salen del código y ya viajan con el deploy. Lo que
 * falta hacer acá es la parte que vive en la base:
 *
 *   1. apagar el hero de video, para que la página abra con la presentación y
 *      no con dos aperturas pegadas;
 *   2. borrar la sección de bodegas.
 *
 * La sección de bodegas se borra y no se apaga, al revés que el hero. No es una
 * sección que el cliente no quiera mostrar: son datos equivocados. Listaba
 * Rutini, Norton y Trumpeter, que vienen del catálogo de ejemplo y no son
 * clientes de Atul, y los tres "Ver la línea" apuntaban a /vinos?bodega=... sin
 * un solo vino detrás: caían en "No encontramos vinos con esos filtros".
 * Dejarla apagada con los datos viejos adentro es dejar la trampa armada para
 * el día que alguien la vuelva a prender. Las bodegas reales ya se muestran con
 * su logo en la home (LogoStrip).
 *
 * Es idempotente: la segunda corrida no encuentra nada que hacer.
 *
 *   npx tsx prisma/ops/quienes-somos.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  /*
    El hero se apaga sólo si sigue siendo el que pusimos nosotros. Si alguien
    lo reescribió desde el admin, esa decisión vale más que este script y se
    respeta: se avisa y se sigue de largo.
  */
  const hero = await prisma.cmsSection.findUnique({ where: { key: "quienes-somos.hero" } });
  if (!hero) {
    console.log("quienes-somos.hero: no existe, se saltea");
  } else if (!hero.isActive) {
    console.log("quienes-somos.hero: ya estaba apagado");
  } else if (!JSON.stringify(hero.data).includes("No hacemos el vino.")) {
    console.log('quienes-somos.hero: lo editaron desde el admin (ya no dice "No hacemos el vino.") — sin tocar');
  } else {
    await prisma.cmsSection.update({
      where: { key: "quienes-somos.hero" },
      data: { isActive: false, updatedBy: "ops/quienes-somos" },
    });
    console.log("quienes-somos.hero: apagado — la página abre con la presentación");
  }

  const bodegas = await prisma.cmsSection.findUnique({ where: { key: "quienes-somos.bodegas" } });
  if (!bodegas) {
    console.log("quienes-somos.bodegas: no existe, nada que borrar");
  } else {
    /*
      Antes de borrar, se deja el contenido en el log. Es la única copia que va
      a quedar si después resulta que algo de ahí servía.
    */
    console.log(`quienes-somos.bodegas: se borra. Contenido: ${JSON.stringify(bodegas.data)}`);
    await prisma.cmsSection.delete({ where: { key: "quienes-somos.bodegas" } });
    console.log("quienes-somos.bodegas: borrada");
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
