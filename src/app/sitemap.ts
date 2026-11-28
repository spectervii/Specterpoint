import type { MetadataRoute } from "next";
import { AREA_LIST } from "@/lib/server/areas";
import { SITE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...AREA_LIST.map((a) => ({ url: `${SITE}/area/${a.id}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.6 })),
  ];
}
