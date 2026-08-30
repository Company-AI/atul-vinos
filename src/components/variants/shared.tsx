import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Primitivas comunes a las tres variantes.
 *
 * Leen las variables semánticas (--v-*) que define cada tema en globals.css,
 * nunca los tokens del sitio principal. El mismo componente se ve distinto
 * según el `data-variant` del layout que lo contiene, que es exactamente lo
 * que permite comparar los tres lenguajes sobre los mismos datos.
 */

export function VContainer({
  size = "default",
  className,
  children,
  as: Tag = "div",
}: {
  size?: "narrow" | "default" | "wide";
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-6 sm:px-10",
        size === "narrow" && "max-w-[760px]",
        size === "default" && "max-w-[1280px]",
        size === "wide" && "max-w-[1600px]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function VSection({
  className,
  children,
  id,
  surface,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
  /** "sunk" invierte el bloque usando el color profundo del tema. */
  surface?: "base" | "raised" | "sunk";
}) {
  return (
    <section
      id={id}
      className={cn("v-section", className)}
      style={{
        backgroundColor:
          surface === "raised"
            ? "var(--v-surface)"
            : surface === "sunk"
              ? "var(--v-sunk)"
              : undefined,
        color: surface === "sunk" ? "var(--v-bg)" : undefined,
      }}
    >
      {children}
    </section>
  );
}

export function VLabel({
  className,
  children,
  style,
}: {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <p className={cn("v-label", className)} style={{ color: "var(--v-muted)", ...style }}>
      {children}
    </p>
  );
}

export function VTitle({
  level = 2,
  className,
  children,
  hero = false,
  style,
}: {
  level?: 1 | 2 | 3;
  className?: string;
  children: React.ReactNode;
  hero?: boolean;
  style?: React.CSSProperties;
}) {
  const Tag = `h${level}` as React.ElementType;
  return (
    <Tag className={cn(hero ? "v-hero-type" : "v-title-type", className)} style={style}>
      {children}
    </Tag>
  );
}

export function VBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("text-[15px] leading-[1.8] [&_p+p]:mt-5", className)}
      style={{ color: "var(--v-muted)", maxWidth: "var(--v-measure)" }}
    >
      {children}
    </div>
  );
}

/** Regla fina del tema. Separa sin pesar. */
export function VRule({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t", className)} style={{ borderColor: "var(--v-rule)" }} />;
}

export function VLink({
  href,
  children,
  variant = "underline",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "underline" | "solid" | "outline";
  className?: string;
}) {
  const base = "v-label inline-flex items-center justify-center transition-all duration-500";

  if (variant === "solid") {
    return (
      <Link
        href={href}
        className={cn(base, "px-8 py-4 hover:opacity-85", className)}
        style={{
          backgroundColor: "var(--v-accent)",
          color: "var(--v-on-accent)",
          borderRadius: "var(--v-radius)",
        }}
      >
        {children}
      </Link>
    );
  }

  if (variant === "outline") {
    return (
      <Link
        href={href}
        className={cn(base, "border px-8 py-4", className)}
        style={{ borderColor: "currentColor", borderRadius: "var(--v-radius)" }}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(base, "gap-2 pb-1", className)}
      style={{ borderBottom: "1px solid var(--v-accent)" }}
    >
      {children}
    </Link>
  );
}

/** Precio en la moneda del sitio, con el mismo formato que la tienda. */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(cents);
}
