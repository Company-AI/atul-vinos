import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Los estados nunca se comunican solo por color: el badge siempre lleva texto.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-xs px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-linen-200 text-carbon-800",
        dark: "bg-carbon-900 text-bone",
        wine: "bg-wine-700 text-bone-pure",
        gold: "bg-gold-500/20 text-oak-700 ring-1 ring-gold-500/40",
        success: "bg-success-100 text-success-500",
        warning: "bg-warning-100 text-warning-500",
        danger: "bg-danger-100 text-danger-500",
        info: "bg-info-100 text-info-500",
        outline: "border border-linen-300 text-stone-600",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {children}
    </span>
  );
}

export function Chip({
  active,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-pill border px-3 text-[13px] transition-colors duration-[160ms]",
        active
          ? "border-carbon-900 bg-carbon-900 text-bone"
          : "border-linen-300 bg-transparent text-carbon-800 hover:border-carbon-600",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { badgeVariants };
