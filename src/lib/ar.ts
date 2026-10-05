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

/**
 * Código ISO 3166-2 de cada provincia: la letra, sin el "AR-" adelante.
 *
 * Es el formato que piden las APIs de logística para identificar la provincia,
 * y es también la primera letra del CPA: X5800ABC es Córdoba. Por eso, cuando
 * alguien escribe el código postal completo, la provincia ya viene adentro.
 */
export const AR_PROVINCE_CODES: Record<ArProvince, string> = {
  "Buenos Aires": "B",
  Catamarca: "K",
  Chaco: "H",
  Chubut: "U",
  CABA: "C",
  Córdoba: "X",
  Corrientes: "W",
  "Entre Ríos": "E",
  Formosa: "P",
  Jujuy: "Y",
  "La Pampa": "L",
  "La Rioja": "F",
  Mendoza: "M",
  Misiones: "N",
  Neuquén: "Q",
  "Río Negro": "R",
  Salta: "A",
  "San Juan": "J",
  "San Luis": "D",
  "Santa Cruz": "Z",
  "Santa Fe": "S",
  "Santiago del Estero": "G",
  "Tierra del Fuego": "V",
  Tucumán: "T",
};

/**
 * La letra de provincia, de donde se pueda sacar.
 *
 * Primero del nombre, que es lo que elige la persona en el formulario. Si no
 * coincide, del CPA: quien escribe "X5800ABC" ya dijo Córdoba aunque no haya
 * tocado el desplegable.
 */
export function provinceCode(province: string, postalCode?: string): string | null {
  const porNombre = AR_PROVINCE_CODES[province.trim() as ArProvince];
  if (porNombre) return porNombre;

  const cpa = postalCode?.trim().match(/^([A-Za-z])\d{4}[A-Za-z]{3}$/);
  if (cpa) {
    const letra = cpa[1].toUpperCase();
    if (Object.values(AR_PROVINCE_CODES).includes(letra)) return letra;
  }
  return null;
}
