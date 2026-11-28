"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useMessages } from "@/lib/i18n";
import { heatCalendarMessages } from "./messages";
import type { HeatCalendarCell, HeatCalendarProps, HeatCalendarSelection } from "./types";

const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function useHeatCalendarModel({ data, end, months = 6, max, levels = 4, format, labels }: HeatCalendarProps) {
  const t = useMessages("heatCalendar", heatCalendarMessages, labels);
  const [active, setActive] = useState<HeatCalendarSelection>(null);

  const model = useMemo(() => {
    const endMs = end ? Date.parse(`${end}T00:00:00Z`) : Date.parse(`${iso(Date.now())}T00:00:00Z`);
    const startDate = new Date(endMs);
    startDate.setUTCMonth(startDate.getUTCMonth() - months);
    // start on the Monday on or before
    const startMs = startDate.getTime() - ((startDate.getUTCDay() + 6) % 7) * DAY;
    const top = max ?? Math.max(1, ...Object.values(data));
    const cells: HeatCalendarCell[] = [];
    const monthLabels: { week: number; label: string }[] = [];
    let lastMonth = -1;
    for (let ms = startMs, i = 0; ms <= endMs + ((7 - new Date(endMs).getUTCDay()) % 7) * DAY; ms += DAY, i++) {
      const date = iso(ms);
      const week = Math.floor(i / 7);
      const weekday = i % 7;
      const v = data[date];
      const value = v === undefined ? null : v;
      const level = value === null ? -1 : value <= 0 ? 0 : Math.min(levels, Math.ceil((value / top) * levels));
      cells.push({ date, value, level, week, weekday, future: ms > endMs });
      const m = new Date(ms).getUTCMonth();
      if (weekday === 0 && m !== lastMonth) {
        // skip a label that would collide with the previous one
        if (monthLabels.length && week - monthLabels[monthLabels.length - 1].week < 3) monthLabels.pop();
        monthLabels.push({ week, label: new Date(ms).toLocaleString("en-GB", { month: "short", timeZone: "UTC" }) });
        lastMonth = m;
      }
    }
    return { cells, weeks: Math.ceil(cells.length / 7), monthLabels };
  }, [data, end, months, max, levels]);

  return { ...model, levels, format: format ?? ((v: number) => String(v)), t, active, setActive };
}

export type HeatCalendarModel = ReturnType<typeof useHeatCalendarModel>;
export const HeatCalendarContext = createContext<HeatCalendarModel | null>(null);

export function useHeatCalendar() {
  const ctx = useContext(HeatCalendarContext);
  if (!ctx) throw new Error("useHeatCalendar must be used inside <HeatCalendar>");
  return ctx;
}
