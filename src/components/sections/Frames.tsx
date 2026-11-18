"use client";

import { useEffect, useRef, useState } from "react";
import { BestsellersBookShowcase, CompleteShelfLandingPage } from "@/components/threeui/LandingPages";
import { showcaseHost } from "@/components/threeui/hostBoundary";
import { attachShelf } from "@/lib/shelfBridge";

export function Hero() {
  return (
    <section data-palette="earth" className="shader-frame" aria-label="Opeyemi Shodipo: Security, Data, Growth">
      <BestsellersBookShowcase
        headingFont="geist"
        bodyFont="geist"
        headingWeight="600"
        bodyWeight="400"
        primaryColor="#c3a47b"
        headingSize={325}
        bodySize={17}
        headingLetterSpacing={-0.07}
        applyScene={showcaseHost}
        style={{ background: "#29251d" }}
      />
    </section>
  );
}

/* The shelf is a full WebGL scene that builds dozens of textures when it
   starts. It is mounted only when the visitor gets close to it, or once the
   page has settled and the browser is idle, so it never competes with the
   books at the top while they are being read. */
export function Shelf() {
  const ref = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    const el = ref.current;
    if (!el) return;
    const mount = () => setMounted(true);
    const io = new IntersectionObserver((entries) => entries.some((e) => e.intersectionRatio > 0) && mount(), {
      rootMargin: "0px",
    });
    io.observe(el);

    let idle = 0;
    let timer = 0;
    const whenIdle = () => {
      timer = window.setTimeout(() => {
        const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
        idle = ric ? ric(mount, { timeout: 4000 }) : window.setTimeout(mount, 200);
      }, 3500);
    };
    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });

    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      const cic = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (idle && cic) cic(idle);
      window.removeEventListener("load", whenIdle);
    };
  }, [mounted]);

  return (
    <section ref={ref} id="shelf" data-palette="shelf" className="shader-frame scroll-mt-0" style={{ background: "#171a24" }} aria-label="The shelf: seven volumes">
      {mounted && (
        <CompleteShelfLandingPage headingFont="geist" bodyFont="geist" applyScene={attachShelf} style={{ background: "#171a24" }} />
      )}
    </section>
  );
}
