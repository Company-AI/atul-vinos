/**
 * Precarga las regiones vitivinícolas de Argentina.
 *
 * Es una comodidad, no parte del seed: son datos de geografía pública, no
 * inventados, y quedan editables o borrables desde /admin/regiones.
 *
 * Idempotente: hace upsert por slug, así que no duplica las que ya existen
 * ni pisa los cambios que se les hayan hecho desde el admin —sólo completa
 * provincia y descripción si estaban vacías.
 *
 * Las descripciones son cualitativas a propósito: no afirmo altitudes
 * exactas que no puedo verificar.
 *
 *   npx tsx scripts/seed-regiones-argentina.ts
 */
import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

type Entrada = { name: string; province: string; description: string };

const REGIONES: Entrada[] = [
  // ── Noroeste: viñedos de mucha altura ──────────────────────────────────
  { name: "Quebrada de Humahuaca", province: "Jujuy",
    description: "Viñedos de altura extrema, entre los más altos del mundo. Sol intenso, amplitud térmica muy marcada y vinos de color profundo y acidez firme." },
  { name: "Valles Calchaquíes", province: "Salta",
    description: "Altura, sol y noches frías. Cuna del Torrontés argentino y de Malbec de trazo tenso y muy perfumado." },
  { name: "Cafayate", province: "Salta",
    description: "El corazón de los Valles Calchaquíes. Suelos arenosos y gran insolación: blancos aromáticos y tintos de estructura." },
  { name: "Colalao del Valle", province: "Tucumán",
    description: "Continuación tucumana de los Calchaquíes, de superficie chica y producción muy artesanal." },
  { name: "Fiambalá", province: "Catamarca",
    description: "Valle de altura al pie de la cordillera, de clima seco y días muy cálidos con noches frescas." },
  { name: "Valle de Famatina", province: "La Rioja",
    description: "Zona histórica del Torrontés riojano, entre las sierras de Famatina y Velasco." },

  // ── Cuyo ───────────────────────────────────────────────────────────────
  { name: "Valle de Tulum", province: "San Juan",
    description: "La zona más extensa de San Juan, de clima cálido y seco. Syrah y Bonarda de fruta madura." },
  { name: "Valle de Pedernal", province: "San Juan",
    description: "Valle de altura sanjuanino, con suelos calcáreos y noches frías que dan vinos más tensos que el promedio de la provincia." },
  { name: "San Rafael", province: "Mendoza",
    description: "Sur mendocino, más bajo y templado que el Valle de Uco. Tradición de Chenin y de tintos de perfil más suave." },

  // ── Centro ─────────────────────────────────────────────────────────────
  { name: "Valle de Calamuchita", province: "Córdoba",
    description: "Vitivinicultura cordobesa en recuperación, de escala chica, sobre sierras y con fuerte impronta local." },
  { name: "Traslasierra", province: "Córdoba",
    description: "Al oeste de las Sierras Grandes, de días cálidos y buena amplitud térmica." },

  // ── Patagonia: menos altura, más viento ────────────────────────────────
  { name: "25 de Mayo", province: "La Pampa",
    description: "Extremo norte de la Patagonia vitivinícola, sobre el río Colorado, de clima ventoso y fresco." },
  { name: "San Patricio del Chañar", province: "Neuquén",
    description: "Polo neuquino moderno. Viento constante, sanidad muy alta y tintos de acidez marcada." },
  { name: "Alto Valle del Río Negro", province: "Río Negro",
    description: "Viñedos viejos sobre el valle del río. Pinot Noir y Merlot de perfil fino, y Semillón de tradición local." },
  { name: "Trevelin", province: "Chubut",
    description: "De los viñedos más australes del país. Ciclo largo y frío: vinos de acidez filosa y graduación baja." },
  { name: "Sarmiento", province: "Chubut",
    description: "Zona patagónica de clima riguroso y producción muy acotada." },
];

async function main() {
  let creadas = 0;
  let completadas = 0;

  for (const entrada of REGIONES) {
    const slug = slugify(entrada.name);
    const existente = await prisma.region.findUnique({ where: { slug } });

    if (!existente) {
      await prisma.region.create({
        data: {
          name: entrada.name,
          slug,
          province: entrada.province,
          country: "Argentina",
          description: entrada.description,
          isActive: true,
        },
      });
      creadas += 1;
      continue;
    }

    // Ya existe: sólo se completa lo que falte, nunca se sobrescribe.
    const parche: { province?: string; description?: string } = {};
    if (!existente.province) parche.province = entrada.province;
    if (!existente.description) parche.description = entrada.description;

    if (Object.keys(parche).length > 0) {
      await prisma.region.update({ where: { id: existente.id }, data: parche });
      completadas += 1;
    }
  }

  const total = await prisma.region.count();
  const provincias = await prisma.region.findMany({
    distinct: ["province"],
    select: { province: true },
    where: { province: { not: null } },
  });

  console.log(`Regiones creadas:    ${creadas}`);
  console.log(`Regiones completadas: ${completadas}`);
  console.log(`Total en catálogo:    ${total} en ${provincias.length} provincias`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
