import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/domain/catalog/types";
import { Reveal, stagger } from "@/ui/reveal";
import { VBody, VContainer, VLabel, VLink, VSection, VTitle, formatPrice } from "./shared";

/**
 * Terroir — el viñedo como ciencia.
 *
 * La regla de la variante: el dato es el ornamento. Las anotaciones en
 * monoespaciada al margen hacen de cuaderno de campo y la serifa lleva la voz.
 *
 * IMPORTANTE: sólo se anotan datos que existen de verdad en la base —región,
 * bodega, uvas, tipo, volumen—. No se inventan altitudes ni coordenadas de
 * bodegas reales; si mañana se quieren mostrar, se agregan como campos
 * cargables y los completa el equipo con valores verificados.
 */

/** Anotación al margen: la unidad de estilo del tema. */
function Annotation({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span
        className="shrink-0 text-[10px] uppercase tracking-[0.16em]"
        style={{ fontFamily: "var(--v-mono)", color: "var(--v-muted)" }}
      >
        {k}
      </span>
      <span className="h-px flex-1" style={{ backgroundColor: "var(--v-rule)" }} />
      <span className="text-[12px]" style={{ fontFamily: "var(--v-mono)" }}>
        {v}
      </span>
    </div>
  );
}

export function TerroirHero({
  eyebrow,
  title,
  accent,
  subtitle,
  imageUrl,
  imageAlt,
  annotations,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  annotations: { k: string; v: string }[];
}) {
  return (
    <section className="relative pt-36">
      <VContainer size="wide">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <VLabel>{eyebrow}</VLabel>
            </Reveal>

            <Reveal delay={0.12} variant="line">
              <VTitle level={1} hero className="mt-8">
                {title}{" "}
                <em className="font-normal italic" style={{ color: "var(--v-accent)" }}>
                  {accent}
                </em>
              </VTitle>
            </Reveal>

            <Reveal delay={0.26}>
              <VBody className="mt-10">
                <p>{subtitle}</p>
              </VBody>
            </Reveal>

            <Reveal delay={0.38}>
              <div className="mt-12">
                <VLink href="/vinos" variant="solid">
                  Ver la selección
                </VLink>
              </div>
            </Reveal>
          </div>

          {/* Cuaderno de campo: lo que sabemos del lugar, en datos verificables. */}
          <Reveal delay={0.2} className="lg:col-span-5">
            <div className="space-y-4 border-t pt-6" style={{ borderColor: "var(--v-rule)" }}>
              {annotations.map((a) => (
                <Annotation key={a.k} k={a.k} v={a.v} />
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal variant="mask" delay={0.3} className="relative mt-20 aspect-[21/9] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ borderRadius: "var(--v-radius)" }}
          />
        </Reveal>
      </VContainer>
    </section>
  );
}

/** Cifras compuestas como lectura de instrumento. */
export function TerroirFigures({
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
    <VSection>
      <VContainer size="wide">
        <Reveal className="max-w-2xl">
          <VLabel>{label}</VLabel>
          <VTitle className="mt-6">{title}</VTitle>
        </Reveal>

        <dl className="mt-16 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <div key={item.label} data-reveal style={stagger(i, 0.08)}>
              <dt className="sr-only">{item.label}</dt>
              <dd>
                <p
                  className="tabular"
                  style={{
                    fontFamily: "var(--v-mono)",
                    fontSize: "clamp(2rem, 3.4vw, 3rem)",
                    color: "var(--v-accent)",
                  }}
                >
                  {item.value}
                </p>
                <p className="mt-4 border-t pt-4 text-[15px]" style={{ borderColor: "var(--v-rule)" }}>
                  {item.label}
                </p>
                <p className="mt-2 text-[13px] leading-[1.7]" style={{ color: "var(--v-muted)" }}>
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

/** Ficha de campo por botella: los datos que sí tenemos, al margen. */
export function TerroirSelection({
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
    <VSection surface="sunk">
      <VContainer size="wide">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <VLabel style={{ color: "var(--v-accent)" }}>{label}</VLabel>
            <VTitle className="mt-6" >{title}</VTitle>
          </div>
          <VLink href="/vinos" variant="underline">
            Catálogo completo
          </VLink>
        </Reveal>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, i) => (
            <article
              key={product.id}
              data-reveal
              style={{ ...stagger(i, 0.08), backgroundColor: "var(--v-surface)", borderRadius: "var(--v-radius)" }}
              className="overflow-hidden"
            >
              <Link href={`/vinos/${product.slug}`} className="group block p-6">
                <div className="relative aspect-[4/5] w-full overflow-hidden" style={{ backgroundColor: "var(--v-bg)" }}>
                  {product.imageUrl && (
                    <Image
                      src={product.imageUrl}
                      alt={product.imageAlt ?? product.name}
                      fill
                      sizes="(max-width: 640px) 90vw, 24vw"
                      className="object-contain p-5 transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.05]"
                    />
                  )}
                </div>

                <h3 className="v-title-type mt-7" style={{ fontSize: "calc(var(--v-title) * 0.5)" }}>
                  {product.name}
                </h3>

                <div className="mt-5 space-y-2.5">
                  {product.wineryName && <Annotation k="Bodega" v={product.wineryName} />}
                  {product.regionName && <Annotation k="Región" v={product.regionName} />}
                  {product.grapes.length > 0 && <Annotation k="Uva" v={product.grapes.join(" · ")} />}
                  <Annotation k="Precio" v={formatPrice(product.price)} />
                </div>
              </Link>
            </article>
          ))}
        </div>
      </VContainer>
    </VSection>
  );
}

/** El Club como suscripción a un cuaderno: cada mes, una entrada nueva. */
export function TerroirClub({
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
    <VSection>
      <VContainer size="wide">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal variant="mask" className="relative aspect-[4/5] w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 46vw"
              className="object-cover"
              style={{ borderRadius: "var(--v-radius)" }}
            />
          </Reveal>

          <div>
            <Reveal>
              <VLabel style={{ color: "var(--v-accent)" }}>El Club</VLabel>
              <VTitle className="mt-6">{title}</VTitle>
              <VBody className="mt-7">
                <p>{body}</p>
              </VBody>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mt-10 space-y-3 border-t pt-8" style={{ borderColor: "var(--v-rule)" }}>
                {bullets.slice(0, 4).map((bullet, i) => (
                  <Annotation key={bullet} k={String(i + 1).padStart(2, "0")} v={bullet} />
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.25}>
              <div className="mt-12 flex flex-wrap items-center gap-6">
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
