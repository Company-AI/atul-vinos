import Image from "next/image";
import Link from "next/link";
import { BackgroundMedia } from "./background-media";
import { cn } from "@/lib/cn";
import type { BlockData } from "@/domain/cms/blocks";
import { buttonVariants } from "@/ui/button";
import { Container, Eyebrow, Heading, Prose, Section } from "@/ui/layout";
import { Reveal } from "@/ui/reveal";

/** Bloque editorial: texto y fotografía con mucho aire. */
export function EditorialSection({ data }: { data: BlockData<"editorial"> }) {
  const dark = data.tone === "dark";
  const media = data.media;
  const imageUrl = media.imageUrl || media.posterUrl;

  if (data.layout === "fullBleed") {
    return (
      <section data-editorial className="on-dark relative isolate overflow-hidden bg-carbon-950">
        {imageUrl && (
          <BackgroundMedia
            media={{
              imageUrl,
              imageAlt: media.imageAlt,
              posterUrl: media.posterUrl,
              videoDesktopUrl: media.videoDesktopUrl,
              videoMobileUrl: media.videoMobileUrl,
            }}
            imageClassName="opacity-60"
          />
        )}
        <div aria-hidden className="absolute inset-0 -z-10 bg-carbon-950/45" />
        <div aria-hidden className="absolute inset-0 -z-10 scrim-full" />
        <Container className="py-section" size="narrow">
          <Reveal>
            <div className="text-center">
              {data.eyebrow && <Eyebrow className="text-linen-300">{data.eyebrow}</Eyebrow>}
              <Heading size="lg" className="mt-5 text-bone">{data.title}</Heading>
              {data.body && (
                <Prose className="mx-auto mt-6 text-linen-200">
                  {data.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
                </Prose>
              )}
              {data.cta.label && (
                <Link
                  href={data.cta.href}
                  className={cn(buttonVariants({ variant: "ghostLight", size: "lg", uppercase: true }), "mt-9")}
                >
                  {data.cta.label}
                </Link>
              )}
            </div>
          </Reveal>
        </Container>
      </section>
    );
  }

  return (
    <Section tone={data.tone} className="overflow-hidden">
      <Container>
        <div
          className={cn(
            "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
            data.mediaSide === "left" && "lg:[&>*:first-child]:order-2",
          )}
        >
          {/* Texto */}
          <Reveal className="max-w-xl">
            {data.eyebrow && (
              <Eyebrow className={dark ? "text-clay-400" : "text-stone-500"}>{data.eyebrow}</Eyebrow>
            )}
            <Heading size="md" className={cn("mt-5", dark && "text-bone")}>
              {data.title}
            </Heading>

            {data.body && (
              <Prose className={cn("mt-6", dark && "text-linen-300")}>
                {data.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
              </Prose>
            )}

            {data.quote && (
              <blockquote
                className={cn(
                  "mt-8 border-l pl-5 font-display text-display-sm font-light italic",
                  dark ? "border-clay-500 text-linen-100" : "border-clay-500 text-carbon-800",
                )}
              >
                {data.quote}
              </blockquote>
            )}

            {data.cta.label && (
              <Link
                href={data.cta.href}
                className={cn(
                  buttonVariants({
                    variant: dark ? "ghostLight" : "outline",
                    size: "lg",
                    uppercase: true,
                  }),
                  "mt-9",
                )}
              >
                {data.cta.label}
              </Link>
            )}
          </Reveal>

          {/* Fotografía */}
          {imageUrl && (
            <Reveal delay={0.12}>
              <div className="relative aspect-[4/5] w-full overflow-hidden lg:aspect-[3/4]">
                <Image
                  src={imageUrl}
                  alt={media.imageAlt || ""}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03]"
                />
              </div>
            </Reveal>
          )}
        </div>
      </Container>
    </Section>
  );
}
