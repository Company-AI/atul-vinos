import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlockData } from "@/domain/cms/blocks";
import { cn } from "@/lib/cn";
import { Container, Eyebrow, Heading, Section } from "@/ui/layout";
import { Reveal, stagger } from "@/ui/reveal";

/**
 * Tira de novedades, promos y box.
 *
 * Se recorre en horizontal con snap en lugar de rotar sola: el visitante
 * controla el ritmo, no hay temporizador que le mueva el contenido bajo el
 * cursor y funciona sin JavaScript. La tira sangra hacia la derecha para que
 * se vea que hay más de lo que entra en pantalla.
 */
export function PromoRail({ data, id }: { data: BlockData<"promo_rail">; id?: string }) {
  const items = data.items.filter((i) => i.title);
  if (items.length === 0) return null;

  const dark = data.tone === "dark";

  return (
    <Section tone={data.tone} density="compact" id={id}>
      {(data.eyebrow || data.title) && (
        <Container className="mb-8">
          <Reveal>
            {data.eyebrow && (
              <Eyebrow className={dark ? "text-clay-400" : "text-stone-500"}>{data.eyebrow}</Eyebrow>
            )}
            {data.title && <Heading size="sm" className="mt-3">{data.title}</Heading>}
          </Reveal>
        </Container>
      )}

      <div className="rail-snap gap-4 px-gutter pb-3 sm:gap-5">
        {items.map((item, i) => (
          <article
            key={item.title}
            data-reveal
            style={stagger(i, 0.06)}
            className="w-[78vw] max-w-[380px] sm:w-[44vw] lg:w-[31%]"
          >
            <Link
              href={item.href}
              className={cn(
                "group flex h-full flex-col overflow-hidden rounded-md border transition-colors",
                dark
                  ? "border-carbon-700 bg-carbon-800 hover:border-carbon-600"
                  : "border-linen-200 bg-bone-pure hover:border-linen-300",
              )}
            >
              {item.imageUrl && (
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-linen-100">
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 78vw, (max-width: 1024px) 44vw, 31vw"
                    className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.04]"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col p-5">
                {item.kicker && (
                  <p className={cn("eyebrow", dark ? "text-clay-400" : "text-wine-700")}>
                    {item.kicker}
                  </p>
                )}
                <h3
                  className={cn(
                    "mt-2.5 font-display text-display-sm font-light",
                    dark ? "text-bone" : "text-carbon-900",
                  )}
                >
                  {item.title}
                </h3>
                {item.body && (
                  <p
                    className={cn(
                      "mt-2.5 flex-1 text-[14px] leading-relaxed",
                      dark ? "text-stone-400" : "text-stone-600",
                    )}
                  >
                    {item.body}
                  </p>
                )}
                <span
                  className={cn(
                    "mt-5 inline-flex items-center gap-2 text-[13px] font-medium",
                    dark ? "text-clay-400" : "text-wine-700",
                  )}
                >
                  {item.cta || "Ver más"}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </Section>
  );
}
