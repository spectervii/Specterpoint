"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/hooks";

const css = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/* ── 01 · Signal ────────────────────────────────────────────
 * A day of activity. Users cluster in a few windows; once the
 * windows show, messages drop into them. */

const ACTIVITY = [8, 5, 4, 3, 3, 6, 22, 58, 74, 46, 30, 34, 62, 55, 32, 26, 28, 36, 52, 80, 92, 70, 38, 16];
const PEAKS = new Set([7, 8, 12, 13, 19, 20, 21]);

export function SignalDay({ active }: { active: boolean }) {
  return (
    <div className="flex w-full flex-col gap-3" aria-hidden>
      <div className="flex h-[42svh] max-h-[380px] min-h-[220px] w-full gap-[3px] sm:gap-1.5">
        {ACTIVITY.map((v, h) => {
          const peak = PEAKS.has(h);
          const height = active ? v : 2;
          const delay = h * 35;
          return (
            <div key={h} className="relative flex-1">
              <div
                className="absolute inset-x-0 bottom-0 rounded-t-[3px]"
                style={{
                  height: `${height}%`,
                  background: peak ? "var(--accent)" : "color-mix(in srgb, var(--ink) 22%, transparent)",
                  transition: `height 900ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
                }}
              />
              {peak && (
                <span
                  className="absolute left-1/2 block aspect-square w-[70%] max-w-[14px] -translate-x-1/2 rounded-[3px] bg-ink"
                  style={{
                    bottom: `calc(${height}% + 8px)`,
                    opacity: active ? 1 : 0,
                    transition: `bottom 900ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, opacity 300ms ease ${1300 + h * 45}ms`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between font-mono text-[10.5px] text-ink-3 tabular-nums">
        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
      </div>
    </div>
  );
}

/* ── 02 · Growth ────────────────────────────────────────────
 * 1,000 cells, one per 40 users. 100 lit at the start, all
 * of them by the end. */

export function GrowthField({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const COLS = 40, ROWS = 25, TOTAL = COLS * ROWS;
    let seed = 40000;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const order = Array.from({ length: TOTAL }, (_, i) => i);
    // the first 4,000 users sit together at the bottom left; the rest scatter in
    const first = order.filter((i) => Math.floor(i / COLS) >= ROWS - 10 && i % COLS < 10);
    const rest = order.filter((i) => !first.includes(i)).sort(() => rand() - 0.5);
    const sequence = [...first, ...rest];
    const litAt = new Float32Array(TOTAL);
    sequence.forEach((cell, k) => (litAt[cell] = k < 100 ? 0 : (k - 100) / (TOTAL - 100)));

    let raf = 0;
    let start = 0;
    const DURATION = 2600;
    const draw = (t: number) => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (activeRef.current && !start) start = t;
      const p = reduced ? (activeRef.current ? 1 : 0) : start ? Math.min(1, (t - start) / DURATION) : 0;
      const eased = 1 - Math.pow(1 - p, 3);
      const cell = Math.min(w / COLS, h / ROWS);
      const s = cell * 0.62;
      const ox = (w - cell * COLS) / 2, oy = (h - cell * ROWS) / 2;
      const ink = css("--ink", "#171914");
      for (let i = 0; i < TOTAL; i++) {
        const x = ox + (i % COLS) * cell + (cell - s) / 2;
        const y = oy + Math.floor(i / COLS) * cell + (cell - s) / 2;
        const on = litAt[i] === 0 || litAt[i] <= eased;
        ctx.globalAlpha = on ? 1 : 0.13;
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.roundRect(x, y, s, s, s * 0.28);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return <canvas ref={ref} aria-hidden className="block aspect-[8/5] w-full" />;
}

/* ── 03 · Shield ────────────────────────────────────────────
 * Sign-ups stream toward the gate. Duplicates and false
 * identities are caught there; real people pass through. */

export function ShieldGate({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    type Token = { lane: number; x: number; speed: number; bad: boolean; caught: number };
    const LANES = 7;
    const tokens: Token[] = [];
    const spawn = (x?: number) =>
      tokens.push({ lane: Math.floor(rand() * LANES), x: x ?? -0.08, speed: 0.0011 + rand() * 0.0012, bad: rand() < 0.24, caught: 0 });
    for (let i = 0; i < 26; i++) spawn(rand() * 1.1 - 0.1);

    let raf = 0;
    let last = 0;
    const GATE = 0.58;
    const draw = (t: number) => {
      const dt = last ? Math.min(48, t - last) : 16;
      last = t;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const ink = css("--ink", "#f4eee6");
      const accent = css("--accent", "#c87046");
      const laneH = h / LANES;
      const tw = Math.max(18, Math.min(34, w * 0.045)), th = laneH * 0.42;

      // the gate
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(w * GATE - 1.5, 0, 3, h);
      ctx.globalAlpha = 0.12;
      ctx.fillRect(w * GATE, 0, w * (1 - GATE), h);

      const moving = activeRef.current && !reduced;
      for (let i = tokens.length - 1; i >= 0; i--) {
        const k = tokens[i];
        if (moving) {
          if (k.bad && k.x + tw / w >= GATE - 0.004 && k.caught === 0) k.caught = 0.001;
          if (k.caught > 0) k.caught += dt / 900;
          else k.x += k.speed * dt * 0.16;
        }
        if (k.caught >= 1 || k.x > 1.05) {
          tokens.splice(i, 1);
          spawn();
          continue;
        }
        const x = k.x * w;
        const y = k.lane * laneH + (laneH - th) / 2;
        const passed = k.x > GATE;
        ctx.globalAlpha = k.caught > 0 ? 1 - k.caught : passed ? 1 : 0.55;
        ctx.fillStyle = k.bad && (k.caught > 0 || k.x + tw / w > GATE - 0.12) ? accent : ink;
        ctx.beginPath();
        ctx.roundRect(x, y, tw, th, th * 0.3);
        ctx.fill();
        if (k.caught > 0) {
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2;
          const cx = x + tw / 2, cy = y + th / 2, r = th * 0.9;
          ctx.beginPath();
          ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx + r, cy + r);
          ctx.moveTo(cx + r, cy - r); ctx.lineTo(cx - r, cy + r);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <div className="flex w-full flex-col gap-3">
      <canvas ref={ref} aria-hidden className="block aspect-[8/5] w-full" />
      <div className="flex justify-between font-mono text-[10.5px] text-ink-3">
        <span>Sign-ups</span>
        <span>Verified</span>
      </div>
    </div>
  );
}

/* ── 04 · Platform ──────────────────────────────────────────
 * Four channels converge on one platform; every customer
 * comes out on one timeline. */

const CHANNELS = ["Push", "WhatsApp", "SMS", "Email"];

export function EngageHub({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const ys = [40, 100, 160, 220];
  return (
    <svg viewBox="0 0 520 260" className="w-full overflow-visible" role="img" aria-label="Push, WhatsApp, SMS and email flowing into engagecl.com">
      {ys.map((y, i) => {
        const d = `M118 ${y} C 220 ${y}, 220 130, 300 130`;
        return (
          <g key={CHANNELS[i]}>
            <text x="104" y={y + 5} textAnchor="end" fontSize="15" fill="var(--ink)" style={{ fontFamily: "var(--sans)", fontWeight: 500, opacity: active ? 1 : 0, transition: `opacity 400ms ease ${i * 120}ms` }}>
              {CHANNELS[i]}
            </text>
            <circle cx="114" cy={y} r="4" fill="var(--ink)" style={{ opacity: active ? 1 : 0, transition: `opacity 400ms ease ${i * 120}ms` }} />
            <path
              id={`ch-${i}`}
              d={d}
              fill="none"
              stroke="var(--ink)"
              strokeOpacity="0.35"
              strokeWidth="1.5"
              pathLength={1}
              strokeDasharray="1"
              style={{ strokeDashoffset: active ? 0 : 1, transition: `stroke-dashoffset 900ms cubic-bezier(0.65,0,0.35,1) ${300 + i * 120}ms` }}
            />
            {active && !reduced && (
              <circle r="4.5" fill="var(--accent)">
                <animateMotion dur="1.6s" begin={`${1.3 + i * 0.4}s`} repeatCount="indefinite">
                  <mpath href={`#ch-${i}`} />
                </animateMotion>
              </circle>
            )}
          </g>
        );
      })}
      <path
        d="M340 130 L 470 130"
        stroke="var(--ink)"
        strokeWidth="1.5"
        pathLength={1}
        strokeDasharray="1"
        style={{ strokeDashoffset: active ? 0 : 1, transition: "stroke-dashoffset 700ms ease 1200ms" }}
      />
      <g style={{ opacity: active ? 1 : 0, transform: active ? "scale(1)" : "scale(0.6)", transformOrigin: "320px 130px", transition: "opacity 500ms ease 900ms, transform 700ms cubic-bezier(0.34,1.4,0.64,1) 900ms" }}>
        <circle cx="320" cy="130" r="30" fill="var(--accent)" />
        <text x="320" y="136" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--accent-ink)" style={{ fontFamily: "var(--sans)" }}>e</text>
      </g>
      {[0, 1, 2].map((r) => (
        <g key={r} style={{ opacity: active ? 1 : 0, transition: `opacity 400ms ease ${1700 + r * 150}ms` }}>
          <circle cx="490" cy={100 + r * 30} r="9" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx="490" cy={97 + r * 30} r="3" fill="var(--ink)" />
        </g>
      ))}
      <text x="320" y="186" textAnchor="middle" fontSize="13" fill="var(--ink-2)" style={{ fontFamily: "var(--mono)", opacity: active ? 1 : 0, transition: "opacity 400ms ease 1400ms" }}>
        engagecl.com
      </text>
    </svg>
  );
}
