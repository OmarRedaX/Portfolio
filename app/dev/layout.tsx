import type { Metadata } from "next";

// Everything under /dev is an internal tool, never meant to be indexed or linked
// from site navigation.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return children;
}
