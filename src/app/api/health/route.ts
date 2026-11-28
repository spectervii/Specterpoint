import { NextResponse } from "next/server";
import { getSnapshot } from "@/lib/server/snapshot-cache";

export const dynamic = "force-dynamic";

/** For uptime monitors. Reads the cached snapshot, so it does not wake the database. */
export async function GET() {
  const snap = await getSnapshot();
  const ageMin = snap ? Math.round((Date.now() - new Date(snap.updatedAt).getTime()) / 60000) : null;
  const ok = ageMin !== null && ageMin < 180;
  return NextResponse.json(
    {
      ok,
      snapshotAgeMinutes: ageMin,
      sources: snap?.sources.map((s) => ({ id: s.id, ok: s.ok, lastOk: s.lastOk, error: s.error })) ?? [],
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
