import { NextResponse, type NextRequest } from "next/server";
import { areaAt, project } from "@/lib/server/areas";

export const dynamic = "force-dynamic";

/*
 * Coordinates from the visitor's browser (only after they agree) → their LGA.
 * Worked out here against the map's own boundaries: nothing is stored, logged
 * or sent to anyone else.
 */
export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  const headers = { "Cache-Control": "no-store" };
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return NextResponse.json({ error: "bad request" }, { status: 400, headers });
  if (lat < 4 || lat > 14 || lon < 2.5 || lon > 15) return NextResponse.json({ error: "outside" }, { status: 404, headers });
  const a = areaAt(lat, lon);
  if (!a) return NextResponse.json({ error: "outside" }, { status: 404, headers });
  const [x, y] = project(lon, lat);
  return NextResponse.json({ area: a.id, pt: [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000] }, { headers });
}
