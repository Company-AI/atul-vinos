"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  size = "md",
  label = "Cantidad",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
}) {
  const box = size === "sm" ? "h-8" : "h-11";
  const btn = size === "sm" ? "w-8" : "w-11";

  return (
    <div
      className={cn(
        "inline-flex items-stretch rounded-sm border border-linen-300 bg-bone-pure",
        box,
        disabled && "opacity-50",
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        aria-label="Quitar uno"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(
          btn,
          "grid place-items-center text-carbon-800 transition-colors hover:bg-linen-200 disabled:pointer-events-none disabled:text-stone-400",
        )}
      >
        <Minus className="size-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/\D/g, ""));
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        className="w-10 border-x border-linen-300 bg-transparent text-center text-sm tabular outline-none"
      />
      <button
        type="button"
        aria-label="Agregar uno"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(
          btn,
          "grid place-items-center text-carbon-800 transition-colors hover:bg-linen-200 disabled:pointer-events-none disabled:text-stone-400",
        )}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
