"use client";

import { useEffect, useRef, useState } from "react";
import { RollingDigits } from "@/components/ApprovalCard";
import { useSeen } from "@/lib/hooks";
import { openVolume } from "@/lib/shelfBridge";
import { CONTACT, volumeIndex } from "@/lib/volumes";
import { EngageHub } from "./visuals";

export default function Engage() {
  const ref = useRef<HTMLElement>(null);
  const active = useSeen(ref, 0.3);
  const [value, setValue] = useState("4 → 4");
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setValue("4 → 1"), 700);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <section
      ref={ref}
      id="engage"
      data-palette="engage"
      aria-label="engagecl.com"
    >
      <div className="mx-auto grid min-h-svh w-full max-w-[1320px] items-center gap-12 px-4 py-24 sm:px-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div className="flex min-w-0 flex-col gap-6">
          <p className="kicker">
            Founder · engagecl.com
          </p>
          <h2 className="display text-[clamp(64px,10vw,160px)] text-ink tabular-nums" aria-label="Four channels, one platform">
            <span aria-hidden>
              <RollingDigits value={value} />
            </span>
          </h2>
          <p className="max-w-[30ch] text-[clamp(18px,1.6vw,22px)] leading-snug text-ink-2">
            Our messages kept breaking across tools, so I built one place for{" "}
            <span className="text-ink">push, WhatsApp, SMS and email</span>, with every customer tracked.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={CONTACT.engage}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 font-sans text-[15px] font-medium text-accent-ink transition-[filter] hover:brightness-110"
            >
              Visit engagecl.com <span aria-hidden>→</span>
            </a>
            <button
              type="button"
              onClick={() => openVolume(volumeIndex("engage"))}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--line-strong)] px-5 font-sans text-[15px] font-medium text-ink transition-colors hover:border-ink"
            >
              Open volume IV
            </button>
          </div>
        </div>
        <div className="min-w-0">
          <EngageHub active={active} />
        </div>
      </div>
    </section>
  );
}
