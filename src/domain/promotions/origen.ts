/**
 * Por dónde entró cada cliente.
 *
 * Se guarda en `User.source` al crearlo en vez de deducirse después. La
 * deducción tentadora —"si no tiene contraseña vino de la ventana"— se rompe
 * el día que esa persona termina de abrir su cuenta: pasa a tener contraseña
 * y su origen cambia solo.
 */
export const ORIGENES_DE_CLIENTE = {
  bienvenida: "Ventana de bienvenida",
  registro: "Se registró",
  admin: "Carga manual",
} as const;

export type OrigenDeCliente = keyof typeof ORIGENES_DE_CLIENTE;

/** Etiqueta para mostrar. Los clientes viejos no tienen origen: "—". */
export function etiquetaDeOrigen(source: string | null | undefined): string {
  if (!source) return "—";
  return ORIGENES_DE_CLIENTE[source as OrigenDeCliente] ?? source;
}

/** De dónde salió una suscripción al newsletter. */
export const ORIGENES_DE_SUSCRIPCION: Record<string, string> = {
  promo: "Ventana de bienvenida",
  registro: "Se registró",
  footer: "Pie del sitio",
  checkout: "Checkout",
  contacto: "Formulario de contacto",
};

export function etiquetaDeOrigenDeSuscripcion(source: string | null | undefined): string {
  if (!source) return "—";
  return ORIGENES_DE_SUSCRIPCION[source] ?? source;
}
