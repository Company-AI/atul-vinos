/**
 * Refresca sólo las secciones de contenido del CMS.
 *
 * El seed completo usa `create` y además regenera pedidos, stock y
 * suscripciones: no sirve para iterar diseño sobre una base con datos reales.
 * Esto reemplaza las secciones declaradas en prisma/seed/content.ts y no toca
 * ninguna otra tabla.
 *
 *   npx tsx scripts/reseed-content.ts
 *
 * ──────────────────────────────────────────────────────────────────────────
 * Esto borra. Es para iterar diseño en tu base local, no para producción.
 *
 * Borra las secciones de esas páginas que no estén declaradas acá, y borra
 * TODOS los banners antes de recrear los del seed. Contra una base con
 * contenido real eso se lleva puesto lo que el cliente cargó desde el admin:
 * un banner de temporada no está en el seed y no vuelve solo.
 *
 * Por eso antes de tocar nada se fija si hay filas que no salieron del seed.
 * Si encuentra alguna, no hace nada y las lista. Para correrlo igual, sabiendo
 * lo que se pierde:
 *
 *   REEMPLAZAR_CONTENIDO=si npx tsx scripts/reseed-content.ts
 *
 * Sobre una base que sólo tiene lo del seed no cambia nada: no hay filas
 * ajenas que proteger y corre derecho.
 *
 * Para apagar una sección en producción no se usa este script: va un script
 * en prisma/ops/, que toca sólo lo suyo y respeta lo editado a mano.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { PrismaClient } from "@prisma/client";
import { BANNERS, CMS_SECTIONS } from "../prisma/seed/content";

const prisma = new PrismaClient();

const FORZAR = process.env.REEMPLAZAR_CONTENIDO === "si";

async function main() {
  const actor = "admin@atulwines.com";
  const keys = CMS_SECTIONS.map((s) => s.key);
  const paginas = [...new Set(CMS_SECTIONS.map((s) => s.page))];

  /*
    Qué se perdería si siguiéramos. Las secciones son las de estas páginas que
    el seed ya no declara. Los banners van por `message` porque la tabla no
    tiene una clave estable: si alguien le editó el texto a uno del seed desde
    el admin, acá figura como ajeno, que es el lado seguro para equivocarse.
  */
  const mensajesDelSeed = new Set(BANNERS.map((b) => b.message));
  const [seccionesAjenas, bannersAjenos] = await Promise.all([
    prisma.cmsSection.findMany({
      where: { page: { in: paginas }, key: { notIn: keys } },
      select: { key: true, title: true },
    }),
    prisma.banner
      .findMany({ select: { message: true } })
      .then((filas) => filas.filter((b) => !mensajesDelSeed.has(b.message))),
  ]);

  if (seccionesAjenas.length > 0 || bannersAjenos.length > 0) {
    console.error("Esta base tiene contenido que no salió del seed y se perdería:\n");
    for (const s of seccionesAjenas) console.error(`  sección  ${s.key}  ${s.title ?? ""}`);
    for (const b of bannersAjenos) console.error(`  banner   "${b.message}"`);

    if (!FORZAR) {
      console.error("\nNo se tocó nada.");
      console.error("Si es tu base local y querés pisarlo igual:");
      console.error("  REEMPLAZAR_CONTENIDO=si npx tsx scripts/reseed-content.ts");
      console.error("\nSi es producción, lo que buscás es un script en prisma/ops/.");
      process.exitCode = 1;
      return;
    }

    console.error("\nREEMPLAZAR_CONTENIDO=si: se borra igual.\n");
  }

  // Las secciones que dejaron de estar declaradas se van con el refresco.
  const removed = await prisma.cmsSection.deleteMany({
    where: { page: { in: paginas }, key: { notIn: keys } },
  });

  for (const section of CMS_SECTIONS) {
    await prisma.cmsSection.upsert({
      where: { key: section.key },
      create: {
        key: section.key,
        page: section.page,
        type: section.type,
        title: section.title,
        sortOrder: section.sortOrder,
        isActive: (section as { isActive?: boolean }).isActive ?? true,
        data: section.data as object,
        updatedBy: actor,
      },
      update: {
        page: section.page,
        type: section.type,
        title: section.title,
        sortOrder: section.sortOrder,
        isActive: (section as { isActive?: boolean }).isActive ?? true,
        data: section.data as object,
        updatedBy: actor,
      },
    });
  }

  /*
    Los banners viven en otra tabla y antes quedaban afuera del refresco: por
    eso el aviso del Club seguía apareciendo después de sacarlo del seed.
  */
  await prisma.banner.deleteMany({});
  for (const b of BANNERS) {
    await prisma.banner.create({
      data: {
        message: b.message,
        linkUrl: (b as { linkUrl?: string }).linkUrl ?? null,
        linkLabel: (b as { linkLabel?: string }).linkLabel ?? null,
        position: b.position,
        isActive: b.isActive ?? true,
        sortOrder: b.sortOrder,
      },
    });
  }

  console.log(`Secciones actualizadas: ${CMS_SECTIONS.length}`);
  console.log(`Banners actualizados:   ${BANNERS.length}`);
  if (removed.count > 0) console.log(`Secciones eliminadas: ${removed.count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
