import type { BlockData } from "@/domain/cms/blocks";
import { cn } from "@/lib/cn";
import { Container, Eyebrow, Heading, Prose, Section } from "@/ui/layout";
import { Reveal } from "@/ui/reveal";

/** Pasos numerados: cómo funciona el Club, cómo se hace el vino. */
export function StepsSection({ data, id }: { data: BlockData<"steps">; id?: string }) {
  const dark = data.tone === "dark";

  return (
    <Section tone={data.tone} id={id}>
      <Container>
        <Reveal className="mb-14 max-w-2xl">
          {data.eyebrow && <Eyebrow className={dark ? "text-clay-400" : "text-stone-500"}>{data.eyebrow}</Eyebrow>}
          <Heading size="md" className="mt-5">{data.title}</Heading>
          {data.body && <Prose className="mt-5">{data.body}</Prose>}
        </Reveal>

        <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {data.steps.map((step, i) => (
            <li key={step.title}>
              <Reveal delay={i * 0.08}>
                <p
                  className={cn(
                    "font-display text-display-md font-light",
                    dark ? "text-clay-400" : "text-clay-500",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </p>
                <div className={cn("mt-4 h-px w-10", dark ? "bg-carbon-600" : "bg-linen-300")} />
                <h3 className={cn("mt-5 font-sans text-[15px] font-medium", dark && "text-bone")}>
                  {step.title}
                </h3>
                {step.body && (
                  <p className={cn("mt-2 text-[14px] leading-relaxed", dark ? "text-stone-400" : "text-stone-600")}>
                    {step.body}
                  </p>
                )}
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
