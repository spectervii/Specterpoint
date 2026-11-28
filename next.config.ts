import type { NextConfig } from "next";

const WEEK = 60 * 60 * 24 * 7;

/* Everything the browser loads comes from this origin: no CDNs, no third-party
   fonts or scripts. Address search reaches OpenStreetMap from the server, not
   the browser. Inline scripts and styles are allowed because Next.js uses them. */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const NOINDEX = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // the map and gazetteer only change when the build script is re-run
      {
        source: "/geo/:path*",
        headers: [{ key: "Cache-Control", value: `public, max-age=${WEEK}, stale-while-revalidate=${WEEK * 4}` }],
      },
      // API responses stay out of search results, except the dataset download
      { source: "/api/((?!export).*)", headers: NOINDEX },
    ];
  },
};

export default nextConfig;
