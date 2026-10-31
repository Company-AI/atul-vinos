/**
 * Corrige textos del CMS que quedaron desactualizados.
 *
 * Hace falta porque el contenido vive en la base, no en el código: cambiar
 * el seed arregla una instalación nueva y no toca la que está andando. Y
 * entrar a editarlo a mano en cada ambiente es la forma de que uno quede
 * distinto del otro sin que nadie se entere.
 *
 * REGLA: cada cambio sólo se aplica si el texto sigue siendo exactamente el
 * viejo. Si alguien ya lo editó desde el admin, se respeta lo que escribió.
 * Un script de mantenimiento que pisa la decisión de una persona es peor que
 * no tenerlo.
 *
 * Es idempotente: la segunda corrida no encuentra nada que cambiar.
 *
 *   npx tsx prisma/ops/textos.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Reemplazos exactos, por sección. */
const CAMBIOS: { seccion: string; de: string; a: string; porque: string }[] = [
  {
    seccion: "home.banner",
    de: "Box armados de 2, 4 y 6 botellas",
    a: "Box de 3 y de 6 vinos",
    porque: "Los box pasan a ser de 3 y de 6.",
  },
  {
    seccion: "home.banner",
    de: "Box de 3 y de 6 vinos",
    a: "Box de 6 vinos",
    porque: "Al final sale sólo el de 6.",
  },
  {
    seccion: "home.banner",
    de: "Gratis en Río Cuarto y la zona.",
    a: "Gratis en Río Cuarto.",
    porque: "No prometer la zona: un pedido chico de afuera no conviene llevarlo gratis.",
  },
  {
    seccion: "home.banner",
    de: "Y 10% off si pagás por transferencia.",
    a: "Y 20% off si pagás por transferencia.",
    porque: "El descuento configurado ya es 20%; el cartel decía 10%.",
  },
  {
    seccion: "site.beneficios",
    de: "10% off por transferencia",
    a: "20% off por transferencia",
    porque: "Lo mismo en la franja de arriba.",
  },
  {
    seccion: "home.destacados",
    de: "Entregamos en Río Cuarto, Las Higueras y Holmberg sin costo de envío.",
    a: "Entregamos en Río Cuarto sin costo de envío.",
    porque: "Mismo criterio que la franja.",
  },
  {
    seccion: "footer.main",
    de: '"href":"/historia"',
    a: '"href":"/#quienes-somos"',
    porque:
      'El pie repetía la etiqueta "Quiénes somos" apuntando a /historia, que es otra página y no los muestra a ellos. Ahora lleva a la misma sección de la home que el menú.',
  },
  {
    seccion: "home.hero",
    de: "/media/scenes/sparkling.jpg",
    a: "/media/scenes/barrels.jpg",
    porque:
      "El segundo slide eran copas de champagne sobre negro: foto de brindis de fin de año, no de bodega, y recortada al hero la mitad izquierda quedaba en negro puro. Va una pared de barricas, que tiene profundidad y aguanta el texto blanco.",
  },
  {
    seccion: "home.hero",
    de: "Dos copas de vino claro brindando",
    a: "Pared de barricas de roble apiladas en una bodega",
    porque: "El alt tiene que describir la foto nueva.",
  },
];

async function main() {
  for (const cambio of CAMBIOS) {
    const fila = await prisma.cmsSection.findUnique({ where: { key: cambio.seccion } });
    if (!fila) {
      console.log(`${cambio.seccion}: no existe, se saltea`);
      continue;
    }

    /*
      Se reemplaza sobre el JSON serializado y no campo por campo: estas
      secciones tienen formas distintas —algunas con items, otras planas— y
      buscar la clave exacta en cada una sería un `if` por tipo de sección
      que se desactualiza al primer cambio de forma.
    */
    const antes = JSON.stringify(fila.data);
    if (!antes.includes(cambio.de)) {
      console.log(`${cambio.seccion}: ya no dice "${cambio.de}" — sin tocar`);
      continue;
    }

    const despues = antes.split(cambio.de).join(cambio.a);
    await prisma.cmsSection.update({
      where: { key: cambio.seccion },
      data: { data: JSON.parse(despues), updatedBy: "ops/textos" },
    });
    console.log(`${cambio.seccion}: "${cambio.de}" → "${cambio.a}"  (${cambio.porque})`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
