import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/domain/catalog/types";
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
    <section className="relative flex min-h-[92svh] flex-col items-center justify-end overflow-hidden pb-24 text-center">
      <Image
        src={imageUrl}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
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
