import { NextResponse, type NextRequest } from "next/server";
import { areaAt, project } from "@/lib/server/areas";

/*
 * Address → LGA. OpenStreetMap Nominatim, called from the server only
 * (the browser never talks to a third party). Their policy asks for at
 * most one request a second and an identifying User-Agent, so queries are
 * spaced out here and every answer is cached for a day.
 */
let last = 0;
const cache = new Map<string, { at: number; body: unknown }>();
const DAY = 86_400_000;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 120);
  if (q.length < 3) return NextResponse.json({ results: [] });
  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < DAY) return NextResponse.json(hit.body, { headers: { "Cache-Control": "public, s-maxage=86400" } });

  const wait = last + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=ng&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "specterpoint-light/1.0 (+https://www.specterpoint.online)", "Accept-Language": "en" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`nominatim ${res.status}`);
    const found = (await res.json()) as { display_name: string; lat: string; lon: string }[];
    const seen = new Set<string>();
    const results = [];
    for (const f of found) {
      const a = areaAt(Number(f.lat), Number(f.lon));
      const key = f.display_name.split(",").slice(0, 2).join(",");
      if (!a || seen.has(key)) continue;
      seen.add(key);
      const [x, y] = project(Number(f.lon), Number(f.lat));
      results.push({ label: f.display_name.split(",").slice(0, 3).join(","), area: a.id, pt: [Math.round(x * 100) / 100, Math.round(y * 100) / 100] });
    }
    const body = { results };
    if (cache.size > 2000) cache.clear();
    cache.set(key, { at: Date.now(), body });
    return NextResponse.json(body, { headers: { "Cache-Control": "public, s-maxage=86400" } });
  } catch (err) {
    console.error("[geocode]", err);
    return NextResponse.json({ results: [], error: "Address search is unavailable right now" }, { status: 502 });
  }
}
