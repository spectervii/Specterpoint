import "server-only";
import { revalidateTag } from "next/cache";
import type { Snapshot } from "@/lib/snapshot";
import { db } from "./db";
import { runIngest } from "./ingest";

const STALE_MS = 70 * 60_000;
let lastAttempt = 0;

/*
 * Scheduled jobs can be late or skipped (GitHub's scheduler especially), so a
 * visit that finds the data over 70 minutes old runs the update itself, in the
 * background after the response. At most once every 15 minutes, across
 * instances, using the fetch log as the shared clock.
 */
export async function refreshIfStale(snap: Snapshot | null) {
  const age = snap ? Date.now() - new Date(snap.updatedAt).getTime() : Infinity;
  if (age < STALE_MS || Date.now() - lastAttempt < 15 * 60_000) return;
  lastAttempt = Date.now();
  try {
    const [r] = (await db().query(
      "SELECT count(*)::int AS n FROM fetch_log WHERE job = 'ingest' AND ran_at > now() - interval '15 minutes'",
    )) as { n: number }[];
    if (r.n > 0) return;
    await runIngest();
    revalidateTag("snapshot");
  } catch (err) {
    console.error("[refresh] failed", err);
  }
}
