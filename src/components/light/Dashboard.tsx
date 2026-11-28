"use client";

import { ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LoadingState from "@/components/LoadingState";
import SearchList, { type SearchItem } from "@/components/SearchList";
import { Download } from "lucide-react";
import { ThemeToggle } from "@/components/motion/theme-toggle";
import { NEIGHBOURHOODS } from "@/data/neighbourhoods";
import { avgHours, lightLevel } from "@/lib/light";
import type { Snapshot } from "@/lib/snapshot";
import type { AreaStats } from "@/lib/stats";
import { timeAgo } from "@/lib/time";
import AreaPage from "./AreaPage";
import Bulb from "./Bulb";
import GridPage from "./GridPage";
import NigeriaMap, { type Geo, type Place } from "./NigeriaMap";

const POLL_MS = 5 * 60_000;

export default function Dashboard({ initial, initialPlace }: { initial: Snapshot | null; initialPlace?: Place }) {
  const [snap, setSnap] = useState(initial);
  const [geo, setGeo] = useState<Geo | null>(null);
  // an area page arrives with its area already chosen, so it renders on the server too
  const [placeList, setPlaceList] = useState<Place[]>(initialPlace ? [initialPlace] : []);
  const [selected, setSelected] = useState<string | null>(initialPlace?.id ?? null);
  const [pin, setPin] = useState<{ x: number; y: number; label: string } | null>(null);
  // location: offered with our own card first; the browser only asks once the visitor taps it
  const [locate, setLocate] = useState<"idle" | "busy" | "denied" | "outside" | "failed">("idle");
  const [located, setLocated] = useState<string | null>(null);
  const [offer, setOffer] = useState(false);
  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem("locate-offer") === "no"; } catch {}
    setOffer(!dismissed && "geolocation" in navigator);
  }, []);
  const [, tick] = useState(0);
  const search = useRef<HTMLInputElement>(null);
  const mapLeaf = useRef<HTMLElement>(null);

  // map and gazetteer: static files, cached by the browser for a week
  useEffect(() => {
    fetch("/geo/nigeria.json").then((r) => r.json()).then(setGeo).catch(() => {});
    fetch("/geo/places.json").then((r) => r.json()).then(setPlaceList).catch(() => {});
  }, []);

  // live data: refresh every five minutes while the tab is visible
  useEffect(() => {
    const load = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/snapshot").then((r) => (r.ok ? r.json() : null)).then((j) => j && setSnap(j)).catch(() => {});
      tick((n) => n + 1);
    };
    const t = setInterval(load, POLL_MS);
    document.addEventListener("visibilitychange", load);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", load); };
  }, []);

  // open an area from the URL (#lagos/ikeja), and keep the URL in step
  useEffect(() => {
    // old links used #state/lga; they still work
    const fromHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (id) setSelected(id);
    };
    fromHash();
    addEventListener("hashchange", fromHash);
    return () => removeEventListener("hashchange", fromHash);
  }, []);
  const pick = useCallback((id: string | null) => {
    setSelected(id);
    setPin(null);
    setLocated(null);
    // every area has its own address (/area/lagos/ikeja), so it can be shared and found in search
    history.replaceState(null, "", id ? `/area/${id}` : "/");
  }, []);

  const places = useMemo(() => new Map(placeList.map((p) => [p.id, p])), [placeList]);

  const findMe = useCallback(() => {
    if (!("geolocation" in navigator)) return setLocate("failed");
    setLocate("busy");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(`/api/locate?lat=${coords.latitude.toFixed(5)}&lon=${coords.longitude.toFixed(5)}`);
          if (r.status === 404) return setLocate("outside");
          const j = (await r.json()) as { area: string; pt: [number, number] };
          pick(j.area);
          setPin({ x: j.pt[0], y: j.pt[1], label: "You" });
          setLocated(j.area);
          setLocate("idle");
          setOffer(false);
          if (matchMedia("(max-width: 860px)").matches) mapLeaf.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch {
          setLocate("failed");
        }
      },
      (err) => setLocate(err.code === err.PERMISSION_DENIED ? "denied" : "failed"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60_000 },
    );
  }, [pick]);
  const notNow = () => {
    setOffer(false);
    try { localStorage.setItem("locate-offer", "no"); } catch {}
  };
  const items: SearchItem[] = useMemo(() => {
    const lgas = placeList.map((p) => ({ key: p.id, label: p.n, hint: p.s, area: p.id }));
    const hoods = NEIGHBOURHOODS.map(([n, id]) => ({ key: `nb:${n}`, label: n, hint: places.get(id)?.n ?? "", area: id }));
    return [...hoods, ...lgas];
  }, [placeList, places]);

  const levels = useMemo(() => {
    const out: Record<string, number | null> = {};
    for (const [id, s] of Object.entries(snap?.areas ?? {})) out[id] = lightLevel(avgHours(s));
    return out;
  }, [snap]);
  const live = useMemo(() => Object.entries(snap?.areas ?? {}).filter(([, s]) => s.now && s.now.s !== "off").map(([id]) => id), [snap]);

  const onReported = useCallback((id: string, stats: AreaStats) => {
    setSnap((s) => (s ? { ...s, areas: { ...s.areas, [id]: stats }, contributions: { ...s.contributions, week: s.contributions.week + 1 } } : s));
  }, []);

  const place = selected ? places.get(selected) : undefined;

  return (
    <div className="shell">
      <div className="wash" aria-hidden />
      <header className="top">
        <button type="button" className="name cursor-pointer border-0 bg-transparent p-0" onClick={() => pick(null)}>
          <span className="inline-flex items-center gap-1.5"><Bulb className="size-[22px]" />Specterpoint</span>
        </button>
        <nav aria-label="Site">
          <button type="button" className="navlink" onClick={() => search.current?.focus()}>
            Contributions{snap?.contributions.week ? <span className="ml-1 font-bold text-g4">{snap.contributions.week}</span> : null}
          </button>
          <a href="/api/export" download className="inline-flex items-center gap-1">
            Data <Download size={12} aria-hidden />
          </a>
          <a href="/guide">Guide</a>
          <a href="https://shodipo.vercel.app" target="_blank" rel="noopener" className="inline-flex items-center gap-0.5">
            Creator <ArrowUpRight size={12} aria-hidden />
          </a>
          <span className="sep" aria-hidden />
          <ThemeToggle
            variant="circle"
            start="top-right"
            labels={{ switchToDark: "Switch to Down NEPA", switchToLight: "Switch to Up NEPA" }}
            className="gap-1.5 rounded-full px-2 py-1 text-[12px] text-ink-2 transition-colors hover:bg-hover hover:text-ink"
            iconClassName="size-3.5"
            text={(dark) => (dark ? "Up NEPA" : "Down NEPA")}
          />
        </nav>
      </header>
      <h1 className="kicker">{place ? `Is there light in ${place.n}?` : "Search if you have light in your area"}</h1>

      <main className="desk">
        <div className="book">
          <div className="cast ambient" aria-hidden />
          <div className="cast contact" aria-hidden />

          <section ref={mapLeaf} className="leaf left scroll-mt-3" aria-label="Map">
            {geo ? (
              <NigeriaMap geo={geo} places={places} levels={levels} selected={selected} onPick={pick} live={live} pin={pin} onLocate={findMe} locating={locate === "busy"} />
            ) : (
              <div className="grid h-full place-items-center"><LoadingState label="Drawing the map" variant="Dots" /></div>
            )}
          </section>

          <section className="leaf right" aria-label={place ? place.n : "National grid"}>
            <div className="relative z-[1] flex h-full flex-col gap-4 overflow-y-auto p-[clamp(16px,2.4vw,28px)] pl-[clamp(22px,3vw,36px)]">
              <SearchList
                ref={search}
                items={items}
                onPick={(item) => {
                  pick(item.area);
                  if (item.pt) setPin({ x: item.pt[0], y: item.pt[1], label: item.label.split(",")[0] });
                  else {
                    // an LGA or neighbourhood from the list: zoom in on it straight away,
                    // then move the pin to its exact spot once OpenStreetMap answers
                    const place = places.get(item.area);
                    if (place) setPin({ x: place.c[0], y: place.c[1], label: item.label });
                    fetch(`/api/geocode?q=${encodeURIComponent(`${item.label}, ${place?.s ?? ""}`)}`)
                      .then((r) => r.json())
                      .then((j: { results?: { area: string; pt?: [number, number] }[] }) => {
                        const hit = j.results?.find((r) => r.area === item.area && r.pt);
                        if (hit?.pt) setPin((cur) => (cur && cur.label === item.label ? { x: hit.pt![0], y: hit.pt![1], label: item.label } : cur));
                      })
                      .catch(() => {});
                  }
                  // on a phone the map sits above the search: bring it into view
                  if (matchMedia("(max-width: 860px)").matches) {
                    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
                    mapLeaf.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
                  }
                }}
              />
              <div className="min-h-0 flex-1">
                {place ? (
                  <AreaPage key={place.id} place={place} stats={snap?.areas[place.id]} snap={snap} onClose={() => pick(null)} onReported={onReported} ask={located === place.id} />
                ) : (
                  <>
                    {(offer || locate !== "idle") && (
                      <div className="mb-4 flex items-center justify-between gap-3 rounded-card bg-g1 px-3 py-2.5 shadow-hairline" style={{ animation: "fade-up 300ms ease-out both" }}>
                        <p className="text-[12px] text-ink">
                          {locate === "denied" ? "Location is off. Search your area instead."
                            : locate === "outside" ? "You seem to be outside Nigeria."
                            : locate === "failed" ? "Couldn't find you. Search your area instead."
                            : <><span className="font-bold">Find light near you?</span> Use your location.</>}
                        </p>
                        {locate === "idle" || locate === "busy" ? (
                          <div className="flex shrink-0 gap-1.5">
                            <button type="button" onClick={notNow} className="h-8 rounded-control px-2.5 text-[12px] text-ink-2 hover:bg-hover">Not now</button>
                            <button type="button" onClick={findMe} disabled={locate === "busy"} className="h-8 rounded-control bg-g4 px-3 text-[12px] font-bold text-page hover:bg-g5 disabled:opacity-60">
                              {locate === "busy" ? "Finding…" : "Use my location"}
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => { setLocate("idle"); notNow(); }} aria-label="Close" className="tool shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    )}
                    <GridPage snap={snap} />
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
        <p className="caps text-center !text-[10px]">
          {place ? `${place.n} · ${place.s}` : "Nigeria"} · updated {timeAgo(snap?.updatedAt)} · {geo?.credit ?? ""} · Streets © OpenStreetMap contributors
        </p>
      </main>
    </div>
  );
}
