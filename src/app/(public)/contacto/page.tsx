import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { getSettings } from "@/domain/settings/service";
import { ContactForm } from "@/components/site/contact-form";
import { Container, Eyebrow, Heading, Prose } from "@/ui/layout";

export async function generateMetadata(): Promise<Metadata> {
  const { company } = await getSettings();
  return {
    title: "Contacto",
    description: `Escribinos por WhatsApp a ${company.phone} o por mail a ${company.email}.`,
    alternates: { canonical: "/contacto" },
  };
}

export default async function ContactPage() {
  const { company, club } = await getSettings();

  return (
    <Container className="pb-section pt-4">
      <Eyebrow>Contacto</Eyebrow>
      <Heading level={1} size="lg" className="mt-4 max-w-[20ch]">
        Escribinos y te respondemos.
      </Heading>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <ContactForm clubEnabled={club.enabled} />

        <aside className="space-y-8">
          {/*
            Dos canales y nada más: el WhatsApp y el mail. No hay local a la
            calle, así que publicar un domicilio sólo lograría que alguien se
            tome el viaje al pedo. El número va escrito y no detrás de la
            palabra "WhatsApp": quien prefiera llamar o agendarlo lo necesita
            a la vista.
          */}
          <div>
            <Eyebrow>Directo</Eyebrow>
            <ul className="mt-4 space-y-3 text-[15px]">
              <li>
                <a href={`mailto:${company.email}`} className="flex items-center gap-3 hover:text-accent-700">
                  <Mail className="size-4 shrink-0 text-clay-500" />
                  {company.email}
                </a>
              </li>
              {company.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${company.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:text-accent-700"
                  >
                    <MessageCircle className="size-4 shrink-0 text-clay-500" />
                    {company.phone}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <Eyebrow>Tiempos de respuesta</Eyebrow>
            <Prose className="mt-4">
              Consultas generales: hasta 48 horas hábiles. Si es sobre un pedido en curso,
              incluí el número de pedido y lo priorizamos.
            </Prose>
          </div>
        </aside>
      </div>
    </Container>
  );
}
