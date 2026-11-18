"use client";

import type { ButtonHTMLAttributes } from "react";

/* Pill actions for the approval card's footer: a quiet ghost
   and a filled accent that carries a ⏎ hint. */

type Variant = "ghost" | "accent";
type Size = "sm" | "md";

export function Button({
  variant = "ghost",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const sizing = size === "sm" ? "h-8 px-3.5 text-[12.5px]" : "h-10 px-4.5 text-[13.5px]";
  const look =
    variant === "accent"
      ? "bg-accent text-accent-ink enabled:hover:brightness-110 disabled:opacity-35"
      : "text-ink-2 enabled:hover:bg-hover enabled:hover:text-ink disabled:opacity-35";
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-full font-sans font-medium transition-[background-color,color,filter,opacity] duration-150 ${sizing} ${look} ${className}`}
      {...props}
    >
      {children}
      {variant === "accent" && (
        <span aria-hidden className="font-mono text-[11px] opacity-60">
          ⏎
        </span>
      )}
    </button>
  );
}
