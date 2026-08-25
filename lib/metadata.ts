import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "./site";

// The root app/opengraph-image.tsx (and twitter-image.tsx) file convention only auto-attaches
// to a route that *doesn't* define its own openGraph/twitter object. Next.js metadata merging
// replaces the whole `openGraph`/`twitter` object when a route sets one (nested fields don't
// shallow-merge across segments — see generateMetadata docs), which silently drops the
// file-convention image too. So every per-route override must reference it explicitly.
const sharedImage = { url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 };

export function buildMetadata({
  title,
  description,
  path,
  ogType = "website",
}: {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article" | "profile";
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type: ogType,
      locale: "en_US",
      images: [sharedImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [sharedImage.url],
    },
  };
}
