import { ImageResponse } from "next/og";

export const alt = "Is there light? Live NEPA light status for Nigeria";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#ece7dc", color: "#2b2721", fontFamily: "monospace" }}>
        <svg width="120" height="120" viewBox="0 0 24 24">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5Z" fill="#86b26f" />
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4M9 14h6v4H9z" fill="none" stroke="#2b2721" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 36, letterSpacing: -1 }}>Is there light?</div>
        <div style={{ fontSize: 34, marginTop: 18, color: "#57524a" }}>Live NEPA light status for every area in Nigeria</div>
        <div style={{ fontSize: 26, marginTop: 40, color: "#4f8a3e" }}>specterpoint.online</div>
      </div>
    ),
    size,
  );
}
