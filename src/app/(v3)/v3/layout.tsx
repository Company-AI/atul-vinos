import type { Metadata } from "next";
import { getActiveBanners } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { getCartCount } from "@/domain/cart/service";
import { getSession } from "@/infra/auth/session";
import { SiteHeader, type NavItem } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { TrustBar } from "@/components/site/trust-bar";
import { RevealNoFlashScript, RevealObserver } from "@/ui/reveal-observer";

export const metadata: Metadata = {
  title: "Atul · maqueta 3",
  robots: { index: false, follow: false },
};

/*
  Maqueta 3 — rediseño completo sobre la línea visual de "/".

  Mantiene el sistema: hueso de fondo, azul del logo como único acento de
  marca, granate reservado a ofertas, Cormorant en los títulos, Parisienne en
  la firma, packshots reales, reglas de un pixel y radios chicos.

  Lo que cambia es el esqueleto. "/" y "/v2" son las dos la misma planta:
  barra lateral fija a la izquierda con el menú en vertical. Acá no hay barra
  lateral: el header ocupa todo el ancho con el logotipo centrado y el menú en
  horizontal, así el contenido gana la medida completa y la página se lee como
  un catálogo impreso en lugar de un panel.

  Los avisos van adentro del header y se retraen al scrollear, en vez de la
  franja fija de arriba. Reutiliza SiteHeader —que ya trae carrito, buscador y
  menú mobile— en lugar de duplicar un header propio.
*/
const NAV: NavItem[] = [
  { label: "Vinos", href: "/vinos" },
  { label: "Box", href: "/box" },
  { label: "Novedades", href: "/novedades" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Quiénes somos", href: "/quienes-somos" },
];

export default async function MaquetaTresLayout({ children }: { children: React.ReactNode }) {
  const [settings, banners, cartCount, session] = await Promise.all([
    getSettings(),
    getActiveBanners("top"),
    getCartCount(),
    getSession(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col bg-bone">
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

      {/* El header es fijo: la compensación va acá, como en /mi-cuenta. */}
      <main id="contenido" className="flex-1 pt-16 lg:pt-[84px]">
        {children}
      </main>

      <TrustBar />
      <SiteFooter />
    </div>
  );
}
