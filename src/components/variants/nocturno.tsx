import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/domain/catalog/types";
import { BackgroundMedia, type BackgroundMediaData } from "@/components/marketing/background-media";
import { Reveal, stagger } from "@/ui/reveal";
import { VContainer, VLabel, VLink, VTitle, formatPrice } from "./shared";

/**
 * Nocturno — oscura y cinematográfica.
 *
 * Reglas de la variante:
 *  - Es la única de fondo oscuro: el negro cálido es la identidad, no un
 *    bloque suelto dentro de una página clara.
 *  - Una idea por pantalla. Las secciones ocupan el alto completo y llevan
 *    poco texto: lo que sobra es aire, no contenido.
 *  - La selección se recorre en horizontal con snap. Cambia la mecánica de
 *    lectura, que es lo que de verdad la diferencia de las otras cuatro.
 */

export function NocturnoHero({
  eyebrow,
  title,
  accent,
  subtitle,
  media,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
  media: BackgroundMediaData;
}) {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden py-32 text-center">
      <BackgroundMedia media={media} priority />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, rgb(10 9 8 / 0.52) 0%, rgb(10 9 8 / 0.88) 100%)",
        }}
      />

      <VContainer size="narrow">
        <Reveal>
          <VLabel className="justify-center" style={{ color: "var(--v-accent)" }}>
            {eyebrow}
          </VLabel>
        </Reveal>

        <Reveal delay={0.16} variant="line">
          <VTitle level={1} hero className="mt-10">
            {title}
            {accent && (
              <>
                <br />
                <em className="font-normal italic" style={{ color: "var(--v-accent)" }}>
                  {accent}
                </em>
              </>
            )}
          </VTitle>
        </Reveal>

        <Reveal delay={0.34}>
          <p
            className="mx-auto mt-10 text-[15px] leading-[1.9]"
            style={{ color: "var(--v-muted)", maxWidth: "46ch" }}
          >
            {subtitle}
          </p>
        </Reveal>

        <Reveal delay={0.5}>
          <div className="mt-14 flex justify-center">
            <VLink href="/vinos" variant="outline">
              Ver la selección
            </VLink>
          </div>
        </Reveal>
      </VContainer>

      <div
        aria-hidden
        className="absolute bottom-10 left-1/2 h-14 w-px -translate-x-1/2"
        style={{ background: "linear-gradient(to bottom, transparent, var(--v-accent))" }}
      />
    </section>
  );
}

/** Una frase sola, a pantalla completa. El silencio alrededor es el efecto. */
export function NocturnoStatement({
  text,
  accent,
  attribution,
}: {
  text: string;
  accent: string;
  attribution: string;
}) {
  return (
    <section className="flex min-h-[86svh] items-center py-32 text-center">
      <VContainer size="narrow">
        <Reveal variant="line">
          <p className="v-hero-type" style={{ fontSize: "calc(var(--v-hero) * 0.58)" }}>
            {text}{" "}
            <em className="font-normal italic" style={{ color: "var(--v-accent)" }}>
              {accent}
            </em>
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <VLabel className="mt-14 justify-center">{attribution}</VLabel>
        </Reveal>
      </VContainer>
    </section>
  );
}

/**
 * Selección en riel horizontal con snap.
 *
 * Es la diferencia de mecánica: en vez de una grilla que se abarca de un
 * vistazo, las botellas se recorren de a una. Obliga a detenerse en cada
 * etiqueta, que es exactamente lo que hace una vitrina cara.
 */
export function NocturnoRail({
  products,
  label,
  title,
}: {
  products: ProductCard[];
  label: string;
  title: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="py-32">
      <VContainer size="wide">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <VLabel style={{ color: "var(--v-accent)" }}>{label}</VLabel>
            <VTitle className="mt-5">{title}</VTitle>
          </div>
          <VLink href="/vinos" variant="underline">
            Ver todo
          </VLink>
        </Reveal>
      </VContainer>

      {/* El riel sangra hacia la derecha: se ve que hay más y se puede arrastrar. */}
      <div className="rail-snap mt-16 gap-6 px-6 pb-4 sm:gap-10 sm:px-10">
        {products.map((product, i) => (
          <article
            key={product.id}
            data-reveal
            style={stagger(i, 0.09)}
            className="w-[74vw] max-w-[340px] sm:w-[38vw] lg:w-[26vw]"
          >
            <Link href={`/vinos/${product.slug}`} className="group block">
              <div
                className="relative aspect-[3/4] w-full overflow-hidden"
                style={{ backgroundColor: "var(--v-surface)" }}
              >
                {product.imageUrl && (
                  <Image
                    src={product.imageUrl}
                    alt={product.imageAlt ?? product.name}
                    fill
                    sizes="(max-width: 640px) 74vw, (max-width: 1024px) 38vw, 26vw"
                    className="object-contain p-9 transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.06]"
                  />
                )}
              </div>

              <VLabel className="mt-8">{product.wineryName}</VLabel>
              <h3 className="v-title-type mt-3" style={{ fontSize: "calc(var(--v-title) * 0.44)" }}>
                {product.name}
              </h3>
              <p
                className="mt-5 border-t pt-4 text-[15px] tabular"
                style={{ borderColor: "var(--v-rule)", color: "var(--v-accent)" }}
              >
                {formatPrice(product.price)}
              </p>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

/** El lugar: video a pantalla completa con el texto flotando sobre el negro. */
export function NocturnoPlace({
  label,
  title,
  body,
  media,
}: {
  label: string;
  title: string;
  body: string;
  media: BackgroundMediaData;
}) {
  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden py-32">
      <BackgroundMedia media={media} />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to top, rgb(10 9 8 / 0.94) 0%, rgb(10 9 8 / 0.62) 48%, rgb(10 9 8 / 0.42) 100%)",
        }}
      />

      <VContainer size="narrow" className="text-center">
        <Reveal>
          <VLabel className="justify-center" style={{ color: "var(--v-accent)" }}>
            {label}
          </VLabel>
        </Reveal>
        <Reveal delay={0.14} variant="line">
          <VTitle className="mt-8">{title}</VTitle>
        </Reveal>
        <Reveal delay={0.28}>
          <div
            className="mx-auto mt-9 text-[15px] leading-[1.9] [&_p+p]:mt-5"
            style={{ color: "var(--v-muted)", maxWidth: "46ch" }}
          >
            {body.split("\n\n").map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </Reveal>
      </VContainer>
    </section>
  );
}

/** Mosaico también en riel: la página entera se lee de a un plano por vez. */
export function NocturnoGallery({
  label,
  title,
  items,
}: {
  label: string;
  title: string;
  items: { imageUrl: string; imageAlt: string; caption: string }[];
}) {
  const photos = items.filter((i) => i.imageUrl);
  if (photos.length === 0) return null;

  return (
    <section className="py-32">
      <VContainer size="wide">
        <Reveal>
          <VLabel style={{ color: "var(--v-accent)" }}>{label}</VLabel>
          <VTitle className="mt-5 max-w-[18ch]">{title}</VTitle>
        </Reveal>
      </VContainer>

      <div className="rail-snap mt-16 gap-4 px-6 pb-4 sm:gap-6 sm:px-10">
        {photos.map((photo, i) => (
          <figure
            key={photo.imageUrl}
            data-reveal="mask"
            style={stagger(i, 0.07)}
            className="relative aspect-[3/4] w-[76vw] max-w-[440px] overflow-hidden sm:w-[42vw] lg:w-[30vw]"
          >
            <Image
              src={photo.imageUrl}
              alt={photo.imageAlt}
              fill
              sizes="(max-width: 640px) 76vw, (max-width: 1024px) 42vw, 30vw"
              className="object-cover"
            />
            {photo.caption && (
              <figcaption
                className="v-label absolute inset-x-0 bottom-0 p-5"
                style={{
                  color: "var(--v-ink)",
                  background: "linear-gradient(to top, rgb(10 9 8 / 0.92), transparent)",
                }}
              >
                {photo.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

/** El Club a pantalla completa, con el video detrás y el precio en oro. */
export function NocturnoClub({
  title,
  body,
  bullets,
  media,
  planName,
  planPrice,
}: {
  title: string;
  body: string;
  bullets: string[];
  media: BackgroundMediaData;
  planName: string;
  planPrice: number;
}) {
  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden py-32">
      <BackgroundMedia media={media} />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to right, rgb(10 9 8 / 0.95) 0%, rgb(10 9 8 / 0.82) 46%, rgb(10 9 8 / 0.5) 100%)",
        }}
      />

      <VContainer size="wide">
        <div className="max-w-xl">
          <Reveal>
            <VLabel style={{ color: "var(--v-accent)" }}>El Club</VLabel>
          </Reveal>
          <Reveal delay={0.14} variant="line">
            <VTitle className="mt-7">{title}</VTitle>
          </Reveal>
          <Reveal delay={0.26}>
            <p className="mt-8 text-[15px] leading-[1.9]" style={{ color: "var(--v-muted)", maxWidth: "46ch" }}>
              {body}
            </p>
          </Reveal>

          <Reveal delay={0.36}>
            <ul className="mt-10 space-y-4">
              {bullets.slice(0, 3).map((bullet) => (
                <li key={bullet} className="flex gap-4 text-[14px]">
                  <span aria-hidden style={{ color: "var(--v-accent)" }}>
                    —
                  </span>
                  <span style={{ color: "var(--v-ink)" }}>{bullet}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.46}>
            <p className="mt-12 text-[14px]" style={{ color: "var(--v-muted)" }}>
              Desde{" "}
              <span className="tabular" style={{ color: "var(--v-accent)" }}>
                {formatPrice(planPrice)}
              </span>{" "}
              por mes · plan {planName}
            </p>
            <div className="mt-8">
              <VLink href="/club" variant="solid">
                Conocer el Club
              </VLink>
            </div>
          </Reveal>
        </div>
      </VContainer>
    </section>
  );
}
