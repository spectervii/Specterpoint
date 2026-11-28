import "server-only";
import { unstable_cache } from "next/cache";
import type { Snapshot } from "@/lib/snapshot";
import { db } from "./db";

/**
 * Visitors never query the database directly: the hourly job writes one
 * snapshot row and revalidates this cache, so page views do not wake Neon.
 */
export const getSnapshot = unstable_cache(
  async (): Promise<Snapshot | null> => {
    try {
      const rows = (await db().query("SELECT data FROM snapshot WHERE key = 'main'")) as { data: Snapshot }[];
      return rows[0]?.data ?? null;
    } catch (err) {
      console.error("[snapshot] read failed", err);
      return null;
    }
  },
  ["snapshot-main"],
  { tags: ["snapshot"], revalidate: 3600 },
);
