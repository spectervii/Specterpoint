import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { runIngest } from "@/lib/server/ingest";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Called hourly by GitHub Actions and daily by Vercel Cron, both with Bearer CRON_SECRET. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runIngest();
    revalidateTag("snapshot");
    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (err) {
    console.error("[ingest] crashed", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
export const POST = GET;
