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
 *   2. apagar la sección de bodegas.
 *
 * Las dos se apagan. Nada se borra: este script no tiene un solo delete, y es a
 * propósito. Una fila de CmsSection es contenido que alguien escribió, y
 * recuperarla después de un deleteMany es ir a buscarla a un backup.
 *
 * Igual conviene saber por qué la de bodegas se apaga, porque no es el mismo
 * caso que el hero. No es contenido que el cliente no quiera mostrar ahora: son
 * datos equivocados. Listaba Rutini, Norton y Trumpeter, que vienen del catálogo
 * de ejemplo y no son clientes de Atul, y los tres "Ver la línea" apuntaban a
 * /vinos?bodega=... sin un solo vino detrás: caían en "No encontramos vinos con
 * esos filtros". Así que si algún día alguien la vuelve a prender desde el
 * admin, lo primero es cambiarle los items, no publicarla como está. Las
 * bodegas reales ya se muestran con su logo en la home (LogoStrip).
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
    console.log("quienes-somos.bodegas: no existe, se saltea");
  } else if (!bodegas.isActive) {
    console.log("quienes-somos.bodegas: ya estaba apagada");
  } else {
    /*
      Se deja el contenido en el log igual que si se borrara. No hace falta para
      recuperarla —la fila queda—, pero sirve para ver desde el run qué estaba
      publicado el día que se apagó, sin entrar a la base.
    */
    console.log(`quienes-somos.bodegas: se apaga. Contenido: ${JSON.stringify(bodegas.data)}`);
    await prisma.cmsSection.update({
      where: { key: "quienes-somos.bodegas" },
      data: { isActive: false, updatedBy: "ops/quienes-somos" },
    });
    console.log("quienes-somos.bodegas: apagada — deja de aparecer en la página");
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
