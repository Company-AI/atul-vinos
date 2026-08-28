import { cn } from "@/lib/cn";
import { Badge } from "./badge";

export type StockState = "in_stock" | "low_stock" | "out_of_stock" | "reserved_club";

export function stockState(available: number, minStock = 0): StockState {
  if (available <= 0) return "out_of_stock";
  if (available <= Math.max(minStock, 6)) return "low_stock";
  return "in_stock";
}

const COPY: Record<StockState, { label: string; tone: "success" | "warning" | "danger" | "info" }> = {
  in_stock: { label: "Disponible", tone: "success" },
  low_stock: { label: "Últimas botellas", tone: "warning" },
  out_of_stock: { label: "Sin stock", tone: "danger" },
  reserved_club: { label: "Reservado para el Club", tone: "info" },
};

export function StockIndicator({
  available,
  minStock,
  state,
  showCount = false,
  className,
}: {
  available?: number;
  minStock?: number;
  state?: StockState;
  showCount?: boolean;
  className?: string;
}) {
  const resolved = state ?? stockState(available ?? 0, minStock);
  const { label, tone } = COPY[resolved];
  return (
    <Badge tone={tone} className={cn("gap-1.5", className)}>
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          tone === "success" && "bg-success-500",
          tone === "warning" && "bg-warning-500",
          tone === "danger" && "bg-danger-500",
          tone === "info" && "bg-info-500",
        )}
      />
      {label}
      {showCount && resolved !== "out_of_stock" && available !== undefined && (
        <span className="tabular">· {available}</span>
      )}
    </Badge>
  );
}
