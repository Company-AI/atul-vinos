import { NextResponse, type NextRequest } from "next/server";

/**
 * Modo "todavía no abrimos".
 *
 * Mientras esté encendido, cualquiera que entre al sitio cae en la pantalla de
 * próxima apertura. El panel sigue entrando por su dirección, así que se puede
 * cargar el catálogo entero con la tienda cerrada al público, que es
 * exactamente lo que hay que poder hacer antes de abrir.
 *
 * Se enciende y se apaga con una variable de entorno y no con un dato en la
 * base, por dos razones: tiene que funcionar también sin base —hoy producción
 * corre así— y apagar la tienda es una decisión que no conviene que quede a un
 * clic de distancia dentro del mismo panel que usa todo el mundo.
 *
 * Queda afuera del desvío:
 *   - /admin, para poder trabajar;
 *   - /api, porque los webhooks de pagos y envíos tienen que seguir entrando
 *     aunque la vidriera esté cerrada. Un pago que llega y rebota contra un
 *     redirect es un pedido cobrado que nadie registra;
 *   - /proximamente, que es el destino;
 *   - los archivos estáticos, que los necesita esa misma pantalla.
 *
 * Y hay una llave para mirar la tienda cerrada: entrando con ?ver=LA-LLAVE se
 * guarda una cookie y esa persona pasa derecho. Sirve para revisar la home
 * terminada sin abrirle la puerta a todo el mundo, que es la alternativa:
 * apagar el modo, mirar y volver a prenderlo, con la tienda abierta en el
 * medio. No es una barrera de seguridad —del otro lado no hay nada secreto,
 * sólo una tienda a medio terminar— sino una forma de que nadie entre por
 * casualidad.
 */

const COOKIE_VER = "atul-ver";

const SIN_DESVIO = [/^\/admin(\/|$)/, /^\/api(\/|$)/, /^\/proximamente\/?$/];

export function middleware(request: NextRequest) {
  if (process.env.MODO_APERTURA !== "1") return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (SIN_DESVIO.some((patron) => patron.test(pathname))) return NextResponse.next();

  const llave = process.env.APERTURA_LLAVE?.trim();

  /*
    La llave llega una sola vez por la dirección y queda en una cookie: así no
    hay que arrastrar ?ver= en cada clic, y el parámetro no se queda pegado en
    la barra para que alguien lo copie y lo mande por ahí sin pensarlo.
  */
  if (llave && request.nextUrl.searchParams.get("ver") === llave) {
    const limpio = request.nextUrl.clone();
    limpio.searchParams.delete("ver");
    const respuesta = NextResponse.redirect(limpio, 307);
    respuesta.cookies.set(COOKIE_VER, llave, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 8, // una jornada de trabajo
    });
    return respuesta;
  }

  if (llave && request.cookies.get(COOKIE_VER)?.value === llave) {
    return NextResponse.next();
  }

  const destino = request.nextUrl.clone();
  destino.pathname = "/proximamente";
  destino.search = "";

  /*
    307 y no 301: es temporal. Un 301 se lo guarda el navegador y después, con
    la tienda ya abierta, hay gente que sigue cayendo en la pantalla de espera
    hasta que limpia su caché.
  */
  return NextResponse.redirect(destino, 307);
}

export const config = {
  matcher: [
    /*
      Todo menos lo que sirve el propio Next y las carpetas de archivos de
      /public. La pantalla de espera usa la foto del viñedo y el logo: si el
      desvío las tapara, se vería una pantalla negra.
    */
    "/((?!_next/|brand/|media/|uploads/|favicon\\.ico|icon\\.png|robots\\.txt|sitemap\\.xml|.*\\.svg).*)",
  ],
};
