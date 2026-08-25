"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, type Transition } from "framer-motion";

// Scroll-in fade/translate, once per element (Animation Strategy, implementation-plan.md §4).
// Reduced motion is handled entirely by the global CSS rule in globals.css (which collapses
// transition/animation durations to ~0), not by branching the `initial`/`animate` targets here
// — useReducedMotion() only knows the real value on the client (no `window` during SSR), so
// using it to change animation targets made the server- and client-rendered styles diverge and
// throw a hydration mismatch on every Reveal on the page.
const EASE_STANDARD: Transition["ease"] = [0.22, 1, 0.36, 1];

export function Reveal({
  children,
  className,
  style,
  delay = 0,
  y = 12,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: EASE_STANDARD, delay }}
    >
      {children}
    </motion.div>
  );
}
