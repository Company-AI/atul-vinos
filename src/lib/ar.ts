/** Provincias argentinas, para selects y validaciones. */
export const AR_PROVINCES = [
  "CABA", "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
  "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones",
  "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
  "Santiago del Estero", "Tierra del Fuego", "Tucumán",
] as const;

export type ArProvince = (typeof AR_PROVINCES)[number];

/** Normaliza un teléfono argentino a dígitos, conservando el prefijo. */
export function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

export function isValidPostalCode(value: string): boolean {
  return /^\d{4}$/.test(value.trim()) || /^[A-Za-z]\d{4}[A-Za-z]{3}$/.test(value.trim());
}

/**
 * Los cuatro dígitos de un código postal argentino.
 *
 * Conviven dos formatos: el viejo de cuatro dígitos (5800) y el CPA, que le
 * agrega una letra de provincia adelante y tres de manzana atrás (X5800ABC).
 * La gente escribe cualquiera de los dos, y para ubicar una zona alcanza con
 * el número: las letras del CPA afinan la cuadra, no la localidad.
 *
 * Devuelve null si no se puede leer un número, para no confundir "no sé" con 0.
 */
export function postalCodeNumber(value: string): number | null {
  const digits = value.trim().match(/\d{4}/);
  if (!digits) return null;
  const n = Number(digits[0]);
  return Number.isFinite(n) ? n : null;
}
