/**
 * Seed completo (spec §72): datos suficientes para operar el sistema desde el
 * primer minuto sin cargar nada a mano. Determinista: siempre produce lo mismo.
 *
 *   npm run db:seed
 */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { WINES, PACKS } from "./seed/wines";
import {
  CMS_SECTIONS, FAQS, POSTS, BANNERS, NOTIFICATION_TEMPLATES,
} from "./seed/content";

const prisma = new PrismaClient();

// PRNG determinista: mismos datos demo en cada ejecución.
let seedState = 20260828;
const rnd = () => {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
};
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const between = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const daysAgo = (n: number, hours = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hours, between(0, 59), 0, 0);
  return d;
};

const NOW = new Date();
const PERIOD = { month: NOW.getMonth() + 1, year: NOW.getFullYear() };
const NEXT_PERIOD =
  PERIOD.month === 12
    ? { month: 1, year: PERIOD.year + 1 }
    : { month: PERIOD.month + 1, year: PERIOD.year };

async function reset() {
  // Orden inverso a las dependencias.
  await prisma.$transaction([
    prisma.notificationLog.deleteMany(),
    prisma.notificationTemplate.deleteMany(),
    prisma.job.deleteMany(),
    prisma.webhookEvent.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.shippingLabel.deleteMany(),
    prisma.shipmentEvent.deleteMany(),
    prisma.shipment.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.orderEvent.deleteMany(),
    prisma.inventoryMovement.deleteMany(),
    prisma.inventoryAllocation.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.couponUsage.deleteMany(),
    prisma.order.deleteMany(),
    prisma.subscriptionEvent.deleteMany(),
    prisma.subscriptionCycle.deleteMany(),
    prisma.subscriptionBoxItem.deleteMany(),
    prisma.subscriptionBox.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.planBenefit.deleteMany(),
    prisma.clubBenefit.deleteMany(),
    prisma.subscriptionPlan.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.couponProduct.deleteMany(),
    prisma.couponCategory.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.packItem.deleteMany(),
    prisma.award.deleteMany(),
    prisma.productTagLink.deleteMany(),
    prisma.productPairing.deleteMany(),
    prisma.productGrape.deleteMany(),
    prisma.productVideo.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.inventory.deleteMany(),
    prisma.product.deleteMany(),
    prisma.productTag.deleteMany(),
    prisma.pairing.deleteMany(),
    prisma.grapeVariety.deleteMany(),
    prisma.wineLine.deleteMany(),
    prisma.region.deleteMany(),
    prisma.winery.deleteMany(),
    prisma.category.deleteMany(),
    prisma.shippingRate.deleteMany(),
    prisma.shippingZone.deleteMany(),
    prisma.carrier.deleteMany(),
    prisma.address.deleteMany(),
    prisma.rolePermission.deleteMany(),
    prisma.user.deleteMany(),
    prisma.role.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.cmsSection.deleteMany(),
    prisma.banner.deleteMany(),
    prisma.post.deleteMany(),
    prisma.postCategory.deleteMany(),
    prisma.faq.deleteMany(),
    prisma.newsletterSubscriber.deleteMany(),
    prisma.setting.deleteMany(),
  ]);
}

/** Movimiento de stock con historial. Nunca se toca un número sin registrarlo. */
async function move(
  productId: string,
  type: Prisma.InventoryMovementCreateInput["type"],
  quantity: number,
  opts: { orderId?: string; boxId?: string; userId?: string; comment?: string; at?: Date } = {},
) {
  const inv = await prisma.inventory.findUnique({ where: { productId } });
  if (!inv) return;

  let onHand = inv.onHand;
  let reserved = inv.reserved;
  switch (type) {
    case "ENTRADA":
    case "DEVOLUCION":
      onHand += quantity; break;
    case "RESERVA":
    case "SUSCRIPCION":
      reserved += quantity; break;
    case "LIBERACION":
      reserved = Math.max(0, reserved - quantity); break;
    case "VENTA":
      onHand -= quantity;
      reserved = Math.max(0, reserved - quantity);
      break;
    case "ROTURA":
    case "MERMA":
      onHand -= quantity; break;
    case "AJUSTE":
      onHand = quantity; break;
  }

  await prisma.inventory.update({ where: { productId }, data: { onHand, reserved } });
  await prisma.inventoryMovement.create({
    data: {
      productId, type, quantity,
      onHandBefore: inv.onHand, onHandAfter: onHand,
      reservedBefore: inv.reserved, reservedAfter: reserved,
      orderId: opts.orderId, subscriptionBoxId: opts.boxId,
      userId: opts.userId, comment: opts.comment,
      ...(opts.at ? { createdAt: opts.at } : {}),
    },
  });
}

async function main() {
  console.log("Limpiando base…");
  await reset();

  // ═══════════════════════ Permisos, roles y staff ═══════════════════════════
  const { PERMISSIONS, ROLE_PRESETS } = await import("../src/infra/auth/permissions");

  await prisma.permission.createMany({
    data: PERMISSIONS.map((p) => ({ code: p.code, label: p.label, group: p.group })),
  });
  const allPermissions = await prisma.permission.findMany();
  const permByCode = new Map(allPermissions.map((p) => [p.code, p.id]));

  const roles: Record<string, string> = {};
  for (const [slug, preset] of Object.entries(ROLE_PRESETS)) {
    const codes = preset.permissions === "*" ? PERMISSIONS.map((p) => p.code) : preset.permissions;
    const role = await prisma.role.create({
      data: {
        slug, name: preset.name, description: preset.description, isSystem: true,
        permissions: {
          create: codes.map((code) => ({ permissionId: permByCode.get(code)! })),
        },
      },
    });
    roles[slug] = role.id;
  }

  const staffPassword = await bcrypt.hash("Aurora2026!", 12);
  const [superAdmin] = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@bodegaaurora.test", passwordHash: staffPassword,
        firstName: "Facundo", lastName: "Administrador", isStaff: true,
        roleId: roles.super_admin, emailVerifiedAt: NOW,
      },
    }),
    prisma.user.create({
      data: {
        email: "deposito@bodegaaurora.test", passwordHash: staffPassword,
        firstName: "Marcos", lastName: "Depósito", isStaff: true,
        roleId: roles.deposito, emailVerifiedAt: NOW,
      },
    }),
    prisma.user.create({
      data: {
        email: "atencion@bodegaaurora.test", passwordHash: staffPassword,
        firstName: "Carla", lastName: "Atención", isStaff: true,
        roleId: roles.atencion_cliente, emailVerifiedAt: NOW,
      },
    }),
  ]);
  console.log(`✓ ${PERMISSIONS.length} permisos, ${Object.keys(roles).length} roles, 3 usuarios de staff`);

  // ═══════════════════════════════ Settings ══════════════════════════════════
  const { defaultSettings } = await import("../src/domain/settings/schema");
  const defaults = defaultSettings();
  await prisma.setting.createMany({
    data: Object.entries(defaults).map(([key, value]) => ({
      key, group: key, value: value as object, updatedBy: superAdmin.email,
    })),
  });
  console.log(`✓ ${Object.keys(defaults).length} grupos de configuración`);

  // ═════════════════════════════ Taxonomías ══════════════════════════════════
  const categoryNames = ["Vinos tintos", "Vinos blancos", "Rosados", "Espumantes", "Vinos naranjos", "Packs"];
  const categories = new Map<string, string>();
  for (const [i, name] of categoryNames.entries()) {
    const c = await prisma.category.create({
      data: { name, slug: slugify(name), sortOrder: (i + 1) * 10 },
    });
    categories.set(name, c.id);
  }

  const wineries = new Map<string, string>();
  for (const name of ["Bodega Aurora", "Finca Aurora Alta", "Aurora Patagonia"]) {
    const w = await prisma.winery.create({
      data: {
        name, slug: slugify(name),
        story: "Elaboración propia con uvas de viñedos de la familia.",
        imageUrl: "/media/cellar.png",
      },
    });
    wineries.set(name, w.id);
  }

  const regionData = [
    ["Valle de Uco", "Mendoza"], ["Luján de Cuyo", "Mendoza"], ["Maipú", "Mendoza"],
    ["Valle Calchaquí", "Salta"], ["Valle de Pedernal", "San Juan"], ["Patagonia", "Río Negro"],
  ];
  const regions = new Map<string, string>();
  for (const [name, province] of regionData) {
    const r = await prisma.region.create({
      data: { name, slug: slugify(name), province, imageUrl: "/media/mountains.png" },
    });
    regions.set(name, r.id);
  }

  const lineData = [
    ["Clásica", 10], ["Reserva", 20], ["Gran Reserva", 30], ["Ícono", 40], ["Experimental", 50],
  ] as const;
  const lines = new Map<string, string>();
  for (const [name, order] of lineData) {
    const l = await prisma.wineLine.create({
      data: { name, slug: slugify(name), sortOrder: order, imageUrl: "/media/story-2.png" },
    });
    lines.set(name, l.id);
  }

  const grapeNames = [
    "Malbec", "Cabernet Sauvignon", "Cabernet Franc", "Pinot Noir", "Syrah",
    "Chardonnay", "Sauvignon Blanc", "Torrontés",
  ];
  const grapes = new Map<string, string>();
  for (const name of grapeNames) {
    const g = await prisma.grapeVariety.create({ data: { name, slug: slugify(name) } });
    grapes.set(name, g.id);
  }

  const pairingNames = [
    "Carnes rojas", "Asado", "Cordero", "Caza", "Cerdo", "Aves", "Pescados", "Mariscos",
    "Pastas", "Picadas", "Quesos maduros", "Quesos suaves", "Verduras asadas", "Hongos",
    "Ensaladas", "Comida asiática", "Especias", "Aperitivo",
  ];
  const pairings = new Map<string, string>();
  for (const name of pairingNames) {
    const p = await prisma.pairing.create({ data: { name, slug: slugify(name) } });
    pairings.set(name, p.id);
  }

  const tagNames = [
    "Más vendido", "Novedad", "Guarda", "Alta gama", "Edición limitada", "Fresco",
    "Intenso", "Delicado", "Aromático", "Con barrica", "Método tradicional",
    "Para descubrir", "Para brindar", "Ideal para todos los días", "Pack", "Regalo",
  ];
  const tags = new Map<string, string>();
  for (const name of tagNames) {
    const t = await prisma.productTag.create({ data: { name, slug: slugify(name) } });
    tags.set(name, t.id);
  }
  console.log("✓ Taxonomías: categorías, bodegas, regiones, líneas, varietales, maridajes, etiquetas");

  // ══════════════════════════════ Productos ══════════════════════════════════
  const productIdBySlug = new Map<string, string>();

  for (const w of WINES) {
    const product = await prisma.product.create({
      data: {
        kind: "WINE", status: "ACTIVE",
        name: w.name, slug: w.slug, sku: w.sku,
        shortDescription: w.shortDescription, description: w.description,
        price: w.price, compareAtPrice: w.compareAtPrice ?? null, cost: w.cost,
        wineType: w.wineType, vintage: w.vintage, volumeMl: w.volumeMl,
        alcoholPercent: w.alcoholPercent, servingTempC: w.servingTempC,
        tastingNotes: w.tastingNotes, agingPotential: w.agingPotential,
        intensity: w.intensity, winemaking: w.winemaking,
        featured: w.featured ?? false, isNew: w.isNew ?? false, bestSeller: w.bestSeller ?? false,
        seoTitle: `${w.name} ${w.vintage} · Bodega Aurora`,
        seoDescription: w.shortDescription,
        categoryId: categories.get(w.category)!,
        wineryId: wineries.get(w.winery)!,
        regionId: regions.get(w.region)!,
        lineId: lines.get(w.line)!,
        images: {
          create: [{
            url: `/media/wines/${w.image}.png`,
            alt: `Botella de ${w.name} ${w.vintage} de Bodega Aurora`,
            isPrimary: true, sortOrder: 0, width: 600, height: 800,
          }],
        },
        grapes: {
          create: w.grapes.map((g) => ({ grapeId: grapes.get(g.name)!, percent: g.percent })),
        },
        pairings: { create: w.pairings.map((p) => ({ pairingId: pairings.get(p)! })) },
        tags: { create: w.tags.map((t) => ({ tagId: tags.get(t)! })) },
        awards: {
          create: (w.awards ?? []).map((a) => ({
            title: a.title, organization: a.organization, year: a.year, score: a.score,
          })),
        },
        inventory: {
          create: { onHand: 0, reserved: 0, minStock: w.stock.minStock, location: w.stock.location },
        },
      },
    });
    productIdBySlug.set(w.slug, product.id);
    await move(product.id, "ENTRADA", w.stock.onHand, {
      userId: superAdmin.id, comment: "Carga inicial de inventario", at: daysAgo(75),
    });
  }

  for (const p of PACKS) {
    const pack = await prisma.product.create({
      data: {
        kind: "PACK", status: "ACTIVE",
        name: p.name, slug: p.slug, sku: p.sku,
        shortDescription: p.shortDescription, description: p.description,
        price: p.price, compareAtPrice: p.compareAtPrice ?? null,
        featured: p.featured ?? false, bestSeller: p.bestSeller ?? false,
        seoTitle: `${p.name} · Bodega Aurora`, seoDescription: p.shortDescription,
        categoryId: categories.get(p.category)!,
        wineryId: wineries.get("Bodega Aurora")!,
        images: {
          create: [{
            url: `/media/wines/${p.image}.png`, alt: `${p.name} de Bodega Aurora`,
            isPrimary: true, sortOrder: 0, width: 600, height: 800,
          }],
        },
        tags: { create: p.tags.map((t) => ({ tagId: tags.get(t)! })) },
        packItems: {
          create: p.components.map((c) => ({
            componentId: productIdBySlug.get(c.slug)!, quantity: c.quantity,
          })),
        },
      },
    });
    productIdBySlug.set(p.slug, pack.id);
  }
  console.log(`✓ ${WINES.length} vinos y ${PACKS.length} packs con stock, imágenes y fichas`);

  // ══════════════════════ Logística: carriers y tarifas ══════════════════════
  const carrierData = [
    { code: "mock", name: "Logística Aurora (interno)", sortOrder: 10,
      trackingUrlTemplate: "/seguimiento/{tracking}" },
    { code: "andreani", name: "Andreani", sortOrder: 20,
      trackingUrlTemplate: "https://www.andreani.com/#!/informacionEnvio/{tracking}" },
    { code: "correo_argentino", name: "Correo Argentino", sortOrder: 30,
      trackingUrlTemplate: "https://www.correoargentino.com.ar/formularios/e-commerce?id={tracking}" },
    { code: "oca", name: "OCA", sortOrder: 40,
      trackingUrlTemplate: "https://www1.oca.com.ar/OEPTrackingWeb/Tracking.aspx?numero={tracking}" },
  ];
  const carriers = new Map<string, string>();
  for (const c of carrierData) {
    const carrier = await prisma.carrier.create({
      data: { ...c, isActive: c.code === "mock" },
    });
    carriers.set(c.code, carrier.id);
  }

  const zones = [
    {
      name: "Río Cuarto y alrededores", sortOrder: 10,
      provinces: ["Córdoba"], cities: ["Río Cuarto", "Las Higueras", "Holmberg"],
      rates: [
        { name: "Envío a domicilio", price: 3500, freeFrom: 60000, etaMinDays: 1, etaMaxDays: 2 },
        { name: "Retiro en bodega", price: 0, etaMinDays: 0, etaMaxDays: 1 },
      ],
    },
    {
      name: "Provincia de Córdoba", sortOrder: 20,
      provinces: ["Córdoba"], cities: [],
      rates: [{ name: "Envío estándar", price: 6900, freeFrom: 100000, etaMinDays: 2, etaMaxDays: 4 }],
    },
    {
      name: "Centro (Buenos Aires, Santa Fe, Mendoza)", sortOrder: 30,
      provinces: ["Buenos Aires", "CABA", "Santa Fe", "Mendoza", "San Luis", "Entre Ríos"], cities: [],
      rates: [
        { name: "Envío estándar", price: 8900, freeFrom: 100000, etaMinDays: 3, etaMaxDays: 5 },
        { name: "Envío express", price: 15900, etaMinDays: 1, etaMaxDays: 2 },
      ],
    },
    {
      name: "Resto del país", sortOrder: 40, provinces: [], cities: [],
      rates: [{ name: "Envío estándar", price: 12900, freeFrom: 150000, etaMinDays: 4, etaMaxDays: 8 }],
    },
  ];
  for (const z of zones) {
    await prisma.shippingZone.create({
      data: {
        name: z.name, sortOrder: z.sortOrder, provinces: z.provinces, cities: z.cities,
        rates: {
          create: z.rates.map((r, i) => ({
            name: r.name, price: r.price, freeFrom: r.freeFrom ?? null,
            etaMinDays: r.etaMinDays, etaMaxDays: r.etaMaxDays,
            sortOrder: (i + 1) * 10, carrierId: carriers.get("mock"),
          })),
        },
      },
    });
  }
  console.log("✓ 4 transportistas, 4 zonas y 6 tarifas de envío");

  // ════════════════════════ Club: beneficios y planes ════════════════════════
  const benefitData = [
    { code: "store_discount", name: "Descuento en tienda", description: "Descuento permanente sobre el catálogo.", value: 10, sortOrder: 10 },
    { code: "free_shipping", name: "Envío sin cargo", description: "Envío gratuito en la caja mensual.", sortOrder: 20 },
    { code: "early_access", name: "Acceso anticipado", description: "Compra de nuevas añadas antes del lanzamiento.", sortOrder: 30 },
    { code: "exclusive_wines", name: "Vinos exclusivos", description: "Etiquetas que solo se embotellan para el Club.", sortOrder: 40 },
    { code: "cellar_visit", name: "Visita a la bodega", description: "Una cata de barricas por año sin cargo.", sortOrder: 50 },
  ];
  const benefits = new Map<string, string>();
  for (const b of benefitData) {
    const benefit = await prisma.clubBenefit.create({ data: b });
    benefits.set(b.code, benefit.id);
  }

  const planData = [
    {
      name: "Club Descubrir", slug: "club-descubrir",
      tagline: "Tres vinos por mes para empezar a recorrer la bodega.",
      description: "Tres botellas de nuestras líneas Clásica y Reserva, con ficha de cata de cada vino. Ideal si estás empezando a explorar.",
      price: 39900, bottleCount: 3, sortOrder: 10, shippingCost: 4900, freeShipping: false,
      firstCycleDiscountPercent: 20,
      perks: ["3 botellas por mes", "Fichas de cata", "10% de descuento en la tienda", "Cambiás o pausás cuando quieras"],
      benefits: ["store_discount", "early_access"],
      imageUrl: "/media/story-1.png",
    },
    {
      name: "Club Reserva", slug: "club-reserva",
      tagline: "Cuatro vinos seleccionados, con envío incluido.",
      description: "Cuatro botellas de las líneas Reserva y Gran Reserva, con al menos una etiqueta que no está en la tienda. El plan que elige la mayoría.",
      price: 62900, bottleCount: 4, sortOrder: 20, shippingCost: 0, freeShipping: true,
      featured: true,
      perks: ["4 botellas seleccionadas", "Envío sin cargo", "Un vino exclusivo por mes", "10% de descuento en la tienda", "Acceso anticipado a nuevas añadas"],
      benefits: ["store_discount", "free_shipping", "early_access", "exclusive_wines"],
      imageUrl: "/media/club-box.png",
    },
    {
      name: "Club Ícono", slug: "club-icono",
      tagline: "Seis vinos premium, incluyendo alta gama.",
      description: "Seis botellas con foco en Gran Reserva e Ícono, más la invitación anual a la cata de barricas en la bodega.",
      price: 128900, bottleCount: 6, sortOrder: 30, shippingCost: 0, freeShipping: true,
      trialDays: 0,
      perks: ["6 botellas premium", "Envío sin cargo", "Vinos de alta gama y ediciones limitadas", "15% de descuento en la tienda", "Cata de barricas anual en la bodega"],
      benefits: ["store_discount", "free_shipping", "early_access", "exclusive_wines", "cellar_visit"],
      imageUrl: "/media/story-3.png",
    },
  ];
  const plans = new Map<string, { id: string; price: number; name: string; bottleCount: number }>();
  for (const p of planData) {
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: p.name, slug: p.slug, tagline: p.tagline, description: p.description,
        price: p.price, frequency: "MONTHLY", bottleCount: p.bottleCount,
        imageUrl: p.imageUrl, perks: p.perks,
        shippingCost: p.shippingCost, freeShipping: p.freeShipping,
        trialDays: p.trialDays ?? null,
        firstCycleDiscountPercent: p.firstCycleDiscountPercent ?? null,
        featured: p.featured ?? false, sortOrder: p.sortOrder, isActive: true,
        benefits: {
          create: p.benefits.map((code) => ({
            benefitId: benefits.get(code)!,
            overrideValue: code === "store_discount" && p.slug === "club-icono" ? 15 : null,
          })),
        },
      },
    });
    plans.set(p.slug, { id: plan.id, price: p.price, name: p.name, bottleCount: p.bottleCount });
  }
  console.log(`✓ ${planData.length} planes del Club con ${benefitData.length} beneficios`);

  // ═════════════════════════ Box del mes (actual y próximo) ══════════════════
  const boxComposition: Record<string, string[][]> = {
    "club-descubrir": [
      ["malbec-clasico-2023", "cabernet-sauvignon-reserva-2020", "chardonnay-reserva-2023"],
      ["malbec-clasico-2023", "syrah-2021", "sauvignon-blanc-2024"],
    ],
    "club-reserva": [
      ["malbec-reserva-2021", "cabernet-franc-reserva-2021", "pinot-noir-2022", "chardonnay-reserva-2023"],
      ["malbec-reserva-2021", "cabernet-sauvignon-reserva-2020", "torrontes-2024", "espumante-extra-brut"],
    ],
    "club-icono": [
      ["malbec-gran-reserva-2019", "aurora-icono-2018", "cabernet-franc-reserva-2021",
        "pinot-noir-2022", "espumante-brut-nature", "naranjo-experimental-2023"],
      ["malbec-gran-reserva-2019", "malbec-reserva-2021", "syrah-2021",
        "chardonnay-reserva-2023", "espumante-brut-nature", "naranjo-experimental-2023"],
    ],
  };

  const boxes = new Map<string, string>(); // `${planSlug}:${year}-${month}`
  for (const [planSlug, months] of Object.entries(boxComposition)) {
    for (const [idx, slugs] of months.entries()) {
      const period = idx === 0 ? PERIOD : NEXT_PERIOD;
      const plan = plans.get(planSlug)!;
      const products = slugs.map((s) => productIdBySlug.get(s)!);
      const estimatedCost = slugs.reduce(
        (acc, s) => acc + (WINES.find((w) => w.slug === s)?.cost ?? 0), 0,
      );
      const commercialValue = slugs.reduce(
        (acc, s) => acc + (WINES.find((w) => w.slug === s)?.price ?? 0), 0,
      );
      const box = await prisma.subscriptionBox.create({
        data: {
          planId: plan.id, periodMonth: period.month, periodYear: period.year,
          name: `${plan.name} · ${period.month}/${period.year}`,
          curatorNote: idx === 0
            ? "Selección enfocada en la frescura de las añadas jóvenes."
            : "Selección de guarda: vinos para abrir en un par de años.",
          isPublished: idx === 0,
          estimatedCost, commercialValue,
          items: { create: products.map((productId) => ({ productId, quantity: 1 })) },
        },
      });
      boxes.set(`${planSlug}:${period.year}-${period.month}`, box.id);
    }
  }
  console.log(`✓ ${boxes.size} boxes del mes (actual y próximo) con costo y valor comercial`);

  // ══════════════════════════════ Clientes ═══════════════════════════════════
  const customerData = [
    ["Juan", "Pérez", "juan.perez@example.com", "Córdoba", "Río Cuarto", "5800", "Av. España", "1240"],
    ["María", "Gómez", "maria.gomez@example.com", "CABA", "Palermo", "1425", "Gorriti", "4820"],
    ["Sofía", "Ledesma", "sofia.ledesma@example.com", "Buenos Aires", "La Plata", "1900", "Calle 47", "1180"],
    ["Martín", "Álvarez", "martin.alvarez@example.com", "Mendoza", "Chacras de Coria", "5505", "Viamonte", "560"],
    ["Lucía", "Ferreyra", "lucia.ferreyra@example.com", "Santa Fe", "Rosario", "2000", "Bv. Oroño", "1145"],
    ["Diego", "Sosa", "diego.sosa@example.com", "Córdoba", "Villa Carlos Paz", "5152", "Av. San Martín", "890"],
    ["Valentina", "Ríos", "valentina.rios@example.com", "Neuquén", "Neuquén", "8300", "Roca", "320"],
    ["Ignacio", "Bustos", "ignacio.bustos@example.com", "Córdoba", "Río Cuarto", "5800", "Belgrano", "455"],
    ["Camila", "Ortiz", "camila.ortiz@example.com", "Salta", "Salta", "4400", "Balcarce", "780"],
    ["Federico", "Navarro", "federico.navarro@example.com", "CABA", "Belgrano", "1428", "Cabildo", "2210"],
  ];
  const customerPassword = await bcrypt.hash("Cliente2026!", 12);
  const customers: { id: string; email: string; firstName: string; lastName: string; addressId: string; address: Record<string, string> }[] = [];

  for (const [i, c] of customerData.entries()) {
    const [firstName, lastName, email, province, city, postalCode, street, number] = c;
    const user = await prisma.user.create({
      data: {
        email, passwordHash: customerPassword, firstName, lastName,
        phone: `+54 9 ${between(220, 388)} ${between(400, 599)}-${between(1000, 9999)}`,
        documentId: `${between(20, 42)}${between(100000, 999999)}${between(0, 9)}`,
        acceptsMarketing: i % 3 !== 0, emailVerifiedAt: daysAgo(90 - i * 5),
        createdAt: daysAgo(90 - i * 5),
        internalNotes: i === 0 ? "Cliente frecuente. Prefiere entregas por la mañana." : null,
      },
    });
    const address = await prisma.address.create({
      data: {
        userId: user.id, label: "Casa", firstName, lastName,
        phone: user.phone, documentId: user.documentId,
        street, number, city, province, postalCode,
        reference: i % 4 === 0 ? "Portón negro, timbre 2" : null,
        isDefaultShipping: true, isDefaultBilling: true,
      },
    });
    customers.push({
      id: user.id, email, firstName, lastName, addressId: address.id,
      address: { firstName, lastName, phone: user.phone!, documentId: user.documentId!, street, number, city, province, postalCode, apartment: "", reference: address.reference ?? "" },
    });
  }
  console.log(`✓ ${customers.length} clientes con dirección`);

  // ═══════════════════════════════ Cupones ═══════════════════════════════════
  await prisma.coupon.createMany({
    data: [
      { code: "BIENVENIDO10", type: "PERCENT", value: 10, description: "10% en la primera compra", firstPurchaseOnly: true, maxUsesPerUser: 1, minPurchase: 20000, isActive: true },
      { code: "ENVIOGRATIS", type: "FREE_SHIPPING", value: 0, description: "Envío sin cargo sin mínimo", maxUses: 200, maxUsesPerUser: 2, isActive: true },
      { code: "CLUB15", type: "PERCENT", value: 15, description: "15% exclusivo para socios del Club", clubMembersOnly: true, maxUsesPerUser: 3, isActive: true },
      { code: "COSECHA2026", type: "FIXED", value: 8000, description: "$8.000 en compras desde $80.000", minPurchase: 80000, maxUses: 500, endsAt: new Date(PERIOD.year, PERIOD.month + 1, 30), isActive: true },
      { code: "VERANO24", type: "PERCENT", value: 12, description: "Promoción de verano (vencida)", endsAt: daysAgo(120), isActive: false },
    ],
  });
  console.log("✓ 5 cupones");

  // ═══════════════════════ Contenido, FAQ, blog, banners ═════════════════════
  for (const s of CMS_SECTIONS) {
    await prisma.cmsSection.create({
      data: {
        key: s.key, page: s.page, type: s.type, title: s.title,
        sortOrder: s.sortOrder, data: s.data as object, updatedBy: superAdmin.email,
      },
    });
  }
  await prisma.faq.createMany({ data: FAQS });
  await prisma.banner.createMany({ data: BANNERS });
  await prisma.notificationTemplate.createMany({
    data: NOTIFICATION_TEMPLATES.map((t) => ({ ...t, channel: "EMAIL" as const })),
  });

  const postCategories = new Map<string, string>();
  for (const name of ["Vinos", "Maridajes", "Cosechas", "Bodega"]) {
    const c = await prisma.postCategory.create({ data: { name, slug: slugify(name) } });
    postCategories.set(name, c.id);
  }
  for (const p of POSTS) {
    await prisma.post.create({
      data: {
        title: p.title, slug: p.slug, excerpt: p.excerpt, coverUrl: p.coverUrl,
        content: p.content, author: p.author, categoryId: postCategories.get(p.category)!,
        seoTitle: `${p.title} · Bodega Aurora`, seoDescription: p.excerpt,
        isPublished: true, publishedAt: p.publishedAt, createdAt: p.publishedAt,
      },
    });
  }
  await prisma.newsletterSubscriber.createMany({
    data: customers.slice(0, 6).map((c, i) => ({
      email: c.email, name: `${c.firstName} ${c.lastName}`,
      source: i % 2 === 0 ? "footer" : "checkout", consentAt: daysAgo(60 - i * 4),
    })),
  });
  console.log(`✓ ${CMS_SECTIONS.length} secciones de contenido, ${FAQS.length} FAQ, ${POSTS.length} artículos, ${BANNERS.length} banners`);

  // ══════════════════════════════ Favoritos ══════════════════════════════════
  const wineIds = WINES.map((w) => productIdBySlug.get(w.slug)!);
  for (const c of customers.slice(0, 7)) {
    const favs = new Set<string>();
    for (let i = 0; i < between(1, 4); i++) favs.add(pick(wineIds));
    for (const productId of favs) {
      await prisma.favorite.create({ data: { userId: c.id, productId } });
    }
  }

  // ═══════════════════════════ Pedidos de tienda ═════════════════════════════
  type OrderPlan = { status: Prisma.OrderCreateInput["status"]; day: number };
  const orderPlans: OrderPlan[] = [
    { status: "DELIVERED", day: 52 }, { status: "DELIVERED", day: 47 },
    { status: "DELIVERED", day: 41 }, { status: "DELIVERED", day: 35 },
    { status: "DELIVERED", day: 28 }, { status: "SHIPPED", day: 12 },
    { status: "SHIPPED", day: 9 }, { status: "READY", day: 6 },
    { status: "PREPARING", day: 4 }, { status: "PREPARING", day: 3 },
    { status: "STOCK_RESERVED", day: 2 }, { status: "STOCK_RESERVED", day: 2 },
    { status: "PAID", day: 1 }, { status: "PAID", day: 1 },
    { status: "PAYMENT_PENDING", day: 0 }, { status: "CANCELLED", day: 22 },
    { status: "REFUNDED", day: 31 }, { status: "DELIVERED", day: 19 },
    { status: "DELIVERED", day: 15 }, { status: "SHIPPED", day: 7 },
  ];

  const sellableSlugs = [...WINES.map((w) => w.slug), ...PACKS.map((p) => p.slug)];
  const priceBySlug = new Map<string, number>([
    ...WINES.map((w) => [w.slug, w.price] as [string, number]),
    ...PACKS.map((p) => [p.slug, p.price] as [string, number]),
  ]);
  const nameBySlug = new Map<string, string>([
    ...WINES.map((w) => [w.slug, `${w.name} ${w.vintage}`] as [string, string]),
    ...PACKS.map((p) => [p.slug, p.name] as [string, string]),
  ]);
  const skuBySlug = new Map<string, string>([
    ...WINES.map((w) => [w.slug, w.sku] as [string, string]),
    ...PACKS.map((p) => [p.slug, p.sku] as [string, string]),
  ]);
  const imageBySlug = new Map<string, string>([
    ...WINES.map((w) => [w.slug, `/media/wines/${w.image}.png`] as [string, string]),
    ...PACKS.map((p) => [p.slug, `/media/wines/${p.image}.png`] as [string, string]),
  ]);

  let storeOrders = 0;
  for (const plan of orderPlans) {
    const customer = pick(customers);
    const itemCount = between(1, 3);
    const chosen = new Set<string>();
    while (chosen.size < itemCount) chosen.add(pick(sellableSlugs));

    const items = [...chosen].map((slug) => {
      const quantity = between(1, 3);
      const unitPrice = priceBySlug.get(slug)!;
      return { slug, quantity, unitPrice, lineTotal: unitPrice * quantity };
    });

    const subtotal = items.reduce((a, i) => a + i.lineTotal, 0);
    const shippingTotal = subtotal >= 100000 ? 0 : pick([3500, 6900, 8900]);
    const useCoupon = rnd() < 0.25;
    const discountTotal = useCoupon ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal - discountTotal + shippingTotal;
    const createdAt = daysAgo(plan.day);

    const paid = !["PAYMENT_PENDING", "CANCELLED"].includes(plan.status as string);
    const order = await prisma.order.create({
      data: {
        type: "STORE", status: plan.status,
        userId: customer.id, customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email, customerPhone: customer.address.phone,
        customerDocument: customer.address.documentId,
        addressId: customer.addressId, shippingSnapshot: customer.address,
        subtotal, discountTotal, shippingTotal, total,
        couponCode: useCoupon ? "BIENVENIDO10" : null,
        shippingMethod: shippingTotal === 0 ? "Envío estándar (sin cargo)" : "Envío estándar",
        carrierCode: "mock",
        createdAt,
        paidAt: paid ? createdAt : null,
        preparedAt: ["READY", "SHIPPED", "DELIVERED"].includes(plan.status as string) ? daysAgo(plan.day - 1 > 0 ? plan.day - 1 : 0) : null,
        shippedAt: ["SHIPPED", "DELIVERED"].includes(plan.status as string) ? daysAgo(Math.max(plan.day - 2, 0)) : null,
        deliveredAt: plan.status === "DELIVERED" ? daysAgo(Math.max(plan.day - 5, 0)) : null,
        cancelledAt: ["CANCELLED", "REFUNDED"].includes(plan.status as string) ? daysAgo(Math.max(plan.day - 1, 0)) : null,
        items: {
          create: items.map((i) => ({
            productId: productIdBySlug.get(i.slug)!,
            name: nameBySlug.get(i.slug)!, sku: skuBySlug.get(i.slug)!,
            kind: PACKS.some((p) => p.slug === i.slug) ? "PACK" : "WINE",
            imageUrl: imageBySlug.get(i.slug)!,
            unitPrice: i.unitPrice, quantity: i.quantity, lineTotal: i.lineTotal,
            packSnapshot: PACKS.some((p) => p.slug === i.slug)
              ? PACKS.find((p) => p.slug === i.slug)!.components.map((c) => ({
                  slug: c.slug, name: nameBySlug.get(c.slug), quantity: c.quantity,
                }))
              : undefined,
          })),
        },
        events: {
          create: [
            { type: "status_change", toStatus: "PAYMENT_PENDING", message: "Pedido creado", createdAt },
            ...(paid ? [{ type: "payment", toStatus: "PAID" as const, message: "Pago aprobado por Mercado Pago", createdAt }] : []),
          ],
        },
      },
    });

    // Pago
    if (plan.status !== "PAYMENT_PENDING") {
      const rejected = plan.status === "CANCELLED";
      await prisma.payment.create({
        data: {
          provider: "mercadopago", purpose: "ORDER",
          status: plan.status === "REFUNDED" ? "REFUNDED" : rejected ? "REJECTED" : "APPROVED",
          amount: total, orderId: order.id,
          externalId: `mp-${order.number}-${between(100000, 999999)}`,
          externalStatus: rejected ? "rejected" : "approved",
          externalReference: `order-${order.number}`,
          idempotencyKey: `seed-order-${order.number}`,
          paymentMethod: pick(["visa", "master", "account_money", "amex"]),
          installments: pick([1, 1, 3, 6]),
          failureReason: rejected ? "cc_rejected_insufficient_amount" : null,
          approvedAt: rejected ? null : createdAt, createdAt,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          provider: "mercadopago", purpose: "ORDER", status: "PENDING",
          amount: total, orderId: order.id,
          idempotencyKey: `seed-order-${order.number}`, createdAt,
        },
      });
    }

    // Envío y etiqueta
    if (["READY", "SHIPPED", "DELIVERED"].includes(plan.status as string)) {
      const tracking = `AUR${String(order.number).padStart(6, "0")}`;
      const shipment = await prisma.shipment.create({
        data: {
          orderId: order.id, carrierId: carriers.get("mock")!,
          status: plan.status === "DELIVERED" ? "DELIVERED" : plan.status === "SHIPPED" ? "IN_TRANSIT" : "LABEL_CREATED",
          trackingNumber: tracking, trackingUrl: `/seguimiento/${tracking}`,
          cost: shippingTotal, weightGrams: items.reduce((a, i) => a + i.quantity * 1700, 400),
          dispatchedAt: ["SHIPPED", "DELIVERED"].includes(plan.status as string) ? daysAgo(Math.max(plan.day - 2, 0)) : null,
          deliveredAt: plan.status === "DELIVERED" ? daysAgo(Math.max(plan.day - 5, 0)) : null,
          createdAt,
        },
      });
      await prisma.shippingLabel.create({
        data: {
          shipmentId: shipment.id, format: "THERMAL_100X150",
          payload: {
            orderNumber: order.number, tracking,
            customer: `${customer.firstName} ${customer.lastName}`,
            address: `${customer.address.street} ${customer.address.number}`,
            city: customer.address.city, province: customer.address.province,
            postalCode: customer.address.postalCode, phone: customer.address.phone,
          },
          printCount: 1, lastPrintedAt: createdAt,
        },
      });
    }

    // Movimientos de stock según el estado real del pedido
    const orderItems = await prisma.orderItem.findMany({ where: { orderId: order.id } });
    for (const item of orderItems) {
      const components = item.kind === "PACK"
        ? PACKS.find((p) => p.sku === item.sku)!.components.map((c) => ({
            productId: productIdBySlug.get(c.slug)!, quantity: c.quantity * item.quantity,
          }))
        : [{ productId: item.productId!, quantity: item.quantity }];

      for (const comp of components) {
        if (["PAID", "STOCK_RESERVED", "PREPARING", "READY"].includes(plan.status as string)) {
          await move(comp.productId, "RESERVA", comp.quantity, {
            orderId: order.id, comment: `Reserva por pedido #${order.number}`, at: createdAt,
          });
        } else if (["SHIPPED", "DELIVERED"].includes(plan.status as string)) {
          await move(comp.productId, "RESERVA", comp.quantity, {
            orderId: order.id, comment: `Reserva por pedido #${order.number}`, at: createdAt,
          });
          await move(comp.productId, "VENTA", comp.quantity, {
            orderId: order.id, userId: superAdmin.id,
            comment: `Despacho del pedido #${order.number}`, at: daysAgo(Math.max(plan.day - 2, 0)),
          });
        }
      }
    }
    storeOrders++;
  }
  console.log(`✓ ${storeOrders} pedidos de tienda con pagos, envíos, etiquetas y movimientos de stock`);

  // ═══════════════════════════ Suscripciones ═════════════════════════════════
  // Cada suscripción = 1 contrato. Cada mes cobrado = 1 ciclo + 1 pedido.
  const subPlans: { customer: number; plan: string; status: Prisma.SubscriptionCreateInput["status"]; cycles: number }[] = [
    { customer: 0, plan: "club-reserva", status: "ACTIVE", cycles: 3 },
    { customer: 1, plan: "club-descubrir", status: "ACTIVE", cycles: 3 },
    { customer: 3, plan: "club-icono", status: "ACTIVE", cycles: 2 },
    { customer: 4, plan: "club-reserva", status: "PAYMENT_FAILED", cycles: 2 },
    { customer: 6, plan: "club-descubrir", status: "CANCELLED", cycles: 2 },
  ];

  let cycleCount = 0;
  let subscriptionOrders = 0;

  for (const sp of subPlans) {
    const customer = customers[sp.customer];
    const plan = plans.get(sp.plan)!;
    const startMonthsAgo = sp.cycles - 1;
    const startedAt = new Date(NOW.getFullYear(), NOW.getMonth() - startMonthsAgo, 12, 9, 0, 0);

    const subscription = await prisma.subscription.create({
      data: {
        userId: customer.id, planId: plan.id, status: sp.status,
        amount: plan.price, frequency: "MONTHLY",
        addressId: customer.addressId, shippingSnapshot: customer.address,
        provider: "mercadopago",
        externalId: `preapproval-${sp.plan}-${sp.customer}`,
        externalStatus: sp.status === "ACTIVE" ? "authorized" : sp.status === "CANCELLED" ? "cancelled" : "paused",
        startedAt, createdAt: startedAt,
        lastChargeAt: new Date(NOW.getFullYear(), NOW.getMonth() - (sp.status === "CANCELLED" ? 1 : 0), 12),
        nextChargeAt: sp.status === "ACTIVE" || sp.status === "PAYMENT_FAILED"
          ? new Date(NOW.getFullYear(), NOW.getMonth() + 1, 12)
          : null,
        cancelledAt: sp.status === "CANCELLED" ? daysAgo(18) : null,
        cancelReason: sp.status === "CANCELLED" ? "Se muda al exterior" : null,
        cyclesCount: sp.cycles,
        events: {
          create: [{
            type: "created", message: `Alta en ${plan.name}`,
            createdAt: startedAt,
          }],
        },
      },
    });

    for (let c = 0; c < sp.cycles; c++) {
      const monthOffset = -(sp.cycles - 1 - c);
      const cycleDate = new Date(NOW.getFullYear(), NOW.getMonth() + monthOffset, 12, 9, 0, 0);
      const period = { month: cycleDate.getMonth() + 1, year: cycleDate.getFullYear() };
      const isLast = c === sp.cycles - 1;
      const failed = sp.status === "PAYMENT_FAILED" && isLast;

      const boxId = boxes.get(`${sp.plan}:${period.year}-${period.month}`) ?? null;

      const cycle = await prisma.subscriptionCycle.create({
        data: {
          subscriptionId: subscription.id,
          periodMonth: period.month, periodYear: period.year,
          status: failed ? "PAYMENT_FAILED" : "PAID",
          amount: plan.price,
          chargeAttempts: failed ? 2 : 1,
          chargedAt: failed ? null : cycleDate,
          failedAt: failed ? cycleDate : null,
          failureReason: failed ? "cc_rejected_insufficient_amount" : null,
          boxId, createdAt: cycleDate,
        },
      });
      cycleCount++;

      await prisma.payment.create({
        data: {
          provider: "mercadopago",
          purpose: c === 0 ? "SUBSCRIPTION_SIGNUP" : "SUBSCRIPTION_CYCLE",
          status: failed ? "REJECTED" : "APPROVED",
          amount: plan.price,
          subscriptionId: subscription.id, cycleId: cycle.id,
          externalId: `mp-sub-${subscription.number}-${period.year}${period.month}`,
          externalStatus: failed ? "rejected" : "approved",
          idempotencyKey: `seed-sub-${subscription.number}-${period.year}-${period.month}`,
          paymentMethod: "visa",
          failureReason: failed ? "cc_rejected_insufficient_amount" : null,
          approvedAt: failed ? null : cycleDate, createdAt: cycleDate,
        },
      });

      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id,
          type: failed ? "payment_failed" : "payment_approved",
          message: failed
            ? `Pago rechazado del ciclo ${period.month}/${period.year}`
            : `Pago aprobado del ciclo ${period.month}/${period.year}`,
          createdAt: cycleDate,
        },
      });

      // REGLA FUNDAMENTAL: pago aprobado ⇒ se genera el pedido. Rechazado ⇒ no.
      if (failed) continue;

      const boxItems = boxId
        ? await prisma.subscriptionBoxItem.findMany({ where: { boxId }, include: { product: true } })
        : [];
      const fallbackSlugs = boxComposition[sp.plan][0];
      const resolvedItems = boxItems.length
        ? boxItems.map((bi) => ({ productId: bi.productId, name: bi.product.name, sku: bi.product.sku, quantity: bi.quantity, price: Number(bi.product.price) }))
        : fallbackSlugs.map((s) => {
            const wine = WINES.find((w) => w.slug === s)!;
            return { productId: productIdBySlug.get(s)!, name: wine.name, sku: wine.sku, quantity: 1, price: wine.price };
          });

      const shippingCost = planData.find((p) => p.slug === sp.plan)!.freeShipping ? 0 : 4900;
      const orderStatus: Prisma.OrderCreateInput["status"] = isLast
        ? "PREPARING"
        : c === sp.cycles - 2 ? "SHIPPED" : "DELIVERED";

      const order = await prisma.order.create({
        data: {
          type: "SUBSCRIPTION", status: orderStatus,
          userId: customer.id, customerName: `${customer.firstName} ${customer.lastName}`,
          customerEmail: customer.email, customerPhone: customer.address.phone,
          addressId: customer.addressId, shippingSnapshot: customer.address,
          subtotal: plan.price, shippingTotal: shippingCost, total: plan.price,
          subscriptionId: subscription.id, cycleId: cycle.id,
          // Snapshot inmutable: si el plan o el box cambian, este pedido no cambia
          subscriptionSnapshot: {
            planId: plan.id, planName: plan.name, planPrice: plan.price,
            bottleCount: plan.bottleCount, period: `${period.month}/${period.year}`,
            boxId, freeShipping: shippingCost === 0,
            benefits: planData.find((p) => p.slug === sp.plan)!.benefits,
            items: resolvedItems.map((i) => ({ sku: i.sku, name: i.name, quantity: i.quantity, price: i.price })),
          },
          shippingMethod: shippingCost === 0 ? "Envío del Club (sin cargo)" : "Envío del Club",
          carrierCode: "mock",
          createdAt: cycleDate, paidAt: cycleDate,
          preparedAt: orderStatus !== "PREPARING" ? new Date(cycleDate.getTime() + 864e5) : null,
          shippedAt: ["SHIPPED", "DELIVERED"].includes(orderStatus as string) ? new Date(cycleDate.getTime() + 2 * 864e5) : null,
          deliveredAt: orderStatus === "DELIVERED" ? new Date(cycleDate.getTime() + 5 * 864e5) : null,
          items: {
            create: resolvedItems.map((i) => ({
              productId: i.productId, name: i.name, sku: i.sku, kind: "WINE",
              imageUrl: imageBySlug.get(WINES.find((w) => w.sku === i.sku)?.slug ?? "") ?? null,
              unitPrice: i.price, quantity: i.quantity, lineTotal: i.price * i.quantity,
            })),
          },
          events: {
            create: [
              { type: "payment", toStatus: "PAID", message: `Cobro del Club ${period.month}/${period.year} aprobado`, createdAt: cycleDate },
              { type: "status_change", toStatus: "PREPARING", message: "Pedido generado automáticamente desde la suscripción", createdAt: cycleDate },
            ],
          },
        },
      });
      subscriptionOrders++;

      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id, type: "order_created",
          message: `Pedido #${order.number} generado para ${period.month}/${period.year}`,
          metadata: { orderId: order.id, orderNumber: order.number },
          createdAt: cycleDate,
        },
      });

      if (["SHIPPED", "DELIVERED"].includes(orderStatus as string)) {
        const tracking = `AUR${String(order.number).padStart(6, "0")}`;
        await prisma.shipment.create({
          data: {
            orderId: order.id, carrierId: carriers.get("mock")!,
            status: orderStatus === "DELIVERED" ? "DELIVERED" : "IN_TRANSIT",
            trackingNumber: tracking, trackingUrl: `/seguimiento/${tracking}`,
            cost: shippingCost, dispatchedAt: new Date(cycleDate.getTime() + 2 * 864e5),
            deliveredAt: orderStatus === "DELIVERED" ? new Date(cycleDate.getTime() + 5 * 864e5) : null,
            createdAt: cycleDate,
          },
        });
      }

      for (const item of resolvedItems) {
        await move(item.productId, "SUSCRIPCION", item.quantity, {
          orderId: order.id, boxId: boxId ?? undefined,
          comment: `Box del Club ${period.month}/${period.year} — pedido #${order.number}`,
          at: cycleDate,
        });
        if (["SHIPPED", "DELIVERED"].includes(orderStatus as string)) {
          await move(item.productId, "VENTA", item.quantity, {
            orderId: order.id, userId: superAdmin.id,
            comment: `Despacho del box #${order.number}`,
            at: new Date(cycleDate.getTime() + 2 * 864e5),
          });
        }
      }
    }

    if (sp.status === "CANCELLED") {
      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id, type: "cancelled",
          message: "Suscripción cancelada por el cliente", createdAt: daysAgo(18),
        },
      });
    }
    if (sp.status === "PAYMENT_FAILED") {
      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id, type: "payment_failed",
          message: "Reintento automático programado", createdAt: daysAgo(3),
        },
      });
    }
  }
  console.log(`✓ ${subPlans.length} suscripciones, ${cycleCount} ciclos, ${subscriptionOrders} pedidos del Club`);

  // ══════════════ Movimientos extra: ajustes, roturas, devoluciones ══════════
  await move(productIdBySlug.get("malbec-reserva-2021")!, "ROTURA", 2, {
    userId: superAdmin.id, comment: "Dos botellas rotas en depósito", at: daysAgo(14),
  });
  await move(productIdBySlug.get("chardonnay-reserva-2023")!, "AJUSTE", 118, {
    userId: superAdmin.id, comment: "Ajuste por conteo físico de inventario", at: daysAgo(10),
  });
  await move(productIdBySlug.get("syrah-2021")!, "DEVOLUCION", 1, {
    userId: superAdmin.id, comment: "Devolución por cambio de producto", at: daysAgo(6),
  });
  await move(productIdBySlug.get("torrontes-2024")!, "ENTRADA", 48, {
    userId: superAdmin.id, comment: "Ingreso de nueva partida", at: daysAgo(4),
  });

  // Stock bajo deliberado para probar alertas
  await move(productIdBySlug.get("aurora-icono-2018")!, "AJUSTE", 16, {
    userId: superAdmin.id, comment: "Ajuste: quedan pocas botellas de la añada", at: daysAgo(2),
  });

  // ══════════════════════════════ Auditoría ══════════════════════════════════
  await prisma.auditLog.createMany({
    data: [
      { userId: superAdmin.id, actorEmail: superAdmin.email, action: "product.price.update", entityType: "Product", entityId: productIdBySlug.get("malbec-reserva-2021")!, before: { price: 28900 }, after: { price: 24500 }, ip: "190.51.10.4", createdAt: daysAgo(20) },
      { userId: superAdmin.id, actorEmail: superAdmin.email, action: "stock.adjust", entityType: "Inventory", entityId: productIdBySlug.get("chardonnay-reserva-2023")!, before: { onHand: 132 }, after: { onHand: 118 }, ip: "190.51.10.4", createdAt: daysAgo(10) },
      { userId: superAdmin.id, actorEmail: superAdmin.email, action: "subscription_box.update", entityType: "SubscriptionBox", entityId: [...boxes.values()][1], before: {}, after: { note: "Se cambió el Pinot Noir por Torrontés" }, createdAt: daysAgo(5) },
      { userId: superAdmin.id, actorEmail: superAdmin.email, action: "settings.update", entityType: "Setting", entityId: "shipping", before: { freeShippingFrom: 80000 }, after: { freeShippingFrom: 100000 }, createdAt: daysAgo(2) },
    ],
  });

  // ═════════════════════════ Webhooks de ejemplo ═════════════════════════════
  await prisma.webhookEvent.createMany({
    data: [
      { provider: "mercadopago", eventId: "wh-demo-1001", eventType: "payment", status: "PROCESSED", payload: { action: "payment.updated", data: { id: "1001" } }, processedAt: daysAgo(1), receivedAt: daysAgo(1) },
      { provider: "mercadopago", eventId: "wh-demo-1002", eventType: "preapproval", status: "PROCESSED", payload: { action: "preapproval.updated", data: { id: "2002" } }, processedAt: daysAgo(1), receivedAt: daysAgo(1) },
      { provider: "mercadopago", eventId: "wh-demo-1003", eventType: "payment", status: "FAILED", payload: { action: "payment.updated", data: { id: "1003" } }, attempts: 3, error: "Pago sin external_reference asociado", receivedAt: daysAgo(3) },
    ],
  });

  // ════════════════════════════════ Resumen ══════════════════════════════════
  const [productCount, orderCount, invAlerts] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM "Inventory"
      WHERE ("onHand" - "reserved") <= "minStock"`,
  ]);

  console.log("\n─────────────────────────────────────────────");
  console.log(`Productos: ${productCount}   Pedidos: ${orderCount}   Alertas de stock: ${invAlerts[0].count}`);
  console.log("\nAcceso admin:    admin@bodegaaurora.test / Aurora2026!");
  console.log("Acceso depósito: deposito@bodegaaurora.test / Aurora2026!");
  console.log("Acceso cliente:  juan.perez@example.com / Cliente2026!");
  console.log("─────────────────────────────────────────────\n");
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
