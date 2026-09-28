import type { Metadata } from "next";
import Image from "next/image";
import { Mail } from "lucide-react";
import { InstagramIcon } from "@/components/site/social-icons";
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

  return (
    <main className="on-dark relative isolate grid min-h-dvh place-items-center overflow-hidden bg-carbon-950 px-gutter py-12">
      {foto && (
        <Image
          src={foto}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
      )}

      {/*
        Dos capas sobre la foto: una base pareja que garantiza el contraste del
        texto centrado, y un degradado desde los bordes que devuelve
        profundidad. Con una sola capa la foto queda plana y parece un color.
      */}
      <span aria-hidden className="absolute inset-0 -z-10 bg-carbon-950/72" />
      <span
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgb(13 11 10 / 0) 35%, rgb(13 11 10 / 0.65) 100%)",
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
          <p className="eyebrow mt-8 text-linen-300/80">{contenido.eyebrow}</p>
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
          <CuentaRegresiva targetAt={contenido.targetAt} finalText={contenido.finalText} />
        </div>

        {contenido.body && (
          <p className="mt-10 max-w-[46ch] text-[15px] leading-relaxed text-linen-200/85">
            {contenido.body}
          </p>
        )}

        {/*
          Sin navegación, pero con una forma de llegar a una persona: quien
          entra por error o por curiosidad tiene que poder preguntar.
        */}
        <div className="mt-10 flex items-center gap-6 border-t border-bone/15 pt-8">
          {company.instagram && (
            <a
              href={company.instagram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-[13px] text-linen-300/80 transition-colors hover:text-bone"
            >
              <InstagramIcon className="size-4" aria-hidden />
              Instagram
            </a>
          )}
          {company.email && (
            <a
              href={`mailto:${company.email}`}
              className="flex items-center gap-2 text-[13px] text-linen-300/80 transition-colors hover:text-bone"
            >
              <Mail className="size-4" aria-hidden />
              {company.email}
            </a>
          )}
        </div>

        <p className="script mt-8 text-[20px] text-linen-300/60">{company.tagline}</p>
      </div>
    </main>
  );
}
