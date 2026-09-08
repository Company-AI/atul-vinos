import { cn } from "@/lib/cn";
import { discountPercent, formatARS, type MoneyInput } from "@/lib/money";

export function Price({
  value,
  compareAt,
  size = "md",
  className,
}: {
  value: MoneyInput;
  compareAt?: MoneyInput | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const off = discountPercent(value, compareAt);
  return (
    <span className={cn("inline-flex items-baseline gap-2 tabular", className)}>
      <span
        className={cn(
          "font-medium text-carbon-900",
          size === "sm" && "text-[13px]",
          size === "md" && "text-[15px]",
          size === "lg" && "text-xl",
        )}
      >
        {formatARS(value)}
      </span>
      {off !== null && (
        <>
          <span
            className={cn(
              "text-stone-400 line-through",
              size === "lg" ? "text-sm" : "text-[12px]",
            )}
          >
            {formatARS(compareAt!)}
          </span>
          {/*
            Granate y no azul: el azul es el acento de marca y un "-12%" en
            azul se lee como decoración. La regla está escrita en los tokens
            (globals.css): el granate queda reservado a ofertas y descuentos.
          */}
          <span className="rounded-xs bg-wine-600 px-1.5 py-0.5 text-[10px] font-medium text-bone-pure">
            −{off}%
          </span>
        </>
      )}
    </span>
  );
}
