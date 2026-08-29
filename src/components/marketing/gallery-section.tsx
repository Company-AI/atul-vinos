import Image from "next/image";
import type { BlockData } from "@/domain/cms/blocks";
import { cn } from "@/lib/cn";
import { Container, Eyebrow, Heading, Prose, Section } from "@/ui/layout";
import { Reveal, stagger } from "@/ui/reveal";

/**
 * Mosaico asimétrico. Las fotos entran con cortina y en distinto momento,
 * así la grilla no aparece de golpe como un tablero.
 */
export function GallerySection({ data, id }: { data: BlockData<"gallery">; id?: string }) {
  const dark = data.tone === "dark";
  const items = data.items.filter((item) => item.imageUrl);
  if (items.length === 0) return null;

  return (
    <Section tone={data.tone} id={id}>
      <Container>
        {(data.eyebrow || data.title || data.body) && (
          <Reveal className="mb-14 max-w-2xl">
            {data.eyebrow && (
              <Eyebrow className={dark ? "text-clay-400" : "text-stone-500"}>{data.eyebrow}</Eyebrow>
            )}
            {data.title && <Heading size="md" className="mt-5">{data.title}</Heading>}
            {data.body && (
              <Prose className={cn("mt-5", dark && "text-stone-400")}>{data.body}</Prose>
            )}
          </Reveal>
        )}

        <div className="grid auto-rows-[minmax(0,14rem)] grid-cols-2 gap-3 sm:auto-rows-[minmax(0,16rem)] lg:grid-cols-4 lg:gap-4">
          {items.map((item, i) => (
            <figure
              key={`${item.imageUrl}-${i}`}
              data-reveal="mask"
              style={stagger(i, 0.07)}
              className={cn(
                "group relative overflow-hidden bg-carbon-800",
                item.size === "tall" && "row-span-2",
                item.size === "wide" && "col-span-2",
              )}
            >
              <Image
                src={item.imageUrl}
                alt={item.imageAlt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-[1100ms] ease-out-expo group-hover:scale-[1.04]"
              />
              {item.caption && (
                <>
                  <div aria-hidden className="absolute inset-0 scrim-bottom opacity-0 transition-opacity duration-[280ms] group-hover:opacity-100" />
                  <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 p-4 text-[12px] tracking-wide text-bone opacity-0 transition-all duration-[280ms] group-hover:translate-y-0 group-hover:opacity-100">
                    {item.caption}
                  </figcaption>
                </>
              )}
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  );
}
