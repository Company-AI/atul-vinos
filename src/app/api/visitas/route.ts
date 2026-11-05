import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/infra/security/rate-limit";
import {
  claveDeVisitante,
  normalizarReferente,
  normalizarRuta,
  pareceBot,
  registrarVisita,
  rutaQueNoSeCuenta,
} from "@/domain/visitas/registrar";

/*
  El aviso lo manda el navegador y no el servidor, por una razón concreta: las
  páginas públicas están cacheadas cinco minutos (`revalidate = 300`), así que
  contar en el render contaría renders, no visitas. Dos personas que entran en
  el mismo minuto son un solo render.

  De paso filtra solo a casi todos los rastreadores, que bajan el HTML y no
  ejecutan JavaScript, y así el número se parece a "cuánta gente entró" en vez
  de a "cuántas peticiones hubo".
*/
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lo que manda el navegador. Nada de esto se usa sin revisar. */
type Aviso = { path?: unknown; referrer?: unknown; isMobile?: unknown };

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const userAgent = request.headers.get("user-agent") ?? "";

  /*
    Un tope por IP: sin esto, cualquiera con un bucle infla el contador del
    panel. 120 por minuto deja pasar a una persona navegando rápido —y a una
    familia entera detrás del mismo router— y corta un script.
  */
  const limite = rateLimit(`visitas:${ip}`, { limit: 120, windowSeconds: 60 });
  if (!limite.allowed) {
    return new NextResponse(null, { status: 429 });
  }

  if (pareceBot(userAgent)) {
    // 204 y no 403: no hay por qué decirle a nadie que lo filtramos.
    return new NextResponse(null, { status: 204 });
  }

  let cuerpo: Aviso;
  try {
    cuerpo = (await request.json()) as Aviso;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (typeof cuerpo.path !== "string" || cuerpo.path.length > 500) {
    return new NextResponse(null, { status: 400 });
  }

  const path = normalizarRuta(cuerpo.path);
  if (rutaQueNoSeCuenta(path)) {
    return new NextResponse(null, { status: 204 });
  }

  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const referrer = normalizarReferente(
    typeof cuerpo.referrer === "string" ? cuerpo.referrer : null,
    host,
  );

  try {
    await registrarVisita({
      path,
      referrer,
      visitorKey: claveDeVisitante(ip, userAgent),
      isMobile: cuerpo.isMobile === true,
    });
  } catch (error) {
    /*
      Que falle el contador no puede romperle la navegación a nadie: se anota
      en el log del servidor y la persona ni se entera.
    */
    console.error("visitas: no se pudo registrar", error);
  }

  return new NextResponse(null, { status: 204 });
}
