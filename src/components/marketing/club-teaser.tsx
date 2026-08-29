import Link from "next/link";
import { BackgroundMedia } from "./background-media";
import { Check } from "lucide-react";
import type { BlockData } from "@/domain/cms/blocks";
import { buttonVariants } from "@/ui/button";
import { cn } from "@/lib/cn";
import { Container, Eyebrow, Heading, Prose } from "@/ui/layout";
import { Reveal } from "@/ui/reveal";

/** Invitación al Club: la sección más importante de la home. */
export function ClubTeaser({ data }: { data: BlockData<"club_teaser"> }) {
  const imageUrl = data.media.imageUrl || data.media.posterUrl;

  return (
    <section className="on-dark relative isolate overflow-hidden bg-carbon-900 text-linen-100">
      {imageUrl && (
        <BackgroundMedia
          media={{
            imageUrl,
            imageAlt: data.media.imageAlt,
            posterUrl: data.media.posterUrl,
            videoDesktopUrl: data.media.videoDesktopUrl,
            videoMobileUrl: data.media.videoMobileUrl,
          }}
          imageClassName="opacity-35"
        />
      )}
      <div aria-hidden className="absolute inset-0 -z-10 bg-carbon-950/55" />
      <div aria-hidden className="absolute inset-0 -z-10 scrim-full" />

      <Container className="py-section">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20">
          <Reveal>
            {data.eyebrow && <Eyebrow className="text-gold-400">{data.eyebrow}</Eyebrow>}
            <Heading size="lg" className="mt-5 text-bone">{data.title}</Heading>
            {data.body && <Prose className="mt-6 text-linen-300">{data.body}</Prose>}

            {data.cta.label && (
              <Link
                href={data.cta.href}
                className={cn(
                  buttonVariants({ variant: "primary", size: "lg", uppercase: true }),
                  "mt-10",
                )}
              >
                {data.cta.label}
              </Link>
            )}
          </Reveal>

          {data.bullets.length > 0 && (
            <Reveal delay={0.12}>
              <ul className="divide-y divide-carbon-700 border-y border-carbon-700">
                {data.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 py-4">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold-500" />
                    <span className="text-[15px] leading-relaxed text-linen-200">{bullet}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
      </Container>
    </section>
  );
}
