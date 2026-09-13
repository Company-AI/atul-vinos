import type { Metadata } from "next";
import { getSettings } from "@/domain/settings/service";
import { getCartCount } from "@/domain/cart/service";
import { getSession } from "@/infra/auth/session";
import { CabeceraV4 } from "./_componentes/cabecera";
import { MarcaAtul } from "./_componentes/marca";
import { listarZonasEnvio } from "./_componentes/zonas";
import "./v4.css";

export const metadata: Metadata = {
  title: "Atul · maqueta 4",
  robots: { index: false, follow: false },
};

/*
  Maqueta 4 — port del prototipo que devolvió la IA a partir del brief.

  Es un calco de la UI del prototipo (Norware/atul-vinos-site), no una
  reinterpretación: mismo CSS, mismas medidas, mismo markup. Lo que cambia es
  de dónde salen los datos: el prototipo lee un JSON local y acá el catálogo,
  el carrito y la configuración salen del proyecto real.

  El CSS vive en v4.css acotado a `.v4`, así que no se filtra a "/", "/v2" ni
  "/v3", que siguen con el sistema de tokens de Tailwind.
*/
export default async function MaquetaCuatroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, cartCount, session, zonas] = await Promise.all([
    getSettings(),
    getCartCount(),
    getSession(),
    listarZonasEnvio(),
  ]);

  const { company } = settings;

  return (
    <div className="v4">
      <CabeceraV4
        avisoEnvio="Envío gratis en Río Cuarto, Las Higueras y Holmberg."
        cartCount={cartCount}
        isLoggedIn={Boolean(session)}
        zonas={zonas}
      />

      <main id="top">{children}</main>

      <footer>
        <div className="footer-main section-shell">
          <div className="brand footer-brand">
            <MarcaAtul tono="crema" />
          </div>

          <div>
            <strong>Tienda</strong>
            <a href="#catalogo">Vinos</a>
            <a href="#cajas">Cajas</a>
            <a href="#ofertas">Ofertas</a>
          </div>

          <div>
            <strong>Ayuda</strong>
            <a href="#quienes">Quiénes somos</a>
            <a href="/envios">Envíos y retiros</a>
            <a href="/contacto">Contacto</a>
          </div>

          <div className="footer-phrase">Más que vinos, encuentros</div>
        </div>

        <div className="footer-bottom">
          {company.name} · Vinos · {company.city}, {company.province}
        </div>
      </footer>
    </div>
  );
}
