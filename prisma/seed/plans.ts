/**
 * Planes del Club.
 *
 * Viven acá y no dentro de seed.ts porque los consume también la capa demo
 * (src/infra/demo), que sirve el sitio cuando no hay base configurada. Una
 * sola fuente para los dos.
 */

export type PlanSeed = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price: number;
  bottleCount: number;
  sortOrder: number;
  shippingCost: number;
  freeShipping: boolean;
  featured?: boolean;
  firstCycleDiscountPercent?: number;
  trialDays?: number;
  perks: string[];
  benefits: string[];
  imageUrl: string;
};

export const PLANS: PlanSeed[] = [
  {
    name: "Descubrir",
    slug: "descubrir",
    tagline: "Tres botellas por mes para empezar a recorrer el país.",
    description:
      "Tres etiquetas de nuestras líneas Cotidiana y Reserva, con la ficha de por qué elegimos cada una. Ideal si estás empezando a explorar.",
    price: 42900,
    bottleCount: 3,
    sortOrder: 10,
    shippingCost: 4900,
    freeShipping: false,
    firstCycleDiscountPercent: 20,
    perks: [
      "3 botellas por mes",
      "Ficha con el porqué de cada elección",
      "10% de descuento en la tienda",
      "Cambiás o pausás cuando quieras",
    ],
    benefits: ["store_discount", "early_access"],
    imageUrl: "/media/scenes/mendoza-vineyard-house.jpg",
  },
  {
    name: "Curador",
    slug: "curador",
    tagline: "Cuatro botellas elegidas por nosotros, con envío incluido.",
    description:
      "Cuatro etiquetas de Reserva y Alta gama, con al menos una que no está en el catálogo abierto. Es el plan que elige la mayoría.",
    price: 68900,
    bottleCount: 4,
    sortOrder: 20,
    shippingCost: 0,
    freeShipping: true,
    featured: true,
    perks: [
      "4 botellas seleccionadas",
      "Envío sin cargo",
      "Una etiqueta fuera de catálogo por mes",
      "10% de descuento en la tienda",
      "Aviso anticipado de partidas chicas",
    ],
    benefits: ["store_discount", "free_shipping", "early_access", "exclusive_wines"],
    imageUrl: "/media/scenes/pouring.jpg",
  },
  {
    name: "Reserva",
    slug: "reserva",
    tagline: "Seis botellas, con foco en alta gama e ícono.",
    description:
      "Seis etiquetas con foco en Alta gama e Ícono, más una cata anual con nosotros para probar lo que está por entrar.",
    price: 139900,
    bottleCount: 6,
    sortOrder: 30,
    shippingCost: 0,
    freeShipping: true,
    trialDays: 0,
    perks: [
      "6 botellas de gama alta",
      "Envío sin cargo",
      "Acceso a partidas limitadas",
      "15% de descuento en la tienda",
      "Cata anual con el equipo de selección",
    ],
    benefits: [
      "store_discount",
      "free_shipping",
      "early_access",
      "exclusive_wines",
      "cellar_visit",
    ],
    imageUrl: "/media/scenes/mendoza-vineyard-andes.jpg",
  },
];
