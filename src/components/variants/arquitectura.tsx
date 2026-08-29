import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/domain/catalog/types";
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

        {/* Bloque de imagen: sin bordes redondeados, a sangre por la derecha. */}
        <Reveal variant="mask" className="relative min-h-[46svh] lg:col-span-5 lg:min-h-full">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="object-cover"
          />
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
