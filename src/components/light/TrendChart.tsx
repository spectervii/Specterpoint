"use client";

import { useMemo, useRef, useState } from "react";

export type Point = { t: number; v: number; label: string; note?: string };

const W = 420;
const H = 120;
const PAD = { l: 34, r: 6, t: 8, b: 16 };

/* One series, one axis: generation in MW over time. Hover or drag for the value. */
export default function TrendChart({ points, unit = "MW", ariaLabel }: { points: Point[]; unit?: string; ariaLabel: string }) {
  const [i, setI] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  const g = useMemo(() => {
    if (points.length < 2) return null;
    const t0 = points[0].t;
    const t1 = points[points.length - 1].t;
    const vmax = Math.max(...points.map((p) => p.v));
    const top = Math.ceil((vmax * 1.08) / 1000) * 1000 || 1000;
    const x = (t: number) => PAD.l + ((t - t0) / Math.max(1, t1 - t0)) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b);
    const line = points.map((p, k) => `${k ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
    const area = `${line}L${x(t1).toFixed(1)},${y(0)}L${x(t0).toFixed(1)},${y(0)}Z`;
    const ticks = [0, top / 2, top];
    return { x, y, line, area, ticks };
  }, [points]);

  if (!g) return <div className="grid h-[120px] place-items-center text-[11px] text-ink-3">Not enough data yet</div>;

  const pick = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((clientX - r.left) / r.width) * W;
    let best = 0;
    for (let k = 1; k < points.length; k++) if (Math.abs(g.x(points[k].t) - px) < Math.abs(g.x(points[best].t) - px)) best = k;
    setI(best);
  };
  const p = i === null ? null : points[i];

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full touch-pan-y"
        role="img"
        aria-label={ariaLabel}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={() => setI(null)}
      >
        {g.ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={g.y(v)} y2={g.y(v)} stroke="var(--line)" strokeWidth={1} />
            <text x={PAD.l - 5} y={g.y(v) + 3} fontSize={8.5} textAnchor="end" fill="var(--ink-3)">
              {v >= 1000 ? `${v / 1000}k` : v}
            </text>
          </g>
        ))}
        <path d={g.area} fill="var(--g1)" opacity={0.8} />
        <path d={g.line} fill="none" stroke="var(--g4)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <text x={PAD.l} y={H - 3} fontSize={8.5} fill="var(--ink-3)">{points[0].label}</text>
        <text x={W - PAD.r} y={H - 3} fontSize={8.5} textAnchor="end" fill="var(--ink-3)">{points[points.length - 1].label}</text>
        {p && (
          <g pointerEvents="none">
            <line x1={g.x(p.t)} x2={g.x(p.t)} y1={PAD.t} y2={H - PAD.b} stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="2 2" />
            <circle cx={g.x(p.t)} cy={g.y(p.v)} r={4} fill="var(--g4)" stroke="var(--page)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {p && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-[6px] px-2 py-1 text-[11px] shadow-overlay"
          style={{
            left: `${Math.min(85, Math.max(15, (g.x(p.t) / W) * 100))}%`,
            background: "var(--tooltip-bg)",
            color: "var(--tooltip-ink)",
          }}
        >
          <span className="font-bold">{Math.round(p.v).toLocaleString("en-GB")} {unit}</span>
          <span style={{ color: "var(--tooltip-muted)" }}> · {p.label}{p.note ? ` · ${p.note}` : ""}</span>
        </div>
      )}
    </div>
  );
}
