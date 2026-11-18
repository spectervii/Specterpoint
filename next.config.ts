import type { NextConfig } from "next";

const WEEK = 60 * 60 * 24 * 7;

const nextConfig: NextConfig = {
  async headers() {
    return [
      // versioned or content-stable files: cache for a year
      {
        source: "/vendor/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // covers, videos and textures: a week, refreshed quietly in the background
      {
        source: "/landing-pages/media/:path*",
        headers: [{ key: "Cache-Control", value: `public, max-age=${WEEK}, stale-while-revalidate=${WEEK * 4}` }],
      },
      // the two framed pages and the CVs change with edits: revalidate, but serve the cached copy meanwhile
      {
        source: "/landing-pages/:file*.html",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, stale-while-revalidate=86400" }],
      },
      {
        source: "/cv/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
