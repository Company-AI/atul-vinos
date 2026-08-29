import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Revelado al entrar en viewport.
 *
 * No es un componente cliente: sólo emite `data-reveal` y deja que el
 * observador único de <RevealObserver /> agregue `data-revealed`. Así los
 * bloques del CMS siguen siendo Server Components y la home no arrastra una
 * isla de JS por sección. El estilo y el respeto por prefers-reduced-motion
 * viven en globals.css.
 *
 * - "rise" (por defecto): sube y aparece.
 * - "mask": cortina de abajo hacia arriba, para fotografía.
 * - "line": el titular emerge desde su propia línea de base.
 */
export function Reveal({
  children,
  delay = 0,
  y,
  variant = "rise",
  className,
  as: Tag = "div",
  style,
}: {
  children: React.ReactNode;
  /** En segundos, para mantener la firma previa basada en framer-motion. */
  delay?: number;
  y?: number;
  variant?: "rise" | "mask" | "line";
  className?: string;
  as?: React.ElementType;
  style?: React.CSSProperties;
}) {
  return (
    <Tag
      data-reveal={variant}
      className={className}
      style={{
        ...(delay ? { "--reveal-delay": `${Math.round(delay * 1000)}ms` } : null),
        ...(y !== undefined ? { "--reveal-y": `${y}px` } : null),
        ...style,
      } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Aplica stagger a los hijos directos. */
export function RevealGroup({
  children,
  className,
  step = 0.08,
  variant = "rise",
}: {
  children: React.ReactNode;
  className?: string;
  step?: number;
  variant?: "rise" | "mask" | "line";
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, i) => (
        <Reveal delay={i * step} variant={variant}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}

/**
 * Delay escalonado para elementos que ya tienen su propio wrapper y no pueden
 * envolverse en <Reveal> sin romper la grilla (items de flex/grid).
 */
export function stagger(index: number, step = 0.09, max = 0.54): React.CSSProperties {
  return { "--reveal-delay": `${Math.round(Math.min(index * step, max) * 1000)}ms` } as React.CSSProperties;
}

export { cn };
