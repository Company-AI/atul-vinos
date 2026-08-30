import Link from "next/link";
import { cn } from "@/lib/cn";
import { VContainer, VLabel } from "./shared";
import { VMobileNav } from "./mobile-nav";

export type VariantKey = "maison" | "arquitectura" | "terroir" | "casa";

export const VARIANTS: { key: VariantKey; route: string; name: string; idea: string }[] = [
  { key: "maison", route: "/v2", name: "Maison", idea: "Lujo por resta" },
  { key: "arquitectura", route: "/v3", name: "Arquitectura", idea: "La bodega como edificio" },
  { key: "terroir", route: "/v4", name: "Terroir", idea: "El viñedo como ciencia" },
  { key: "casa", route: "/v6", name: "Casa", idea: "Cálida y clásica, tienda al frente" },
];

/**
 * Barra para saltar entre las tres variantes. Existe sólo para comparar:
 * cuando se elija una dirección, esta barra y las rutas /v2 /v3 /v4 se van.
 */
export function VariantSwitcher({ current }: { current: VariantKey }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[70] border-t backdrop-blur-md"
      style={{ backgroundColor: "color-mix(in srgb, var(--v-bg) 88%, transparent)", borderColor: "var(--v-rule)" }}
    >
      <VContainer className="flex items-center justify-between gap-4 py-3">
        <VLabel className="hidden sm:block">Comparando direcciones</VLabel>

        <nav aria-label="Variantes de diseño" className="flex flex-1 items-center justify-end gap-1">
          {VARIANTS.map((variant) => {
            const active = variant.key === current;
            return (
              <Link
                key={variant.key}
                href={variant.route}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "v-label px-3 py-2 transition-all duration-300 sm:px-4",
                  !active && "opacity-55 hover:opacity-100",
                )}
                style={{
                  backgroundColor: active ? "var(--v-accent)" : "transparent",
                  color: active ? "var(--v-on-accent)" : "var(--v-ink)",
                  borderRadius: "var(--v-radius)",
                }}
              >
                <span className="tabular">{variant.route.replace("/", "")}</span>
                <span className="ml-2 hidden md:inline">· {variant.name}</span>
              </Link>
            );
          })}

          <Link
            href="/"
            className="v-label ml-2 px-3 py-2 opacity-55 transition-opacity duration-300 hover:opacity-100"
          >
            Volver
          </Link>
        </nav>
      </VContainer>
    </div>
  );
}

/**
 * Header de variante. Nace transparente sobre el hero y toma fondo al
 * scrollear; cada tema aporta su color, así que un solo componente sirve
 * a las tres direcciones.
 */
export function VHeader({
  companyName,
  variant,
}: {
  companyName: string;
  variant: VariantKey;
}) {
  /*
    Casa ordena la navegación por venta —la tienda primero— y se mueve dentro
    de su propia variante. Las otras tres arrancan por la marca y linkean al
    sitio principal.
  */
  const nav =
    variant === "casa"
      ? [
          { label: "Tienda", href: "/v6/tienda" },
          { label: "El Club", href: "/v6/club" },
          { label: "Nosotros", href: "/historia" },
          { label: "Contacto", href: "/contacto" },
        ]
      : [
          { label: "Vinos", href: "/vinos" },
          { label: "Club", href: "/club" },
          { label: "Historia", href: "/historia" },
          { label: "Contacto", href: "/contacto" },
        ];

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <VContainer
        className={cn(
          "flex items-center gap-8 py-7",
          "justify-between",
        )}
      >
        <Link href={VARIANTS.find((v) => v.key === variant)!.route} className="v-label text-current">
          <span style={{ letterSpacing: "var(--v-label-ls)" }}>{companyName}</span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-7 sm:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="v-label opacity-75 transition-opacity duration-300 hover:opacity-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <VMobileNav items={nav} />
      </VContainer>
    </header>
  );
}

/** Pie sobrio y común. El detalle de marca lo pone la paleta de cada tema. */
export function VFooter({ companyName, tagline }: { companyName: string; tagline: string }) {
  return (
    <footer className="v-section pb-32" style={{ borderTop: "1px solid var(--v-rule)" }}>
      <VContainer className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="v-title-type">{companyName}</p>
          <p className="mt-3 text-[14px]" style={{ color: "var(--v-muted)" }}>
            {tagline}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {[
            { label: "Vinos", href: "/vinos" },
            { label: "Club", href: "/club" },
            { label: "Envíos", href: "/envios" },
            { label: "Contacto", href: "/contacto" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="v-label hover:opacity-70">
              {item.label}
            </Link>
          ))}
        </div>
      </VContainer>

      <VContainer className="mt-14">
        <p className="text-[12px]" style={{ color: "var(--v-muted)" }}>
          Beber con moderación. Prohibida su venta a menores de 18 años.
        </p>
      </VContainer>
    </footer>
  );
}
