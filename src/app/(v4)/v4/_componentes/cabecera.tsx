"use client";

import { useState } from "react";
import { CarritoV4 } from "./carrito";
import type { ZonaEnvio } from "./zonas";
import { MarcaAtul } from "./marca";

/**
 * Cabecera del prototipo: franja de envío, marca a la izquierda, navegación
 * centrada y acciones a la derecha, con el panel de búsqueda desplegable.
 *
 * El botón abre el cajón con el diseño del prototipo (CarritoV4), alimentado
 * por el carrito real del servidor.
 */
const ENLACES = [
  { href: "#catalogo", label: "Vinos" },
  { href: "#cajas", label: "Cajas" },
  { href: "#ofertas", label: "Ofertas" },
  { href: "#novedades", label: "Novedades" },
  { href: "#quienes", label: "Quiénes somos" },
];

export function CabeceraV4({
  avisoEnvio,
  cartCount,
  isLoggedIn,
  zonas,
}: {
  avisoEnvio: string;
  cartCount: number;
  isLoggedIn: boolean;
  zonas: ZonaEnvio[];
}) {
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <>
      <header className="site-header">
        <div className="topbar">{avisoEnvio}</div>

        <div className="nav-shell">
          <a className="brand" href="#top" aria-label="Atul Vinos">
            <MarcaAtul />
          </a>

          <nav className="main-nav" aria-label="Principal">
            {ENLACES.map((e) => (
              <a key={e.href} href={e.href}>
                {e.label}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            <button
              type="button"
              className="icon-button nav-menu-toggle"
              aria-label="Abrir menú"
              aria-expanded={menuAbierto}
              onClick={() => setMenuAbierto(true)}
            >
              ☰
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Buscar"
              aria-expanded={buscadorAbierto}
              onClick={() => setBuscadorAbierto((v) => !v)}
            >
              ⌕
            </button>
            <a
              className="icon-button"
              href={isLoggedIn ? "/mi-cuenta" : "/ingresar"}
              aria-label={isLoggedIn ? "Mi cuenta" : "Ingresar"}
              style={{ display: "grid", placeItems: "center" }}
            >
              ◯
            </a>
            <button
              type="button"
              className="cart-button"
              onClick={() => setCarritoAbierto(true)}
            >
              Carrito <span>{cartCount}</span>
            </button>
          </div>
        </div>

        {/*
          Buscador: en el prototipo filtra la grilla en vivo; acá resuelve en
          /buscar con un formulario real, que es lo que ya usa el sitio y deja
          la búsqueda en una URL que se puede compartir.
        */}
        <form
          action="/buscar"
          role="search"
          className={buscadorAbierto ? "search-panel open" : "search-panel"}
        >
          <label htmlFor="v4-buscar" className="sr-only">
            Buscar
          </label>
          <input
            id="v4-buscar"
            name="q"
            type="search"
            placeholder="Buscar por vino, varietal, bodega o región…"
          />
        </form>
      </header>

      {/*
        Fuera del <header> a propósito. El header lleva backdrop-filter, que
        crea bloque contenedor para los position:fixed que cuelgan de él: un
        cajón adentro se dimensionaría contra el header en vez de la pantalla.
        Es el mismo bug que tenía el menú de "/".
      */}
      <aside
        className={menuAbierto ? "nav-drawer open" : "nav-drawer"}
        aria-hidden={!menuAbierto}
        inert={!menuAbierto}
        aria-label="Menú"
      >
        <div className="nav-drawer-head">
          <span className="eyebrow">MENÚ</span>
          <button
            type="button"
            className="icon-button"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>
        <nav aria-label="Principal (mobile)">
          {ENLACES.map((e) => (
            <a key={e.href} href={e.href} onClick={() => setMenuAbierto(false)}>
              {e.label}
            </a>
          ))}
        </nav>
      </aside>
      <div
        className={menuAbierto ? "drawer-backdrop open" : "drawer-backdrop"}
        onClick={() => setMenuAbierto(false)}
        aria-hidden
      />

      <CarritoV4
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
        zonas={zonas}
      />
    </>
  );
}
