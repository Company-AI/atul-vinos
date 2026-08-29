import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getSettings } from "@/domain/settings/service";
import { ContactForm } from "@/components/site/contact-form";
import { Container, Eyebrow, Heading, Prose } from "@/ui/layout";

export async function generateMetadata(): Promise<Metadata> {
  const { company } = await getSettings();
  return {
    title: "Contacto",
    description: `Escribinos o visitanos en ${company.city}, ${company.province}.`,
    alternates: { canonical: "/contacto" },
  };
}

export default async function ContactPage() {
  const { company } = await getSettings();

  return (
    <Container className="pb-section pt-4">
      <Eyebrow>Contacto</Eyebrow>
      <Heading level={1} size="lg" className="mt-4 max-w-[20ch]">
        Escribinos y te respondemos.
      </Heading>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <ContactForm />

        <aside className="space-y-8">
          <div>
            <Eyebrow>Dónde estamos</Eyebrow>
            <address className="mt-4 flex gap-3 text-[15px] not-italic leading-relaxed text-carbon-800">
              <MapPin className="mt-1 size-4 shrink-0 text-clay-500" />
              <span>
                {company.addressLine}<br />
                {company.city}, {company.province} ({company.postalCode})
              </span>
            </address>
            <p className="mt-3 text-[13px] text-stone-500">
              Visitas guiadas con degustación de martes a sábado, con reserva previa.
            </p>
          </div>

          <div>
            <Eyebrow>Directo</Eyebrow>
            <ul className="mt-4 space-y-3 text-[15px]">
              <li>
                <a href={`mailto:${company.email}`} className="flex items-center gap-3 hover:text-wine-700">
                  <Mail className="size-4 shrink-0 text-clay-500" />
                  {company.email}
                </a>
              </li>
              <li>
                <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 hover:text-wine-700">
                  <Phone className="size-4 shrink-0 text-clay-500" />
                  {company.phone}
                </a>
              </li>
              {company.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${company.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:text-wine-700"
                  >
                    <MessageCircle className="size-4 shrink-0 text-clay-500" />
                    WhatsApp
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
