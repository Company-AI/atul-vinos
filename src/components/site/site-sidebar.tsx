"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { House, Mail, Menu, Package, Sparkles, Tag, Users, Wine, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type SidebarItem = { label: string; href: string; icon: keyof typeof ICONOS };

const ICONOS = {
  inicio: House,
  wine: Wine,
  box: Package,
  nuevo: Sparkles,
  oferta: Tag,
  nosotros: Users,
  contacto: Mail,
} as const;

type Props = {
  items: SidebarItem[];
  secundarios: SidebarItem[];
  tagline: string[];
  /** Logo al tope de la columna. En mobile lo muestra la barra superior. */
  logo?: { url: string; alt: string };
};

/**
 * Navegación lateral.
 *
 * Reemplaza al menú horizontal: con la tienda al frente, el menú vertical
 * libera todo el ancho superior para el logo, el buscador y el carrito, y
 * permite listar más secciones sin apretarlas.
 *
 * Se exporta en tres piezas porque el sidebar es hermano del header, no un
 * hijo: la columna vive en el layout y el cajón mobile se dispara desde la
 * barra superior.
 */
function SidebarContenido({ items, secundarios, tagline, logo }: Props) {
  const pathname = usePathname();

  const enlace = (item: SidebarItem) => {
    const Icon = ICONOS[item.icon];
    const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={activo ? "page" : undefined}
          className={cn(
            "flex items-center gap-3.5 rounded-sm py-2.5 pl-1 pr-2 text-[15px] transition-colors",
            activo ? "text-accent-700" : "text-carbon-800 hover:text-accent-700",
          )}
        >
          <Icon
            className={cn("size-[18px] shrink-0", activo ? "text-accent-700" : "text-stone-500")}
            aria-hidden
          />
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <div className="flex min-h-full flex-col">
      {logo && (
        <Link href="/" aria-label={`${logo.alt} — inicio`} className="mb-8 block px-6">
          <Image src={logo.url} alt={logo.alt} width={683} height={227} priority className="h-11 w-auto" />
        </Link>
      )}

      <nav aria-label="Principal" className="px-6 pt-1">
        <ul>{items.map(enlace)}</ul>
        <hr className="my-5 border-t border-linen-300" />
        <ul>{secundarios.map(enlace)}</ul>
      </nav>

      {/*
        Firma al pie. La ilustración de finca va como grabado lineal muy tenue
        (#D8CEC5 al 35%): da identidad sin convertir la tienda en un sitio de
        bodega, que es justo lo que el cliente pidió sacar.
      */}
      <div className="relative mt-auto px-6 pb-8 pt-16">
        <Image
          src="/media/brand/finca.webp"
          alt=""
          aria-hidden
          width={640}
          height={853}
          className="pointer-events-none absolute inset-x-0 bottom-24 -z-10 w-full opacity-[0.38] mix-blend-multiply"
        />
        <div className="mb-4 h-px w-8 bg-linen-300" />
        <p className="text-[12px] uppercase leading-[1.75] tracking-[0.18em] text-stone-500">
          {tagline.map((linea) => (
            <span key={linea} className="block">
              {linea}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

/** Columna fija de escritorio. */
export function SidebarColumn(props: Props) {
  return (
    <aside className="hidden w-[212px] shrink-0 border-r border-linen-200 bg-bone lg:block">
      <div className="sticky top-0 flex max-h-dvh flex-col overflow-y-auto pt-7">
        <SidebarContenido {...props} />
      </div>
    </aside>
  );
}

/**
 * Disparador y cajón del menú.
 *
 * Por defecto sólo aparece en pantallas chicas, porque en escritorio la
 * columna fija ya muestra el menú. Con `siempreVisible` se usa en todas las
 * medidas: el menú se repliega detrás de las tres rayitas y el contenido se
 * queda con todo el ancho. Es un cajón, no un desplegable, así entra la
 * navegación completa —principal, secundaria y firma— sin apretarla.
 */
export function SidebarMenu({ siempreVisible = false, ...props }: Props & { siempreVisible?: boolean }) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  useEffect(() => setAbierto(false), [pathname]);

  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menú"
        aria-expanded={abierto}
        onClick={() => setAbierto(true)}
        className={cn("-ml-1.5 rounded-sm p-2 text-carbon-900", !siempreVisible && "lg:hidden")}
      >
        <Menu className="size-6" aria-hidden />
      </button>

      {abierto && (
        <div className={cn("fixed inset-0 z-[70] flex", !siempreVisible && "lg:hidden")}>
          <div
            className="flex w-[280px] max-w-[80vw] flex-col overflow-y-auto bg-bone pt-5 shadow-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
          >
            <div className="flex justify-end px-4">
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setAbierto(false)}
                className="rounded-sm p-2 text-carbon-900"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <SidebarContenido {...props} />
          </div>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setAbierto(false)}
            className="flex-1 bg-carbon-950/45"
          />
        </div>
      )}
    </>
  );
}
