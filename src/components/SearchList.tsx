"use client";

import { forwardRef, useEffect, useState } from "react";
import GlideMenu from "@/components/primitives/GlideMenu";

/* ─────────────────────────────────────────────────────────
 * SEARCH — command search with live filtering.
 * Local LGAs and neighbourhoods filter as you type; Enter (or no
 * local match) asks OpenStreetMap for the address.
 * ───────────────────────────────────────────────────────── */

export type SearchItem = { key: string; label: string; hint: string; area: string; pt?: [number, number] };

export type SearchListLabels = {
  placeholder: string;
  ariaLabel: string;
  emptyTitle: string;
  emptyHint: string;
};

const LABELS: SearchListLabels = {
  placeholder: "Area or address",
  ariaLabel: "Search for an area or address",
  emptyTitle: "No results found",
  emptyHint: "Try a nearby street or the LGA",
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const SearchList = forwardRef<HTMLInputElement, {
  items: SearchItem[];
  labels?: SearchListLabels;
  onPick: (item: SearchItem) => void;
}>(function SearchList({ items, labels = LABELS, onPick }, ref) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState<SearchItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const q = norm(query);

  const local = q
    ? items
        .map((i) => ({ i, at: norm(i.label).indexOf(q) }))
        .filter((x) => x.at >= 0)
        .sort((a, b) => a.at - b.at || a.i.label.length - b.i.label.length)
        .slice(0, 6)
        .map((x) => x.i)
    : [];
  const results = local.length ? local : remote ?? [];
  const empty = q.length > 2 && !busy && results.length === 0 && remote !== null;

  useEffect(() => setRemote(null), [q]);

  // nothing local after a pause: ask OpenStreetMap
  useEffect(() => {
    if (q.length < 4 || local.length) return;
    const t = setTimeout(() => lookup(query), 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, local.length]);

  async function lookup(text: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(text)}`);
      const j = (await res.json()) as { results?: { label: string; area: string; pt?: [number, number] }[] };
      setRemote(
        (j.results ?? []).map((r) => {
          const base = items.find((i) => i.area === r.area && i.key === r.area);
          return { key: `osm:${r.label}`, label: r.label, hint: base ? base.label : "", area: r.area, pt: r.pt };
        }),
      );
    } catch {
      setRemote([]);
    } finally {
      setBusy(false);
    }
  }

  function pick(item: SearchItem) {
    onPick(item);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative w-full" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOpen(false)}>
      <div className="w-full overflow-hidden rounded-card bg-surface shadow-raised">
        {/* input row */}
        <div className="flex h-10 items-center gap-2 border-b border-line px-3 transition-colors duration-100 hover:bg-hover">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" className="shrink-0" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            ref={ref}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (results[0]) pick(results[0]);
                else if (q.length >= 3) lookup(query);
              }
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder={labels.placeholder}
            aria-label={labels.ariaLabel}
            enterKeyHint="search"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-3"
          />
          {busy && <span className="size-1.5 rounded-full bg-g4" style={{ animation: "pulse-dot 900ms ease-in-out infinite" }} aria-label="Searching" />}
          {query && (
            <button
              aria-label="Clear search"
              type="button"
              onClick={() => setQuery("")}
              className="flex size-6 items-center justify-center rounded-full text-ink-3
                transition-colors duration-100 hover:bg-line/70 hover:text-ink"
              style={{ animation: "fade-in 150ms ease-out both" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* results / empty state, floating over the page */}
      {open && q && (empty || results.length > 0) && (
        <div className="absolute inset-x-0 top-11 z-30 overflow-hidden rounded-card bg-surface shadow-overlay" style={{ animation: "fade-in 150ms ease-out both" }}>
          {empty ? (
            <div className="flex flex-col items-center justify-center gap-1 px-4 py-6" style={{ animation: "fade-in 250ms ease-out both" }}>
              <span className="mb-1.5 flex size-8 items-center justify-center rounded-control bg-inset text-ink-3 shadow-hairline">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
              </span>
              <span className="text-[13px] font-bold text-ink">{labels.emptyTitle}</span>
              <span className="text-[12px] text-ink-3">{labels.emptyHint}</span>
            </div>
          ) : (
            <div className="p-1">
              <GlideMenu className="flex flex-col gap-px" highlightClassName="inset-x-0 rounded-[6px] bg-hover">
                {results.map((item) => (
                  <button
                    key={item.key}
                    data-menu-row
                    type="button"
                    onClick={() => pick(item)}
                    className="relative z-10 flex min-h-8 w-full items-center justify-between gap-3 rounded-[6px] px-2 py-1 text-left text-[13px] text-ink"
                    style={{ animation: "fade-in 200ms ease-out both" }}
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="shrink-0 text-[11px] text-ink-3">{item.hint}</span>
                  </button>
                ))}
              </GlideMenu>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default SearchList;
