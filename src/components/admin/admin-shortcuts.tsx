"use client";

import Link from "next/link";
import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  AlertTriangle, Box, ClipboardList, Package, Printer, Wine, Zap,
} from "lucide-react";

/** Atajos del dashboard (spec §77). */
const SHORTCUTS = [
  { href: "/admin/productos/nuevo", label: "Nuevo producto", Icon: Wine },
  { href: "/admin/stock?accion=ingreso", label: "Registrar stock", Icon: Box },
  { href: "/admin/picking", label: "Pedidos a preparar", Icon: ClipboardList },
  { href: "/admin/envios?pendientes=1", label: "Imprimir etiquetas", Icon: Printer },
  { href: "/admin/pagos?estado=fallidos", label: "Pagos fallidos", Icon: AlertTriangle },
  { href: "/admin/suscripciones/box", label: "Preparar box del mes", Icon: Package },
  { href: "/admin/stock?filtro=bajo", label: "Stock bajo", Icon: AlertTriangle },
];

export function AdminShortcuts() {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-sm border border-linen-300 bg-bone-pure px-2.5 text-[12px] text-carbon-800 transition-colors hover:border-stone-400"
        >
          <Zap className="size-3.5" />
          Acciones rápidas
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-40 min-w-[230px] rounded-sm border border-linen-300 bg-bone-pure py-1 shadow-raised"
        >
          {SHORTCUTS.map((shortcut) => (
            <DropdownMenu.Item key={shortcut.href} asChild>
              <Link
                href={shortcut.href}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] text-carbon-800 outline-none data-[highlighted]:bg-linen-100"
              >
                <shortcut.Icon className="size-3.5 text-stone-500" />
                {shortcut.label}
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
