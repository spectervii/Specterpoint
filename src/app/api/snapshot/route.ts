import { NextResponse } from "next/server";
import { getSnapshot } from "@/lib/server/snapshot-cache";

export async function GET() {
  const snap = await getSnapshot();
  if (!snap) return NextResponse.json({ error: "No data yet" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json(snap, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
