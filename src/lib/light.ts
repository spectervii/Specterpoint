import type { AreaStats } from "./stats";
import { lagosDay } from "./time";

/** Average hours of light a day over the last `days` days that have reports. */
export function avgHours(s: AreaStats | undefined, days = 30, now = Date.now()) {
  if (!s) return null;
  const from = lagosDay(now - days * 86_400_000);
  const vals = Object.entries(s.cal).filter(([d]) => d >= from).map(([, h]) => h);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** 0 = no light, 1..4 = more hours. null = no reports. */
export function lightLevel(hours: number | null) {
  if (hours === null) return null;
  if (hours < 0.5) return 0;
  if (hours < 4) return 1;
  if (hours < 8) return 2;
  if (hours < 14) return 3;
  return 4;
}

export const LEVEL_FILL = ["var(--off)", "var(--g1)", "var(--g2)", "var(--g3)", "var(--g4)"];
