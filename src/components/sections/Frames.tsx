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
      <section data-palette="shelf" className="mx-auto flex min-h-[60svh] w-full max-w-[1320px] flex-col justify-end gap-4 px-4 pb-12 sm:px-10">
        <p className="kicker">The shelf</p>
        <h2 className="display max-w-[12ch] text-[clamp(56px,10vw,160px)]">Every step has a volume.</h2>
      </section>
      <section id="shelf" data-palette="shelf" className="shader-frame scroll-mt-0" aria-label="The shelf: seven volumes">
        <CompleteShelfLandingPage headingFont="geist" bodyFont="geist" applyScene={attachShelf} />
      </section>
    </>
  );
}
