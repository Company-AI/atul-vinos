import Image from "next/image";
import type { BlockData } from "@/domain/cms/blocks";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/ui/button";
import { Container, Eyebrow, Heading, Section } from "@/ui/layout";
import { Reveal } from "@/ui/reveal";

/**
 * Foto fija mientras el texto avanza. Es el recurso que más "editorial" hace
 * ver a una sección larga: en vez de alternar bloques, la imagen sostiene la
 * lectura. En mobile no hay sticky —la foto va arriba y el texto debajo—
 * porque la altura de pantalla no alcanza para que el efecto se lea.
 */
export function SplitStickySection({
  data,
  id,
}: {
  data: BlockData<"split_sticky">;
  id?: string;
}) {
  const dark = data.tone === "dark";
  const mediaFirst = data.mediaSide === "left";
  if (data.entries.length === 0) return null;

  return (
    <Section tone={data.tone} id={id}>
      <Container>
        <div className="grid gap-x-16 gap-y-12 lg:grid-cols-2">
          {/* Columna de imagen */}
          <div className={cn(mediaFirst ? "lg:order-1" : "lg:order-2")}>
            <Reveal
              variant="mask"
              className="relative aspect-[4/5] w-full overflow-hidden bg-carbon-800 lg:sticky lg:top-[104px]"
            >
              {data.media.imageUrl && (
                <Image
                  src={data.media.imageUrl}
                  alt={data.media.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
            </Reveal>
          </div>

          {/* Columna de texto */}
          <div className={cn("flex flex-col", mediaFirst ? "lg:order-2" : "lg:order-1")}>
            <Reveal>
              {data.eyebrow && (
                <Eyebrow className={dark ? "text-clay-400" : "text-stone-500"}>{data.eyebrow}</Eyebrow>
              )}
              {data.title && <Heading size="md" className="mt-5">{data.title}</Heading>}
            </Reveal>

            <div className="mt-14 space-y-14">
              {data.entries.map((entry, i) => (
                <Reveal key={`${entry.title}-${i}`} delay={0.06}>
                  <div
                    className={cn(
                      "border-t pt-7",
                      dark ? "border-carbon-600" : "border-linen-300",
                    )}
                  >
                    <div className="flex items-baseline gap-5">
                      <span
                        className={cn(
                          "font-display text-[15px] tabular",
                          dark ? "text-clay-400" : "text-clay-500",
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3
                        className={cn(
                          "font-display text-display-sm font-light",
                          dark ? "text-bone" : "text-carbon-900",
                        )}
                      >
                        {entry.title}
                      </h3>
                    </div>
                    {entry.body && (
                      <p
                        className={cn(
                          "mt-4 max-w-[52ch] pl-10 text-[15px] leading-[1.75]",
                          dark ? "text-stone-400" : "text-stone-600",
                        )}
                      >
                        {entry.body}
                      </p>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>

            {data.cta.label && (
              <Reveal delay={0.1} className="mt-14">
                <ButtonLink
                  href={data.cta.href}
                  variant={dark ? "ghostLight" : "outline"}
                  size="lg"
                  uppercase
                >
                  {data.cta.label}
                </ButtonLink>
              </Reveal>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
