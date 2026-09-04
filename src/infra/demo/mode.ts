/**
 * Modo demo: el sitio se sirve sin base de datos.
 *
 * Existe para poder publicar el diseño en Netlify sin configurar nada. Si no
 * hay DATABASE_URL, los servicios de lectura devuelven el contenido de
 * prisma/seed en lugar de consultar Postgres.
 *
 * Es de sólo lectura. Todo lo que escribe —carrito, checkout, login, admin—
 * queda deshabilitado, y las pantallas lo dicen en lugar de fallar.
 */
export const IS_DEMO = !process.env.DATABASE_URL;

/** Marca de agua para las pantallas que no funcionan sin base. */
export const DEMO_NOTICE =
  "Esta es una vista de diseño: no hay base de datos conectada, así que las " +
  "acciones que guardan información están deshabilitadas.";
