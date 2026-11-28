import { lagosDay, lagosHour } from "./time";

/* ─────────────────────────────────────────────────────────
 * CONTRIBUTIONS → AREA STATS
 * Residents report "on", "off" or "weak" for their area. Reports are
 * merged into a single timeline per area: "on"/"weak" opens a spell of
 * light, "off" closes it. A spell nobody closes is capped at MAX_SPELL_H
 * (or the next report), so one forgotten report cannot claim a week of
 * light.
 * ───────────────────────────────────────────────────────── */

export type Status = "on" | "off" | "weak";
export type Report = { area: string; status: Status; at: string };

export type AreaStats = {
  /** reports in the window */
  n: number;
  /** latest report, if recent enough to say something about now */
  now: { s: Status; at: string } | null;
  /** most common hours (Lagos time) light comes on, most common first */
  on: number[];
  /** spells of light per day, on days with reports */
  perDay: number | null;
  /** median spell length in hours */
  spellH: number | null;
  /** share of light reports marked weak: 0..1 */
  weak: number | null;
  /** Lagos date → hours of light that day (only days with reports) */
  cal: Record<string, number>;
  /** Lagos date → number of reports that day */
  rc?: Record<string, number>;
};

const DEDUPE_MS = 15 * 60_000;
const MAX_SPELL_H = 18;
const NOW_WINDOW_MS = 4 * 3600_000;

export function areaStats(reports: Report[], nowMs = Date.now()): AreaStats {
  const sorted = [...reports].sort((a, b) => a.at.localeCompare(b.at));
  // several people reporting the same thing minutes apart is one event
  const events: Report[] = [];
  for (const r of sorted) {
    const last = events[events.length - 1];
    if (last && last.status === r.status && new Date(r.at).getTime() - new Date(last.at).getTime() < DEDUPE_MS) continue;
    events.push(r);
  }

  type Spell = { start: number; end: number };
  const spells: Spell[] = [];
  let open: number | null = null;
  let weakReports = 0;
  let lightReports = 0;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const t = new Date(e.at).getTime();
    if (e.status === "weak") weakReports++;
    if (e.status !== "off") lightReports++;
    if (e.status !== "off" && open === null) open = t;
    if (e.status === "off" && open !== null) {
      spells.push({ start: open, end: Math.min(t, open + MAX_SPELL_H * 3600_000) });
      open = null;
    }
  }
  if (open !== null) {
    // still on: up to now, but never more than the cap
    spells.push({ start: open, end: Math.min(nowMs, open + MAX_SPELL_H * 3600_000) });
  }

  const cal: Record<string, number> = {};
  for (const e of events) cal[lagosDay(e.at)] ??= 0;
  for (const s of spells) {
    let t = s.start;
    while (t < s.end) {
      const day = lagosDay(t);
      // end of this Lagos day, as an instant
      const dayEnd = new Date(`${day}T00:00:00Z`).getTime() - 3600_000 + 24 * 3600_000;
      const segEnd = Math.min(s.end, dayEnd);
      cal[day] = (cal[day] ?? 0) + (segEnd - t) / 3600_000;
      t = segEnd;
    }
  }
  for (const k of Object.keys(cal)) cal[k] = Math.min(24, Math.round(cal[k] * 10) / 10);

  const hours = new Map<number, number>();
  for (const s of spells) hours.set(lagosHour(s.start), (hours.get(lagosHour(s.start)) ?? 0) + 1);
  const on = [...hours.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 3).map(([h]) => h);

  const daysWithReports = Object.keys(cal).length;
  const lengths = spells.map((s) => (s.end - s.start) / 3600_000).sort((a, b) => a - b);
  const median = lengths.length ? lengths[Math.floor(lengths.length / 2)] : null;

  const rc: Record<string, number> = {};
  for (const r of sorted) rc[lagosDay(r.at)] = (rc[lagosDay(r.at)] ?? 0) + 1;

  const last = events[events.length - 1];
  return {
    n: reports.length,
    now: last && nowMs - new Date(last.at).getTime() < NOW_WINDOW_MS ? { s: last.status, at: last.at } : null,
    on,
    perDay: daysWithReports ? Math.round((spells.length / daysWithReports) * 10) / 10 : null,
    spellH: median === null ? null : Math.round(median * 10) / 10,
    weak: lightReports ? Math.round((weakReports / lightReports) * 100) / 100 : null,
    cal,
    rc,
  };
}

export function qualityLabel(weak: number | null) {
  if (weak === null) return null;
  if (weak < 0.2) return "Good";
  if (weak < 0.5) return "Fair";
  return "Poor";
}
