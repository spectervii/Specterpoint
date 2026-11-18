"use client";

import { useEffect } from "react";

/* The two framed pages animate forever. Both already pause themselves
   when their document is hidden (the shelf stops its render loop, the
   showcase stops its cover videos). When a frame scrolls well out of
   view, the host tells that frame's document it is hidden, so those
   authored pause paths run and the page stops costing battery. */

const PAUSED = Symbol.for("specter.paused");
type PausableDoc = Document & { [PAUSED]?: boolean };

function ensurePatched(doc: PausableDoc) {
  if (Object.prototype.hasOwnProperty.call(doc, PAUSED)) return;
  doc[PAUSED] = false;
  const proto = Object.getPrototypeOf(doc);
  const hidden = Object.getOwnPropertyDescriptor(Document.prototype, "hidden") ?? Object.getOwnPropertyDescriptor(proto, "hidden");
  const state = Object.getOwnPropertyDescriptor(Document.prototype, "visibilityState") ?? Object.getOwnPropertyDescriptor(proto, "visibilityState");
  Object.defineProperty(doc, "hidden", {
    configurable: true,
    get() {
      return doc[PAUSED] || Boolean(hidden?.get?.call(doc));
    },
  });
  Object.defineProperty(doc, "visibilityState", {
    configurable: true,
    get() {
      return doc[PAUSED] ? "hidden" : state?.get?.call(doc);
    },
  });
}

function setPaused(frame: HTMLIFrameElement, paused: boolean) {
  const doc = frame.contentDocument as PausableDoc | null;
  if (!doc || doc.readyState === "loading") return;
  ensurePatched(doc);
  if (doc[PAUSED] === paused) return;
  doc[PAUSED] = paused;
  doc.dispatchEvent(new Event("visibilitychange"));
}

export default function FramePauser() {
  useEffect(() => {
    const wrappers = document.querySelectorAll<HTMLElement>(".shader-frame");
    const visible = new Map<Element, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible.set(e.target, e.isIntersecting);
          const frame = e.target.querySelector("iframe");
          if (frame) setPaused(frame, !e.isIntersecting);
        }
      },
      { rootMargin: "25% 0px 25% 0px" },
    );
    wrappers.forEach((w) => {
      io.observe(w);
      // a frame that finishes loading while off-screen starts paused
      // (captured on the wrapper, so frames mounted later are covered too)
      w.addEventListener(
        "load",
        (event) => {
          const frame = event.target as HTMLIFrameElement;
          if (frame.tagName === "IFRAME" && visible.get(w) === false) setPaused(frame, true);
        },
        true,
      );
    });
    return () => io.disconnect();
  }, []);
  return null;
}
