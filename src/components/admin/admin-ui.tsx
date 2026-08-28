import * as React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Tarjeta de métrica: cifra grande, contexto chico, sin decoración. */
export function MetricCard({
  label,
  value,
  hint,
  delta,
  href,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  delta?: { value: number; label?: string };
  href?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const content = (
    <>
      <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-[26px] font-medium leading-none tabular",
          tone === "neutral" && "text-carbon-900",
          tone === "success" && "text-success-500",
          tone === "warning" && "text-warning-500",
          tone === "danger" && "text-danger-500",
          tone === "info" && "text-info-500",
        )}
      >
        {value}
      </p>
      {(hint || delta) && (
        <p className="mt-1.5 flex items-center gap-1 text-[12px] text-stone-500">
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 tabular",
                delta.value >= 0 ? "text-success-500" : "text-danger-500",
              )}
            >
              {delta.value >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {Math.abs(delta.value)}%
            </span>
          )}
          {hint}
        </p>
      )}
    </>
  );

  const className = cn(
    "block rounded-md border border-linen-200 bg-bone-pure p-4",
    href && "transition-colors hover:border-stone-400",
  );

  return href ? <Link href={href} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}

export function AdminPageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href: string }[];
}) {
  return (
    <header className="mb-6">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Ruta" className="mb-2 flex items-center gap-1.5 text-[12px] text-stone-500">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>/</span>}
              <Link href={crumb.href} className="hover:text-carbon-900">{crumb.label}</Link>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-light leading-tight text-carbon-900">
            {title}
          </h1>
          {description && <p className="mt-1 text-[13px] text-stone-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function AdminCard({
  title,
  description,
  action,
  children,
  className,
  padded = true,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("rounded-md border border-linen-200 bg-bone-pure", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linen-200 px-4 py-3">
          <div>
            {title && <h2 className="text-[13px] font-medium text-carbon-900">{title}</h2>}
            {description && <p className="mt-0.5 text-[12px] text-stone-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn(padded && "p-4")}>{children}</div>
    </section>
  );
}

/** Tabla densa con encabezado fijo y scroll horizontal propio. */
export function AdminTable({
  headers,
  children,
  empty,
  className,
}: {
  headers: (string | { label: string; align?: "left" | "right" | "center"; className?: string })[];
  children: React.ReactNode;
  empty?: React.ReactNode;
  className?: string;
}) {
  const hasRows = React.Children.count(children) > 0;

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[720px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-linen-300 bg-linen-100">
            {headers.map((header, i) => {
              const config = typeof header === "string" ? { label: header } : header;
              return (
                <th
                  key={`${config.label}-${i}`}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-3 py-2 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-stone-500",
                    config.align === "right" && "text-right",
                    config.align === "center" && "text-center",
                    typeof header !== "string" ? header.className : undefined,
                  )}
                >
                  {config.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-linen-200">{children}</tbody>
      </table>

      {!hasRows && empty && <div className="p-6">{empty}</div>}
    </div>
  );
}

export function Td({
  children,
  align = "left",
  className,
  colSpan,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "px-3 py-2.5 align-middle text-carbon-800",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}
