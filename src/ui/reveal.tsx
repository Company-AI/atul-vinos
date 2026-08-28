"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Reveal al entrar en viewport. Una sola vez, 620ms, con stagger opcional.
 * Respeta prefers-reduced-motion (no anima, solo renderiza).
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  if (reduce) {
    const Tag = as as React.ElementType;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.62, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}

/** Aplica stagger de 80ms a los hijos directos. */
export function RevealGroup({
  children,
  className,
  step = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  step?: number;
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, i) => (
        <Reveal delay={i * step}>{child}</Reveal>
      ))}
    </div>
  );
}
