import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "./social-icons";
import { getSection } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { Container } from "@/ui/layout";
import { NewsletterForm } from "./newsletter-form";

export async function SiteFooter() {
  const [footer, settings] = await Promise.all([
    getSection("footer.main", "footer"),
    getSettings(),
  ]);
  const { company, legal } = settings;

  const socials = [
    { href: company.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: company.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: company.youtube, label: "YouTube", Icon: YoutubeIcon },
  ].filter((s) => s.href);

  return (
    <footer className="on-dark bg-carbon-900 text-linen-200">
      <Container className="py-section-sm">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr_1.4fr]">
          {/* Marca */}
          <div>
            <Image
              src={company.logoLightUrl}
              alt={company.name}
              width={200}
              height={40}
              className="h-9 w-auto"
            />
            {footer.tagline && (
              <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-stone-400">
                {footer.tagline}
              </p>
            )}

            <ul className="mt-6 space-y-2 text-[13px] text-stone-400">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  {company.addressLine}, {company.city}, {company.province}
                </span>
              </li>
              <li>
                <a href={`mailto:${company.email}`} className="flex items-center gap-2 hover:text-bone">
                  <Mail className="size-3.5 shrink-0" />
                  {company.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${company.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-bone"
                >
                  <Phone className="size-3.5 shrink-0" />
                  {company.phone}
                </a>
              </li>
            </ul>

            {socials.length > 0 && (
              <ul className="mt-6 flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="grid size-9 place-items-center rounded-sm border border-carbon-600 text-linen-200 transition-colors hover:border-linen-300 hover:text-bone"
                    >
                      <Icon className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Navegación */}
          <nav aria-label="Footer" className="grid gap-8 sm:grid-cols-3">
            {footer.columns.map((column) => (
              <div key={column.title}>
                <p className="eyebrow mb-4 text-stone-500">{column.title}</p>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.href}`}>
                      <Link
                        href={link.href}
                        className="text-[14px] text-linen-200 transition-colors hover:text-bone"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Newsletter */}
          <div>
            <p className="eyebrow mb-4 text-stone-500">
              {footer.newsletterTitle || "Novedades"}
            </p>
            {footer.newsletterBody && (
              <p className="mb-5 max-w-xs text-[14px] leading-relaxed text-stone-400">
                {footer.newsletterBody}
              </p>
            )}
            <NewsletterForm source="footer" />
          </div>
        </div>

        {/* Legales y consumo responsable */}
        <div className="mt-14 border-t border-carbon-700 pt-8">
          <p className="max-w-2xl text-[12px] leading-relaxed text-stone-500">
            {footer.responsibleNote || legal.responsibleDrinking} {legal.minorsNotice}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-[12px] text-stone-500">
            <p>
              © {new Date().getFullYear()} {company.legalName}. Todos los derechos reservados.
            </p>
            <div className="flex gap-4">
              <Link href={legal.termsUrl} className="hover:text-linen-200">Términos</Link>
              <Link href={legal.privacyUrl} className="hover:text-linen-200">Privacidad</Link>
              <Link href={legal.returnsUrl} className="hover:text-linen-200">Cambios y devoluciones</Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
