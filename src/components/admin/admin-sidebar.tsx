"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BarChart3, Box, ClipboardList, FileText, Landmark, LayoutDashboard, LogOut,
  MapPin, Megaphone, Menu, Package, Percent, ScrollText, Settings, ShieldCheck,
  ShoppingCart, Truck, Users, Wine, X,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/cn";
import type { PermissionCode } from "@/infra/auth/permissions";

type Item = {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  permission?: PermissionCode;
  badge?: number;
};

type Group = { title: string; items: Item[] };

export function AdminSidebar({
  permissions,
  isSuperAdmin,
  companyName,
  logoUrl,
  counters,
  user,
}: {
  permissions: string[];
  isSuperAdmin: boolean;
  companyName: string;
  logoUrl: string;
  counters: { toPrepare: number; failedPayments: number; lowStock: number };
  user: { name: string; role: string };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const can = (permission?: PermissionCode) =>
    !permission || isSuperAdmin || permissions.includes(permission);

  const groups: Group[] = [
    {
      title: "Operación",
      items: [
        { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
        { href: "/admin/pedidos", label: "Pedidos", Icon: ShoppingCart, permission: "orders.view" },
        { href: "/admin/picking", label: "A preparar", Icon: ClipboardList, permission: "orders.prepare", badge: counters.toPrepare },
        { href: "/admin/envios", label: "Envíos y etiquetas", Icon: Truck, permission: "orders.labels" },
      ],
    },
    {
      title: "Catálogo",
      items: [
        { href: "/admin/productos", label: "Productos", Icon: Wine, permission: "products.view" },
        { href: "/admin/bodegas", label: "Bodegas", Icon: Landmark, permission: "products.view" },
        { href: "/admin/regiones", label: "Regiones", Icon: MapPin, permission: "products.view" },
        { href: "/admin/stock", label: "Stock", Icon: Box, permission: "stock.view", badge: counters.lowStock },
      ],
    },
    {
      title: "Club",
      items: [
        { href: "/admin/suscripciones", label: "Suscriptores", Icon: Users, permission: "subscriptions.view" },
        { href: "/admin/suscripciones/planes", label: "Planes", Icon: FileText, permission: "subscriptions.plans" },
        { href: "/admin/suscripciones/box", label: "Box del mes", Icon: Package, permission: "subscriptions.box" },
      ],
    },
    {
      title: "Comercial",
      items: [
        { href: "/admin/clientes", label: "Clientes", Icon: Users, permission: "customers.view" },
        { href: "/admin/cupones", label: "Cupones", Icon: Percent, permission: "coupons.view" },
        { href: "/admin/contenido", label: "Contenido", Icon: Megaphone, permission: "cms.edit" },
      ],
    },
    {
      title: "Administración",
      items: [
        { href: "/admin/pagos", label: "Pagos y webhooks", Icon: ScrollText, permission: "payments.view", badge: counters.failedPayments },
        { href: "/admin/reportes", label: "Reportes", Icon: BarChart3, permission: "reports.view" },
        { href: "/admin/auditoria", label: "Auditoría", Icon: ShieldCheck, permission: "audit.view" },
        { href: "/admin/usuarios", label: "Usuarios y roles", Icon: Users, permission: "users.manage" },
        { href: "/admin/configuracion", label: "Configuración", Icon: Settings, permission: "settings.view" },
      ],
    },
  ];

  const nav = (
    <nav aria-label="Administración" className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-carbon-700 px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src={logoUrl} alt={companyName} width={130} height={26} className="h-6 w-auto" />
        </Link>
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
          className="rounded-sm p-1.5 text-linen-300 lg:hidden"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => {
          const visible = group.items.filter((item) => can(item.permission));
          if (visible.length === 0) return null;

          return (
            <div key={group.title} className="mb-4">
              <p className="px-2 pb-1.5 text-[10px] uppercase tracking-[0.18em] text-stone-500">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {visible.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-[13px] transition-colors",
                          active
                            ? "bg-carbon-700 text-bone"
                            : "text-linen-300 hover:bg-carbon-800 hover:text-bone",
                        )}
                      >
                        <item.Icon className="size-4 shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="rounded-xs bg-wine-700 px-1.5 text-[10px] tabular text-bone-pure">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-carbon-700 p-3">
        <p className="truncate text-[12px] text-linen-200">{user.name}</p>
        <p className="truncate text-[11px] text-stone-500">{user.role}</p>
        <div className="mt-2 flex gap-2">
          <Link
            href="/"
            className="flex-1 rounded-sm border border-carbon-600 px-2 py-1 text-center text-[11px] text-linen-300 hover:border-linen-300"
          >
            Ver el sitio
          </Link>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => { void logout(); })}
            aria-label="Cerrar sesión"
            className="rounded-sm border border-carbon-600 px-2 py-1 text-linen-300 hover:border-linen-300"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="on-dark hidden w-[228px] shrink-0 border-r border-carbon-700 bg-carbon-900 lg:block">
        <div className="sticky top-0 h-dvh">{nav}</div>
      </aside>

      {/* Mobile */}
      <button
        type="button"
        aria-label="Abrir menú"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 right-4 z-40 grid size-12 place-items-center rounded-full bg-carbon-900 text-bone shadow-raised lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-carbon-950/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="on-dark absolute inset-y-0 left-0 w-[260px] bg-carbon-900">{nav}</div>
        </div>
      )}
    </>
  );
}
