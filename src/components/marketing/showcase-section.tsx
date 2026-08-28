import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlockData } from "@/domain/cms/blocks";
import { Container, Eyebrow, Heading, Prose, Section } from "@/ui/layout";
import { Reveal } from "@/ui/reveal";

/** Grilla de líneas o colecciones, con fotografía grande y poco texto. */
export function ShowcaseSection({ data }: { data: BlockData<"showcase"> }) {
  const dark = data.tone === "dark";

  return (
    <Section tone={data.tone}>
      <Container>
        <Reveal className="mb-12 max-w-2xl">
          {data.eyebrow && <Eyebrow className={dark ? "text-clay-400" : "text-stone-500"}>{data.eyebrow}</Eyebrow>}
          <Heading size="md" className="mt-5">{data.title}</Heading>
          {data.body && <Prose className="mt-5">{data.body}</Prose>}
        </Reveal>

        <ul className="grid gap-px overflow-hidden border border-linen-300 bg-linen-300 sm:grid-cols-2 lg:grid-cols-4">
          {data.items.map((item, i) => (
            <li key={`${item.title}-${i}`}>
              <Reveal delay={i * 0.08}>
                <Link
                  href={item.href}
                  className="group relative block aspect-[3/4] overflow-hidden bg-carbon-900"
                >
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover opacity-70 transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] group-hover:opacity-85"
                    />
                  )}
                  <span aria-hidden className="absolute inset-0 scrim-bottom" />
                  <span className="absolute inset-x-0 bottom-0 p-6">
                    <span className="block font-display text-display-sm font-light text-bone">
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="mt-1 block text-[13px] leading-snug text-linen-300">
                        {item.subtitle}
                      </span>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-bone opacity-0 transition-opacity duration-[280ms] group-hover:opacity-100">
                      Ver la línea
                      <ArrowRight className="size-3.5" />
                    </span>
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>

        {data.cta.label && (
          <Reveal className="mt-10">
            <Link
              href={data.cta.href}
              className="inline-flex items-center gap-2 text-sm underline underline-offset-4 transition-colors hover:text-wine-700"
            >
              {data.cta.label}
              <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        )}
      </Container>
    </Section>
  );
}
