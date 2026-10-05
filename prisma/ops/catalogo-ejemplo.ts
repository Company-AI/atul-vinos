/**
 * Carga la bodega y el vino de ejemplo en una base que ya está inicializada.
 *
 * El seed completo no sirve para esto: no se puede correr dos veces sobre la
 * misma base. Este script toca sólo el catálogo y es idempotente —si ya está,
 * lo deja como está—, así que se puede correr sin miedo a duplicar nada.
 *
 * Las listas de clasificación se buscan antes de crearse: en una base ya
 * inicializada existen, y crear "Malbec" de nuevo rompería la unicidad.
 *
 *   npx tsx prisma/ops/catalogo-ejemplo.ts
 */
import { PrismaClient } from "@prisma/client";
import { BODEGA_EJEMPLO, VINO_EJEMPLO } from "../seed/ejemplo";
import { slugify } from "../../src/lib/slug";

const prisma = new PrismaClient();

async function main() {
  const v = VINO_EJEMPLO;

  const yaEsta = await prisma.product.findUnique({ where: { slug: v.slug } });
  if (yaEsta) {
    console.log(`✓ "${v.name}" ya estaba cargado. No se tocó nada.`);
    return;
  }

  const bodega = await prisma.winery.upsert({
    where: { slug: slugify(BODEGA_EJEMPLO.name) },
    update: {},
    create: {
      name: BODEGA_EJEMPLO.name,
      slug: slugify(BODEGA_EJEMPLO.name),
      story: BODEGA_EJEMPLO.story,
      imageUrl: BODEGA_EJEMPLO.imageUrl,
    },
  });

  const categoria = await prisma.category.upsert({
    where: { slug: slugify(v.category) },
    update: {},
    create: { name: v.category, slug: slugify(v.category) },
  });

  const region = await prisma.region.upsert({
    where: { slug: slugify(v.region) },
    update: {},
    create: { name: v.region, slug: slugify(v.region), province: "Mendoza" },
  });

  const linea = await prisma.wineLine.upsert({
    where: { slug: slugify(v.line) },
    update: {},
    create: { name: v.line, slug: slugify(v.line) },
  });

  const varietales = await Promise.all(
    v.grapes.map((g) =>
      prisma.grapeVariety.upsert({
        where: { slug: slugify(g.name) },
        update: {},
        create: { name: g.name, slug: slugify(g.name) },
      }),
    ),
  );

  const maridajes = await Promise.all(
    v.pairings.map((p) =>
      prisma.pairing.upsert({
        where: { slug: slugify(p) },
        update: {},
        create: { name: p, slug: slugify(p) },
      }),
    ),
  );

  const etiquetas = await Promise.all(
    v.tags.map((t) =>
      prisma.productTag.upsert({
        where: { slug: slugify(t) },
        update: {},
        create: { name: t, slug: slugify(t) },
      }),
    ),
  );

  const producto = await prisma.product.create({
    data: {
      kind: "WINE",
      status: "ACTIVE",
      name: v.name,
      slug: v.slug,
      sku: v.sku,
      shortDescription: v.shortDescription,
      description: v.description,
      price: v.price,
      cost: v.cost,
      wineType: v.wineType,
      volumeMl: v.volumeMl,
      servingTempC: v.servingTempC,
      tastingNotes: v.tastingNotes,
      agingPotential: v.agingPotential,
      intensity: v.intensity,
      featured: v.featured ?? false,
      seoTitle: v.name,
      seoDescription: v.shortDescription,
      categoryId: categoria.id,
      wineryId: bodega.id,
      regionId: region.id,
      lineId: linea.id,
      images: {
        create: [{
          url: v.image.includes("/") ? v.image : `/media/wines/${v.image}.png`,
          alt: `Botella de ${v.name}`,
          isPrimary: true, sortOrder: 0, width: 1000, height: 1000,
        }],
      },
      grapes: {
        create: varietales.map((g, i) => ({
          grapeId: g.id, percent: v.grapes[i].percent ?? null,
        })),
      },
      pairings: { create: maridajes.map((p) => ({ pairingId: p.id })) },
      tags: { create: etiquetas.map((t) => ({ tagId: t.id })) },
      inventory: {
        create: {
          onHand: v.stock.onHand, reserved: 0,
          minStock: v.stock.minStock, location: v.stock.location,
        },
      },
    },
  });

  /*
    El stock se registra como movimiento además de quedar en el inventario: la
    regla del proyecto es que ningún número de stock cambia sin dejar rastro.
  */
  await prisma.inventoryMovement.create({
    data: {
      productId: producto.id,
      type: "ENTRADA",
      quantity: v.stock.onHand,
      onHandBefore: 0,
      onHandAfter: v.stock.onHand,
      reservedBefore: 0,
      reservedAfter: 0,
      comment: "Carga inicial del vino de ejemplo",
    },
  });

  console.log(`✓ "${bodega.name}" y "${producto.name}" cargados.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
