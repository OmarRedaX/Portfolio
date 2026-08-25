import { ImageResponse } from "next/og";
import { OgCard } from "@/lib/og-card";

export const alt = "Omar Reda — Full-Stack Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Typographic-only OG card — no photo dependency, per the design tokens (Design Direction &
// Tokens, CLAUDE.md). Mirrors the site palette (warm off-black + cyanotype-blue accent) and the
// tag/bracket motif from .tag in app/globals.css, reimplemented in plain CSS since ImageResponse
// can't read the site's Tailwind/CSS-variable layer.
export default function Image() {
  return new ImageResponse(<OgCard />, { ...size });
}
