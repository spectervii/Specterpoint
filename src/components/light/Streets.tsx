"use client";

import { memo, useEffect, useState } from "react";

/*
 * Streets for the closest zoom levels, from OpenStreetMap (built by scripts/build-streets.py).
 * Only the tiles in view are fetched, and each is cached once loaded:
 *   - from STREETS_FROM: main roads (overview tiles)
 *   - from DETAIL_FROM:  every street, with names from NAMES_FROM
 */
export const STREETS_FROM = 18;
const DETAIL_FROM = 60;
const NAMES_FROM = 140;

type Index = { tile: number; tiles: string[]; coarse: number; coarseTiles: string[]; cities: { name: string; box: number[] }[]; credit: string };
type Tile = { M: string[]; m?: string[]; n?: [string, number, number, number, number][] };

let indexPromise: Promise<Index> | null = null;
export function streetIndex() {
  indexPromise ??= fetch("/streets/index.json").then((r) => r.json());
  return indexPromise;
}
const cache = new Map<string, Promise<Tile | null>>();
function tile(path: string) {
  let p = cache.get(path);
  if (!p) {
    p = fetch(path).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    cache.set(path, p);
  }
  return p;
}

export function inCity(index: Index | null, x: number, y: number) {
  return !!index?.cities.some(({ box: [x0, y0, x1, y1] }) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
}

const TileLayer = memo(function TileLayer({ t, detail }: { t: Tile; detail: boolean }) {
  return (
    <>
      {detail && t.m?.length ? (
        <path d={t.m.join("")} fill="none" stroke="var(--ink-3)" strokeOpacity={0.8} strokeWidth={0.9} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      <path d={t.M.join("")} fill="none" stroke="var(--ink-2)" strokeOpacity={0.85} strokeWidth={detail ? 1.6 : 1} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
});

export default function Streets({ view, W, H, k }: { view: { s: number; x: number; y: number }; W: number; H: number; k: number }) {
  const [index, setIndex] = useState<Index | null>(null);
  const [tiles, setTiles] = useState<Record<string, Tile>>({});
  const on = view.s >= STREETS_FROM;
  const detail = view.s >= DETAIL_FROM;

  useEffect(() => {
    if (on && !index) streetIndex().then(setIndex).catch(() => {});
  }, [on, index]);

  // which tiles are in view (a little margin so panning does not show gaps)
  const hw = (W / 2 / view.s) * 1.15;
  const hh = (H / 2 / view.s) * 1.15;
  const size = detail ? index?.tile ?? 1.5 : index?.coarse ?? 6;
  const want: string[] = [];
  if (on && index) {
    const have = new Set(detail ? index.tiles : index.coarseTiles);
    for (let tx = Math.floor((view.x - hw) / size); tx <= Math.floor((view.x + hw) / size); tx++)
      for (let ty = Math.floor((view.y - hh) / size); ty <= Math.floor((view.y + hh) / size); ty++) {
        const id = `${tx}_${ty}`;
        if (have.has(id)) want.push(detail ? `/streets/${id}.json` : `/streets/z/${id}.json`);
      }
  }
  const key = want.join("|");

  useEffect(() => {
    if (!key) return;
    let live = true;
    for (const path of key.split("|")) {
      tile(path).then((t) => {
        if (live && t) setTiles((cur) => (cur[path] ? cur : { ...cur, [path]: t }));
      });
    }
    return () => {
      live = false;
    };
  }, [key]);

  if (!on) return null;
  const shown = want.map((p) => [p, tiles[p]] as const).filter(([, t]) => t);
  const names = view.s >= NAMES_FROM;
  const u = 1 / (view.s * k); // one screen pixel in map units

  return (
    <g pointerEvents="none" style={{ animation: "fade-in 300ms ease-out both" }}>
      {shown.map(([p, t]) => <TileLayer key={p} t={t!} detail={detail} />)}
      {names && labels(shown.map(([, t]) => t!), view, hw, hh, u).map(([name, x, y, a, major]) => (
        <text
          key={`${name}${x}${y}`}
          transform={`translate(${x} ${y}) rotate(${a}) scale(${u})`}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={major ? 11 : 9.5}
          fontWeight={major ? 700 : 400}
          fill="var(--ink-2)"
          stroke="var(--page)"
          strokeWidth={3}
          paintOrder="stroke"
        >
          {name}
        </text>
      ))}
    </g>
  );
}

/** Names that fit: main roads first, then longer names, skipping any that would overlap one already placed. */
function labels(tiles: Tile[], view: { x: number; y: number }, hw: number, hh: number, u: number) {
  const all = tiles.flatMap((t) => t.n ?? []).filter(([, x, y]) => Math.abs(x - view.x) < hw && Math.abs(y - view.y) < hh);
  all.sort((p, q) => q[4] - p[4] || q[0].length - p[0].length);
  const placed: [number, number, number, number][] = [];
  const out: typeof all = [];
  const seen = new Set<string>();
  for (const l of all) {
    const [name, x, y, a, major] = l;
    if (seen.has(`${name}|${Math.round(x / (40 * u))}|${Math.round(y / (40 * u))}`)) continue;
    // the label's box on screen, rotated, as an axis-aligned box in map units (plus a little air)
    const w = name.length * (major ? 6.8 : 5.9) * u + 8 * u;
    const h = (major ? 13 : 11) * u + 4 * u;
    const r = (a * Math.PI) / 180;
    const bw = Math.abs(w * Math.cos(r)) + Math.abs(h * Math.sin(r));
    const bh = Math.abs(w * Math.sin(r)) + Math.abs(h * Math.cos(r));
    const box: [number, number, number, number] = [x - bw / 2, y - bh / 2, x + bw / 2, y + bh / 2];
    if (placed.some((p) => box[0] < p[2] && box[2] > p[0] && box[1] < p[3] && box[3] > p[1])) continue;
    placed.push(box);
    seen.add(`${name}|${Math.round(x / (40 * u))}|${Math.round(y / (40 * u))}`);
    out.push(l);
    if (out.length >= 140) break;
  }
  return out;
}
