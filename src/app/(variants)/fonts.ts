import {
  Alegreya,
  Alegreya_Sans,
  Alegreya_Sans_SC,
  Archivo,
  Fraunces,
  JetBrains_Mono,
  Jost,
} from "next/font/google";

/**
 * Fuentes propias de cada variante de diseño.
 *
 * Se cargan en el layout de cada ruta y no en el layout raíz: el sitio
 * principal no debe pagar el costo de familias que no usa.
 */

/** Maison: sans geométrica y callada, al lado de la serifa de alto contraste. */
export const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

/** Arquitectura: una sola sans para todo, de tracking cerrado. */
export const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

/** Terroir: serifa suave con eje óptico. */
export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-fraunces",
  display: "swap",
});

/** Terroir: la monoespaciada lleva las anotaciones de campo. */
export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

/** Casa: superfamilia Alegreya. La serifa lleva la voz. */
export const alegreya = Alegreya({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-alegreya",
  display: "swap",
});

/** Casa: la sans de la misma familia, para el cuerpo y la interfaz. */
export const alegreyaSans = Alegreya_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-alegreya-sans",
  display: "swap",
});

/** Casa: versalitas reales para etiquetas y volantas. */
export const alegreyaSC = Alegreya_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-alegreya-sc",
  display: "swap",
});
