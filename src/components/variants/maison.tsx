import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/domain/catalog/types";
import { cn } from "@/lib/cn";
import { BackgroundMedia, type BackgroundMediaData } from "@/components/marketing/background-media";
import { Reveal, stagger } from "@/ui/reveal";
import { VBody, VContainer, VLabel, VLink, VRule, VSection, VTitle, formatPrice } from "./shared";

/**
 * Maison — lujo por resta.
 *
 * La regla de la variante: cada sección muestra una sola idea y le deja
 * mucho aire alrededor. Poca imagen, medida angosta, composición centrada.
 * Si una sección necesita dos columnas para explicarse, no pertenece acá.
 */

export function MaisonHero({
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
    <section className="relative isolate flex min-h-[96svh] flex-col items-center justify-end overflow-hidden pb-24 text-center">
      <BackgroundMedia media={media} priority />
      {/* Velo muy tenue: la foto se mantiene clara, como el resto del tema. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to top, color-mix(in srgb, var(--v-bg) 96%, transparent) 0%, color-mix(in srgb, var(--v-bg) 78%, transparent) 26%, color-mix(in srgb, var(--v-bg) 20%, transparent) 62%, transparent 100%)",
        }}
      />

      <VContainer size="narrow">
        <Reveal>
          <VLabel className="justify-center">{eyebrow}</VLabel>
        </Reveal>

        <Reveal delay={0.15}>
          <VTitle level={1} hero className="mt-8">
            {title}
            {accent && (
              <>
                {" "}
                <em className="font-normal italic">{accent}</em>
              </>
            )}
          </VTitle>
        </Reveal>

        <Reveal delay={0.3}>
          <VBody className="mx-auto mt-8 text-center">
            <p>{subtitle}</p>
          </VBody>
        </Reveal>

        <Reveal delay={0.45}>
          <div className="mt-12 flex justify-center">
            <VLink href="/vinos" variant="underline">
              Ver la selección
            </VLink>
          </div>
        </Reveal>
      </VContainer>
    </section>
  );
}

/** Una sola frase, centrada, con aire desmedido. El gesto central del tema. */
export function MaisonStatement({ text, accent, attribution }: { text: string; accent: string; attribution: string }) {
  return (
    <VSection className="text-center">
      <VContainer size="narrow">
        <Reveal variant="line">
          <p className="v-hero-type" style={{ fontSize: "calc(var(--v-hero) * 0.62)" }}>
            {text} <em className="font-normal italic">{accent}</em>
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <VLabel className="mt-12 justify-center">{attribution}</VLabel>
        </Reveal>
      </VContainer>
    </VSection>
  );
}

/**
 * Selección. Tres botellas y no cuatro: con tres, cada una recibe una columna
 * ancha y la fila respira. Es la diferencia entre una vidriera y una grilla.
 */
export function MaisonSelection({ products, title }: { products: ProductCard[]; title: string }) {
  if (products.length === 0) return null;

  return (
    <VSection surface="raised">
      <VContainer>
        <Reveal className="mx-auto max-w-[560px] text-center">
          <VLabel className="justify-center">La selección</VLabel>
          <VTitle className="mt-6">{title}</VTitle>
        </Reveal>

        <div className="mt-20 grid gap-16 sm:grid-cols-3 sm:gap-10">
          {products.slice(0, 3).map((product, i) => (
            <article key={product.id} data-reveal style={stagger(i, 0.12)} className="text-center">
              <Link href={`/vinos/${product.slug}`} className="group block">
                <div
                  className="relative mx-auto aspect-[3/4] w-full max-w-[240px] overflow-hidden"
                  style={{ backgroundColor: "var(--v-bg)" }}
                >
                  {product.imageUrl && (
                    <Image
                      src={product.imageUrl}
                      alt={product.imageAlt ?? product.name}
                      fill
                      sizes="(max-width: 640px) 60vw, 22vw"
                      className="object-contain p-6 transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.05]"
                    />
                  )}
                </div>

                <p className="v-label mt-8" style={{ color: "var(--v-muted)" }}>
                  {product.wineryName}
                </p>
                <h3 className="v-title-type mt-3" style={{ fontSize: "calc(var(--v-title) * 0.52)" }}>
                  {product.name}
                </h3>
                <p className="mt-4 text-[15px] tabular" style={{ color: "var(--v-ink)" }}>
                  {formatPrice(product.price)}
                </p>
              </Link>
            </article>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-20 text-center">
          <VLink href="/vinos" variant="underline">
            Ver todas las etiquetas
          </VLink>
        </Reveal>
      </VContainer>
    </VSection>
  );
}

/** Invitación al Club: una foto ancha, una frase y un solo camino a seguir. */
export function MaisonClub({
  title,
  body,
  imageUrl,
  planName,
  planPrice,
}: {
  title: string;
  body: string;
  imageUrl: string;
  planName: string;
  planPrice: number;
}) {
  return (
    <VSection>
      <VContainer size="narrow" className="text-center">
        <Reveal variant="mask" className="relative mx-auto aspect-[16/10] w-full overflow-hidden">
          <Image src={imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 760px" className="object-cover" />
        </Reveal>

        <Reveal delay={0.15}>
          <VLabel className="mt-14 justify-center">El Club</VLabel>
          <VTitle className="mt-6">{title}</VTitle>
          <VBody className="mx-auto mt-7 text-center">
            <p>{body}</p>
          </VBody>
        </Reveal>

        <Reveal delay={0.3}>
          <VRule className="mx-auto mt-12 w-16" />
          <p className="mt-12 text-[15px]" style={{ color: "var(--v-muted)" }}>
            Desde <span className="tabular">{formatPrice(planPrice)}</span> por mes · plan {planName}
          </p>
          <div className="mt-8 flex justify-center">
            <VLink href="/club" variant="solid">
              Conocer el Club
            </VLink>
          </div>
        </Reveal>
      </VContainer>
    </VSection>
  );
}

/* ══════════════════ Secciones restantes de la variante ═══════════════════ */

/** Editorial: foto grande arriba, texto centrado y angosto debajo. */
export function MaisonEditorial({
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
    <VSection>
      <VContainer size="narrow" className="text-center">
        <Reveal>
          <VLabel className="justify-center">{label}</VLabel>
          <VTitle className="mt-6">{title}</VTitle>
        </Reveal>

        <Reveal variant="mask" delay={0.15} className="relative mt-14 aspect-[3/2] w-full overflow-hidden">
          <Image src={imageUrl} alt={imageAlt} fill sizes="(max-width: 768px) 100vw, 760px" className="object-cover" />
        </Reveal>

        <Reveal delay={0.22}>
          <VBody className="mx-auto mt-14 text-left">
            {body.split("\n\n").map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </VBody>
        </Reveal>

        {quote && (
          <Reveal delay={0.3}>
            <p
              className="v-title-type mx-auto mt-16 max-w-[20ch] italic"
              style={{ fontSize: "calc(var(--v-title) * 0.72)" }}
            >
              {quote}
            </p>
          </Reveal>
        )}
      </VContainer>
    </VSection>
  );
}

/**
 * El lugar. Único momento oscuro del tema: video a sangre con velo profundo.
 * El contraste con el resto de la página es justamente el efecto buscado.
 */
export function MaisonPlace({
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
    <section className="relative isolate flex min-h-[86svh] items-center overflow-hidden py-32 text-center">
      <BackgroundMedia media={media} />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(to bottom, rgb(18 18 18 / 0.55), rgb(18 18 18 / 0.72))" }}
      />

      <VContainer size="narrow">
        <Reveal>
          <VLabel className="justify-center" style={{ color: "rgb(255 255 255 / 0.68)" }}>
            {label}
          </VLabel>
        </Reveal>
        <Reveal delay={0.12} variant="line">
          <VTitle className="mt-7 text-white">{title}</VTitle>
        </Reveal>
        <Reveal delay={0.24}>
          <div
            className="mx-auto mt-8 text-[15px] leading-[1.8] [&_p+p]:mt-5"
            style={{ color: "rgb(255 255 255 / 0.78)", maxWidth: "var(--v-measure)" }}
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

/** Niveles de selección: cuatro columnas separadas por reglas finas. */
export function MaisonLines({
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
    <VSection surface="sunk">
      <VContainer>
        <Reveal className="mx-auto max-w-[620px] text-center">
          <VLabel className="justify-center">{label}</VLabel>
          <VTitle className="mt-6">{title}</VTitle>
          {body && (
            <VBody className="mx-auto mt-7 text-center">
              <p>{body}</p>
            </VBody>
          )}
        </Reveal>

        <div className="mt-20 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {items.map((item, i) => (
            <Link
              key={item.title}
              href={item.href}
              data-reveal
              style={stagger(i, 0.1)}
              className="group block text-center"
            >
              <div className="relative mx-auto aspect-square w-full overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 90vw, 22vw"
                  className="object-cover transition-transform duration-[1600ms] ease-out-expo group-hover:scale-[1.06]"
                />
              </div>
              <h3 className="v-title-type mt-7" style={{ fontSize: "calc(var(--v-title) * 0.5)" }}>
                {item.title}
              </h3>
              <p className="mt-3 text-[13px]" style={{ color: "var(--v-muted)" }}>
                {item.subtitle}
              </p>
            </Link>
          ))}
        </div>
      </VContainer>
    </VSection>
  );
}

/** Proceso: cuatro pasos en una sola columna angosta, uno debajo del otro. */
export function MaisonProcess({
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
      <VContainer size="narrow">
        <Reveal className="text-center">
          <VLabel className="justify-center">{label}</VLabel>
          <VTitle className="mt-6">{title}</VTitle>
        </Reveal>

        <div className="mt-16">
          {entries.map((entry, i) => (
            <div key={entry.title} data-reveal style={stagger(i, 0.1)}>
              <VRule className={i === 0 ? "" : ""} />
              <div className="py-10 text-center">
                <p className="v-label tabular" style={{ color: "var(--v-accent)" }}>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="v-title-type mt-5" style={{ fontSize: "calc(var(--v-title) * 0.56)" }}>
                  {entry.title}
                </h3>
                <p
                  className="mx-auto mt-4 text-[15px] leading-[1.8]"
                  style={{ color: "var(--v-muted)", maxWidth: "52ch" }}
                >
                  {entry.body}
                </p>
              </div>
            </div>
          ))}
          <VRule />
        </div>
      </VContainer>
    </VSection>
  );
}

/** Mosaico: dos filas asimétricas, sin captions. La foto habla sola. */
export function MaisonGallery({
  label,
  title,
  items,
}: {
  label: string;
  title: string;
  items: { imageUrl: string; imageAlt: string; size: string }[];
}) {
  const photos = items.filter((i) => i.imageUrl);
  if (photos.length === 0) return null;

  return (
    <VSection surface="raised">
      <VContainer>
        <Reveal className="mx-auto max-w-[560px] text-center">
          <VLabel className="justify-center">{label}</VLabel>
          <VTitle className="mt-6">{title}</VTitle>
        </Reveal>

        <div className="mt-16 grid auto-rows-[minmax(0,15rem)] grid-cols-2 gap-4 lg:grid-cols-4">
          {photos.map((photo, i) => (
            <figure
              key={photo.imageUrl}
              data-reveal="mask"
              style={stagger(i, 0.08)}
              className={cn(
                "relative overflow-hidden",
                photo.size === "tall" && "row-span-2",
                photo.size === "wide" && "col-span-2",
              )}
            >
              <Image
                src={photo.imageUrl}
                alt={photo.imageAlt}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />
            </figure>
          ))}
        </div>
      </VContainer>
    </VSection>
  );
}

/** Bodegas representadas: tres, en fila, con la regla como único adorno. */
export function MaisonWineries({
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
      <VContainer size="narrow">
        <Reveal className="text-center">
          <VLabel className="justify-center">{label}</VLabel>
          <VTitle className="mt-6">{title}</VTitle>
          {body && (
            <VBody className="mx-auto mt-7 text-center">
              <p>{body}</p>
            </VBody>
          )}
        </Reveal>

        <div className="mt-16">
          {items.map((item, i) => (
            <div key={item.title} data-reveal style={stagger(i, 0.1)}>
              <VRule />
              <Link href={item.href} className="group flex items-center gap-7 py-7">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-full">
                  <Image src={item.imageUrl} alt="" fill sizes="80px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="v-title-type" style={{ fontSize: "calc(var(--v-title) * 0.5)" }}>
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[13px]" style={{ color: "var(--v-muted)" }}>
                    {item.subtitle}
                  </p>
                </div>
                <span className="v-label shrink-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ color: "var(--v-accent)" }}>
                  Ver
                </span>
              </Link>
            </div>
          ))}
          <VRule />
        </div>
      </VContainer>
    </VSection>
  );
}

/** Cifras en una línea, discretas: en este tema el número no grita. */
export function MaisonFigures({ items }: { items: { value: string; label: string }[] }) {
  if (items.length === 0) return null;

  return (
    <VSection surface="raised">
      <VContainer>
        <dl className="grid gap-12 text-center sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <div key={item.label} data-reveal style={stagger(i, 0.08)}>
              <dt className="sr-only">{item.label}</dt>
              <dd>
                <p className="v-title-type tabular" style={{ color: "var(--v-accent)" }}>
                  {item.value}
                </p>
                <p className="mt-4 text-[14px]" style={{ color: "var(--v-muted)" }}>
                  {item.label}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </VContainer>
    </VSection>
  );
}
