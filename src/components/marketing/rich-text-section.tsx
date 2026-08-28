import type { BlockData } from "@/domain/cms/blocks";
import { Container, Eyebrow, Heading, Prose, Section } from "@/ui/layout";
import { Reveal } from "@/ui/reveal";

export function RichTextSection({ data }: { data: BlockData<"rich_text"> }) {
  return (
    <Section tone={data.tone} density="compact">
      <Container size="narrow">
        <Reveal>
          {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}
          {data.title && <Heading size="md" className="mt-5">{data.title}</Heading>}
          {data.body && (
            <Prose className="mt-6">
              {data.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
            </Prose>
          )}
        </Reveal>
      </Container>
    </Section>
  );
}
