import { getActiveBanners } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { getCartCount } from "@/domain/cart/service";
import { getSession } from "@/infra/auth/session";
import { SiteHeader, type NavItem } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

const NAV: NavItem[] = [
  { label: "Vinos", href: "/vinos" },
  { label: "Club", href: "/club" },
  { label: "Nuestra historia", href: "/historia" },
  { label: "Historias", href: "/historias" },
  { label: "Contacto", href: "/contacto" },
];

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, banners, cartCount, session] = await Promise.all([
    getSettings(),
    getActiveBanners("top"),
    getCartCount(),
    getSession(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        nav={NAV}
        companyName={settings.company.name}
        logoUrl={settings.company.logoUrl}
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

      {/*
        El header es fijo. Las páginas con hero a pantalla completa marcan su
        primer bloque con data-hero y el main quita el padding superior.
      */}
      <main
        id="contenido"
        className="flex-1 pt-[calc(3.5rem+2rem)] has-[[data-hero]]:pt-0 lg:pt-[calc(72px+2rem)]"
      >
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
