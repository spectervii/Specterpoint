"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { RollingDigits } from "@/components/ApprovalCard";
import { useSeen } from "@/lib/hooks";
import { openVolume } from "@/lib/shelfBridge";
import { CONTACT, VOLUMES, volumeIndex } from "@/lib/volumes";
import { EngageHub, GrowthField, ShieldGate, SignalDay } from "./visuals";

function Rolling({ from, to, active, delay = 300 }: { from: string; to: string; active: boolean; delay?: number }) {
  const [value, setValue] = useState(from);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setValue(to), delay);
    return () => clearTimeout(t);
  }, [active, to, delay]);
  return (
    <span aria-label={to}>
      <span aria-hidden>
        <RollingDigits value={value} />
      </span>
    </span>
  );
}

type Step = {
  n: string;
  name: string;
  volume: string;
  headline: (active: boolean) => ReactNode;
  line: string;
  visual: (active: boolean) => ReactNode;
  next?: { label: string; href: string; external?: boolean };
};

const STEPS: Step[] = [
  {
    n: "01",
    name: "Signal",
    volume: "signal",
    headline: () => <>On their clock.</>,
    line: "MinieMoney users came alive in the same windows every day. Email and push now land inside them.",
    visual: (a) => <SignalDay active={a} />,
    next: { label: "which grew the base", href: "#growth" },
  },
  {
    n: "02",
    name: "Growth",
    volume: "growth",
    headline: (a) => <Rolling from="04,000" to="40,000" active={a} delay={250} />,
    line: "MinieMoney users in twelve months. Up from 4,000. The right message, to the right person, at the right time.",
    visual: (a) => <GrowthField active={a} />,
    next: { label: "and growth draws fakes", href: "#shield" },
  },
  {
    n: "03",
    name: "Shield",
    volume: "shield",
    headline: () => <>1 person.<br />1 account.</>,
    line: "Helped build the anti-fraud system that stops duplicate accounts and false identities at sign-up.",
    visual: (a) => <ShieldGate active={a} />,
    next: { label: "so every message reaches someone real", href: "#platform" },
  },
  {
    n: "04",
    name: "Platform",
    volume: "engage",
    headline: (a) => <Rolling from="4 → 4" to="4 → 1" active={a} delay={700} />,
    line: "Our messages kept breaking across tools, so I built engagecl.com: push, WhatsApp, SMS and email in one platform, every customer tracked.",
    visual: (a) => <EngageHub active={a} />,
    next: { label: "engagecl.com", href: CONTACT.engage, external: true },
  },
];

function StepPanel({ step }: { step: Step }) {
  const ref = useRef<HTMLElement>(null);
  const active = useSeen(ref, 0.3);
  const v = VOLUMES[volumeIndex(step.volume)];
  return (
    <section
      ref={ref}
      id={step.name.toLowerCase()}
      data-palette={step.volume}
      aria-label={`${step.n} ${step.name}`}
      className="relative mx-auto grid min-h-svh w-full max-w-[1320px] items-center gap-10 py-24 pr-4 pl-10 sm:pr-10 sm:pl-20 lg:grid-cols-[1fr_1.1fr] lg:gap-20"
    >
      {/* node on the thread */}
      <span aria-hidden className="absolute top-24 left-4 grid size-3 -translate-x-1/2 place-items-center rounded-full bg-ink sm:left-10" />

      <div className="flex min-w-0 flex-col gap-6">
        <p className="kicker">
          {step.n} · {step.name}
        </p>
        <h3 className="display text-[clamp(56px,9.5vw,150px)] text-ink">{step.headline(active)}</h3>
        <p className="max-w-[34ch] text-[clamp(16px,1.45vw,20px)] leading-snug text-ink-2">{step.line}</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-2">
          {step.next && (
            <a
              href={step.next.href}
              {...(step.next.external ? { target: "_blank", rel: "noopener" } : {})}
              className="group inline-flex min-h-11 items-center gap-2 font-mono text-[12.5px] text-ink"
            >
              <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">{step.next.external ? "↗" : "→"}</span>
              <span className="border-b border-[var(--line-strong)] pb-0.5 transition-colors group-hover:border-ink">{step.next.label}</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => openVolume(volumeIndex(step.volume))}
            className="inline-flex min-h-11 items-center gap-2 font-mono text-[12.5px] text-ink-3 transition-colors hover:text-ink"
          >
            <span className="grid size-6 place-items-center rounded-full bg-accent text-[10px] text-accent-ink">{v.roman}</span>
            Open the volume
          </button>
        </div>
      </div>
      <div className="min-w-0">{step.visual(active)}</div>
    </section>
  );
}

/** the thread that ties the four steps together; it fills as you read */
function Thread() {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setP(Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / r.height)));
      });
    };
    on();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => {
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
    };
  }, []);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-y-0 left-4 w-px sm:left-10">
      <div className="absolute inset-0 bg-[var(--line)]" />
      <div className="absolute inset-x-0 top-0 bg-ink" style={{ height: `${p * 100}%` }} />
    </div>
  );
}

export default function Record() {
  return (
    <div id="record">
      <section data-palette="earth" className="mx-auto flex min-h-[80svh] w-full max-w-[1320px] flex-col justify-end gap-5 px-4 pb-16 sm:px-10">
        <p className="kicker">The chain</p>
        <h2 className="display max-w-[11ch] text-[clamp(60px,11vw,180px)] text-accent">
          How 4,000 became 40,000.
        </h2>
      </section>

      <div className="relative mx-auto w-full max-w-[1320px]">
        <Thread />
        {STEPS.map((s) => (
          <StepPanel key={s.n} step={s} />
        ))}
      </div>
    </div>
  );
}
