import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/domain/catalog/types";
import { cn } from "@/lib/cn";
import { Reveal, stagger } from "@/ui/reveal";
import { VBody, VContainer, VLabel, VLink, VRule, VSection, VTitle, formatPrice } from "./shared";

/**
 * Casa — cálida y clásica, con la tienda al frente.
 *
 * Reglas de la variante:
 *  - Sin video en ninguna sección: manda la fotografía fija y grande.
 *  - Las etiquetas van en versalitas reales (font-variant-caps), no en
 *    mayúscula forzada: es de ahí que sale el aire tradicional.
 *  - La venta aparece arriba de todo, no al final: la primera sección después
 *    del hero ya son botellas con precio.
 */

export function CasaHero({
  eyebrow,
  title,
  accent,
  subtitle,
  imageUrl,
  imageAlt,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
}) {
  return (
    <section className="relative flex min-h-[88svh] items-end overflow-hidden pb-20 pt-40">
      <Image src={imageUrl} alt={imageAlt} fill priority sizes="100vw" className="-z-10 object-cover" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to top, rgb(45 34 26 / 0.86) 0%, rgb(45 34 26 / 0.52) 42%, rgb(45 34 26 / 0.16) 78%, transparent 100%)",
        }}
      />

      <VContainer size="wide">
        <div className="max-w-3xl" style={{ color: "var(--v-surface)" }}>
          <Reveal>
            <VLabel style={{ color: "color-mix(in srgb, var(--v-surface) 78%, transparent)" }}>
              {eyebrow}
            </VLabel>
          </Reveal>

          <Reveal delay={0.12} variant="line">
            <VTitle level={1} hero className="mt-6">
              {title}{" "}
              <span style={{ fontStyle: "italic" }}>{accent}</span>
            </VTitle>
          </Reveal>

          <Reveal delay={0.26}>
            <p
              className="mt-7 text-[16px] leading-[1.75]"
              style={{ color: "color-mix(in srgb, var(--v-surface) 82%, transparent)", maxWidth: "56ch" }}
            >
              {subtitle}
            </p>
          </Reveal>

          <Reveal delay={0.38}>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <VLink href="/v6/tienda" variant="solid">
                Ir a la tienda
              </VLink>
              <Link
                href="/v6/club"
                className="v-label pb-1"
                style={{ borderBottom: "1px solid currentColor", color: "var(--v-surface)" }}
              >
                Conocer el Club
              </Link>
            </div>
          </Reveal>
        </div>
      </VContainer>
    </section>
  );
}

/**
 * La tienda arriba de todo. Es el gesto que define la variante: antes de
 * contar quiénes somos, mostramos qué se puede comprar y a qué precio.
 */
export function CasaShopfront({
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
    <VSection surface="raised">
      <VContainer size="wide">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <VLabel style={{ color: "var(--v-accent)" }}>{label}</VLabel>
            <VTitle className="mt-4">{title}</VTitle>
          </div>
          <VLink href="/v6/tienda" variant="underline">
            Ver toda la tienda
          </VLink>
        </Reveal>

        <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, i) => (
            <CasaWineCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </VContainer>
    </VSection>
  );
}

/** Ficha de botella: foto sobre papel, versalitas y precio bien visible. */
export function CasaWineCard({ product, index = 0 }: { product: ProductCard; index?: number }) {
  return (
    <article data-reveal style={stagger(index, 0.07)}>
      <Link href={`/vinos/${product.slug}`} className="group block">
        <div className="relative aspect-[3/4] w-full overflow-hidden" style={{ backgroundColor: "var(--v-bg)" }}>
          {product.imageUrl && (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              sizes="(max-width: 640px) 90vw, 24vw"
              className="object-contain p-7 transition-transform duration-[1100ms] ease-out-expo group-hover:scale-[1.05]"
            />
          )}
        </div>

        <VLabel className="mt-6" style={{ color: "var(--v-muted)" }}>
          {product.wineryName}
        </VLabel>

        <h3 className="v-title-type mt-1.5" style={{ fontSize: "calc(var(--v-title) * 0.56)" }}>
          {product.name}
        </h3>

        {product.regionName && (
          <p className="mt-2 text-[13px]" style={{ color: "var(--v-muted)" }}>
            {product.regionName}
          </p>
        )}

        <div
          className="mt-4 flex items-baseline justify-between border-t pt-4"
          style={{ borderColor: "var(--v-rule)" }}
        >
          <span className="text-[17px] tabular" style={{ color: "var(--v-ink)" }}>
            {formatPrice(product.price)}
          </span>
          <span
            className="v-label opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ color: "var(--v-accent)" }}
          >
            Ver ficha
          </span>
        </div>
      </Link>
    </article>
  );
}

/** Editorial cálido: foto grande a un lado, texto con inicial destacada. */
export function CasaEditorial({
  label,
  title,
  body,
  quote,
  imageUrl,
  imageAlt,
  mediaSide = "left",
}: {
  label: string;
  title: string;
  body: string;
  quote: string;
  imageUrl: string;
  imageAlt: string;
  mediaSide?: "left" | "right";
}) {
  const paragraphs = body.split("\n\n");

  return (
    <VSection>
      <VContainer size="wide">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal
            variant="mask"
            className={cn("relative aspect-[4/5] w-full overflow-hidden", mediaSide === "right" && "lg:order-2")}
          >
            <Image src={imageUrl} alt={imageAlt} fill sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover" />
          </Reveal>

          <div className={cn(mediaSide === "right" && "lg:order-1")}>
            <Reveal>
              <VLabel style={{ color: "var(--v-accent)" }}>{label}</VLabel>
              <VTitle className="mt-4">{title}</VTitle>
            </Reveal>

            <Reveal delay={0.14}>
              <VBody className="mt-7">
                {paragraphs.map((p, i) => (
                  <p
                    key={p.slice(0, 24)}
                    className={i === 0 ? "first-letter:float-left first-letter:mr-2 first-letter:text-[3.2em] first-letter:leading-[0.8]" : undefined}
                    style={i === 0 ? { fontFamily: "var(--v-display)" } : undefined}
                  >
                    {p}
                  </p>
                ))}
              </VBody>
            </Reveal>

            {quote && (
              <Reveal delay={0.24}>
                <p
                  className="v-title-type mt-9 italic"
                  style={{ fontSize: "calc(var(--v-title) * 0.66)", color: "var(--v-accent)" }}
                >
                  {quote}
                </p>
              </Reveal>
            )}
          </div>
        </div>
      </VContainer>
    </VSection>
  );
}

/** Niveles de selección, en fila con la foto contenida y el pie en versalitas. */
export function CasaLines({
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
      <VContainer size="wide">
        <Reveal className="max-w-2xl">
          <VLabel style={{ color: "color-mix(in srgb, var(--v-bg) 72%, transparent)" }}>{label}</VLabel>
          <VTitle className="mt-4">{title}</VTitle>
          {body && (
            <p
              className="mt-6 text-[15px] leading-[1.75]"
              style={{ color: "color-mix(in srgb, var(--v-bg) 68%, transparent)", maxWidth: "58ch" }}
            >
              {body}
            </p>
          )}
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <Link key={item.title} href={item.href} data-reveal style={stagger(i, 0.08)} className="group block">
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 90vw, 24vw"
                  className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.06]"
                />
              </div>
              <h3 className="v-title-type mt-5" style={{ fontSize: "calc(var(--v-title) * 0.54)" }}>
                {item.title}
              </h3>
              <p
                className="mt-2 text-[13px]"
                style={{ color: "color-mix(in srgb, var(--v-bg) 62%, transparent)" }}
              >
                {item.subtitle}
              </p>
            </Link>
          ))}
        </div>
      </VContainer>
    </VSection>
  );
}

/** Bodegas representadas, con la foto en formato apaisado y la regla debajo. */
export function CasaWineries({
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
        <Reveal className="max-w-2xl">
          <VLabel style={{ color: "var(--v-accent)" }}>{label}</VLabel>
          <VTitle className="mt-4">{title}</VTitle>
          {body && (
            <VBody className="mt-6">
              <p>{body}</p>
            </VBody>
          )}
        </Reveal>

        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {items.map((item, i) => (
            <Link key={item.title} href={item.href} data-reveal style={stagger(i, 0.08)} className="group block">
              <div className="relative aspect-[3/2] w-full overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 90vw, 32vw"
                  className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.05]"
                />
              </div>
              <h3 className="v-title-type mt-5" style={{ fontSize: "calc(var(--v-title) * 0.56)" }}>
                {item.title}
              </h3>
              <VRule className="mt-4" />
              <p className="mt-4 text-[13px]" style={{ color: "var(--v-muted)" }}>
                {item.subtitle}
              </p>
            </Link>
          ))}
        </div>
      </VContainer>
    </VSection>
  );
}

/** Mosaico de fotografía grande. Sin video en toda la variante, por decisión. */
export function CasaGallery({
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
    <VSection surface="raised">
      <VContainer size="wide">
        <Reveal className="max-w-2xl">
          <VLabel style={{ color: "var(--v-accent)" }}>{label}</VLabel>
          <VTitle className="mt-4">{title}</VTitle>
        </Reveal>

        <div className="mt-14 grid auto-rows-[minmax(0,16rem)] grid-cols-2 gap-5 lg:grid-cols-4">
          {photos.map((photo, i) => (
            <figure
              key={photo.imageUrl}
              data-reveal="mask"
              style={stagger(i, 0.07)}
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
              {photo.caption && (
                <figcaption
                  className="v-label absolute inset-x-0 bottom-0 p-4"
                  style={{
                    color: "var(--v-surface)",
                    background: "linear-gradient(to top, rgb(45 34 26 / 0.8), transparent)",
                  }}
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

/** Invitación al Club, con la foto ancha y el precio de entrada a la vista. */
export function CasaClub({
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
    <VSection surface="sunk">
      <VContainer size="wide">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Reveal>
              <VLabel style={{ color: "color-mix(in srgb, var(--v-bg) 74%, transparent)" }}>El Club</VLabel>
              <VTitle className="mt-4">{title}</VTitle>
              <p
                className="mt-6 text-[15px] leading-[1.75]"
                style={{ color: "color-mix(in srgb, var(--v-bg) 70%, transparent)", maxWidth: "56ch" }}
              >
                {body}
              </p>
            </Reveal>

            <Reveal delay={0.14}>
              <ul className="mt-9 space-y-3.5">
                {bullets.slice(0, 4).map((bullet) => (
                  <li key={bullet} className="flex gap-4 text-[15px]">
                    <span aria-hidden style={{ color: "color-mix(in srgb, var(--v-bg) 55%, transparent)" }}>
                      ·
                    </span>
                    <span style={{ color: "color-mix(in srgb, var(--v-bg) 82%, transparent)" }}>{bullet}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <VLink href="/v6/club" variant="solid">
                  Ver los planes
                </VLink>
                <p className="text-[14px]" style={{ color: "color-mix(in srgb, var(--v-bg) 66%, transparent)" }}>
                  Desde <span className="tabular">{formatPrice(planPrice)}</span>/mes · {planName}
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal variant="mask" className="relative aspect-[4/5] w-full overflow-hidden">
            <Image src={imageUrl} alt="" fill sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover" />
          </Reveal>
        </div>
      </VContainer>
    </VSection>
  );
}
