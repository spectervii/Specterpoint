"use client";

import { useEffect, useState, type RefObject } from "react";

/** true once the element has entered the viewport (never flips back) */
export function useSeen(ref: RefObject<Element | null>, threshold = 0.35) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seen, threshold]);
  return seen;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(q.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** steps through `frames` once `active`, one every `ms` */
export function useSequence<T>(frames: T[], active: boolean, ms: number, startDelay = 0) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    let n = 0;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      n += 1;
      setI(n);
      if (n < frames.length - 1) t = setTimeout(tick, ms);
    };
    t = setTimeout(tick, startDelay);
    return () => clearTimeout(t);
  }, [active, frames.length, ms, startDelay]);
  return frames[Math.min(i, frames.length - 1)];
}
