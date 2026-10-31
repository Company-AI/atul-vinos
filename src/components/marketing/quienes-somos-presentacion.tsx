import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/*
  La presentación de Marian y Maxi. Vive acá y no suelta en la home porque la
  usan dos páginas: la home la muestra como cierre, y /quienes-somos la abre
  con ella. El cliente pidió lo segundo —"que lo primero que figure sea
  nuestra foto y nuestra presentación"— y hasta ahora el ítem del menú llevaba
  a una página editorial donde no aparecían por ningún lado.

  Pasó de una tarjeta sobre foto a sangre a dos columnas. No es gusto: el texto
  que mandó el cliente son cuatro párrafos, y en la tarjeta anterior —560px de
  ancho montada sobre la foto— entraba uno. Con la foto al lado, el texto tiene
  su propia columna y respira.

  La foto es la que mandaron ellos, en un viñedo de Mendoza. El recorte es
  vertical y centrado: en el original las caras quedan en el medio, así que
  object-cover saca cielo arriba y pedregullo abajo sin tocarlas.
*/
export function QuienesSomosPresentacion({
  comoTitulo = false,
  conEnlace = true,
  className = "mt-20 border-t border-linen-200 bg-bone-pure",
}: {
  /** En /quienes-somos encabeza la página, así que el h2 pasa a h1. */
  comoTitulo?: boolean;
  /** El enlace a /quienes-somos sobra cuando ya estás en /quienes-somos. */
  conEnlace?: boolean;
  className?: string;
}) {
  const Titulo = comoTitulo ? "h1" : "h2";

  return (
    <section className={className}>
      <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-gutter py-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16 lg:py-24">
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-linen-100 lg:aspect-[4/4.6]">
          <Image
            src="/media/equipo/marian-y-maxi.jpg"
            alt="Marian y Maxi entre las hileras de un viñedo"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover"
            priority={comoTitulo}
          />
        </div>

        <div className="min-w-0">
          <Titulo className="font-display text-display-lg font-light text-carbon-900">
            Quiénes somos
          </Titulo>

          <div className="mt-7 space-y-5 text-[15px] leading-[1.85] text-stone-600">
            <p>
              Detrás de Atul estamos nosotros: Marian y Maxi. Ambos trabajamos en relación de
              dependencia, pero desde hace tiempo sentíamos las ganas de construir algo propio,
              un proyecto familiar que crezca con el tiempo y que de verdad nos apasionara.
            </p>
            <p>
              ¿Por qué vino? Porque fue una pasión que descubrimos juntos. Con los años, Mendoza
              se convirtió en nuestro lugar en el mundo. Viaje tras viaje, bodega tras bodega,
              nos enamoramos del ritual de buscar etiquetas nuevas, probar varietales distintos
              y aprender de cada añada.
            </p>
            <p>
              Atul nace de esas ganas de emprender juntos fuera del horario laboral, de hacer lo
              que nos motiva y de traer a Río Cuarto esa misma curiosidad por descubrir bodegas
              boutique y proyectos pequeños que no se consiguen en cualquier lado.
            </p>
          </div>

          {/*
            El cierre va aparte y con otro peso: es la firma del texto, no un
            párrafo más, y en el original del cliente también está separado.
          */}
          <p className="mt-7 font-display text-[21px] font-light leading-snug text-carbon-900">
            Somos Marian, Maxi y nuestro hijo Felipe —el responsable del nombre de este sueño—.
            <span className="accent-italic"> ¡Bienvenidos a Atul!</span>
          </p>

          {conEnlace && (
            <Link
              href="/quienes-somos"
              className="mt-8 inline-flex items-center gap-2 text-[13px] font-medium text-accent-700 transition-colors hover:text-accent-600"
            >
              Conocé cómo elegimos
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
