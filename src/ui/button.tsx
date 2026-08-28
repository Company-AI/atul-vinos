import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "font-sans font-medium tracking-wide",
    "transition-[background-color,color,border-color,opacity] duration-[160ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
    "disabled:pointer-events-none disabled:opacity-45",
    "aria-[busy=true]:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: "bg-wine-700 text-bone-pure hover:bg-wine-600 rounded-md",
        dark: "bg-carbon-900 text-bone hover:bg-carbon-800 rounded-md",
        outline:
          "border border-carbon-900 text-carbon-900 hover:bg-carbon-900 hover:text-bone rounded-md",
        ghostLight:
          "border border-bone/40 text-bone hover:bg-bone hover:text-carbon-900 rounded-md backdrop-blur-[2px]",
        subtle: "bg-linen-200 text-carbon-900 hover:bg-linen-300 rounded-md",
        quiet: "text-carbon-900 hover:bg-linen-200 rounded-md",
        danger: "bg-danger-500 text-white hover:opacity-90 rounded-md",
        link: "text-carbon-900 underline underline-offset-4 hover:text-wine-700",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px]",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-8 text-sm",
        icon: "h-10 w-10",
      },
      block: { true: "w-full", false: "" },
      uppercase: { true: "uppercase text-[11px] tracking-[0.16em]", false: "" },
    },
    defaultVariants: { variant: "dark", size: "md", block: false, uppercase: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, uppercase, loading, children, ...props }, ref) => (
    <button
      ref={ref}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, block, uppercase }), className)}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={cn(
        "size-3.5 shrink-0 animate-spin rounded-full border-[1.5px] border-current border-t-transparent",
        className,
      )}
    />
  );
}

export { buttonVariants };
