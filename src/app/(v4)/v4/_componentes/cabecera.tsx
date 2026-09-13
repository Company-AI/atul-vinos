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

  return (
    <>
      <header className="site-header">
        <div className="topbar">{avisoEnvio}</div>

        <div className="nav-shell">
          <a className="brand" href="#top" aria-label="Atul Vinos">
            <MarcaAtul />
          </a>

          <nav className="main-nav" aria-label="Principal">
            <a href="#catalogo">Vinos</a>
            <a href="#cajas">Cajas</a>
            <a href="#ofertas">Ofertas</a>
            <a href="#novedades">Novedades</a>
            <a href="#quienes">Quiénes somos</a>
          </nav>

          <div className="nav-actions">
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

      <CarritoV4
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
        zonas={zonas}
      />
    </>
  );
}
