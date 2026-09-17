"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { CartDrawer } from "@/components/shop/cart-drawer";

const ENLACES = [
  { href: "/vinos", label: "Vinos" },
  { href: "/box", label: "Boxes" },
  { href: "/novedades", label: "Novedades" },
  { href: "/ofertas", label: "Ofertas" },
  { href: "/quienes-somos", label: "Conocer Atul" },
  { href: "/contacto", label: "Contacto" },
];

/**
 * Cabecera de la captura: las tres rayitas a la izquierda, el logotipo
 * centrado, y buscador, cuenta y carrito a la derecha.
 *
 * El cajón del menú se monta en <body> con un portal. Acá la cabecera no
 * lleva backdrop-filter, así que no haría falta, pero se deja igual: es el
 * bug que ya tuvimos en "/" y no conviene volver a pisarlo si algún día se le
 * agrega desenfoque.
 */
export function CabeceraV2({
  cartCount,
  isLoggedIn,
}: {
  cartCount: number;
  isLoggedIn: boolean;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  useEffect(() => {
    if (!menuAbierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setMenuAbierto(false);
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [menuAbierto]);

  return (
    <>
      <header className="cab">
        <div className="caja cab-fila">
          <div className="cab-izq">
            <button
              type="button"
              className="icono"
              aria-label="Abrir menú"
              aria-expanded={menuAbierto}
              onClick={() => setMenuAbierto(true)}
            >
              <Menu size={19} strokeWidth={1.6} />
            </button>
          </div>

          <a href="/v2" aria-label="Atul Vinos — inicio">
            <Image
              src="/brand/logotipo-azul.png"
              alt="Atul Vinos"
              width={683}
              height={227}
              priority
              style={{ height: 34, width: "auto", display: "block" }}
            />
          </a>

          <div className="cab-der">
            <form action="/buscar" role="search" className="buscador">
              <Search size={13} strokeWidth={1.8} aria-hidden />
              <label htmlFor="v2-buscar" className="sr-only">
                Buscar
              </label>
              <input id="v2-buscar" name="q" type="search" placeholder="Buscar vinos..." />
            </form>

            <a
              className="icono"
              href={isLoggedIn ? "/mi-cuenta" : "/ingresar"}
              aria-label={isLoggedIn ? "Mi cuenta" : "Ingresar"}
            >
              <User size={18} strokeWidth={1.6} />
            </a>

            <button
              type="button"
              className="icono carrito"
              onClick={() => setCarritoAbierto(true)}
              aria-label={`Carrito${cartCount > 0 ? `, ${cartCount} productos` : " vacío"}`}
            >
              <ShoppingCart size={18} strokeWidth={1.6} />
              <span className="badge">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      {menuAbierto &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 80,
              display: "flex",
            }}
          >
            <nav
              aria-label="Menú"
              style={{
                width: "min(280px, 82%)",
                height: "100%",
                background: "#faf7f2",
                boxShadow: "16px 0 40px rgb(0 0 0 / 0.12)",
                display: "flex",
                flexDirection: "column",
                padding: "18px 22px",
                overflowY: "auto",
              }}
            >
              <button
                type="button"
                onClick={() => setMenuAbierto(false)}
                aria-label="Cerrar menú"
                style={{
                  alignSelf: "flex-end",
                  border: 0,
                  background: "transparent",
                  color: "#1e2d54",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={19} />
              </button>
              {ENLACES.map((e) => (
                <a
                  key={e.href}
                  href={e.href}
                  onClick={() => setMenuAbierto(false)}
                  style={{
                    padding: "13px 0",
                    borderBottom: "1px solid #e6e1d8",
                    fontSize: 14,
                    color: "#1b1f2a",
                  }}
                >
                  {e.label}
                </a>
              ))}
            </nav>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMenuAbierto(false)}
              style={{ flex: 1, border: 0, background: "rgb(20 20 20 / 0.28)", cursor: "pointer" }}
            />
          </div>,
          document.body,
        )}

      <CartDrawer open={carritoAbierto} onOpenChange={setCarritoAbierto} />
    </>
  );
}
