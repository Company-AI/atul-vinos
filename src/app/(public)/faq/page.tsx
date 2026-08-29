import type { Metadata } from "next";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { prisma } from "@/infra/db/prisma";
import { Container, Eyebrow, Heading, Prose } from "@/ui/layout";
import { EmptyState } from "@/ui/empty-state";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Envíos, pagos, el Club y todo lo que suelen preguntarnos.",
  alternates: { canonical: "/faq" },
};

const GROUP_LABELS: Record<string, string> = {
  general: "General",
  envios: "Envíos",
  pagos: "Pagos",
  club: "El Club",
};

export default async function FaqPage() {
  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
  });

  const groups = [...new Set(faqs.map((faq) => faq.group))];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <Container size="narrow" className="pb-section pt-4">
        <Eyebrow>Ayuda</Eyebrow>
        <Heading level={1} size="md" className="mt-4">
          Preguntas frecuentes
        </Heading>
        <Prose className="mt-5">
          Si no encontrás lo que buscás, escribinos y te respondemos.
        </Prose>

        {faqs.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="Todavía no cargamos preguntas"
              description="Mientras tanto, podés escribirnos desde la página de contacto."
            />
          </div>
        ) : (
          <div className="mt-12 space-y-12">
            {groups.map((group) => (
              <section key={group}>
                <h2 className="eyebrow mb-4 text-stone-500">
                  {GROUP_LABELS[group] ?? group}
                </h2>
                <Accordion.Root type="single" collapsible className="border-t border-linen-300">
                  {faqs
                    .filter((faq) => faq.group === group)
                    .map((faq) => (
                      <Accordion.Item key={faq.id} value={faq.id} className="border-b border-linen-300">
                        <Accordion.Header>
                          <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left">
                            <span className="text-[15px] font-medium text-carbon-900">
                              {faq.question}
                            </span>
                            <ChevronDown className="size-4 shrink-0 text-stone-500 transition-transform group-data-[state=open]:rotate-180" />
                          </Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content>
                          <p className="max-w-[62ch] pb-5 text-[15px] leading-relaxed text-stone-600">
                            {faq.answer}
                          </p>
                        </Accordion.Content>
                      </Accordion.Item>
                    ))}
                </Accordion.Root>
              </section>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
