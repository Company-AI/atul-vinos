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
