"use client";

import { shelfHost } from "@/components/threeui/hostBoundary";
import { VOLUMES, type Palette } from "./volumes";

/* The portfolio and the 3D shelf share one origin, so the host can
   watch the shelf retint itself and steer it from the record above.
   Only the shelf's own public controls are used: its volume markers,
   its Open button and its close button. */

type Listener = (palette: Palette, index: number) => void;

let frame: HTMLIFrameElement | null = null;
let current: { palette: Palette; index: number } | null = null;
const listeners = new Set<Listener>();
let observer: MutationObserver | null = null;

function read(doc: Document) {
  const title = doc.getElementById("selection-title")?.textContent?.trim();
  const index = Math.max(0, VOLUMES.findIndex((v) => v.title === title));
  return { palette: VOLUMES[index].palette, index };
}

export function attachShelf(el: HTMLIFrameElement) {
  shelfHost(el);
  const doc = el.contentDocument;
  if (!doc?.documentElement || doc.documentElement.hasAttribute("data-specter-bridge")) return;
  doc.documentElement.setAttribute("data-specter-bridge", "");
  frame = el;

  const emit = () => {
    current = read(doc);
    listeners.forEach((fn) => fn(current!.palette, current!.index));
  };
  observer?.disconnect();
  observer = new MutationObserver(emit);
  // the shelf retints :root inline and rewrites the selection title per volume
  observer.observe(doc.documentElement, { attributes: true, attributeFilter: ["style"] });
  const title = doc.getElementById("selection-title");
  if (title) observer.observe(title, { childList: true, characterData: true, subtree: true });
  emit();
}

export function onShelfTheme(fn: Listener) {
  listeners.add(fn);
  if (current) fn(current.palette, current.index);
  return () => listeners.delete(fn);
}

export function shelfIndex() {
  return current?.index ?? 0;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function until<T>(get: () => T | null | undefined, timeout = 8000) {
  const end = performance.now() + timeout;
  while (performance.now() < end) {
    const value = get();
    if (value) return value;
    await wait(120);
  }
  return null;
}

/** scroll to the shelf and open volume `index` the way a visitor would */
export async function openVolume(index: number) {
  const section = document.getElementById("shelf");
  if (!section) return;
  section.scrollIntoView({ behavior: "smooth", block: "start" });

  // wait for the scroll to land and the shelf to be awake and built
  const doc = await until(() => {
    const d = frame?.contentDocument;
    const landed = Math.abs(section.getBoundingClientRect().top) < 4;
    return landed && d && !d.hidden && d.getElementById("markers")?.children.length ? d : null;
  }, 12000);
  if (!doc) return;
  await wait(250);

  const experience = doc.getElementById("experience");
  if (experience?.classList.contains("mode-detail")) {
    (doc.getElementById("close-detail") as HTMLButtonElement | null)?.click();
    await until(() => !experience.classList.contains("mode-detail") || null, 3000);
    await wait(1000);
  }
  const marker = doc.getElementById("markers")?.children[index] as HTMLButtonElement | undefined;
  marker?.click();
  // the shelf slides through its neighbours on the way, so wait until
  // the requested volume has held still in front for a moment
  const title = VOLUMES[index].title;
  const isFront = () => doc.getElementById("selection-title")?.textContent?.trim() === title;
  let steady = 0;
  const end = performance.now() + 6000;
  while (performance.now() < end && steady < 5) {
    steady = isFront() ? steady + 1 : 0;
    await wait(120);
  }
  if (!isFront()) marker?.click();
  (doc.getElementById("inspect") as HTMLButtonElement | null)?.click();
}
