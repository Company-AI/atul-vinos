import * as React from "react";
import { cn } from "@/lib/cn";

export function Container({
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
        "mx-auto w-full px-gutter",
        size === "narrow" && "max-w-[880px]",
        size === "default" && "max-w-[1440px]",
        size === "wide" && "max-w-none",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Section({
  tone = "light",
  density = "default",
  className,
  children,
  id,
}: {
  tone?: "light" | "dark" | "linen" | "none";
  density?: "default" | "compact" | "none";
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        tone === "light" && "bg-bone text-carbon-900",
        tone === "linen" && "bg-linen-100 text-carbon-900",
        tone === "dark" && "on-dark bg-carbon-900 text-linen-100",
        density === "default" && "py-section",
        density === "compact" && "py-section-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("eyebrow text-stone-500", className)}>{children}</p>
  );
}

export function Heading({
  level = 2,
  size = "lg",
  className,
  children,
}: {
  level?: 1 | 2 | 3 | 4;
  size?: "xl" | "lg" | "md" | "sm";
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = `h${level}` as React.ElementType;
  return (
    <Tag
      className={cn(
        "font-display font-light",
        size === "xl" && "text-display-xl",
        size === "lg" && "text-display-lg",
        size === "md" && "text-display-md",
        size === "sm" && "text-display-sm",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Prose({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "max-w-[62ch] text-[15px] leading-[1.75] text-stone-600 [&_a]:underline [&_a]:underline-offset-4 [&_p+p]:mt-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-t border-linen-200", className)} />;
}
