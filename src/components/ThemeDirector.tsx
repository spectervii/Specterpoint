"use client";

import { useEffect } from "react";
import { EARTH, ENGAGECL, VOLUMES, applyPalette, type Palette } from "@/lib/volumes";
import { onShelfTheme } from "@/lib/shelfBridge";

/* Whichever zone crosses the middle of the screen owns the page's
   colours. Zones declare data-palette: "earth", a volume id, or
   "shelf" (follow whatever volume the 3D shelf is showing). */

export default function ThemeDirector() {
  useEffect(() => {
    let zone = "earth";
    let shelfPalette: Palette = VOLUMES[0].palette;

    const paint = () => {
      if (zone === "shelf") applyPalette(shelfPalette);
      else if (zone === "earth") applyPalette(EARTH);
      else if (zone === "engagecl") applyPalette(ENGAGECL);
      else applyPalette(VOLUMES.find((v) => v.id === zone)?.palette ?? EARTH);
    };

    const off = onShelfTheme((p) => {
      shelfPalette = p;
      if (zone === "shelf") paint();
    });

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            zone = (entry.target as HTMLElement).dataset.palette ?? "earth";
            paint();
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    document.querySelectorAll("[data-palette]").forEach((el) => io.observe(el));
    paint();
    return () => {
      io.disconnect();
      off();
    };
  }, []);

  return null;
}
