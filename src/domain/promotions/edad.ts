/**
 * Edad a partir de una fecha de nacimiento.
 *
 * Vive en el dominio y no en el formulario porque lo tienen que usar los dos
 * lados: el navegador para avisar antes de enviar, y el servidor para decidir.
 * Si sólo validara el formulario, bastaría con mandar el pedido a mano para
 * saltearlo, y lo que está en juego es vender alcohol a un menor.
 */

/** Años cumplidos al día de hoy. Negativo si la fecha es futura. */
export function edadEnAnios(nacimiento: Date, hoy = new Date()): number {
  let anios = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
  const mes = hoy.getUTCMonth() - nacimiento.getUTCMonth();
  // Todavía no cumplió este año.
  if (mes < 0 || (mes === 0 && hoy.getUTCDate() < nacimiento.getUTCDate())) anios -= 1;
  return anios;
}

/**
 * Convierte el "AAAA-MM-DD" del formulario a fecha, o null si no sirve.
 *
 * Se arma en UTC a propósito: `new Date("1990-05-01")` ya es UTC, pero
 * `new Date(1990, 4, 1)` es hora local, y mezclarlos corre la fecha un día
 * para cualquiera al oeste de Greenwich —o sea, para todo el país—.
 */
export function fechaDeNacimiento(valor: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());
  if (!m) return null;

  const [, a, mes, d] = m;
  const fecha = new Date(Date.UTC(Number(a), Number(mes) - 1, Number(d)));

  // Rechaza el 31 de febrero y cualquier otra fecha que el Date "arregle" solo.
  if (
    fecha.getUTCFullYear() !== Number(a) ||
    fecha.getUTCMonth() !== Number(mes) - 1 ||
    fecha.getUTCDate() !== Number(d)
  ) {
    return null;
  }

  const anios = edadEnAnios(fecha);
  // Ni el futuro ni 1902: los dos son errores de tipeo, no personas.
  if (anios < 0 || anios > 120) return null;

  return fecha;
}
