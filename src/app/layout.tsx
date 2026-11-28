import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-geist-mono", display: "swap" });

import { KEYWORDS, SITE } from "@/lib/seo";

const TITLE = "Is there light? Live NEPA light status and power outage tracker for Nigeria";
const DESCRIPTION =
  "Is there light in your area? Live NEPA light status for every LGA in Nigeria from residents' reports, with national grid generation, grid collapse alerts and each DisCo's load allocation, updated hourly. Free CSV download.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: "%s" },
  description: DESCRIPTION,
  keywords: KEYWORDS,
  applicationName: "Specterpoint",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: { title: TITLE, description: DESCRIPTION, url: SITE, siteName: "Specterpoint", type: "website", locale: "en_NG" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ece7dc" },
    { media: "(prefers-color-scheme: dark)", color: "#161915" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geistMono.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
