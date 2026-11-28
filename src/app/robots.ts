import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/api/export"], disallow: ["/api/"] },
    sitemap: "https://www.specterpoint.online/sitemap.xml",
    host: "https://www.specterpoint.online",
  };
}
