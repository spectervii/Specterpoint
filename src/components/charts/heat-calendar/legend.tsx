"use client";

import { useHeatCalendar } from "./context";

export function HeatCalendarLegend() {
  const { levels, t } = useHeatCalendar();
  return (
    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-ink-3">
      <span className="mr-0.5 inline-block size-[10px] rounded-[2px] border border-line" style={{ background: "var(--heat-none)" }} />
      <span className="mr-2">{t("noData")}</span>
      <span>{t("less")}</span>
      {Array.from({ length: levels + 1 }, (_, i) => (
        <span key={i} className="inline-block size-[10px] rounded-[2px]" style={{ background: `var(--heat-${i})` }} />
      ))}
      <span>{t("more")}</span>
    </div>
  );
}
