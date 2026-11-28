"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { useHeatCalendar } from "./context";

const CELL = 11;
const GAP = 2;
const DAYS = ["Mon", "", "Wed", "", "Fri", "", ""];

/** The weeks-by-weekday grid. Cells use --heat-0 … --heat-N and --heat-none. */
export function HeatCalendarGrid({ children }: { children?: ReactNode }) {
  const { cells, weeks, monthLabels, setActive, t, format } = useHeatCalendar();
  const w = 22 + weeks * (CELL + GAP);
  const h = 14 + 7 * (CELL + GAP);
  const scroller = useRef<HTMLDivElement>(null);
  // on narrow screens start at the most recent weeks
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks]);
  return (
    <div className="relative max-w-full" onPointerLeave={() => setActive(null)}>
      <div ref={scroller} className="overflow-x-auto">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={t("label")} className="block">
        {monthLabels.map((m) => (
          <text key={`${m.week}-${m.label}`} x={22 + m.week * (CELL + GAP)} y={9} fontSize={9} fill="var(--ink-3)">
            {m.label}
          </text>
        ))}
        {DAYS.map((d, i) =>
          d ? (
            <text key={d} x={0} y={14 + i * (CELL + GAP) + CELL - 1.5} fontSize={8.5} fill="var(--ink-3)">
              {d}
            </text>
          ) : null,
        )}
        {cells.map((c) =>
          c.future ? null : (
            <rect
              key={c.date}
              x={22 + c.week * (CELL + GAP)}
              y={14 + c.weekday * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={2}
              fill={c.level < 0 ? "var(--heat-none)" : `var(--heat-${c.level})`}
              stroke={c.level < 0 ? "var(--line)" : "none"}
              strokeWidth={0.6}
              tabIndex={-1}
              onPointerEnter={(e) => setActive({ cell: c, x: e.currentTarget.getBBox().x, y: e.currentTarget.getBBox().y })}
            >
              <title>{`${c.date}: ${c.value === null ? t("noData") : format(c.value)}`}</title>
            </rect>
          ),
        )}
      </svg>
      </div>
      {children}
    </div>
  );
}
