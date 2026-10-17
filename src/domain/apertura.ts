/**
 * Si la tienda está cerrada al público en este momento.
 *
 * Vive aparte del middleware para poder probarla: el middleware necesita un
 * NextRequest y el entorno real, y la decisión de abrir o no la tienda es
 * demasiado consecuente para verificarla sólo a ojo.
 *
 * MODO_APERTURA tiene tres estados:
 *
 *   "1"     cerrada, y se abre a mano. Hay que cambiar la variable y volver
 *           a desplegar. Es lo más seguro: nada la abre sin que una persona
 *           lo decida.
 *
 *   "auto"  cerrada hasta que pase APERTURA_EN, y a partir de ahí abierta
 *           sola. La misma fecha que muestra la cuenta regresiva es la que
 *           abre la puerta, así que no hay dos fechas que mantener en
 *           sincronía ni un reloj aparte que pueda fallar.
 *
 *   resto   abierta. Es lo que vale en desarrollo, donde la variable no está.
 *
 * Con "auto" no hace falta ninguna tarea programada: cada visita compara la
 * hora contra la fecha. La tienda abre en el instante exacto aunque nadie
 * esté mirando, y si hay que frenarla alcanza con correr la fecha.
 */
export type ModoDeApertura = string | undefined;

export function tiendaCerrada(
  modo: ModoDeApertura,
  aperturaEn: string | undefined,
  ahora = new Date(),
): boolean {
  if (modo === "1") return true;
  if (modo !== "auto") return false;

  const fecha = parsearApertura(aperturaEn);

  /*
    Sin fecha válida, "auto" se comporta como cerrada. Es la decisión
    prudente: una variable mal escrita no tiene que abrir la tienda sola.
  */
  if (!fecha) return true;

  return ahora < fecha;
}

/** Fecha de apertura, o null si no se puede interpretar. */
export function parsearApertura(valor: string | undefined): Date | null {
  const texto = valor?.trim();
  if (!texto) return null;
  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}
