/**
 * Dinero en ARS. Regla del proyecto: toda aritmética se hace en centavos enteros
 * para evitar errores de punto flotante; la conversión a Decimal ocurre solo en el
 * borde con la base de datos.
 */

export type MoneyInput = number | string | { toString(): string };

export function toNumber(value: MoneyInput | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

export function toCents(value: MoneyInput | null | undefined): number {
  return Math.round(toNumber(value) * 100);
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

/** Suma segura en centavos. */
export function sumCents(...values: number[]): number {
  return values.reduce((acc, v) => acc + Math.round(v), 0);
}

/** Aplica un porcentaje (0-100) sobre un monto en centavos, redondeando al centavo. */
export function percentOfCents(cents: number, percent: number): number {
  return Math.round((cents * percent) / 100);
}

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const arsFormatterDecimals = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** $ 24.500 — muestra decimales solo si existen. */
export function formatARS(value: MoneyInput | null | undefined): string {
  const n = toNumber(value);
  const hasDecimals = Math.abs(n * 100) % 100 !== 0;
  return (hasDecimals ? arsFormatterDecimals : arsFormatter).format(n);
}

/** Porcentaje de descuento entre precio anterior y precio actual. */
export function discountPercent(
  price: MoneyInput,
  compareAtPrice: MoneyInput | null | undefined,
): number | null {
  const current = toCents(price);
  const previous = toCents(compareAtPrice);
  if (!previous || previous <= current) return null;
  return Math.round(((previous - current) / previous) * 100);
}
