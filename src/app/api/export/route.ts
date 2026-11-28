import { NextResponse, type NextRequest } from "next/server";
import { AREAS, AREA_LIST } from "@/lib/server/areas";
import { getSnapshot } from "@/lib/server/snapshot-cache";
import { DISCO_NAMES } from "@/lib/snapshot";
import { lagosDay } from "@/lib/time";

/*
 * CSV download, built from the cached snapshot (does not wake the database).
 *   /api/export              every day of national and DisCo figures, plus every area with reports
 *   /api/export?area=<id>    one area, one row per day for six months, with its DisCo and national figures
 * One row per date and place. Empty cells mean the source had nothing for that day.
 */
const COLUMNS = [
  "date", "level", "area_id", "area", "state", "disco",
  "light_hours", "reports",
  "disco_allocation_mw",
  "national_peak_mw", "national_offpeak_mw", "national_energy_mwh", "frequency_low_hz", "frequency_high_hz",
  "national_source",
] as const;
type Row = Partial<Record<(typeof COLUMNS)[number], string | number | null>>;

const cell = (v: unknown) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // quote when needed, and neutralise spreadsheet formulas
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET(req: NextRequest) {
  const snap = await getSnapshot();
  if (!snap) return NextResponse.json({ error: "No data yet" }, { status: 503 });

  const areaId = req.nextUrl.searchParams.get("area");
  const one = areaId ? AREAS.get(areaId) : null;
  if (areaId && !one) return NextResponse.json({ error: "Unknown area" }, { status: 404 });

  const national = new Map(snap.grid.daily.map((d) => [d.d, d]));
  const nat = (date: string): Row => {
    const n = national.get(date);
    return n
      ? { national_peak_mw: n.peak, national_offpeak_mw: n.off, national_energy_mwh: n.mwh, frequency_low_hz: n.fl, frequency_high_hz: n.fh, national_source: n.src }
      : {};
  };
  const discoMw = (disco: string, date: string) => snap.discoDaily?.[disco]?.[date] ?? null;

  // six months of dates, oldest first
  const days: string[] = [];
  for (let i = 182; i >= 0; i--) days.push(lagosDay(Date.now() - i * 86_400_000));

  const rows: Row[] = [];
  if (one) {
    const st = snap.areas[one.id];
    for (const d of days) {
      rows.push({
        date: d, level: "lga", area_id: one.id, area: one.name, state: one.state, disco: DISCO_NAMES[one.disco],
        light_hours: st?.cal[d] ?? null, reports: st?.rc?.[d] ?? (st?.cal[d] === undefined ? 0 : null),
        disco_allocation_mw: discoMw(one.disco, d), ...nat(d),
      });
    }
  } else {
    for (const d of days) {
      if (national.has(d)) rows.push({ date: d, level: "national", area: "Nigeria", ...nat(d) });
      for (const disco of Object.keys(DISCO_NAMES)) {
        const mw = discoMw(disco, d);
        if (mw !== null) rows.push({ date: d, level: "disco", area_id: disco, area: DISCO_NAMES[disco], disco: DISCO_NAMES[disco], disco_allocation_mw: mw });
      }
      for (const a of AREA_LIST) {
        const st = snap.areas[a.id];
        if (!st || st.cal[d] === undefined) continue;
        rows.push({
          date: d, level: "lga", area_id: a.id, area: a.name, state: a.state, disco: DISCO_NAMES[a.disco],
          light_hours: st.cal[d], reports: st.rc?.[d] ?? null, disco_allocation_mw: discoMw(a.disco, d), ...nat(d),
        });
      }
    }
  }

  const csv = [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(","))].join("\n") + "\n";
  const name = `nigeria-light-${one ? one.id.replace("/", "-") : "all"}-${lagosDay(Date.now())}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
