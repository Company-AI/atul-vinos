"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { SidebarMobile, type SidebarItem } from "./site-sidebar";

/**
 * Barra superior de la tienda: logo al centro, buscador y carrito a la
 * derecha, y el disparador del menú lateral a la izquierda en mobile.
 *
 * El buscador es un formulario real que resuelve en /buscar en lugar de abrir
 * un overlay: en una tienda buscar es la acción principal y conviene que
 * funcione sin JavaScript y que la búsqueda quede en una URL compartible.
 */
export function SiteTopbar({
  companyName,
  logoUrl,
  cartCount,
  isLoggedIn,
  nav,
  navSecundaria,
  tagline,
  logoSoloEnMobile = false,
}: {
  companyName: string;
  logoUrl: string;
  cartCount: number;
  isLoggedIn: boolean;
  nav: SidebarItem[];
  navSecundaria: SidebarItem[];
  tagline: string[];
  /** El sidebar ya muestra el logo en desktop: acá sólo hace falta en mobile. */
  logoSoloEnMobile?: boolean;
}) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-[50] border-b border-linen-200 bg-bone/95 backdrop-blur-md">
        <div className="mx-auto grid h-[72px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6">
          <div className="flex items-center justify-start">
            <SidebarMobile items={nav} secundarios={navSecundaria} tagline={tagline} />
          </div>

          <Link
            href="/"
            aria-label={`${companyName} — inicio`}
            className={logoSoloEnMobile ? "justify-self-center lg:hidden" : "justify-self-center"}
          >
            <Image
              src={logoUrl}
              alt={companyName}
              width={683}
              height={227}
              priority
              className="h-9 w-auto sm:h-11"
            />
          </Link>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <form action="/buscar" role="search" className="hidden md:block">
              <label htmlFor="buscar-topbar" className="sr-only">
                Buscar
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-500"
                  aria-hidden
                />
                <input
                  id="buscar-topbar"
                  name="q"
                  type="search"
                  placeholder="Buscar vinos, bodegas, cepas…"
                  className="h-10 w-[248px] rounded-pill border border-linen-300 bg-bone-pure pl-10 pr-4 text-[13px] text-carbon-900 outline-none transition-colors placeholder:text-stone-500 focus:border-accent-700 lg:w-[280px]"
                />
              </div>
            </form>

            <Link
              href="/buscar"
              aria-label="Buscar"
              className="rounded-sm p-2 text-carbon-800 transition-colors hover:text-accent-700 md:hidden"
            >
              <Search className="size-5" aria-hidden />
            </Link>

            <Link
              href={isLoggedIn ? "/mi-cuenta" : "/ingresar"}
              aria-label={isLoggedIn ? "Mi cuenta" : "Ingresar"}
              className="hidden rounded-sm p-2 text-carbon-800 transition-colors hover:text-accent-700 sm:block"
            >
              <User className="size-5" aria-hidden />
            </Link>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Carrito${cartCount > 0 ? `, ${cartCount} productos` : " vacío"}`}
              className="relative grid size-10 place-items-center rounded-md bg-accent-700 text-bone-pure transition-colors hover:bg-accent-600"
            >
              <ShoppingCart className="size-[18px]" aria-hidden />
              <span
                className="absolute -right-1 -top-1 grid size-[18px] place-items-center rounded-full bg-carbon-900 text-[10px] font-medium tabular text-bone-pure"
                aria-hidden
              >
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
