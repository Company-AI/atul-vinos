import { getActiveBanners } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { getCartCount } from "@/domain/cart/service";
import { getSession } from "@/infra/auth/session";
import { SiteHeader, type NavItem } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { RevealNoFlashScript, RevealObserver } from "@/ui/reveal-observer";

/*
  El Club sale del menú para el lanzamiento: sin stock profundo por etiqueta,
  prometer una caja distinta cada mes se rompe al segundo mes. El motor de
  suscripciones queda intacto y volver a mostrarlo es agregar el ítem acá.
*/
const NAV: NavItem[] = [
  { label: "Vinos", href: "/vinos" },
  { label: "Box", href: "/box" },
  { label: "Quiénes somos", href: "/quienes-somos" },
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
      <RevealNoFlashScript />
      <RevealObserver />

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
        className="flex-1 pt-[calc(4rem+1rem)] has-[[data-hero]]:pt-0 lg:pt-[calc(84px+1rem)]"
      >
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
