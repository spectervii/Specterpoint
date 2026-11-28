import "server-only";
import { dmyToIso, lagosDay, lagosToDate } from "@/lib/time";

/* ─────────────────────────────────────────────────────────
 * DATA SOURCES
 *
 * 1. NIGGRID (niggrid.org), the Nigerian Independent System Operator's
 *    public grid portal. Official. Read as HTML.
 *    - Home / Dashboard: daily performance for the last two complete days
 *      (peak, off-peak, energy generated and sent out, frequency range)
 *      the 06:00 grid reading, and the latest realtime generation with the
 *      number of power stations that had reported.
 *    - DisCoLoadProfile: MW allocated to each of the 11 DisCos.
 * 2. Nigeria Power Data (nigeriapowerdata.com), free public API that
 *    captures NIGGRID every 30 minutes. Used as a fallback for DisCo
 *    allocations, and for history: only readings where at least
 *    COMPLETE_GENCOS power stations had reported are kept, because
 *    earlier readings in an hour undercount the grid.
 *
 * Every parser checks its numbers are physically plausible and throws
 * otherwise, so a changed page layout is logged as a failure instead of
 * storing nonsense.
 * ───────────────────────────────────────────────────────── */

const UA = "Mozilla/5.0 (compatible; specterpoint-light/1.0; +https://www.specterpoint.online)";
export const COMPLETE_GENCOS = 18;

export async function fetchText(url: string, { retries = 2, timeoutMs = 20000 } = {}): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html,application/json" },
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`${url} answered ${res.status}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function pageText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

const num = (s: string) => Number(s.replace(/,/g, ""));
const plausibleMw = (v: number) => Number.isFinite(v) && v >= 0 && v <= 20000;
const plausibleHz = (v: number) => Number.isFinite(v) && v >= 45 && v <= 55;

export type DailyPerformance = {
  day: string;
  peakMw: number;
  offpeakMw: number | null;
  energyGeneratedMwh: number | null;
  energySentMwh: number | null;
  freqHigh: number | null;
  freqLow: number | null;
};

export type GridReading = { observedAt: string; totalMw: number; frequencyHz: number | null; gencos: number | null };

/** NIGGRID home page: daily blocks plus the 06:00 reading. */
export function parseNiggridHome(html: string) {
  const text = pageText(html);
  const days: DailyPerformance[] = [];
  const blocks = text.split(/Per(?:fro|for)mance For ::/).slice(1);
  for (const block of blocks) {
    const date = block.match(/^\s*(\d{2}\/\d{2}\/\d{4})/);
    const peak = block.match(/Peak Generation\s*([\d,.]+)\s*MW/);
    if (!date || !peak) continue;
    const off = block.match(/Off-Peak Generation\s*([\d,.]+)\s*MW/);
    const gen = block.match(/Energy Generated\s*([\d,.]+)\s*MWh/);
    const sent = block.match(/Energy Sent Out\s*([\d,.]+)\s*MWh/);
    const freq = block.match(/Frequency HF:\s*([\d.]+)[^L]*LF:\s*([\d.]+)/);
    const d: DailyPerformance = {
      day: dmyToIso(date[1]),
      peakMw: num(peak[1]),
      offpeakMw: off ? num(off[1]) : null,
      energyGeneratedMwh: gen ? num(gen[1]) : null,
      energySentMwh: sent ? num(sent[1]) : null,
      freqHigh: freq ? num(freq[1]) : null,
      freqLow: freq ? num(freq[2]) : null,
    };
    if (!plausibleMw(d.peakMw) || (d.offpeakMw !== null && !plausibleMw(d.offpeakMw))) continue;
    if (d.energyGeneratedMwh !== null && (d.energyGeneratedMwh < 0 || d.energyGeneratedMwh > 400000)) continue;
    if (d.freqHigh !== null && !plausibleHz(d.freqHigh)) d.freqHigh = null;
    if (d.freqLow !== null && !plausibleHz(d.freqLow)) d.freqLow = null;
    if (!days.some((x) => x.day === d.day)) days.push(d);
  }
  const six = text.match(/Grid @ 06:00 Hrs for (\d{2}\/\d{2}\/\d{4}) Generation ([\d,.]+) MW Frequency ([\d.]+) Hz/);
  const reading: GridReading | null =
    six && plausibleMw(num(six[2]))
      ? {
          observedAt: lagosToDate(six[1], "06:00").toISOString(),
          totalMw: num(six[2]),
          frequencyHz: plausibleHz(num(six[3])) ? num(six[3]) : null,
          gencos: null,
        }
      : null;
  // "Realtime Generation :: as at 22:00 is 3,211.08 MW as reported by 18 Gencos"
  const rt = text.match(/Realtime Generation :: as at (\d{1,2}:\d{2}) is ([\d,.]+) MW as reported by (\d+) Gencos/);
  let realtime: GridReading | null = null;
  if (rt && plausibleMw(num(rt[2]))) {
    const today = lagosDay(Date.now());
    const [y, m, d] = today.split("-");
    let at = lagosToDate(`${d}/${m}/${y}`, rt[1]);
    // just after midnight the page can still show yesterday's last reading
    if (at.getTime() > Date.now() + 10 * 60_000) at = new Date(at.getTime() - 86_400_000);
    realtime = { observedAt: at.toISOString(), totalMw: num(rt[2]), frequencyHz: null, gencos: Number(rt[3]) };
  }
  if (!days.length) throw new Error("NIGGRID home: no daily performance block found");
  return { days, reading, realtime };
}

export const DISCO_IDS: Record<string, string> = {
  Abuja: "abuja", Benin: "benin", Eko: "eko", Enugu: "enugu", Ibadan: "ibadan", Ikeja: "ikeja",
  Jos: "jos", Kaduna: "kaduna", Kano: "kano", PHarcourt: "portharcourt", "Port Harcourt": "portharcourt", Yola: "yola",
};

export type DiscoAllocation = { observedAt: string; discos: Record<string, number> };

/** NIGGRID DisCo load profile page. */
export function parseNiggridDiscos(html: string): DiscoAllocation {
  const text = pageText(html);
  const asAt = text.match(/Data as at (\d{2}\/\d{2}\/\d{4}) (\d{2}:\d{2}(?::\d{2})?)/);
  if (!asAt) throw new Error("NIGGRID DisCos: no 'Data as at' timestamp");
  const discos: Record<string, number> = {};
  for (const m of text.matchAll(/(Abuja|Benin|Eko|Enugu|Ibadan|Ikeja|Jos|Kaduna|Kano|PHarcourt|Yola) Disco\s+([\d,.]+)/g)) {
    const v = num(m[2]);
    if (plausibleMw(v)) discos[DISCO_IDS[m[1]]] = v;
  }
  if (Object.keys(discos).length < 9) throw new Error(`NIGGRID DisCos: only ${Object.keys(discos).length} of 11 found`);
  return { observedAt: lagosToDate(asAt[1], asAt[2]).toISOString(), discos };
}

const NPD = "https://nigeriapowerdata.com";

/** Fallback: DisCo allocations from Nigeria Power Data. */
export async function npdDiscos(): Promise<DiscoAllocation> {
  const j = JSON.parse(await fetchText(`${NPD}/api/discos`));
  const discos: Record<string, number> = {};
  for (const d of j.discos ?? []) {
    const key = String(d.company ?? "").replace(/ Disco$/i, "");
    const id = DISCO_IDS[key];
    const v = Number(d.load_allocation_mw);
    if (id && plausibleMw(v)) discos[id] = v;
  }
  if (Object.keys(discos).length < 9) throw new Error("Nigeria Power Data DisCos: incomplete");
  return { observedAt: new Date(j.reading_timestamp ?? j.fetched_at ?? Date.now()).toISOString(), discos };
}

/** Complete grid readings from Nigeria Power Data's history. */
export async function npdCompleteReadings(hours: number): Promise<GridReading[]> {
  const j = JSON.parse(await fetchText(`${NPD}/api/history?hours=${hours}&limit=5000`, { timeoutMs: 45000 }));
  const out: GridReading[] = [];
  for (const r of j.history ?? []) {
    const mw = Number(r.total_generation_mw);
    const g = Number(r.reporting_gencos);
    if (!r.timestamp || !plausibleMw(mw) || !(g >= COMPLETE_GENCOS)) continue;
    out.push({ observedAt: new Date(r.timestamp).toISOString(), totalMw: mw, frequencyHz: null, gencos: g });
  }
  return out;
}

/**
 * DisCo allocation history from Nigeria Power Data (/api/discos/{slug}).
 * The response shape is read defensively: any list of records carrying a
 * timestamp and an allocation in MW is accepted, everything else ignored.
 */
export async function npdDiscoHistory(hours: number): Promise<{ disco: string; observedAt: string; mw: number }[]> {
  const list = JSON.parse(await fetchText(`${NPD}/api/discos`, { timeoutMs: 30000 }));
  const out: { disco: string; observedAt: string; mw: number }[] = [];
  for (const d of list.discos ?? []) {
    const id = DISCO_IDS[String(d.company ?? "").replace(/ Disco$/i, "")];
    // their pages live at /discos/<company-name-slug>, e.g. /discos/abuja-disco
    const slug =
      String(d.slug ?? d.detail_url ?? "").split("/").filter(Boolean).pop() ||
      String(d.company ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!id || !slug) continue;
    let j: unknown;
    try {
      j = JSON.parse(await fetchText(`${NPD}/api/discos/${slug}?hours=${hours}&limit=2000`, { timeoutMs: 45000, retries: 1 }));
    } catch {
      continue; // one DisCo failing should not lose the others
    }
    const seen = new Set<string>();
    const visit = (o: unknown, depth: number) => {
      if (depth > 4 || !o || typeof o !== "object") return;
      if (Array.isArray(o)) {
        for (const r of o) {
          if (!r || typeof r !== "object") continue;
          const rec = r as Record<string, unknown>;
          const t = rec.timestamp ?? rec.reading_timestamp ?? rec.observed_at;
          const mw = Number(rec.load_allocation_mw ?? rec.allocation_mw);
          if (t && plausibleMw(mw) && mw > 0) {
            const at = new Date(String(t));
            if (!Number.isNaN(at.getTime()) && !seen.has(at.toISOString())) {
              seen.add(at.toISOString());
              out.push({ disco: id, observedAt: at.toISOString(), mw });
            }
          } else visit(r, depth + 1);
        }
      } else for (const v of Object.values(o)) visit(v, depth + 1);
    };
    visit(j, 0);
    await new Promise((res) => setTimeout(res, 400)); // be gentle with a free API
  }
  if (!out.length) throw new Error("Nigeria Power Data DisCo history: no records found");
  return out;
}
