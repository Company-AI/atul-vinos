/**
 * Dos cambios que el reemplazo de textos no puede hacer solo:
 *
 *   1. Cambia el slide del Día de la Madre por el del descuento por cantidad,
 *      y acelera el carrusel. Es un objeto entero, no una cadena suelta.
 *   2. Deja activo sólo el box de seis.
 *
 * Es idempotente y no pisa nada que ya esté como tiene que estar.
 *
 *   npx tsx prisma/ops/hero-y-box.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Segundos por slide. Estaba en 7 y el cliente lo vio "estancado". */
const SEGUNDOS = Number(process.env.HERO_SEGUNDOS ?? 4);

async function main() {
  await ajustarHero();
  await dejarSoloBoxDeSeis();
}

async function ajustarHero() {
  const fila = await prisma.cmsSection.findUnique({ where: { key: "home.hero" } });
  if (!fila) {
    console.log("home.hero: no existe, se saltea");
    return;
  }

  const data = structuredClone(fila.data) as Record<string, unknown>;
  const slides = (data.slides ?? []) as Record<string, unknown>[];
  const cambios: string[] = [];

  if (data.autoplaySeconds !== SEGUNDOS) {
    cambios.push(`velocidad ${data.autoplaySeconds}s → ${SEGUNDOS}s`);
    data.autoplaySeconds = SEGUNDOS;
  }

  /*
    Se busca el slide por su volanta y no por su posición: si alguien agrega
    otro slide antes, cambiar "el segundo" pisaría el equivocado.
  */
  const i = slides.findIndex((s) => String(s.eyebrow ?? "").toLowerCase().includes("madre"));
  if (i >= 0) {
    slides[i] = {
      ...slides[i],
      eyebrow: "Armá tu caja",
      title: "10% extra desde 6 botellas.",
      titleAccent: "Armá la tuya como quieras.",
      subtitle:
        "Elegí las etiquetas que quieras: al llegar a seis, se descuenta un 10% más sobre los precios que ya ves.",
      ctaPrimary: { href: "/vinos", label: "Ver los vinos" },
    };
    cambios.push("slide del Día de la Madre → descuento por cantidad");
  }

  if (cambios.length === 0) {
    console.log("home.hero: sin cambios");
    return;
  }

  await prisma.cmsSection.update({
    where: { key: "home.hero" },
    data: { data: { ...data, slides } as object, updatedBy: "ops/hero-y-box" },
  });
  console.log(`home.hero: ${cambios.join(" · ")}`);
}

async function dejarSoloBoxDeSeis() {
  const boxes = await prisma.product.findMany({
    where: { kind: "PACK" },
    select: { id: true, name: true, status: true, packItems: { select: { quantity: true } } },
  });

  for (const box of boxes) {
    const botellas = box.packItems.reduce((acc, i) => acc + i.quantity, 0);
    const corresponde = botellas === 6;

    // ARCHIVED y no borrado: si mañana vuelven los de cuatro, están enteros.
    const nuevo = corresponde ? "ACTIVE" : "ARCHIVED";
    if (box.status === nuevo) {
      console.log(`  ${box.name} (${botellas} botellas): ya está ${nuevo}`);
      continue;
    }
    await prisma.product.update({ where: { id: box.id }, data: { status: nuevo } });
    console.log(`  ${box.name} (${botellas} botellas): ${box.status} → ${nuevo}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
