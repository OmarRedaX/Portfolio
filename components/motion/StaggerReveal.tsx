"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { motion, type Transition } from "framer-motion";
import { signalRevealGeometry } from "@/lib/game/geometry";

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
  const host = useRef<HTMLDivElement>(null);
  return (
    <motion.div
      ref={host}
      data-game-reveal-state="pending"
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      onViewportEnter={() => {
        if (host.current) signalRevealGeometry(host.current, "moving");
      }}
      onAnimationComplete={() => {
        if (host.current) signalRevealGeometry(host.current, "settled");
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
  const host = useRef<HTMLDivElement>(null);
  return (
    <motion.div
      ref={host}
      data-game-reveal-state="pending"
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
      onAnimationStart={() => {
        if (host.current) signalRevealGeometry(host.current, "moving");
      }}
      onAnimationComplete={() => {
        if (host.current) signalRevealGeometry(host.current, "settled");
      }}
    >
      {children}
    </motion.div>
  );
}
