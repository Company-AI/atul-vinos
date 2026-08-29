/**
 * Refresca sólo las secciones de contenido del CMS.
 *
 * El seed completo usa `create` y además regenera pedidos, stock y
 * suscripciones: no sirve para iterar diseño sobre una base con datos reales.
 * Esto reemplaza las secciones declaradas en prisma/seed/content.ts y no toca
 * ninguna otra tabla.
 *
 *   npx tsx scripts/reseed-content.ts
 */
import { PrismaClient } from "@prisma/client";
import { CMS_SECTIONS } from "../prisma/seed/content";

const prisma = new PrismaClient();

async function main() {
  const actor = "admin@auroraseleccion.test";
  const keys = CMS_SECTIONS.map((s) => s.key);

  // Las secciones que dejaron de estar declaradas se van con el refresco.
  const removed = await prisma.cmsSection.deleteMany({
    where: { page: { in: [...new Set(CMS_SECTIONS.map((s) => s.page))] }, key: { notIn: keys } },
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
        data: section.data as object,
        updatedBy: actor,
      },
      update: {
        page: section.page,
        type: section.type,
        title: section.title,
        sortOrder: section.sortOrder,
        data: section.data as object,
        updatedBy: actor,
      },
    });
  }

  console.log(`Secciones actualizadas: ${CMS_SECTIONS.length}`);
  if (removed.count > 0) console.log(`Secciones eliminadas: ${removed.count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
