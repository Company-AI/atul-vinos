import type { BlockData } from "@/domain/cms/blocks";
import { cn } from "@/lib/cn";
import { Container, Eyebrow, Heading, Section } from "@/ui/layout";
import { Reveal, stagger } from "@/ui/reveal";

/**
 * Cifras clave separadas por líneas finas. Da escala al negocio sin adjetivos:
 * los números los administra el CMS, no están escritos en el componente.
 */
export function FiguresSection({ data, id }: { data: BlockData<"figures">; id?: string }) {
  const dark = data.tone === "dark";
  if (data.items.length === 0) return null;

  return (
    <Section tone={data.tone} density="compact" id={id}>
      <Container>
        {(data.eyebrow || data.title) && (
          <Reveal className="mb-14 max-w-2xl">
            {data.eyebrow && (
              <Eyebrow className={dark ? "text-clay-400" : "text-stone-500"}>{data.eyebrow}</Eyebrow>
            )}
            {data.title && <Heading size="md" className="mt-5">{data.title}</Heading>}
          </Reveal>
        )}

        <dl
          className={cn(
            "grid gap-x-10 gap-y-12 sm:grid-cols-2",
            data.items.length % 3 === 0 ? "lg:grid-cols-3" : "lg:grid-cols-4",
          )}
        >
          {data.items.map((item, i) => (
            <div
              key={`${item.label}-${i}`}
              data-reveal
              style={stagger(i)}
              className={cn(
                "border-t pt-6",
                dark ? "border-carbon-600" : "border-linen-300",
              )}
            >
              <dt className="sr-only">{item.label}</dt>
              <dd>
                <p
                  className={cn(
                    "font-display text-display-md font-light tabular",
                    dark ? "text-bone" : "text-carbon-900",
                  )}
                >
                  {item.value}
                </p>
                <p className={cn("mt-3 text-[15px]", dark ? "text-linen-200" : "text-carbon-800")}>
                  {item.label}
                </p>
                {item.detail && (
                  <p
                    className={cn(
                      "mt-1.5 text-[13px] leading-relaxed",
                      dark ? "text-stone-400" : "text-stone-500",
                    )}
                  >
                    {item.detail}
                  </p>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
