import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// /dev/style-guide is intentionally excluded — it's noindex'd internal tooling
// (app/dev/layout.tsx), never linked from site navigation.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE_URL, lastModified, changeFrequency: "monthly", priority: 1 },
    {
      url: `${SITE_URL}/work/quick-bite`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/resume`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
