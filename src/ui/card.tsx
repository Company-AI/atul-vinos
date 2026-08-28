import * as React from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  tone = "light",
  padded = true,
}: {
  className?: string;
  children: React.ReactNode;
  tone?: "light" | "dark" | "linen";
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border",
        tone === "light" && "border-linen-200 bg-bone-pure",
        tone === "linen" && "border-linen-300 bg-linen-100",
        tone === "dark" && "on-dark border-carbon-700 bg-carbon-800 text-linen-100",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4", className)}>
      <div>
        <h3 className="font-sans text-sm font-medium text-carbon-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-[13px] text-stone-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
