"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, type Transition } from "framer-motion";

const EASE_STANDARD: Transition["ease"] = [0.22, 1, 0.36, 1];

// Container/item pair for a light stagger-in on scroll (tech-stack labels, list entries) —
// Animation Strategy, implementation-plan.md §4. Never loops or idles: viewport `once` fires
// the stagger a single time per element, matching the "never repeating" rule. Reduced motion is
// handled by the global CSS rule in globals.css, not by branching targets here — see Reveal.tsx
// for why a client-only reduceMotion branch on `initial`/`animate` causes a hydration mismatch.
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.09,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  style,
  y = 8,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: EASE_STANDARD },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
