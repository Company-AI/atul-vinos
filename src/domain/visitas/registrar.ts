import { createHash } from "node:crypto";
import { prisma } from "@/infra/db/prisma";

/**
 * Registra una visita, sin guardar nada que identifique a la persona.
 *
 * La clave del visitante es un hash de IP + user agent + el día + un secreto
 * del servidor. Sirve para contar personas distintas dentro de un día y deja
 * de servir al día siguiente, porque al cambiar la fecha cambia el hash. No
 * se puede ir para atrás —no se guarda la IP en ningún lado— ni seguir a la
 * misma persona entre dos días.
 *
 * Es a propósito: medir cuánta gente entra no necesita saber quién es, y así
 * el sitio sigue sin poner una sola cookie de seguimiento y sin necesitar
 * banner de consentimiento.
 */
let avisoDeSal = false;

export function claveDeVisitante(ip: string, userAgent: string, cuando = new Date()) {
  const dia = cuando.toISOString().slice(0, 10);
  /*
    Sin la sal el hash se podría rehacer probando IPs: son pocas las posibles
    y quien tenga la base podría ir para atrás. Con una sal que sólo vive en
    el servidor, no. Si falta, se avisa una vez y se sigue contando: perder la
    métrica entera por una variable sin setear sería peor.
  */
  const secreto = process.env.VISITAS_SAL;
  if (!secreto && !avisoDeSal) {
    avisoDeSal = true;
    console.warn("visitas: falta VISITAS_SAL, el hash del visitante queda sin sal");
  }
  const sal = secreto || "atul-sin-sal";
  return createHash("sha256").update(`${sal}|${dia}|${ip}|${userAgent}`).digest("hex").slice(0, 32);
}

/*
  Bots conocidos, para no contarlos como gente.

  La primera barrera no es esta lista sino que el aviso lo manda el navegador
  con JavaScript: los rastreadores que sólo bajan el HTML no llegan hasta acá.
  Esto agarra a los que sí ejecutan JavaScript y se anuncian, que son los
  buscadores grandes y los previsualizadores de WhatsApp y las redes.
*/
const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|pagespeed|monitor|uptime|curl|wget|python-requests|axios|node-fetch/i;

export function pareceBot(userAgent: string) {
  return userAgent.length === 0 || BOTS.test(userAgent);
}

/*
  Rutas que no son visitas de nadie: el panel es trabajo nuestro y las de
  servicio no las mira una persona. Contarlas infla el número justo cuando
  más se lo mira, que es el día que se carga el catálogo.
*/
const FUERA = [/^\/admin/, /^\/api/, /^\/ingresar/, /^\/_next/, /^\/proximamente/];

export function rutaQueNoSeCuenta(path: string) {
  return FUERA.some((r) => r.test(path));
}

/** Deja la ruta en algo que sirva para agrupar: sin query y sin barra final. */
export function normalizarRuta(crudo: string) {
  let path = crudo.split("?")[0].split("#")[0].trim();
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path.slice(0, 300) || "/";
}

/** El dominio propio no es "de dónde vino": es navegación interna. */
export function normalizarReferente(crudo: string | null | undefined, host: string) {
  if (!crudo) return null;
  try {
    const u = new URL(crudo);
    if (u.hostname === host || u.hostname === `www.${host}` || `www.${u.hostname}` === host) return null;
    return `${u.hostname}${u.pathname === "/" ? "" : u.pathname}`.slice(0, 200);
  } catch {
    return null;
  }
}

export async function registrarVisita(datos: {
  path: string;
  referrer: string | null;
  visitorKey: string;
  isMobile: boolean;
}) {
  await prisma.pageView.create({ data: datos });
}
