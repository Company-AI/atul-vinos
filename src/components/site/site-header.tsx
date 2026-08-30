"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { SearchOverlay } from "./search-overlay";
import { AnnouncementBar, type Announcement } from "./announcement-bar";

export type NavItem = { label: string; href: string };

/** Rutas que arrancan con hero a pantalla completa: el header nace transparente. */
const OVERLAY_ROUTES = ["/", "/club", "/historia", "/v8"];

export function SiteHeader({
  nav,
  companyName,
  logoUrl,
  logoLightUrl,
  cartCount,
  isLoggedIn,
  announcements,
}: {
  nav: NavItem[];
  companyName: string;
  logoUrl: string;
  logoLightUrl: string;
  cartCount: number;
  isLoggedIn: boolean;
  announcements: Announcement[];
}) {
  const pathname = usePathname();
  const canOverlay = OVERLAY_ROUTES.includes(pathname);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [menuOpen]);

  const transparent = canOverlay && !scrolled && !menuOpen;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[50] transition-[background-color,border-color,box-shadow] duration-[280ms]",
          transparent
            ? "on-dark border-b border-transparent bg-transparent"
            : "border-b border-linen-200 bg-bone/95 backdrop-blur-md",
        )}
      >
        {announcements.length > 0 && (
          <div
            className={cn(
              "overflow-hidden transition-[max-height,opacity] duration-[280ms]",
              scrolled || menuOpen ? "max-h-0 opacity-0" : "max-h-12 opacity-100",
            )}
          >
            <AnnouncementBar items={announcements} />
          </div>
        )}

        {/*
          Orden del header (spec §66): logo, navegación, buscar, cuenta, carrito.
          Mobile: grilla de 3 columnas con el logo centrado y el menú a la izquierda.
        */}
        <div className="mx-auto grid h-14 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-gutter lg:flex lg:h-[72px] lg:gap-8">
          {/* Menú mobile */}
          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className={cn(
              "-ml-2 justify-self-start rounded-sm p-2 transition-colors lg:hidden",
              transparent ? "text-bone" : "text-carbon-900",
            )}
          >
            <Menu className="size-5" />
          </button>

          {/* Logo */}
          <Link
            href="/"
            aria-label={`${companyName} — inicio`}
            className="shrink-0 justify-self-center lg:justify-self-start"
          >
            <Image
              src={transparent ? logoLightUrl : logoUrl}
              alt={companyName}
              width={180}
              height={36}
              priority
              className="h-7 w-auto lg:h-9"
            />
          </Link>

          {/* Navegación desktop */}
          <nav aria-label="Principal" className="hidden flex-1 lg:block">
            <ul className="flex items-center gap-7">
              {nav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "eyebrow relative py-2 transition-colors",
                        transparent ? "text-linen-200 hover:text-bone" : "text-carbon-800 hover:text-wine-700",
                        active && "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-current",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-1 justify-self-end">
            <button
              type="button"
              aria-label="Buscar"
              onClick={() => setSearchOpen(true)}
              className={cn(
                "rounded-sm p-2 transition-colors",
                transparent ? "text-linen-200 hover:text-bone" : "text-carbon-800 hover:text-wine-700",
              )}
            >
              <Search className="size-[18px]" />
            </button>

            <Link
              href={isLoggedIn ? "/mi-cuenta" : "/ingresar"}
              aria-label={isLoggedIn ? "Mi cuenta" : "Ingresar"}
              className={cn(
                "hidden rounded-sm p-2 transition-colors sm:block",
                transparent ? "text-linen-200 hover:text-bone" : "text-carbon-800 hover:text-wine-700",
              )}
            >
              <User className="size-[18px]" />
            </Link>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Carrito${cartCount > 0 ? `, ${cartCount} productos` : " vacío"}`}
              className={cn(
                "relative rounded-sm p-2 transition-colors",
                transparent ? "text-linen-200 hover:text-bone" : "text-carbon-800 hover:text-wine-700",
              )}
            >
              <ShoppingBag className="size-[18px]" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-[17px] place-items-center rounded-full bg-wine-700 text-[10px] font-medium tabular text-bone-pure">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Panel mobile a pantalla completa */}
      {menuOpen && (
        <div className="on-dark fixed inset-0 z-[60] flex flex-col bg-carbon-900 lg:hidden">
          <div className="flex h-14 items-center justify-between px-gutter">
            <Image src={logoLightUrl} alt={companyName} width={160} height={32} className="h-7 w-auto" />
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMenuOpen(false)}
              className="-mr-2 rounded-sm p-2 text-bone"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav aria-label="Principal" className="flex-1 overflow-y-auto px-gutter pt-8">
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block border-b border-carbon-700 py-5 font-display text-display-sm font-light text-bone"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={isLoggedIn ? "/mi-cuenta" : "/ingresar"}
                  className="block border-b border-carbon-700 py-5 font-display text-display-sm font-light text-bone"
                >
                  {isLoggedIn ? "Mi cuenta" : "Ingresar"}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
