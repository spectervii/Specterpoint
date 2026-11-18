"use client";

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
      />
    </section>
  );
}

export function Shelf() {
  return (
    <>
      <section id="shelf" data-palette="shelf" className="shader-frame scroll-mt-0" aria-label="The shelf: seven volumes">
        <CompleteShelfLandingPage headingFont="geist" bodyFont="geist" applyScene={attachShelf} />
      </section>
    </>
  );
}
