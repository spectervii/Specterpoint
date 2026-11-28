import "server-only";
import data from "@/data/areas.json";

type Area = {
  id: string; name: string; state: string; disco: string;
  c: [number, number]; ll: [number, number]; box: [number, number, number, number]; hit: [number, number][][];
};

const { proj, areas: list } = data as unknown as { proj: { lon0: number; lat1: number; kx: number; scale: number }; areas: Area[] };
export const AREAS = new Map(list.map((a) => [a.id, a]));
export const AREA_LIST = list;

export function project(lon: number, lat: number): [number, number] {
  return [(lon - proj.lon0) * proj.kx * proj.scale, (proj.lat1 - lat) * proj.scale];
}

function inRing([x, y]: [number, number], ring: [number, number][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** The LGA containing a coordinate, or the nearest one when it sits on a coastline gap. */
export function areaAt(lat: number, lon: number): Area | null {
  const p = project(lon, lat);
  let nearest: Area | null = null;
  let best = Infinity;
  for (const a of list) {
    const [x0, y0, x1, y1] = a.box;
    if (p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1 && a.hit.some((r) => inRing(p, r))) return a;
    const d = (a.c[0] - p[0]) ** 2 + (a.c[1] - p[1]) ** 2;
    if (d < best) { best = d; nearest = a; }
  }
  return best < 15 ** 2 ? nearest : null;
}
