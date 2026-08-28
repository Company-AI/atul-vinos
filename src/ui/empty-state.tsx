import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Estados vacíos con salida: siempre explican qué pasó y ofrecen una acción.
 * Nunca una tabla vacía sin contexto.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed border-linen-300 text-center",
        compact ? "px-6 py-10" : "px-6 py-20",
        className,
      )}
    >
      {icon && <div className="mb-4 text-stone-400">{icon}</div>}
      <p className="font-display text-display-sm font-light text-carbon-900">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
