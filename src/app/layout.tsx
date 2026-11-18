import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://specterpoint.online"),
  title: "Opeyemi Shodipo · Specterpoint",
  description: "4,000 to 40,000 users in a year. Data that finds the moment, security that keeps it honest, and engagecl.com to deliver it.",
  openGraph: {
    title: "Opeyemi Shodipo · Specterpoint",
    description: "Signal, growth, shield, platform.",
    url: "https://specterpoint.online",
    siteName: "Specterpoint",
    type: "profile",
  },
};

export const viewport: Viewport = {
  themeColor: "#29251d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
