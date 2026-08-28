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
