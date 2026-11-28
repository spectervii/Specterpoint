"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

/* Swaps one icon for another when `value` changes: the old one blurs out as the new one blurs in. */
export function ActionSwapIcon({
  value,
  animation = "blur",
  className,
  children,
}: {
  value: string;
  animation?: "blur" | "scale";
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const hidden = reduce
    ? { opacity: 0 }
    : animation === "blur"
      ? { opacity: 0, filter: "blur(4px)", scale: 0.6 }
      : { opacity: 0, scale: 0.4 };
  return (
    <span className={cn("relative inline-grid place-items-center", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          className="col-start-1 row-start-1 inline-flex"
          initial={hidden}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          exit={hidden}
          transition={{ duration: 0.28, ease: EASE_OUT }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
