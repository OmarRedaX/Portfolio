import { ImageResponse } from "next/og";
import { OgCard } from "@/lib/og-card";

export const alt = "Omar Reda — Full-Stack Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<OgCard />, { ...size });
}
