/*
  `server-only` existe para que el bundler falle si un módulo de servidor entra
  al bundle del cliente. Fuera de Next no resuelve, así que los tests que tocan
  server actions no arrancaban. Acá no hay bundle que proteger: queda vacío.
*/
export {};
