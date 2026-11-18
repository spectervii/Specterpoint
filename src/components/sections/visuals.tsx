"use client";

import { useReducedMotion } from "@/lib/hooks";

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
