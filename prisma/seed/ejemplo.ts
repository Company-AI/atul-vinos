import type { WineSeed } from "./wines";

/**
 * Catálogo mínimo para arrancar un sitio real.
 *
 * Una bodega y un vino, pensados para abrirlos en el panel, mirar cómo está
 * armada una ficha completa y duplicarla con los datos de verdad. No son una
 * bodega ni un vino que exista: ponerle acá una marca real daría a entender
 * que ya la vendemos.
 *
 * Las listas de clasificación —varietales, maridajes, regiones, categorías—
 * sí se cargan completas, porque son conocimiento general y ahorran tipear
 * "Malbec" y "Carnes rojas" cuarenta veces.
 */

export const BODEGA_EJEMPLO = {
  name: "Bodega de ejemplo",
  story:
    "Esta bodega es un ejemplo para que veas cómo se completa la ficha. " +
    "Editala con los datos de una bodega real o borrala cuando cargues las tuyas.",
  imageUrl: "/media/scenes/mendoza-vineyard-andes.jpg",
};

export const VINO_EJEMPLO: WineSeed = {
  name: "Vino de ejemplo",
  slug: "vino-de-ejemplo",
  sku: "EJEMPLO-001",
  wineType: "TINTO",
  price: 25000,
  cost: 15000,
  volumeMl: 750,
  intensity: "MEDIO",
  servingTempC: "16–18 °C",
  agingPotential: "Se puede guardar entre 3 y 5 años",
  line: "Reserva",
  winery: BODEGA_EJEMPLO.name,
  region: "Valle de Uco",
  category: "Vinos tintos",
  grapes: [{ name: "Malbec", percent: 100 }],
  pairings: ["Carnes rojas", "Quesos maduros"],
  tags: ["Con barrica"],
  shortDescription: "Ejemplo para ver cómo queda una ficha completa.",
  description:
    "Este producto existe para mostrarte cómo se ve un vino cargado con todos " +
    "sus datos: precio, ficha enológica, varietal, maridajes, foto y stock. " +
    "Abrilo en el panel, fijate qué campo llena cada parte de la página y usalo " +
    "de molde para cargar los tuyos. Cuando no te sirva más, archivalo.",
  tastingNotes:
    "Acá va la nota de cata: color, aromas y cómo se siente en boca. Es el texto " +
    "que aparece en la ficha del vino, debajo de la foto.",
  /* Foto genérica, sin etiqueta: no hay marca de nadie en esta botella. */
  image: "/media/wines/tinto.jpg",
  stock: { onHand: 12, minStock: 3, location: "A-01-01" },
  featured: true,
};
