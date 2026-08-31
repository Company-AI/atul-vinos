import type { Metadata } from "next";
import { getActiveBanners } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { getCartCount } from "@/domain/cart/service";
import { getSession } from "@/infra/auth/session";
import { SiteHeader, type NavItem } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { RevealNoFlashScript, RevealObserver } from "@/ui/reveal-observer";
import { VariantSwitcher } from "@/components/variants/chrome";

/*
  Las direcciones de diseño son internas y van noindex: prerenderizarlas no
  aporta nada y obliga a tener base disponible durante el build.
*/
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Oscuro · Dirección de diseño",
  robots: { index: false, follow: false },
};

const NAV: NavItem[] = [
  { label: "Vinos", href: "/vinos" },
  { label: "Club", href: "/club" },
  { label: "Nuestra historia", href: "/historia" },
  { label: "Historias", href: "/historias" },
  { label: "Contacto", href: "/contacto" },
];

/**
 * /v8 es la home principal en oscuro: mismo layout, mismo header, mismo footer
 * y los mismos bloques del CMS que "/". Lo único que cambia es el atributo
 * data-theme, que reasigna la paleta en globals.css. No hay componentes
 * propios a propósito: si mañana se cambia una sección de la home, esta
 * versión la hereda sola.
 */
export default async function OscuroLayout({ children }: { children: React.ReactNode }) {
  const [settings, banners, cartCount, session] = await Promise.all([
    getSettings(),
    getActiveBanners("top"),
    getCartCount(),
    getSession(),
  ]);

  return (
    <div data-theme="oscuro" className="flex min-h-dvh flex-col">
      <RevealNoFlashScript />
      <RevealObserver />

      <SiteHeader
        nav={NAV}
        companyName={settings.company.name}
        logoUrl={settings.company.logoLightUrl}
        logoLightUrl={settings.company.logoLightUrl}
        cartCount={cartCount}
        isLoggedIn={Boolean(session)}
        announcements={banners.map((b) => ({
          id: b.id,
          message: b.message,
          linkUrl: b.linkUrl,
          linkLabel: b.linkLabel,
        }))}
      />

      <main
        id="contenido"
        className="flex-1 pt-[calc(3.5rem+2rem)] has-[[data-hero]]:pt-0 lg:pt-[calc(72px+2rem)]"
      >
        {children}
      </main>

      <SiteFooter />

      {/* Espacio para que la barra de comparación no tape el pie. */}
      <div aria-hidden className="h-16" />
      <VariantSwitcher current="oscuro" />
    </div>
  );
}
