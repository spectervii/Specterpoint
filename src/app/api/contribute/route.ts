import { createHash } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { AREAS } from "@/lib/server/areas";
import { db, logFetch } from "@/lib/server/db";
import { areaStats, type Report } from "@/lib/stats";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["on", "off", "weak"]);

/*
 * A resident reports light in their area. No accounts: the reporter is a
 * salted hash of IP and browser, used only for rate limits (6 an hour,
 * one per area every 10 minutes). The area's stats are recomputed at
 * once so the report shows up without waiting for the hourly job.
 */
export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: { area?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const area = String(body.area ?? "");
  const status = String(body.status ?? "");
  if (!AREAS.has(area) || !STATUSES.has(status)) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  const reporter = createHash("sha256")
    .update(`${ip}|${req.headers.get("user-agent") ?? ""}|${process.env.HASH_SALT ?? process.env.CRON_SECRET ?? "light"}`)
    .digest("hex")
    .slice(0, 32);

  const sql = db();
  try {
    const [r] = (await sql.query(
      `SELECT count(*)::int AS hour, count(*) FILTER (WHERE area_id = $2 AND reported_at > now() - interval '10 minutes')::int AS here
       FROM contributions WHERE reporter = $1 AND reported_at > now() - interval '1 hour'`,
      [reporter, area],
    )) as { hour: number; here: number }[];
    if (r.here > 0) return NextResponse.json({ error: "You just reported this area" }, { status: 429 });
    if (r.hour >= 6) return NextResponse.json({ error: "Too many reports, try again later" }, { status: 429 });

    await sql.query("INSERT INTO contributions (area_id, status, reporter) VALUES ($1, $2, $3)", [area, status, reporter]);
    const rows = (await sql.query(
      "SELECT status, reported_at AS at FROM contributions WHERE area_id = $1 AND reported_at > now() - interval '186 days' ORDER BY reported_at",
      [area],
    )) as { status: Report["status"]; at: string }[];
    const stats = areaStats(rows.map((x) => ({ area, status: x.status, at: new Date(x.at).toISOString() })));
    await sql.query(
      `UPDATE snapshot SET data = jsonb_set(data, ARRAY['areas', $1::text], $2::jsonb, true) WHERE key = 'main'`,
      [area, JSON.stringify(stats)],
    );
    revalidateTag("snapshot");
    await logFetch("contribute", "contributions", true, 1, t0);
    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    console.error("[contribute]", err);
    await logFetch("contribute", "contributions", false, 0, t0, err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Could not save, try again" }, { status: 500 });
  }
}
