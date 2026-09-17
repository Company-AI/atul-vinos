import type { Metadata } from "next";
import { getCartCount } from "@/domain/cart/service";
import { getSession } from "@/infra/auth/session";
import { CabeceraV2 } from "./_componentes/cabecera";
import "./v2.css";

export const metadata: Metadata = {
  title: "Atul · maqueta 2",
  robots: { index: false, follow: false },
};

/*
  Maqueta 2 — calco de la captura que pasó el cliente.

  La captura llega hasta la grilla de productos y no muestra pie de página,
  así que acá tampoco hay: el pedido fue reproducir la imagen, y agregar un
  pie sería inventar una parte que nadie aprobó.
*/
export default async function MaquetaDosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cartCount, session] = await Promise.all([getCartCount(), getSession()]);

  return (
    <div className="v2">
      <CabeceraV2 cartCount={cartCount} isLoggedIn={Boolean(session)} />
      <main>{children}</main>
    </div>
  );
}
