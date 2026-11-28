import "server-only";
import { areaStats, type Report } from "@/lib/stats";
import { lagosDay } from "@/lib/time";
import type { DailyRow, Snapshot, SourceHealth } from "@/lib/snapshot";
import { db, logFetch } from "./db";
import {
  fetchText,
  npdCompleteReadings,
  npdDiscoHistory,
  npdDiscos,
  parseNiggridDiscos,
  parseNiggridHome,
  type DiscoAllocation,
  type GridReading,
} from "./sources";

const NIGGRID_HOME = "https://niggrid.org/";
const NIGGRID_DISCOS = "https://niggrid.org/DisCoLoadProfile";

const SOURCES = {
  niggrid_daily: { name: "NIGGRID daily performance", url: NIGGRID_HOME, role: "Official daily peak, off-peak, energy and frequency" },
  niggrid_discos: { name: "NIGGRID DisCo load profile", url: NIGGRID_DISCOS, role: "Official MW allocated to each DisCo" },
  npd_discos: { name: "Nigeria Power Data · DisCos", url: "https://nigeriapowerdata.com", role: "Fallback for DisCo allocations" },
  npd_disco_history: { name: "Nigeria Power Data · DisCo history", url: "https://nigeriapowerdata.com", role: "Past DisCo allocations, by date" },
  npd_history: { name: "Nigeria Power Data · history", url: "https://nigeriapowerdata.com", role: "Complete grid readings for history (≥18 stations reporting)" },
  contributions: { name: "Contributions", url: "https://www.specterpoint.online", role: "Residents reporting light in their area" },
} as const;

type StepResult = { source: string; ok: boolean; rows: number; detail?: string };

async function step<T>(source: keyof typeof SOURCES | "snapshot", fn: () => Promise<{ rows: number; value?: T }>): Promise<StepResult & { value?: T }> {
  const t0 = Date.now();
  try {
    const r = await fn();
    await logFetch("ingest", source, true, r.rows, t0);
    return { source, ok: true, rows: r.rows, value: r.value };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[ingest] ${source} failed:`, detail);
    await logFetch("ingest", source, false, 0, t0, detail);
    return { source, ok: false, rows: 0, detail };
  }
}

async function saveReadings(readings: GridReading[], source: string) {
  if (!readings.length) return 0;
  const sql = db();
  let n = 0;
  for (let i = 0; i < readings.length; i += 200) {
    const chunk = readings.slice(i, i + 200);
    const values: unknown[] = [];
    const rows = chunk.map((r, k) => {
      values.push(r.observedAt, source, r.totalMw, r.frequencyHz, r.gencos);
      const b = k * 5;
      return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5})`;
    });
    const res = await sql.query(
      `INSERT INTO grid_readings (observed_at, source, total_mw, frequency_hz, gencos_reporting) VALUES ${rows.join(",")}
       ON CONFLICT (observed_at, source) DO UPDATE SET total_mw = EXCLUDED.total_mw,
         frequency_hz = COALESCE(EXCLUDED.frequency_hz, grid_readings.frequency_hz),
         gencos_reporting = EXCLUDED.gencos_reporting, fetched_at = now()
       RETURNING 1`,
      values,
    );
    n += res.length;
  }
  return n;
}

async function saveDiscos(a: DiscoAllocation, source: string) {
  const sql = db();
  const values: unknown[] = [];
  const rows = Object.entries(a.discos).map(([disco, mw], k) => {
    values.push(a.observedAt, disco, mw, source);
    const b = k * 4;
    return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4})`;
  });
  const res = await sql.query(
    `INSERT INTO disco_allocations (observed_at, disco, mw, source) VALUES ${rows.join(",")}
     ON CONFLICT (observed_at, disco) DO NOTHING RETURNING 1`,
    values,
  );
  return res.length;
}

export async function runIngest() {
  const started = Date.now();
  const sql = db();
  const results: StepResult[] = [];

  // 1. official daily performance + the 06:00 reading
  results.push(
    await step("niggrid_daily", async () => {
      const { days, reading, realtime } = parseNiggridHome(await fetchText(NIGGRID_HOME));
      let rows = 0;
      for (const d of days) {
        const r = await sql.query(
          `INSERT INTO grid_daily (day, peak_mw, offpeak_mw, energy_generated_mwh, energy_sent_mwh, freq_high, freq_low, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'NIGGRID')
           ON CONFLICT (day) DO UPDATE SET peak_mw = EXCLUDED.peak_mw, offpeak_mw = EXCLUDED.offpeak_mw,
             energy_generated_mwh = EXCLUDED.energy_generated_mwh, energy_sent_mwh = EXCLUDED.energy_sent_mwh,
             freq_high = COALESCE(EXCLUDED.freq_high, grid_daily.freq_high), freq_low = COALESCE(EXCLUDED.freq_low, grid_daily.freq_low),
             source = 'NIGGRID', fetched_at = now()
           RETURNING 1`,
          [d.day, d.peakMw, d.offpeakMw, d.energyGeneratedMwh, d.energySentMwh, d.freqHigh, d.freqLow],
        );
        rows += r.length;
      }
      if (reading) rows += await saveReadings([reading], "NIGGRID");
      if (realtime) rows += await saveReadings([realtime], "NIGGRID");
      return { rows };
    }),
  );

  // 2. DisCo allocations: NIGGRID first, Nigeria Power Data if NIGGRID is down
  const official = await step("niggrid_discos", async () => ({
    rows: await saveDiscos(parseNiggridDiscos(await fetchText(NIGGRID_DISCOS)), "NIGGRID"),
  }));
  results.push(official);
  if (!official.ok) {
    results.push(await step("npd_discos", async () => ({ rows: await saveDiscos(await npdDiscos(), "Nigeria Power Data") })));
  }

  // 3. complete readings for history; a deep backfill while history is thin
  const [{ count }] = (await sql.query("SELECT count(*)::int AS count FROM grid_readings WHERE source = 'Nigeria Power Data'")) as { count: number }[];
  results.push(
    await step("npd_history", async () => {
      const readings = await npdCompleteReadings(count < 100 ? 4320 : 72);
      let rows = await saveReadings(readings, "Nigeria Power Data");
      // days NIGGRID has not given us yet: the day's peak from complete readings, never overwriting official figures
      const peaks = new Map<string, number>();
      for (const r of readings) {
        const day = lagosDay(r.observedAt);
        peaks.set(day, Math.max(peaks.get(day) ?? 0, r.totalMw));
      }
      for (const [day, peak] of peaks) {
        const res = await sql.query(
          `INSERT INTO grid_daily (day, peak_mw, source) VALUES ($1, $2, 'Nigeria Power Data (complete readings)')
           ON CONFLICT (day) DO UPDATE SET peak_mw = GREATEST(grid_daily.peak_mw, EXCLUDED.peak_mw)
           WHERE grid_daily.source <> 'NIGGRID' RETURNING 1`,
          [day, peak],
        );
        rows += res.length;
      }
      return { rows };
    }),
  );

  // 3b. past DisCo allocations: while history is short, keep trying until it is filled
  const [{ days }] = (await sql.query(
    "SELECT count(DISTINCT (observed_at AT TIME ZONE 'Africa/Lagos')::date)::int AS days FROM disco_allocations",
  )) as { days: number }[];
  const [{ recent }] = (await sql.query(
    // after a success wait a day; after a failure (their API is often down) try again in 3 hours
    `SELECT count(*)::int AS recent FROM fetch_log WHERE source = 'npd_disco_history'
       AND ((ok AND ran_at > now() - interval '23 hours') OR ran_at > now() - interval '3 hours')`,
  )) as { recent: number }[];
  if (days < 60 && recent === 0) {
    results.push(
      await step("npd_disco_history", async () => {
        const recs = await npdDiscoHistory(4400);
        // one value per DisCo per hour is plenty
        const byHour = new Map<string, { disco: string; observedAt: string; mw: number }>();
        for (const r of recs) byHour.set(`${r.disco}|${r.observedAt.slice(0, 13)}`, { ...r, observedAt: `${r.observedAt.slice(0, 13)}:00:00.000Z` });
        let rows = 0;
        const all = [...byHour.values()];
        for (let i = 0; i < all.length; i += 250) {
          const chunk = all.slice(i, i + 250);
          const values: unknown[] = [];
          const ph = chunk.map((r, k) => {
            values.push(r.observedAt, r.disco, r.mw);
            return `($${k * 3 + 1}, $${k * 3 + 2}, $${k * 3 + 3}, 'Nigeria Power Data')`;
          });
          const res = await sql.query(
            `INSERT INTO disco_allocations (observed_at, disco, mw, source) VALUES ${ph.join(",")} ON CONFLICT (observed_at, disco) DO NOTHING RETURNING 1`,
            values,
          );
          rows += res.length;
        }
        return { rows };
      }),
    );
  }

  // 4. keep the database small: the dashboard never shows more than six months
  await sql.query("DELETE FROM grid_readings WHERE observed_at < now() - interval '400 days'");
  await sql.query("DELETE FROM disco_allocations WHERE observed_at < now() - interval '200 days'");
  await sql.query("DELETE FROM contributions WHERE reported_at < now() - interval '400 days'");
  await sql.query("DELETE FROM fetch_log WHERE ran_at < now() - interval '90 days'");

  // 5. rebuild the snapshot every visitor reads
  const snap = await step("snapshot", async () => {
    const s = await buildSnapshot();
    await sql.query(
      "INSERT INTO snapshot (key, data, updated_at) VALUES ('main', $1, now()) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()",
      [JSON.stringify(s)],
    );
    return { rows: Object.keys(s.areas).length };
  });
  results.push(snap);

  return { ok: results.every((r) => r.ok || r.source === "niggrid_discos" || r.source === "npd_disco_history"), ms: Date.now() - started, results };
}

export async function buildSnapshot(): Promise<Snapshot> {
  const sql = db();
  const [daily, discoRows, discoAvg, reports, health, counts, intraday, discoDays] = await Promise.all([
    sql.query(
      `SELECT day::text AS d, peak_mw::float AS peak, offpeak_mw::float AS off, energy_generated_mwh::float AS mwh,
              freq_high::float AS fh, freq_low::float AS fl, source AS src
       FROM grid_daily WHERE day > (now() AT TIME ZONE 'Africa/Lagos')::date - 186 ORDER BY day`,
    ),
    sql.query(
      `SELECT DISTINCT ON (disco) disco, mw::float AS mw, observed_at, source FROM disco_allocations ORDER BY disco, observed_at DESC`,
    ),
    sql.query(
      `SELECT disco, avg(mw)::float AS avg30 FROM disco_allocations WHERE observed_at > now() - interval '30 days' GROUP BY disco`,
    ),
    sql.query(
      `SELECT area_id AS area, status, reported_at AS at FROM contributions
       WHERE reported_at > now() - interval '186 days' ORDER BY area_id, reported_at`,
    ),
    sql.query(
      `SELECT source, max(ran_at) FILTER (WHERE ok) AS last_ok, max(ran_at) AS last_run,
              (array_agg(ok ORDER BY ran_at DESC))[1] AS ok, (array_agg(detail ORDER BY ran_at DESC))[1] AS detail
       FROM fetch_log WHERE ran_at > now() - interval '30 days' AND source <> 'snapshot' GROUP BY source`,
    ),
    sql.query(
      `SELECT count(*) FILTER (WHERE reported_at > now() - interval '7 days')::int AS week,
              count(DISTINCT area_id) FILTER (WHERE reported_at > now() - interval '30 days')::int AS areas
       FROM contributions`,
    ),
    sql.query(
      `SELECT observed_at AS t, total_mw::float AS mw, source AS src FROM grid_readings
       WHERE observed_at > now() - interval '30 hours' AND (gencos_reporting IS NULL OR gencos_reporting >= 18)
       ORDER BY observed_at`,
    ),
    sql.query(
      `SELECT disco, (observed_at AT TIME ZONE 'Africa/Lagos')::date::text AS d, round(avg(mw)::numeric, 1)::float AS mw
       FROM disco_allocations WHERE observed_at > now() - interval '186 days' GROUP BY 1, 2`,
    ),
  ]);
  const discoDaily: Snapshot["discoDaily"] = {};
  for (const r of discoDays as { disco: string; d: string; mw: number }[]) (discoDaily[r.disco] ??= {})[r.d] = r.mw;

  const dailyRows = daily as DailyRow[];
  const latest = [...dailyRows].reverse().find((d) => d.src === "NIGGRID") ?? dailyRows[dailyRows.length - 1] ?? null;
  const recent = dailyRows.filter((d) => d.mwh).slice(-30).map((d) => d.mwh as number).sort((a, b) => a - b);
  const typical = recent.length ? recent[Math.floor(recent.length / 2)] : null;
  let status: Snapshot["grid"]["status"] = "unknown";
  if (latest) {
    if ((latest.off !== null && latest.off < 1000) || latest.peak < 1500) status = "collapse";
    else if (latest.mwh && typical && latest.mwh < typical * 0.85) status = "low";
    else status = "steady";
  }

  const total = (discoRows as { mw: number }[]).reduce((s, r) => s + r.mw, 0);
  const avgBy = new Map((discoAvg as { disco: string; avg30: number }[]).map((r) => [r.disco, r.avg30]));
  const discos: Snapshot["discos"] = {};
  let discosAsAt: string | null = null;
  let discosSource: string | null = null;
  for (const r of discoRows as { disco: string; mw: number; observed_at: string; source: string }[]) {
    discos[r.disco] = { mw: r.mw, share: total ? Math.round((r.mw / total) * 1000) / 10 : 0, avg30: avgBy.get(r.disco) ?? r.mw };
    const at = new Date(r.observed_at).toISOString();
    if (!discosAsAt || at > discosAsAt) {
      discosAsAt = at;
      discosSource = r.source;
    }
  }

  const byArea = new Map<string, Report[]>();
  for (const r of reports as { area: string; status: Report["status"]; at: string }[]) {
    const list = byArea.get(r.area) ?? [];
    list.push({ area: r.area, status: r.status, at: new Date(r.at).toISOString() });
    byArea.set(r.area, list);
  }
  const areas: Snapshot["areas"] = {};
  for (const [id, list] of byArea) areas[id] = areaStats(list);

  const sources: SourceHealth[] = Object.entries(SOURCES).map(([id, s]) => {
    const h = (health as { source: string; last_ok: string | null; last_run: string | null; ok: boolean | null; detail: string | null }[]).find(
      (x) => x.source === id,
    );
    return {
      id,
      ...s,
      lastOk: h?.last_ok ? new Date(h.last_ok).toISOString() : null,
      lastRun: h?.last_run ? new Date(h.last_run).toISOString() : null,
      ok: h?.ok ?? null,
      error: h && !h.ok ? h.detail : null,
    };
  });

  const c = (counts as { week: number; areas: number }[])[0];
  return {
    updatedAt: new Date().toISOString(),
    grid: {
      status, typicalMwh: typical, latest, daily: dailyRows,
      readings: (intraday as { t: string; mw: number; src: string }[]).map((r) => ({ t: new Date(r.t).toISOString(), mw: r.mw, src: r.src })),
    },
    discos,
    discoDaily,
    discosAsAt,
    discosSource,
    totalAllocatedMw: Math.round(total),
    areas,
    contributions: { week: c?.week ?? 0, areas: c?.areas ?? 0 },
    sources,
  };
}
