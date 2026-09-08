import type { Metadata } from "next";
import { getSettings } from "@/domain/settings/service";
import { getCartCount } from "@/domain/cart/service";
import { getSession } from "@/infra/auth/session";
import { PromoBar } from "@/components/site/promo-bar";
import { SiteTopbar } from "@/components/site/site-topbar";
import { SidebarColumn, type SidebarItem } from "@/components/site/site-sidebar";
import { TrustBar } from "@/components/site/trust-bar";
import { SiteFooter } from "@/components/site/site-footer";
import { RevealNoFlashScript, RevealObserver } from "@/ui/reveal-observer";

export const metadata: Metadata = {
  title: "Atul · maqueta 1",
  robots: { index: false, follow: false },
};

/*
  Primera maqueta, viva en paralelo con la de "/" para comparar.

  Comparte todos los componentes de tienda con la principal; lo que cambia es
  la configuración: el logo va centrado en la barra superior en lugar del menú,
  el menú no incluye Inicio, la firma es otra y los avisos de arriba llevan
  segunda línea. Reutiliza en vez de duplicar: si se arregla un componente,
  las dos maquetas lo heredan.
*/
const NAV: SidebarItem[] = [
  { label: "Vinos", href: "/vinos", icon: "wine" },
  { label: "Box", href: "/box", icon: "box" },
  { label: "Novedades", href: "/novedades", icon: "nuevo" },
  { label: "Ofertas", href: "/ofertas", icon: "oferta" },
];

const NAV_SECUNDARIA: SidebarItem[] = [
  { label: "Quiénes somos", href: "/quienes-somos", icon: "nosotros" },
  { label: "Contacto", href: "/contacto", icon: "contacto" },
];

const TAGLINE = ["Buenos vinos", "Mejores historias"];

export default async function MaquetaUnoLayout({ children }: { children: React.ReactNode }) {
  const [settings, cartCount, session] = await Promise.all([
    getSettings(),
    getCartCount(),
    getSession(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col bg-bone">
      <RevealNoFlashScript />
      <RevealObserver />

      <PromoBar conDetalle />

      <div className="flex flex-1">
        <SidebarColumn items={NAV} secundarios={NAV_SECUNDARIA} tagline={TAGLINE} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Acá el logo sí va en la barra superior, centrado. */}
          <SiteTopbar
            companyName={settings.company.name}
            logoUrl={settings.company.logoUrl}
            cartCount={cartCount}
            isLoggedIn={Boolean(session)}
            nav={NAV}
            navSecundaria={NAV_SECUNDARIA}
            tagline={TAGLINE}
          />

          <main id="contenido" className="flex-1">
            {children}
          </main>

          <TrustBar />
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
