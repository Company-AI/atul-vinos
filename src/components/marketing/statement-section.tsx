import Image from "next/image";
import type { BlockData } from "@/domain/cms/blocks";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/ui/button";
import { Container, Eyebrow, Section } from "@/ui/layout";
import { Reveal } from "@/ui/reveal";

/**
 * Momento tipográfico: una sola frase compuesta grande, con mucho aire
 * alrededor. Corta el ritmo entre secciones de producto y da respiro.
 * La foto de fondo, si la hay, va casi apagada: acompaña, no compite.
 */
export function StatementSection({ data, id }: { data: BlockData<"statement">; id?: string }) {
  const dark = data.tone === "dark";
  const hasBackground = Boolean(data.backgroundUrl);

  return (
    <Section
      tone={data.tone}
      id={id}
      className={cn("relative overflow-hidden", hasBackground && "grain")}
    >
      {hasBackground && (
        <>
          <Image
            src={data.backgroundUrl}
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className={cn("object-cover", dark ? "opacity-[0.18]" : "opacity-[0.10]")}
          />
          <div
            aria-hidden
            className={cn(
              "absolute inset-0",
              dark
                ? "bg-gradient-to-b from-carbon-900 via-carbon-900/70 to-carbon-900"
                : "bg-gradient-to-b from-bone via-bone/70 to-bone",
            )}
          />
        </>
      )}

      <Container size="narrow" className="relative text-center">
        {data.eyebrow && (
          <Reveal>
            <Eyebrow className={cn("justify-center", dark ? "text-clay-400" : "text-stone-500")}>
              {data.eyebrow}
            </Eyebrow>
          </Reveal>
        )}

        <Reveal variant="line" delay={0.08}>
          <p
            className={cn(
              "mt-8 font-display text-display-lg font-light",
              dark ? "text-bone" : "text-carbon-900",
            )}
          >
            {data.text}
            {data.textAccent && (
              <>
                {" "}
                <span className="accent-italic">{data.textAccent}</span>
              </>
            )}
          </p>
        </Reveal>

        {data.attribution && (
          <Reveal delay={0.24}>
            <p
              className={cn(
                "mt-10 text-[13px] tracking-wide",
                dark ? "text-stone-400" : "text-stone-500",
              )}
            >
              {data.attribution}
            </p>
          </Reveal>
        )}

        {data.cta.label && (
          <Reveal delay={0.32}>
            <div className="mt-12">
              <ButtonLink
                href={data.cta.href}
                variant={dark ? "ghostLight" : "outline"}
                size="lg"
                uppercase
              >
                {data.cta.label}
              </ButtonLink>
            </div>
          </Reveal>
        )}
      </Container>
    </Section>
  );
}
