"use client";

import { useMemo, useState } from "react";
import { DISCO_NAMES, type Snapshot } from "@/lib/snapshot";
import { formatLagos, timeAgo } from "@/lib/time";
import TrendChart, { type Point } from "./TrendChart";

const STATUS = {
  steady: { label: "Steady", meaning: "Normal supply", color: "var(--g4)" },
  low: { label: "Low", meaning: "Less power than usual", color: "var(--weak)" },
  collapse: { label: "Collapse", meaning: "Most areas are off", color: "#b4553a" },
  unknown: { label: "Waiting", meaning: "No reading yet", color: "var(--ink-3)" },
} as const;

const RANGES = ["24h", "7d", "30d", "6m"] as const;
type Range = (typeof RANGES)[number];

const fmt = (v: number | null | undefined, unit: string) => (v === null || v === undefined ? "-" : `${Math.round(v).toLocaleString("en-GB")} ${unit}`);
const dayLabel = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export default function GridPage({ snap }: { snap: Snapshot | null }) {
  const [range, setRange] = useState<Range>("7d");
  const latest = snap?.grid.latest ?? null;
  // NIGGRID publishes the frequency range a day later than the other figures
  const freqDay = snap ? [...snap.grid.daily].reverse().find((d) => d.fl && d.fh) : undefined;
  const st = STATUS[snap?.grid.status ?? "unknown"];

  const points: Point[] = useMemo(() => {
    if (!snap) return [];
    if (range === "24h") {
      return snap.grid.readings
        .filter((r) => Date.parse(r.t) > Date.now() - 24 * 3600_000)
        .map((r) => ({ t: Date.parse(r.t), v: r.mw, label: formatLagos(r.t, { hour: "numeric", minute: "2-digit" }), note: r.src }));
    }
    const n = range === "7d" ? 7 : range === "30d" ? 30 : 183;
    return snap.grid.daily.slice(-n).map((d) => ({ t: Date.parse(`${d.d}T12:00:00Z`), v: d.peak, label: dayLabel(d.d), note: d.src === "NIGGRID" ? "NIGGRID" : "Nigeria Power Data" }));
  }, [snap, range]);

  const vsUsual = latest?.mwh && snap?.grid.typicalMwh ? Math.round((latest.mwh / snap.grid.typicalMwh - 1) * 100) : null;
  const has24 = (snap?.grid.readings.length ?? 0) >= 3;

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <p className="caps">National grid{latest ? ` · ${dayLabel(latest.d)}` : ""}</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-[clamp(28px,3.4vw,40px)] font-bold leading-none tabular-nums">{fmt(latest?.peak, "MW")}</p>
            <p className="mt-1.5 text-[11px] text-ink-3">Peak generation</p>
          </div>
          <div className="text-right">
            <p className="inline-flex items-center gap-1.5 text-[13px] font-bold">
              <span className="size-2 rounded-full" style={{ background: st.color }} aria-hidden />
              {st.label}
            </p>
            <p className="mt-1 text-[11px] text-ink-3">{st.meaning}</p>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-card bg-line shadow-hairline">
        {[
          ["Energy", fmt(latest?.mwh, "MWh"), vsUsual === null ? null : `${vsUsual > 0 ? "+" : ""}${vsUsual}% vs usual`],
          ["Lowest", fmt(latest?.off, "MW"), "off-peak"],
          ["Frequency", freqDay ? `${freqDay.fl!.toFixed(1)} to ${freqDay.fh!.toFixed(1)}` : "-", "Hz, target 50"],
        ].map(([k, v, sub]) => (
          <div key={k} className="bg-page px-3 py-2.5">
            <dt className="text-[10.5px] text-ink-3">{k}</dt>
            <dd className="mt-1 text-[13px] font-bold tabular-nums">{v}</dd>
            {sub && <dd className="text-[10.5px] text-ink-3">{sub}</dd>}
          </div>
        ))}
      </dl>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="caps">{range === "24h" ? "Generation" : "Daily peak"}</p>
          <div className="flex gap-0.5 rounded-full p-0.5 shadow-hairline" role="tablist" aria-label="Time range">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={range === r}
                disabled={r === "24h" && !has24}
                onClick={() => setRange(r)}
                className={`rounded-full px-2 py-0.5 text-[10.5px] transition-colors disabled:opacity-30 ${range === r ? "bg-g4 font-bold text-page" : "text-ink-2 hover:bg-hover"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <TrendChart points={points} ariaLabel={`Grid generation, ${range}`} />
      </div>

      {snap && Object.keys(snap.discos).length > 0 && (
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <p className="caps">DisCos today</p>
            <p className="text-[10.5px] text-ink-3">{snap.totalAllocatedMw.toLocaleString("en-GB")} MW shared</p>
          </div>
          <ul className="grid grid-cols-1 gap-x-5 gap-y-1 sm:grid-cols-2">
            {Object.entries(snap.discos)
              .sort((a, b) => b[1].mw - a[1].mw)
              .map(([id, d]) => {
                const top = Math.max(...Object.values(snap.discos).map((x) => x.mw));
                return (
                  <li key={id} className="grid grid-cols-[6.5em_1fr_3.2em] items-center gap-2 text-[11px]" title={`${DISCO_NAMES[id]}: ${d.mw} MW, ${d.share}%`}>
                    <span className="truncate text-ink-2">{DISCO_NAMES[id]?.replace(" Electric", "")}</span>
                    <span className="h-[6px] rounded-full bg-inset">
                      <span className="block h-full rounded-full bg-g3" style={{ width: `${(d.mw / top) * 100}%` }} />
                    </span>
                    <span className="text-right tabular-nums">{Math.round(d.mw)}</span>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      <details className="mt-auto text-[11px] text-ink-3">
        <summary className="cursor-pointer select-none list-none">
          <span className="caps">Sources</span> · updated {timeAgo(snap?.updatedAt)}
        </summary>
        <ul className="mt-2 flex flex-col gap-1">
          {snap?.sources.filter((s) => s.lastRun || s.id === "contributions").map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3">
              <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-ink">
                <span className="size-1.5 rounded-full" style={{ background: s.ok === false ? "#b4553a" : "var(--g4)" }} aria-label={s.ok === false ? "failing" : "ok"} />
                {s.name}
              </a>
              <span className="tabular-nums">{s.ok === false ? "retrying" : timeAgo(s.lastOk)}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
