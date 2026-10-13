import { format, addMonths, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd/MM/yyyy", { locale: es });
}

/**
 * Para columnas `@db.Date`, que no tienen hora.
 *
 * Postgres devuelve esas fechas a medianoche UTC. `formatDate` las imprime en
 * la hora local del servidor, y en UTC-3 eso las corre un día para atrás: una
 * fecha de nacimiento del 14 se muestra como 13. Acá se leen los campos en
 * UTC, que es como se guardaron.
 */
export function formatDateOnly(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${d.getUTCFullYear()}`;
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
}

export function formatLongDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function periodLabel(month: number, year: number): string {
  return `${MONTH_NAMES_ES[month - 1]} ${year}`;
}

export function currentPeriod(now = new Date()) {
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function nextPeriod(month: number, year: number) {
  const d = addMonths(new Date(year, month - 1, 1), 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export { addMonths, startOfMonth, endOfMonth, differenceInDays };
