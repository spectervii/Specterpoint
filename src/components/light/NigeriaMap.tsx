"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LEVEL_FILL } from "@/lib/light";
import Streets, { inCity, streetIndex } from "./Streets";

export type Geo = { w: number; h: number; outline: string; states: { name: string; d: string }[]; lgas: { id: string; d: string }[]; credit: string };
export type Place = { id: string; n: string; s: string; d: string; c: [number, number]; b: [number, number, number, number] };

const MAX_ZOOM = 400;
const PIN_ZOOM = 14;
/** street level, for addresses inside the cities with street data */
const STREET_ZOOM = 180;
const FLY_MAX = 6;

/* All 774 LGAs never re-render together: only fills and the selection change. */
const Lgas = memo(function Lgas({ geo, levels, onPick, onHover }: {
  geo: Geo;
  levels: Record<string, number | null>;
  onPick: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <g onPointerLeave={() => onHover(null)}>
      {geo.lgas.map((l) => {
        const lv = levels[l.id];
        return (
          <path
            key={l.id}
            d={l.d}
            fill={lv === null || lv === undefined ? "var(--page)" : LEVEL_FILL[lv]}
            stroke="var(--line-strong)"
            strokeWidth={0.35}
            vectorEffect="non-scaling-stroke"
            className="cursor-pointer transition-[fill] duration-500 hover:brightness-95"
            onClick={() => onPick(l.id)}
            onPointerEnter={() => onHover(l.id)}
          />
        );
      })}
    </g>
  );
});

export default function NigeriaMap({ geo, places, levels, selected, onPick, live, pin, onLocate, locating, mode, onMode, legend, describe }: {
  geo: Geo | null;
  places: Map<string, Place>;
  levels: Record<string, number | null>;
  selected: string | null;
  onPick: (id: string | null) => void;
  /** areas reporting light right now */
  live: string[];
  /** an exact address from search */
  pin?: { x: number; y: number; label: string } | null;
  onLocate?: () => void;
  locating?: boolean;
  mode: "disco" | "reports";
  onMode: (m: "disco" | "reports") => void;
  legend: { label: string; from: string; to: string; empty: string | null; zero: boolean };
  /** extra line for the hover label */
  describe: (id: string) => string;
}) {
  const W = geo?.w ?? 1000;
  const H = geo?.h ?? 818.4;
  const [view, setViewState] = useState({ s: 1, x: W / 2, y: H / 2 });
  const viewRef = useRef(view);
  const [gesture, setGesture] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  // screen pixels per map unit, so labels stay a readable size on any screen
  const [px, setPx] = useState(1);
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setPx(Math.min(r.width / W, r.height / H) || 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [W, H]);

  const clamp = useCallback((v: { s: number; x: number; y: number }) => {
    const s = Math.min(MAX_ZOOM, Math.max(1, v.s));
    if (s === 1) return { s, x: W / 2, y: H / 2 };
    // once zoomed, any point of the map can sit in the middle, so coastal and border areas centre too
    return { s, x: Math.min(W, Math.max(0, v.x)), y: Math.min(H, Math.max(0, v.y)) };
  }, [W, H]);
  const setView = useCallback((v: { s: number; x: number; y: number }) => {
    const c = clamp(v);
    viewRef.current = c;
    setViewState(c);
  }, [clamp]);

  /** screen point → map units (the svg letterboxes the map inside its box) */
  const toMap = useCallback((clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    const k = Math.min(r.width / W, r.height / H);
    return { u: (clientX - r.left - (r.width - W * k) / 2) / k, v: (clientY - r.top - (r.height - H * k) / 2) / k, k };
  }, [W, H]);
  /** zoom to scale s, keeping the map point under (clientX, clientY) where it is */
  const zoomAt = useCallback((s: number, clientX: number, clientY: number) => {
    const v = viewRef.current;
    const { u, v: vv } = toMap(clientX, clientY);
    const wx = v.x + (u - W / 2) / v.s;
    const wy = v.y + (vv - H / 2) / v.s;
    const ns = Math.min(MAX_ZOOM, Math.max(1, s));
    setView({ s: ns, x: wx - (u - W / 2) / ns, y: wy - (vv - H / 2) / ns });
  }, [toMap, setView, W, H]);
  const zoomBy = (k: number) => setView({ ...viewRef.current, s: viewRef.current.s * k });

  // fly to the searched address, or else to the selected area
  useEffect(() => {
    if (pin) {
      setGesture(false);
      setView({ s: PIN_ZOOM, x: pin.x, y: pin.y });
      // inside a city with street data, carry on down to street level
      let live = true;
      streetIndex()
        .then((idx) => { if (live && inCity(idx, pin.x, pin.y)) setView({ s: STREET_ZOOM, x: pin.x, y: pin.y }); })
        .catch(() => {});
      return () => { live = false; };
    }
    const p = selected ? places.get(selected) : null;
    if (!p) return;
    const [x0, y0, x1, y1] = p.b;
    const s = Math.min(FLY_MAX, Math.max(1.6, 0.42 * Math.min(W / Math.max(8, x1 - x0), H / Math.max(8, y1 - y0))));
    setGesture(false);
    setView({ s, x: (x0 + x1) / 2, y: (y0 + y1) / 2 });
  }, [selected, places, W, H, setView, pin]);

  /*
   * Gestures, with native listeners so they can stop the browser zooming the page:
   * - pinch (two fingers) zooms the map around the fingers
   * - one finger pans once zoomed in; at full view it scrolls the page as usual
   * - trackpad pinch (ctrl + wheel) zooms around the cursor; two-finger scroll pans when zoomed
   */
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    let pinch: { d: number; s: number } | null = null;
    let pan: { x: number; y: number; vx: number; vy: number } | null = null;
    // one finger at full view: we scroll the page ourselves, so the map can keep every touch
    let scroll: { y: number; last: number; t: number; vel: number } | null = null;
    let glide = 0;
    let endTimer: ReturnType<typeof setTimeout> | undefined;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const mid = (t: TouchList) => [(t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2] as const;

    const onTouchStart = (e: TouchEvent) => {
      moved.current = false;
      if (e.touches.length === 2) {
        e.preventDefault();
        pinch = { d: dist(e.touches), s: viewRef.current.s };
        pan = null;
        setGesture(true);
        scroll = null;
      } else if (e.touches.length === 1 && viewRef.current.s > 1) {
        const t = e.touches[0];
        pan = { x: t.clientX, y: t.clientY, vx: viewRef.current.x, vy: viewRef.current.y };
        setGesture(true);
      } else if (e.touches.length === 1) {
        cancelAnimationFrame(glide);
        scroll = { y: e.touches[0].clientY, last: e.touches[0].clientY, t: performance.now(), vel: 0 };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (pinch && e.touches.length === 2) {
        e.preventDefault();
        moved.current = true;
        const [cx, cy] = mid(e.touches);
        zoomAt(pinch.s * (dist(e.touches) / pinch.d), cx, cy);
      } else if (pan && e.touches.length === 1) {
        e.preventDefault();
        const t = e.touches[0];
        const { k } = toMap(0, 0);
        const s = viewRef.current.s;
        if (Math.abs(t.clientX - pan.x) + Math.abs(t.clientY - pan.y) > 4) moved.current = true;
        setView({ s, x: pan.vx - (t.clientX - pan.x) / k / s, y: pan.vy - (t.clientY - pan.y) / k / s });
      } else if (scroll && e.touches.length === 1) {
        e.preventDefault();
        const y = e.touches[0].clientY;
        const now = performance.now();
        if (Math.abs(y - scroll.y) > 4) moved.current = true;
        window.scrollBy(0, scroll.last - y);
        scroll.vel = (scroll.last - y) / Math.max(1, now - scroll.t);
        scroll.last = y;
        scroll.t = now;
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null;
      if (scroll && e.touches.length === 0) {
        // let the page coast a little, like a normal flick
        let v = scroll.vel * 16;
        const step = () => {
          if (Math.abs(v) < 0.5) return;
          window.scrollBy(0, v);
          v *= 0.94;
          glide = requestAnimationFrame(step);
        };
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches) glide = requestAnimationFrame(step);
        scroll = null;
      }
      if (e.touches.length === 1 && viewRef.current.s > 1) {
        const t = e.touches[0];
        pan = { x: t.clientX, y: t.clientY, vx: viewRef.current.x, vy: viewRef.current.y };
      } else if (e.touches.length === 0) {
        pan = null;
        setGesture(false);
      }
    };
    const onWheel = (e: WheelEvent) => {
      const v = viewRef.current;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomAt(v.s * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
      } else if (v.s > 1) {
        e.preventDefault();
        const { k } = toMap(0, 0);
        setView({ s: v.s, x: v.x + e.deltaX / k / v.s, y: v.y + e.deltaY / k / v.s });
      } else return;
      setGesture(true);
      clearTimeout(endTimer);
      endTimer = setTimeout(() => setGesture(false), 160);
    };
    // Safari's own trackpad pinch events
    let gs = 1;
    const onGestureStart = (e: Event) => { e.preventDefault(); gs = viewRef.current.s; };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const g = e as Event & { scale: number; clientX: number; clientY: number };
      zoomAt(gs * g.scale, g.clientX, g.clientY);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("gesturestart", onGestureStart);
    el.addEventListener("gesturechange", onGestureChange);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("gesturestart", onGestureStart);
      el.removeEventListener("gesturechange", onGestureChange);
      clearTimeout(endTimer);
      cancelAnimationFrame(glide);
    };
  }, [zoomAt, toMap, setView]);

  // mouse drag to pan
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const transform = `translate(${W / 2 - view.x * view.s}px, ${H / 2 - view.y * view.s}px) scale(${view.s})`;
  const hp = hover ? places.get(hover) : null;
  const sp = selected ? places.get(selected) : null;

  const stateLines = useMemo(() => geo?.states.map((s) => s.d).join(" ") ?? "", [geo]);

  return (
    <div className="relative z-[1] flex h-full flex-col">
      <div
        ref={boxRef}
        className="relative min-h-0 flex-1 overflow-hidden rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-g4"
        style={{ touchAction: "none" }}
        tabIndex={0}
        aria-label="Map. Use plus and minus to zoom, arrow keys to move."
        onKeyDown={(e) => {
          const v = viewRef.current;
          const step = 60 / v.s;
          const keys: Record<string, () => void> = {
            "+": () => zoomBy(1.5), "=": () => zoomBy(1.5), "-": () => zoomBy(0.66), _: () => zoomBy(0.66),
            ArrowLeft: () => setView({ ...v, x: v.x - step }), ArrowRight: () => setView({ ...v, x: v.x + step }),
            ArrowUp: () => setView({ ...v, y: v.y - step }), ArrowDown: () => setView({ ...v, y: v.y + step }),
            "0": () => setView({ s: 1, x: W / 2, y: H / 2 }),
          };
          if (keys[e.key]) { e.preventDefault(); keys[e.key](); }
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-full w-full select-none"
          role="img"
          aria-label="Map of Nigeria by local government area"
          onPointerDown={(e) => {
            if (e.pointerType !== "mouse") return;
            moved.current = false;
            drag.current = { px: e.clientX, py: e.clientY, x: viewRef.current.x, y: viewRef.current.y };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || e.pointerType !== "mouse" || e.buttons === 0) return;
            const { k } = toMap(0, 0);
            const s = viewRef.current.s;
            if (Math.abs(e.clientX - d.px) + Math.abs(e.clientY - d.py) > 4) {
              moved.current = true;
              setGesture(true);
            }
            if (moved.current && s > 1) setView({ s, x: d.x - (e.clientX - d.px) / k / s, y: d.y - (e.clientY - d.py) / k / s });
          }}
          onPointerUp={() => { drag.current = null; setGesture(false); }}
          onClickCapture={(e) => { if (moved.current) { e.stopPropagation(); moved.current = false; } }}
          style={{ cursor: view.s > 1 ? (drag.current ? "grabbing" : "grab") : undefined }}
        >
          <defs>
            <filter id="pencil" x="-2%" y="-2%" width="104%" height="104%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
              <feDisplacementMap in="SourceGraphic" scale="2.2" />
            </filter>
          </defs>
          <g style={{ transform, transformOrigin: "0 0", transition: gesture ? "none" : "transform 700ms cubic-bezier(0.16,1,0.3,1)" }}>
            {geo ? (
              <>
                <Lgas geo={geo} levels={levels} onPick={(id) => onPick(id)} onHover={setHover} />
                <Streets view={view} W={W} H={H} k={px} />
                <path d={stateLines} fill="none" stroke="var(--ink-3)" strokeWidth={0.7} vectorEffect="non-scaling-stroke" pointerEvents="none" opacity={0.7} />
                <path d={geo.outline} fill="none" stroke="var(--ink)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" pointerEvents="none" filter={view.s <= 1.5 ? "url(#pencil)" : undefined} strokeLinejoin="round" />
                {live.map((id) => {
                  const p = places.get(id);
                  return p ? (
                    <circle key={id} cx={p.c[0]} cy={p.c[1]} r={3 / (view.s * px)} fill="var(--g5)" pointerEvents="none" style={{ animation: "pulse-dot 2.4s ease-in-out infinite" }} />
                  ) : null;
                })}
                {sp && (
                  <path
                    d={geo.lgas.find((l) => l.id === sp.id)?.d}
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth={view.s > 40 ? 1.2 : 2.2}
                    strokeDasharray={view.s > 40 ? "5 4" : undefined}
                    strokeOpacity={view.s > 40 ? 0.6 : 1}
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                    style={{ animation: "fade-in 300ms ease-out both" }}
                  />
                )}
                {sp && !pin && (
                  <g pointerEvents="none" style={{ animation: "fade-in 300ms ease-out both" }}>
                    <circle cx={sp.c[0]} cy={sp.c[1]} r={4 / (view.s * px)} fill="var(--ink)" stroke="var(--page)" strokeWidth={1.5 / (view.s * px)} />
                    <text
                      x={sp.c[0]}
                      y={sp.c[1] - 9 / (view.s * px)}
                      textAnchor="middle"
                      fontSize={13 / (view.s * px)}
                      fontWeight={700}
                      fill="var(--ink)"
                      stroke="var(--page)"
                      strokeWidth={3 / (view.s * px)}
                      paintOrder="stroke"
                    >
                      {sp.n}
                    </text>
                  </g>
                )}
                {pin && (
                  <g pointerEvents="none" transform={`translate(${pin.x} ${pin.y}) scale(${1 / (view.s * px)})`}>
                  <g style={{ animation: "fade-in 300ms ease-out both" }}>
                    <path d="M0 0c-6-8-10-12-10-17a10 10 0 0 1 20 0c0 5-4 9-10 17Z" fill="var(--g4)" stroke="var(--page)" strokeWidth={2} />
                    <circle cy={-17} r={3.6} fill="var(--page)" />
                    <text y={-32} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)" stroke="var(--page)" strokeWidth={3} paintOrder="stroke">
                      {pin.label}
                    </text>
                  </g>
                  </g>
                )}
              </>
            ) : null}
          </g>
        </svg>
        {hp && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-[6px] px-2 py-1 text-[11px] shadow-overlay" style={{ background: "var(--tooltip-bg)", color: "var(--tooltip-ink)" }}>
            <span className="font-bold">{hp.n}</span>
            <span style={{ color: "var(--tooltip-muted)" }}> · {hp.s}{describe(hp.id) ? ` · ${describe(hp.id)}` : ""}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3 pt-1 sm:px-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex w-fit gap-0.5 rounded-full p-0.5 shadow-hairline" role="tablist" aria-label="Colour the map by">
            {([["disco", "DisCo power"], ["reports", "Reports"]] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={mode === k}
                onClick={() => onMode(k)}
                className={`rounded-full px-2.5 py-0.5 text-[10.5px] transition-colors ${mode === k ? "bg-g4 font-bold text-page" : "text-ink-2 hover:bg-hover"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-ink-3" aria-label={legend.label} title={legend.label}>
            {legend.empty && (
              <>
                <span className="mr-0.5 inline-block size-[10px] rounded-[2px] border border-line" style={{ background: "var(--page)" }} />
                <span className="mr-2 whitespace-nowrap">{legend.empty}</span>
              </>
            )}
            <span className="whitespace-nowrap">{legend.from}</span>
            {(legend.zero ? LEVEL_FILL : LEVEL_FILL.slice(1)).map((f) => (
              <span key={f} className="inline-block h-[10px] w-[14px] rounded-[2px]" style={{ background: f }} />
            ))}
            <span className="whitespace-nowrap">{legend.to}</span>
          </div>
        </div>
        <div className="tools" role="group" aria-label="Map controls">
          <button type="button" className="tool" aria-label="Zoom out" onClick={() => zoomBy(0.66)} disabled={view.s <= 1}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="8.6" cy="8.6" r="5.6" /><path d="M12.8 12.8 17.4 17.4M6.2 8.6h4.8" /></svg>
          </button>
          <span className="zoom-read" aria-live="polite">{view.s < 10 ? `${Math.round(view.s * 100)}%` : `${Math.round(view.s)}×`}</span>
          <button type="button" className="tool" aria-label="Zoom in" onClick={() => zoomBy(1.5)} disabled={view.s >= MAX_ZOOM}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="8.6" cy="8.6" r="5.6" /><path d="M12.8 12.8 17.4 17.4M6.2 8.6h4.8M8.6 6.2v4.8" /></svg>
          </button>
          <span className="tool-sep" aria-hidden />
          {onLocate && (
            <button type="button" className="tool" aria-label="Find my area" onClick={onLocate} disabled={locating}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={locating ? { animation: "pulse-dot 900ms ease-in-out infinite" } : undefined}>
                <circle cx="10" cy="10" r="5.2" /><circle cx="10" cy="10" r="1.6" fill="currentColor" /><path d="M10 1.8v2.6M10 15.6v2.6M1.8 10h2.6M15.6 10h2.6" />
              </svg>
            </button>
          )}
          <button type="button" className="tool" aria-label="Whole country" onClick={() => { setView({ s: 1, x: W / 2, y: H / 2 }); onPick(null); }} disabled={view.s === 1 && !selected}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V3h4M17 7V3h-4M3 13v4h4M17 13v4h-4" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
