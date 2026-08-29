import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/domain/catalog/types";
import { cn } from "@/lib/cn";
import { BackgroundMedia, type BackgroundMediaData } from "@/components/marketing/background-media";
import { Reveal, stagger } from "@/ui/reveal";
import { VContainer, VLabel, VLink, VSection, formatPrice } from "./shared";

/**
 * Arquitectura — la bodega como edificio.
 *
 * La regla de la variante: todo se apoya en una grilla visible. Nada flota
 * centrado, los bordes son duros y las reglas finas se ven. Una sola familia
 * tipográfica para todo, con las etiquetas en mayúscula haciendo de cota.
 */

export function ArqHero({
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
    <section className="relative min-h-[94svh] pt-32">
      <VContainer size="wide" className="grid h-full gap-px lg:grid-cols-12">
        {/* Bloque de texto: ocupa siete columnas y arranca abajo, como un basamento. */}
        <div className="flex flex-col justify-end pb-16 lg:col-span-7 lg:pb-24 lg:pr-16">
          <Reveal>
            <VLabel>{eyebrow}</VLabel>
          </Reveal>

          <Reveal delay={0.12} variant="line">
            <h1 className="v-hero-type mt-10 uppercase">
              {title}
              {accent && (
                <>
                  <br />
                  <span style={{ color: "var(--v-accent)" }}>{accent}</span>
                </>
              )}
            </h1>
          </Reveal>

          <Reveal delay={0.28}>
            <div className="mt-10 grid gap-8 border-t pt-8 sm:grid-cols-2" style={{ borderColor: "var(--v-rule)" }}>
              <p className="text-[15px] leading-[1.7]" style={{ color: "var(--v-muted)" }}>
                {subtitle}
              </p>
              <div className="flex items-start sm:justify-end">
                <VLink href="/vinos" variant="solid">
                  Ver la selección
                </VLink>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Bloque de video: sin bordes redondeados, a sangre por la derecha. */}
        <Reveal variant="mask" className="relative isolate min-h-[46svh] overflow-hidden lg:col-span-5 lg:min-h-full">
          <BackgroundMedia media={media} priority sizes="(max-width: 1024px) 100vw, 42vw" />
        </Reveal>
      </VContainer>
    </section>
  );
}

/** Manifiesto en bloques numerados. La grilla se ve: las reglas no se esconden. */
export function ArqManifesto({
  label,
  title,
  entries,
}: {
  label: string;
  title: string;
  entries: { title: string; body: string }[];
}) {
  if (entries.length === 0) return null;

  return (
    <VSection>
      <VContainer size="wide">
        <Reveal className="max-w-3xl">
          <VLabel>{label}</VLabel>
          <h2 className="v-title-type mt-6 uppercase">{title}</h2>
        </Reveal>

        <div className="mt-20 grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ backgroundColor: "var(--v-rule)" }}>
          {entries.map((entry, i) => (
            <div
              key={entry.title}
              data-reveal
              style={{ ...stagger(i, 0.08), backgroundColor: "var(--v-bg)" }}
              className="p-8 lg:p-10"
            >
              <p className="v-label tabular" style={{ color: "var(--v-accent)" }}>
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-8 text-[17px] font-semibold uppercase tracking-tight">{entry.title}</h3>
              <p className="mt-4 text-[14px] leading-[1.7]" style={{ color: "var(--v-muted)" }}>
                {entry.body}
              </p>
            </div>
          ))}
        </div>
      </VContainer>
    </VSection>
  );
}

/** Cifras sobre el color profundo del tema: el bloque pesado de la página. */
export function ArqFigures({
  label,
  title,
  items,
}: {
  label: string;
  title: string;
  items: { value: string; label: string; detail: string }[];
}) {
  if (items.length === 0) return null;

  return (
    <VSection surface="sunk">
      <VContainer size="wide">
        <Reveal className="max-w-3xl">
          <VLabel style={{ color: "var(--v-accent)" }}>{label}</VLabel>
          <h2 className="v-title-type mt-6 uppercase">{title}</h2>
        </Reveal>

        <dl className="mt-20 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <div
              key={item.label}
              data-reveal
              style={{ ...stagger(i, 0.08), borderColor: "color-mix(in srgb, var(--v-bg) 24%, transparent)" }}
              className="border-t pt-6"
            >
              <dt className="sr-only">{item.label}</dt>
              <dd>
                <p className="v-hero-type tabular" style={{ fontSize: "calc(var(--v-hero) * 0.44)" }}>
                  {item.value}
                </p>
                <p className="mt-4 text-[15px] font-medium uppercase tracking-tight">{item.label}</p>
                <p
                  className="mt-2 text-[13px] leading-[1.65]"
                  style={{ color: "color-mix(in srgb, var(--v-bg) 62%, transparent)" }}
                >
                  {item.detail}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </VContainer>
    </VSection>
  );
}

/** Catálogo en grilla estricta: fichas al ras, separadas sólo por la regla. */
export function ArqSelection({ products, title, label }: { products: ProductCard[]; title: string; label: string }) {
  if (products.length === 0) return null;

  return (
    <VSection>
      <VContainer size="wide">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <VLabel>{label}</VLabel>
            <h2 className="v-title-type mt-6 uppercase">{title}</h2>
          </div>
          <VLink href="/vinos" variant="underline">
            Catálogo completo
          </VLink>
        </Reveal>

        <div
          className="mt-16 grid gap-px sm:grid-cols-2 lg:grid-cols-4"
          style={{ backgroundColor: "var(--v-rule)" }}
        >
          {products.map((product, i) => (
            <article
              key={product.id}
              data-reveal
              style={{ ...stagger(i, 0.07), backgroundColor: "var(--v-surface)" }}
            >
              <Link href={`/vinos/${product.slug}`} className="group block p-6 lg:p-8">
                <div className="relative aspect-[4/5] w-full overflow-hidden" style={{ backgroundColor: "var(--v-bg)" }}>
                  {product.imageUrl && (
                    <Image
                      src={product.imageUrl}
                      alt={product.imageAlt ?? product.name}
                      fill
                      sizes="(max-width: 640px) 90vw, 24vw"
                      className="object-contain p-5 transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.04]"
                    />
                  )}
                </div>

                <p className="v-label mt-7">{product.wineryName}</p>
                <h3 className="mt-3 text-[16px] font-semibold uppercase leading-tight tracking-tight">
                  {product.name}
                </h3>
                <p className="mt-5 flex items-baseline justify-between border-t pt-4" style={{ borderColor: "var(--v-rule)" }}>
                  <span className="text-[15px] tabular font-medium">{formatPrice(product.price)}</span>
                  <span className="v-label" style={{ color: "var(--v-accent)" }}>
                    Ver
                  </span>
                </p>
              </Link>
            </article>
          ))}
        </div>
      </VContainer>
    </VSection>
  );
}

/** Club en dos bloques al ras, sin aire entre foto y texto. */
export function ArqClub({
  title,
  body,
  bullets,
  imageUrl,
  planName,
  planPrice,
}: {
  title: string;
  body: string;
  bullets: string[];
  imageUrl: string;
  planName: string;
  planPrice: number;
}) {
  return (
    <VSection surface="raised">
      <VContainer size="wide">
        <div className="grid items-stretch gap-px lg:grid-cols-2" style={{ backgroundColor: "var(--v-rule)" }}>
          <Reveal variant="mask" className="relative min-h-[52svh]">
            <Image src={imageUrl} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </Reveal>

          <div className="flex flex-col justify-center p-10 lg:p-16" style={{ backgroundColor: "var(--v-bg)" }}>
            <Reveal>
              <VLabel style={{ color: "var(--v-accent)" }}>El Club</VLabel>
              <h2 className="v-title-type mt-6 uppercase">{title}</h2>
              <p className="mt-6 text-[15px] leading-[1.7]" style={{ color: "var(--v-muted)" }}>
                {body}
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <ul className="mt-10 space-y-px" style={{ backgroundColor: "var(--v-rule)" }}>
                {bullets.slice(0, 4).map((bullet) => (
                  <li
                    key={bullet}
                    className="flex gap-4 py-4 text-[14px]"
                    style={{ backgroundColor: "var(--v-bg)" }}
                  >
                    <span className="v-label shrink-0" style={{ color: "var(--v-accent)" }}>
                      —
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.25}>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <VLink href="/club" variant="solid">
                  Ver los planes
                </VLink>
                <p className="text-[14px]" style={{ color: "var(--v-muted)" }}>
                  Desde <span className="tabular">{formatPrice(planPrice)}</span>/mes · {planName}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </VContainer>
    </VSection>
  );
}

/* ══════════════════ Secciones restantes de la variante ═══════════════════ */

/** Declaración: tipografía enorme contra el borde izquierdo, sin centrar nada. */
export function ArqStatement({ text, accent, attribution }: { text: string; accent: string; attribution: string }) {
  return (
    <VSection>
      <VContainer size="wide">
        <Reveal variant="line">
          <p className="v-hero-type max-w-[16ch] uppercase" style={{ fontSize: "calc(var(--v-hero) * 0.78)" }}>
            {text} <span style={{ color: "var(--v-accent)" }}>{accent}</span>
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="mt-12 border-t pt-6" style={{ borderColor: "var(--v-rule)" }}>
            <VLabel>{attribution}</VLabel>
          </div>
        </Reveal>
      </VContainer>
    </VSection>
  );
}

/** Editorial en dos columnas al ras, con la foto ocupando media pantalla. */
export function ArqEditorial({
  label,
  title,
  body,
  quote,
  imageUrl,
  imageAlt,
}: {
  label: string;
  title: string;
  body: string;
  quote: string;
  imageUrl: string;
  imageAlt: string;
}) {
  return (
    <VSection surface="raised">
      <VContainer size="wide">
        <div className="grid items-stretch gap-px lg:grid-cols-2" style={{ backgroundColor: "var(--v-rule)" }}>
          <div className="flex flex-col justify-center p-10 lg:p-16" style={{ backgroundColor: "var(--v-bg)" }}>
            <Reveal>
              <VLabel>{label}</VLabel>
              <h2 className="v-title-type mt-6 uppercase">{title}</h2>
            </Reveal>
            <Reveal delay={0.14}>
              <div className="mt-8 text-[15px] leading-[1.7] [&_p+p]:mt-5" style={{ color: "var(--v-muted)" }}>
                {body.split("\n\n").map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
            </Reveal>
            {quote && (
              <Reveal delay={0.24}>
                <p
                  className="mt-10 border-l-2 pl-6 text-[17px] font-medium uppercase leading-tight"
                  style={{ borderColor: "var(--v-accent)" }}
                >
                  {quote}
                </p>
              </Reveal>
            )}
          </div>

          <Reveal variant="mask" className="relative min-h-[56svh]">
            <Image src={imageUrl} alt={imageAlt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </Reveal>
        </div>
      </VContainer>
    </VSection>
  );
}

/** El lugar: video a sangre con el texto metido en un bloque sólido. */
export function ArqPlace({
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
    <section className="relative isolate min-h-[92svh] overflow-hidden">
      <BackgroundMedia media={media} />

      <VContainer size="wide" className="flex min-h-[92svh] items-end py-16">
        <Reveal
          className="max-w-xl p-10 lg:p-14"
          style={{ backgroundColor: "var(--v-sunk)", color: "var(--v-bg)" }}
        >
          <VLabel style={{ color: "var(--v-accent)" }}>{label}</VLabel>
          <h2 className="v-title-type mt-6 uppercase">{title}</h2>
          <div
            className="mt-7 text-[15px] leading-[1.7] [&_p+p]:mt-4"
            style={{ color: "color-mix(in srgb, var(--v-bg) 72%, transparent)" }}
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

/** Niveles: cuatro bloques al ras, la foto en blanco y negro hasta el hover. */
export function ArqLines({
  label,
  title,
  body,
  items,
}: {
  label: string;
  title: string;
  body: string;
  items: { title: string; subtitle: string; imageUrl: string; href: string }[];
}) {
  if (items.length === 0) return null;

  return (
    <VSection>
      <VContainer size="wide">
        <Reveal className="max-w-3xl">
          <VLabel>{label}</VLabel>
          <h2 className="v-title-type mt-6 uppercase">{title}</h2>
          {body && (
            <p className="mt-6 max-w-xl text-[15px] leading-[1.7]" style={{ color: "var(--v-muted)" }}>
              {body}
            </p>
          )}
        </Reveal>

        <div className="mt-16 grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ backgroundColor: "var(--v-rule)" }}>
          {items.map((item, i) => (
            <Link
              key={item.title}
              href={item.href}
              data-reveal
              style={{ ...stagger(i, 0.07), backgroundColor: "var(--v-bg)" }}
              className="group relative block aspect-[3/4] overflow-hidden"
            >
              <Image
                src={item.imageUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 90vw, 24vw"
                className="object-cover grayscale transition-all duration-[900ms] ease-out-expo group-hover:scale-[1.05] group-hover:grayscale-0"
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgb(22 24 26 / 0.86) 0%, rgb(22 24 26 / 0.1) 62%)" }}
              />
              <div className="absolute inset-x-0 bottom-0 p-6" style={{ color: "var(--v-bg)" }}>
                <h3 className="text-[18px] font-semibold uppercase leading-tight tracking-tight">{item.title}</h3>
                <p className="mt-2 text-[12px]" style={{ color: "color-mix(in srgb, var(--v-bg) 70%, transparent)" }}>
                  {item.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </VContainer>
    </VSection>
  );
}

/** Mosaico rígido: sin gap, las fotos se tocan y forman un solo plano. */
export function ArqGallery({
  label,
  title,
  items,
}: {
  label: string;
  title: string;
  items: { imageUrl: string; imageAlt: string; caption: string; size: string }[];
}) {
  const photos = items.filter((i) => i.imageUrl);
  if (photos.length === 0) return null;

  return (
    <VSection surface="sunk">
      <VContainer size="wide">
        <Reveal className="max-w-3xl">
          <VLabel style={{ color: "var(--v-accent)" }}>{label}</VLabel>
          <h2 className="v-title-type mt-6 uppercase">{title}</h2>
        </Reveal>

        <div className="mt-16 grid auto-rows-[minmax(0,14rem)] grid-cols-2 gap-px lg:grid-cols-4">
          {photos.map((photo, i) => (
            <figure
              key={photo.imageUrl}
              data-reveal="mask"
              style={stagger(i, 0.06)}
              className={cn(
                "group relative overflow-hidden",
                photo.size === "tall" && "row-span-2",
                photo.size === "wide" && "col-span-2",
              )}
            >
              <Image
                src={photo.imageUrl}
                alt={photo.imageAlt}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.05]"
              />
              {photo.caption && (
                <figcaption
                  className="v-label absolute bottom-0 left-0 px-3 py-2"
                  style={{ backgroundColor: "var(--v-accent)", color: "var(--v-on-accent)" }}
                >
                  {photo.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </VContainer>
    </VSection>
  );
}

/** Bodegas: tres fichas con la foto arriba y el dato duro debajo. */
export function ArqWineries({
  label,
  title,
  body,
  items,
}: {
  label: string;
  title: string;
  body: string;
  items: { title: string; subtitle: string; imageUrl: string; href: string }[];
}) {
  if (items.length === 0) return null;

  return (
    <VSection surface="raised">
      <VContainer size="wide">
        <Reveal className="max-w-3xl">
          <VLabel>{label}</VLabel>
          <h2 className="v-title-type mt-6 uppercase">{title}</h2>
          {body && (
            <p className="mt-6 max-w-xl text-[15px] leading-[1.7]" style={{ color: "var(--v-muted)" }}>
              {body}
            </p>
          )}
        </Reveal>

        <div className="mt-16 grid gap-px sm:grid-cols-3" style={{ backgroundColor: "var(--v-rule)" }}>
          {items.map((item, i) => (
            <Link
              key={item.title}
              href={item.href}
              data-reveal
              style={{ ...stagger(i, 0.08), backgroundColor: "var(--v-bg)" }}
              className="group block"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 90vw, 32vw"
                  className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-7">
                <h3 className="text-[17px] font-semibold uppercase tracking-tight">{item.title}</h3>
                <p className="mt-3 border-t pt-3 text-[12px]" style={{ borderColor: "var(--v-rule)", color: "var(--v-muted)" }}>
                  {item.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </VContainer>
    </VSection>
  );
}
