"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

/* A list whose hover highlight glides between rows instead of
   blinking. Rows opt in with `data-menu-row`; the highlight is a
   single absolutely positioned layer that follows the pointer or
   keyboard focus. */

export default function GlideMenu({
  children,
  className = "",
  highlightClassName = "",
}: {
  children: ReactNode;
  className?: string;
  highlightClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);

  const follow = useCallback((target: EventTarget | null) => {
    const root = ref.current;
    const row = (target as HTMLElement | null)?.closest?.("[data-menu-row]") as HTMLElement | null;
    if (!root || !row || !root.contains(row)) return;
    setBox({ top: row.offsetTop, height: row.offsetHeight });
  }, []);

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onPointerMove={(event) => event.pointerType === "mouse" && follow(event.target)}
      onPointerLeave={() => setBox(null)}
      onFocus={(event) => follow(event.target)}
      onBlur={(event) => {
        if (!ref.current?.contains(event.relatedTarget as Node)) setBox(null);
      }}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute ${highlightClassName}`}
        style={{
          top: box?.top ?? 0,
          height: box?.height ?? 0,
          opacity: box ? 1 : 0,
          transition: "top 220ms cubic-bezier(0.22,1,0.36,1), height 220ms cubic-bezier(0.22,1,0.36,1), opacity 160ms ease",
        }}
      />
      {children}
    </div>
  );
}
