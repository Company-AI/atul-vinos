"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  Heart, Home, LogOut, MapPin, Package, Sparkles, User, Wine,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/mi-cuenta", label: "Inicio", Icon: Home },
  { href: "/mi-cuenta/pedidos", label: "Mis pedidos", Icon: Package },
  { href: "/mi-cuenta/suscripcion", label: "Mi suscripción", Icon: Wine },
  { href: "/mi-cuenta/beneficios", label: "Beneficios del Club", Icon: Sparkles },
  { href: "/mi-cuenta/favoritos", label: "Mis favoritos", Icon: Heart },
  { href: "/mi-cuenta/direcciones", label: "Direcciones", Icon: MapPin },
  { href: "/mi-cuenta/datos", label: "Mis datos", Icon: User },
];

export function AccountNav() {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <nav aria-label="Mi cuenta" className="lg:sticky lg:top-28">
      <ul className="flex gap-1 overflow-x-auto border-b border-linen-200 pb-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:border-none lg:pb-0">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-sm px-3 py-2.5 text-[14px] transition-colors",
                  active
                    ? "bg-carbon-900 text-bone lg:bg-linen-200 lg:text-carbon-900"
                    : "text-stone-600 hover:bg-linen-100 hover:text-carbon-900",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-4 lg:border-t lg:border-linen-200 lg:pt-4">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => { void logout(); })}
            className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-sm px-3 py-2.5 text-[14px] text-stone-600 transition-colors hover:bg-linen-100 hover:text-carbon-900"
          >
            <LogOut className="size-4 shrink-0" />
            Cerrar sesión
          </button>
        </li>
      </ul>
    </nav>
  );
}
