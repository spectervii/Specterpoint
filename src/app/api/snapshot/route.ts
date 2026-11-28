import { after, NextResponse } from "next/server";
import { refreshIfStale } from "@/lib/server/refresh";
import { getSnapshot } from "@/lib/server/snapshot-cache";

export const maxDuration = 60;

export async function GET() {
  const snap = await getSnapshot();
  after(() => refreshIfStale(snap));
  if (!snap) return NextResponse.json({ error: "No data yet" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json(snap, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
