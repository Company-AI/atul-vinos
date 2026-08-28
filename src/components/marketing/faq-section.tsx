import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { BlockData } from "@/domain/cms/blocks";
import { getFaqs } from "@/domain/cms/service";
import { Container, Eyebrow, Heading, Section } from "@/ui/layout";
import { Reveal } from "@/ui/reveal";

export async function FaqSection({ data, id }: { data: BlockData<"faq">; id?: string }) {
  const faqs = await getFaqs(data.group);
  if (faqs.length === 0) return null;

  return (
    <Section tone="light" id={id}>
      <Container size="narrow">
        <Reveal className="mb-10">
          {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}
          <Heading size="md" className="mt-5">{data.title}</Heading>
        </Reveal>

        <Accordion.Root type="single" collapsible className="border-t border-linen-300">
          {faqs.map((faq) => (
            <Accordion.Item key={faq.id} value={faq.id} className="border-b border-linen-300">
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left">
                  <span className="text-[15px] font-medium text-carbon-900">{faq.question}</span>
                  <ChevronDown className="size-4 shrink-0 text-stone-500 transition-transform duration-[280ms] group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[fade-in_160ms_ease-out_reverse] data-[state=open]:animate-[fade-in_240ms_ease-out]">
                <p className="max-w-[62ch] pb-5 text-[14px] leading-relaxed text-stone-600">
                  {faq.answer}
                </p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </Container>
    </Section>
  );
}
