import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Escalas tipográficas propias del design system.
 *
 * IMPORTANTE: cada token `--text-*` que se agregue en globals.css tiene que
 * listarse acá. tailwind-merge no los conoce y, si falta uno, lo clasifica
 * como color: entonces `text-display-2xl` y `text-bone` se pisan entre sí y
 * una de las dos desaparece en silencio, sin error ni aviso.
 */
const TEXT_SCALE = [
  "display-2xl",
  "display-xl",
  "display-lg",
  "display-md",
  "display-sm",
  "lead",
  "eyebrow",
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...TEXT_SCALE] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
