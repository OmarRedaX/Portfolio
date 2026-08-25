"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

// Functional scroll-progress indicator for the case-study page (Animation Strategy,
// implementation-plan.md §4) — the one place a technical accent earns its place on long-form
// content. Sits just under the sticky header (z-40, header is z-50). Tied 1:1 to the visitor's
// own scroll input rather than an independent/decorative animation, so it's left out of the
// reduced-motion branching (which also avoids the SSR/client mismatch described in Reveal.tsx).
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 40,
    restDelta: 0.001,
  });

  // Header height isn't a fixed constant — it differs between the mobile/desktop nav rows and
  // reflows on font load/resize, so a hardcoded top offset would drift out of alignment with the
  // sticky header's actual bottom edge. Measured instead of hardcoded; the header is `sticky
  // top-0`, so its rendered height (not scroll position) is all that's needed.
  const [top, setTop] = useState(0);
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const update = () => setTop(header.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 z-40 h-[2px] origin-left"
      style={{ background: "var(--accent)", scaleX, top }}
    />
  );
}
