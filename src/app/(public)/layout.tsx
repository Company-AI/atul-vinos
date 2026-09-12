import { getActiveBanners } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { getCartCount } from "@/domain/cart/service";
import { getSession } from "@/infra/auth/session";
import { PromoBar } from "@/components/site/promo-bar";
import { SiteTopbar } from "@/components/site/site-topbar";
import type { SidebarItem } from "@/components/site/site-sidebar";
import { TrustBar } from "@/components/site/trust-bar";
import { SiteFooter } from "@/components/site/site-footer";
import { RevealNoFlashScript, RevealObserver } from "@/ui/reveal-observer";

/*
  El Club no se lanza todavía: sin stock profundo por etiqueta, prometer una
  caja distinta cada mes se rompe al segundo mes. El motor de suscripciones
  queda intacto y volver a mostrarlo es agregar el ítem acá.
*/
const NAV: SidebarItem[] = [
  { label: "Inicio", href: "/", icon: "inicio" },
  { label: "Vinos", href: "/vinos", icon: "wine" },
  { label: "Box", href: "/box", icon: "box" },
  { label: "Novedades", href: "/novedades", icon: "nuevo" },
  { label: "Ofertas", href: "/ofertas", icon: "oferta" },
];

const NAV_SECUNDARIA: SidebarItem[] = [
  { label: "Quiénes somos", href: "/quienes-somos", icon: "nosotros" },
  { label: "Contacto", href: "/contacto", icon: "contacto" },
];

const TAGLINE = ["Vinos", "que", "conectan"];

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, cartCount, session] = await Promise.all([
    getSettings(),
    getCartCount(),
    getSession(),
  ]);

  // Los banners del CMS siguen disponibles, pero la franja fija de beneficios
  // los reemplaza en la parte superior.
  void getActiveBanners;

  return (
    <div className="flex min-h-dvh flex-col bg-bone">
      <RevealNoFlashScript />
      <RevealObserver />

      <PromoBar remate="Buenos vinos, personas reales." />

      {/*
        Sin columna lateral fija: el menú se repliega detrás de las tres
        rayitas, arriba a la izquierda, y se despliega como cajón. Lo pidió el
        cliente y además le devuelve a la tienda los 212px que ocupaba la
        columna, que es ancho de góndola. La columna sigue existiendo en el
        componente y la usa "/v2", que se mantiene como alternativa.
      */}
      <div className="flex min-w-0 flex-1 flex-col">
        <SiteTopbar
          companyName={settings.company.name}
          logoUrl={settings.company.logoUrl}
          menuSiempreVisible
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
  );
}
