"use client";

import { useHeatCalendar } from "./context";

export function HeatCalendarTooltip() {
  const { active, t, format } = useHeatCalendar();
  if (!active) return null;
  const { cell, x, y } = active;
  const day = new Date(`${cell.date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[6px] px-2 py-1 text-[11px] shadow-overlay"
      style={{ left: Math.max(60, x + 5), top: y - 4, background: "var(--tooltip-bg)", color: "var(--tooltip-ink)", animation: "fade-in 120ms ease-out both" }}
    >
      <span className="font-bold">{cell.value === null ? t("noData") : format(cell.value)}</span>
      <span style={{ color: "var(--tooltip-muted)" }}> · {day}</span>
    </div>
  );
}
