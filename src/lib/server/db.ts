import "server-only";
import { neon } from "@neondatabase/serverless";

/** Neon over HTTP: no connection pool to manage in serverless functions. */
export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export async function logFetch(job: string, source: string, ok: boolean, rows: number, startedAt: number, detail?: string) {
  try {
    await db().query(
      "INSERT INTO fetch_log (job, source, ok, rows, duration_ms, detail) VALUES ($1, $2, $3, $4, $5, $6)",
      [job, source, ok, rows, Date.now() - startedAt, detail ? detail.slice(0, 500) : null],
    );
  } catch (err) {
    console.error("fetch_log write failed", err);
  }
}
