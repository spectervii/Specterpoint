import type { ReactNode } from "react";
import type { HeatCalendarMessages } from "./messages";

export type HeatCalendarCell = {
  /** "YYYY-MM-DD" */
  date: string;
  /** null = no data that day */
  value: number | null;
  /** 0 (none) to levels, or -1 for no data */
  level: number;
  week: number;
  weekday: number;
  future: boolean;
};

export type HeatCalendarSelection = { cell: HeatCalendarCell; x: number; y: number } | null;

export type HeatCalendarProps = {
  /** date → value. Missing dates render as "no data". */
  data: Record<string, number>;
  /** last day shown, "YYYY-MM-DD". Default: today (UTC). */
  end?: string;
  /** how many months back. Default 6. */
  months?: number;
  /** value at which a cell is fully saturated. Default: the largest value. */
  max?: number;
  /** number of colour steps above zero. Default 4. */
  levels?: number;
  /** formats a value for the tooltip */
  format?: (value: number) => string;
  labels?: Partial<HeatCalendarMessages>;
  className?: string;
  children?: ReactNode;
};
