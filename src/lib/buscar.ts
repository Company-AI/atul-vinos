/**
 * Búsqueda tolerante para los buscadores del panel.
 *
 * Quien carga productos escribe rápido y no pone tildes: "carmenere" tiene que
 * encontrar "Carménère". Tampoco va a respetar mayúsculas ni espacios de más.
 *
 * No se usa slugify para esto aunque también saque tildes: slugify convierte
 * los espacios en guiones y descarta todo lo que no sea letra o número, así
 * que "NOR-DOC" y "nor doc" terminarían distintos y buscar por SKU dejaría de
 * funcionar.
 */

export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** ¿Alguno de los campos contiene lo que se escribió? Consulta vacía: todo entra. */
export function coincideBusqueda(consulta: string, ...campos: string[]): boolean {
  const q = normalizarBusqueda(consulta);
  if (q === "") return true;
  return campos.some((campo) => normalizarBusqueda(campo).includes(q));
}
