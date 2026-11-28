"use client";

import { useState } from "react";
import { HeatCalendar } from "@/components/charts/HeatCalendar";
import { avgHours } from "@/lib/light";
import { DISCO_NAMES, type Snapshot } from "@/lib/snapshot";
import { qualityLabel, type AreaStats, type Status } from "@/lib/stats";
import { formatHour, lagosDay, timeAgo } from "@/lib/time";
import type { Place } from "./NigeriaMap";

const NOW: Record<Status, { label: string; color: string }> = {
  on: { label: "Light now", color: "var(--g4)" },
  weak: { label: "Weak light", color: "var(--weak)" },
  off: { label: "No light", color: "var(--ink-3)" },
};

export default function AreaPage({ place, stats, snap, onClose, onReported, ask = false }: {
  place: Place;
  stats: AreaStats | undefined;
  snap: Snapshot | null;
  onClose: () => void;
  onReported: (id: string, stats: AreaStats) => void;
  /** the visitor was just located here: draw their eye to the question */
  ask?: boolean;
}) {
  const [sent, setSent] = useState<{ ok: boolean; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [cal, setCal] = useState<"light" | "supply">("light");
  const disco = snap?.discos[place.d];
  const hours = avgHours(stats);
  // the DisCo's daily allocation as a share of its own usual level (official figures)
  const supply = (() => {
    const days = snap?.discoDaily?.[place.d] ?? {};
    const vals = Object.values(days).sort((a, b) => a - b);
    if (!vals.length) return null;
    const usual = vals[Math.floor(vals.length / 2)];
    return Object.fromEntries(Object.entries(days).map(([d, mw]) => [d, Math.round((mw / usual) * 100)]));
  })();

  async function report(status: Status) {
    setBusy(true);
    setSent(null);
    try {
      const res = await fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: place.id, status }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Could not save");
      onReported(place.id, j.stats);
      setSent({ ok: true, msg: "Thanks, added" });
    } catch (err) {
      setSent({ ok: false, msg: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setBusy(false);
    }
  }

  const facts: [string, string][] = [
    ["Comes on", stats?.on.length ? stats.on.map(formatHour).join(", ") : "-"],
    ["How often", stats?.perDay ? `${stats.perDay}× a day` : "-"],
    ["How long", stats?.spellH ? `${stats.spellH} h each` : "-"],
    ["Quality", qualityLabel(stats?.weak ?? null) ?? "-"],
  ];

  return (
    <div className="flex h-full flex-col gap-3.5 [&>*]:shrink-0" style={{ animation: "fade-up 300ms ease-out both" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[clamp(20px,2.2vw,26px)] font-bold leading-tight">{place.n}</h2>
          <p className="mt-0.5 text-[11px] text-ink-3">{place.s} · {DISCO_NAMES[place.d] ?? place.d}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Back to the national grid" className="tool shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-card bg-inset px-3 py-2.5 shadow-hairline">
        {stats?.now ? (
          <p className="inline-flex items-center gap-2 text-[14px] font-bold">
            <span className="size-2.5 rounded-full" style={{ background: NOW[stats.now.s].color, animation: stats.now.s === "off" ? "none" : "pulse-dot 2.4s ease-in-out infinite" }} aria-hidden />
            {NOW[stats.now.s].label}
            <span className="text-[11px] font-normal text-ink-3">{timeAgo(stats.now.at)}</span>
          </p>
        ) : (
          <p className="text-[13px] text-ink-2">No recent report</p>
        )}
        <p className="text-right text-[11px] text-ink-3">
          {hours === null ? "" : <><span className="font-bold text-ink">{hours.toFixed(1)} h</span> a day</>}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card bg-line shadow-hairline">
        {facts.map(([k, v]) => (
          <div key={k} className="bg-page px-3 py-2">
            <dt className="text-[10.5px] text-ink-3">{k}</dt>
            <dd className="mt-0.5 text-[13px] font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="min-w-0">
        <div className="mb-1.5 flex items-center gap-3" role="tablist" aria-label="Calendar">
          {([["light", "Days with light"], ["supply", `${DISCO_NAMES[place.d]?.replace(" Electric", "") ?? "DisCo"} supply`]] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={cal === k}
              disabled={k === "supply" && !supply}
              onClick={() => setCal(k)}
              className={`caps border-b pb-0.5 transition-colors disabled:opacity-40 ${cal === k ? "border-ink !text-ink" : "border-transparent hover:!text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {cal === "light" || !supply ? (
          <HeatCalendar
            key="light"
            data={stats?.cal ?? {}}
            end={lagosDay(Date.now())}
            months={6}
            max={24}
            format={(v) => (v > 0 ? `${v} h of light` : "No light")}
            labels={{ label: `Days with light in ${place.n}, last six months` }}
          />
        ) : (
          <HeatCalendar
            key="supply"
            data={supply}
            end={lagosDay(Date.now())}
            months={6}
            max={120}
            format={(v) => `${v}% of usual`}
            labels={{ label: `${DISCO_NAMES[place.d]} power allocation by day, last six months`, noData: "No figure" }}
          />
        )}
      </div>

      <div
        id="report"
        className={`mt-auto rounded-card transition-[box-shadow,padding] ${ask && !sent ? "-mx-2 p-2 shadow-[0_0_0_2px_var(--g3)]" : ""}`}
        style={ask && !sent ? { animation: "fade-up 400ms ease-out both" } : undefined}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-bold">Do you have light{ask ? ` in ${place.n}` : ""}?</p>
          {sent && <p className={`text-[11px] ${sent.ok ? "text-g4" : "text-ink-2"}`} role="status">{sent.msg}</p>}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["on", "weak", "off"] as Status[]).map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => report(s)}
              className={`h-10 rounded-control text-[13px] font-bold shadow-hairline transition-[background-color,transform] active:scale-[0.97] disabled:opacity-50 ${
                s === "on" ? "bg-g4 text-page hover:bg-g5" : s === "weak" ? "bg-g1 text-ink hover:bg-g2" : "bg-surface text-ink hover:bg-hover"
              }`}
            >
              {s === "on" ? "Yes" : s === "weak" ? "Weak" : "No"}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10.5px] text-ink-3">
          {stats?.n ? `${stats.n} reports` : "No reports yet"}
          {disco ? ` · ${DISCO_NAMES[place.d]} gets ${Math.round(disco.mw)} MW, ${disco.share}% of the grid` : ""}
          {" · "}
          <a href={`/api/export?area=${encodeURIComponent(place.id)}`} download className="underline decoration-line underline-offset-2 hover:text-ink">
            CSV
          </a>
        </p>
      </div>
    </div>
  );
}
