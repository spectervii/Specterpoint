/* Nigeria is UTC+1 all year (no daylight saving). */
export const LAGOS_OFFSET_HOURS = 1;
export const TZ = "Africa/Lagos";

/** "DD/MM/YYYY" and optional "HH:MM[:SS]" in Lagos time → Date (UTC instant). */
export function lagosToDate(dmy: string, hm = "00:00"): Date {
  const [d, m, y] = dmy.split("/").map(Number);
  const [hh, mm, ss = 0] = hm.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh - LAGOS_OFFSET_HOURS, mm, ss));
}

/** "DD/MM/YYYY" → "YYYY-MM-DD" */
export function dmyToIso(dmy: string) {
  const [d, m, y] = dmy.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** Lagos calendar date ("YYYY-MM-DD") of an instant. */
export function lagosDay(t: Date | number | string) {
  const ms = new Date(t).getTime() + LAGOS_OFFSET_HOURS * 3600_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Lagos hour of day (0–23) of an instant. */
export function lagosHour(t: Date | number | string) {
  return new Date(new Date(t).getTime() + LAGOS_OFFSET_HOURS * 3600_000).getUTCHours();
}

export function formatHour(h: number) {
  const ampm = h < 12 ? "am" : "pm";
  const v = h % 12 === 0 ? 12 : h % 12;
  return `${v} ${ampm}`;
}

export function timeAgo(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "-";
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 90) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function formatLagos(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts }).format(new Date(iso));
}
