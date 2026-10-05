import type { Metadata } from "next";
import Image from "next/image";
import { InstagramIcon, WhatsappIcon } from "@/components/site/social-icons";
import { getSection } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { CuentaRegresiva } from "@/components/marketing/cuenta-regresiva";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Próximamente",
  description: "Estamos por abrir.",
  // No tiene sentido posicionar una pantalla que va a durar unos días.
  robots: { index: false, follow: false },
};

/**
 * Pantalla de próxima apertura.
 *
 * Vive fuera del layout público a propósito: sin cabecera, sin menú y sin
 * footer. Si la tienda todavía no abrió, ofrecer navegación es prometer
 * páginas que no queremos que se visiten.
 *
 * Todo el texto y la fecha salen del CMS, así que la apertura se corre sin
 * tocar código —que es justo lo que suele pasar con estas pantallas—.
 *
 * Los aires están ajustados para que entre completa en una pantalla de 800px
 * de alto, que es un portátil común: medido, con la separación original la
 * página pedía 874 y había que scrollear para ver la cuenta entera.
 */
export default async function ProximamentePage() {
  const [contenido, settings] = await Promise.all([
    getSection("site.proximamente", "coming_soon"),
    getSettings(),
  ]);

  const { company } = settings;
  const foto = contenido.media.imageUrl || contenido.media.posterUrl;

  /*
    La fecha de apertura puede venir del entorno. Es para poder correrla sin
    tocar la base ni reconstruir: cuando la tienda está cerrada, mover la fecha
    es lo más probable que haya que hacer, y suele hacerse con apuro.
  */
  const apertura = process.env.APERTURA_EN?.trim() || contenido.targetAt;

  return (
    <main className="on-dark relative isolate grid min-h-dvh place-items-center overflow-hidden bg-carbon-950 px-gutter py-12">
      {foto && (
        <Image
          src={foto}
          alt=""
          fill
          priority
          sizes="100vw"
          /*
            Desenfocada a propósito. El viñedo se sigue leyendo como viñedo
            —las hileras, la luz, el verde— pero deja de competir con el texto:
            sin detalle fino, el titular y la cuenta regresiva apoyan sobre una
            superficie pareja en vez de sobre hojas y alambres.

            El scale-110 es para que el desenfoque no deje los bordes
            transparentes: al difuminar, los píxeles del borde se mezclan con
            lo que no hay y aparece una orla clara. Agrandando la foto, esa
            orla queda fuera de la pantalla.
          */
          className="-z-20 scale-110 object-cover blur-[10px]"
        />
      )}

      {/*
        Dos capas sobre la foto: una base pareja que sostiene el contraste del
        texto centrado, y un degradado desde los bordes que devuelve
        profundidad. Con una sola capa la foto queda plana y parece un color.

        La base quedó en 45%: con 58 más el degradado de bordes, el viñedo
        desaparecía igual. Hay margen de sobra —el titular es grande y crema—,
        así que conviene gastar contraste en que la foto se vea.

        La base está calibrada para que el viñedo se siga viendo. Con una sala
        de barricas —de por sí muy oscura— más un velo del 72% la pantalla
        quedaba negra y la foto no aportaba nada.

        La foto tiene que ser apaisada. Con una vertical, en una pantalla
        ancha el recorte de object-cover toma una franja del centro y cae
        sobre el cielo: se veía un degradado gris y ni rastro del viñedo.
      */}
      <span aria-hidden className="absolute inset-0 -z-10 bg-carbon-950/45" />
      <span
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgb(13 11 10 / 0) 40%, rgb(13 11 10 / 0.45) 100%)",
        }}
      />
      {/*
        Velo que sube desde abajo. La parte baja de la foto es el viñedo
        iluminado, y ahí caen el mail y la firma, que son texto chico: medido,
        quedaban en 4,05 de contraste contra un mínimo de 4,5. Oscurecer sólo
        esa franja los salva sin aplanar el resto de la foto, que es lo que
        pasaba subiendo el velo general.
      */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to top, rgb(13 11 10 / 0.62) 0%, rgb(13 11 10 / 0.25) 32%, rgb(13 11 10 / 0) 55%)",
        }}
      />

      <span aria-hidden className="grain absolute inset-0 -z-10" />

      <div className="flex w-full max-w-[720px] flex-col items-center text-center">
        {company.isologoLightUrl && (
          <Image
            src={company.isologoLightUrl}
            alt={company.name}
            width={900}
            height={900}
            priority
            className="h-20 w-auto sm:h-24"
          />
        )}

        {contenido.eyebrow && (
          <p className="eyebrow mt-8 text-bone/90">{contenido.eyebrow}</p>
        )}

        {contenido.title && (
          <h1 className="mt-5 font-display text-display-lg font-light text-bone">
            {contenido.title}
            {contenido.titleAccent && (
              <>
                <br />
                <span className="accent-italic text-linen-200">{contenido.titleAccent}</span>
              </>
            )}
          </h1>
        )}

        <div className="mt-10 w-full">
          <CuentaRegresiva targetAt={apertura} finalText={contenido.finalText} />
        </div>

        {contenido.body && (
          <p className="mt-10 max-w-[46ch] text-[15px] leading-relaxed text-linen-200/85">
            {contenido.body}
          </p>
        )}

        {/*
          Sin navegación, pero con una forma de seguir a la marca mientras no
          hay tienda. Instagram y nada más: el mail acá invitaba a escribir a
          una casilla que todavía nadie atiende, y una consulta sin respuesta
          es peor que no ofrecer el canal.
        */}
        {(company.instagram || company.whatsapp) && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-bone/15 pt-8">
            {company.instagram && (
              <a
                href={company.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[14px] text-linen-200 transition-colors hover:text-bone"
              >
                <InstagramIcon className="size-[18px]" aria-hidden />
                Seguinos en Instagram
              </a>
            )}
            {company.whatsapp && (
              <a
                href={`https://wa.me/${company.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[14px] text-linen-200 transition-colors hover:text-bone"
              >
                <WhatsappIcon className="size-[18px]" aria-hidden />
                Escribinos por WhatsApp
              </a>
            )}
          </div>
        )}

        <p className="script mt-8 text-[20px] text-linen-300/60">{company.tagline}</p>
      </div>
    </main>
  );
}
