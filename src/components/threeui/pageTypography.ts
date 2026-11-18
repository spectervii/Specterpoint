"use client";

import { useMemo } from "react";

/* ─────────────────────────────────────────────────────────
 * PAGE TYPOGRAPHY
 * The ThreeUI bundle references this module but does not ship
 * it, so this is the host-side seam: typography and colour
 * overrides are appended to the framed document's own <head>.
 * The packaged file on disk is never rewritten.
 * ───────────────────────────────────────────────────────── */

export type PageFont =
  | "iowan-old-style"
  | "instrument-serif"
  | "newsreader"
  | "geist"
  | "inter";

export type PageTypographyProps = {
  headingFont?: PageFont;
  bodyFont?: PageFont;
  headingWeight?: "400" | "500" | "600" | "700";
  bodyWeight?: "400" | "500" | "600" | "700";
  primaryColor?: string;
  /** px; the upper bound of the hero heading's authored clamp */
  headingSize?: number;
  /** px; the upper bound of the body copy's authored clamp */
  bodySize?: number;
  /** em */
  headingLetterSpacing?: number;
};

/** where each typography knob lands inside one specific authored page */
export type PageTypographyRecipe = {
  heading: string;
  body: string;
  /** CSS custom property that carries the page's primary colour */
  primaryVar?: string;
  /** element sized by headingSize, and its authored clamp floor/preferred */
  headingSize?: { selector: string; min: string; preferred: string; minWidth?: number; compact?: string };
  bodySize?: { selector: string; min: string; preferred: string };
  /** authored italic body elements to set upright when a sans is chosen */
  uprightBody?: string;
};

export type LandingPageCustomization = { css: string; fontHref?: string } | undefined;

const STACKS: Record<PageFont, string> = {
  "iowan-old-style": '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Baskerville, Georgia, serif',
  "instrument-serif": '"Instrument Serif", "Iowan Old Style", Georgia, serif',
  newsreader: '"Newsreader", "Iowan Old Style", Georgia, serif',
  geist: '"Geist", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  inter: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
};

const GOOGLE_FAMILIES: Partial<Record<PageFont, string>> = {
  "instrument-serif": "Instrument+Serif:ital@0;1",
  newsreader: "Newsreader:ital,wght@0,400..700;1,400..700",
  geist: "Geist:wght@400..700",
  inter: "Inter:wght@400;500;600;700",
};

export const BESTSELLERS_TYPOGRAPHY: PageTypographyRecipe = {
  heading: ".brand, .hero-word, .cover-title, .detail-title, .menu-link",
  body: "body",
  primaryVar: "--pink",
  headingSize: {
    selector: ".hero-word",
    min: "184px",
    preferred: "22vw",
    minWidth: 901,
    compact: "@media (max-width:900px){.hero-word{font-size:clamp(96px,23vw,200px)}}@media (max-width:560px){.hero-word{font-size:26vw;top:20vh}}",
  },
  bodySize: { selector: ".detail-description", min: "14px", preferred: "1.28vw" },
  uprightBody: ".cover-kicker, .cover-subtitle, .ticket-button, .open-badge, .doc-label, .doc-step-copy strong, .doc-steps li::before, .review-source, .year, .pill",
};

export const COMPLETE_SHELF_TYPOGRAPHY: PageTypographyRecipe = {
  heading: ".editorial-identity strong, .selection__title, .detail-title, .detail-deck, .page-status strong, .fallback__header h2, .fallback-book strong",
  body: "body",
};

const TYPE_KEYS: (keyof PageTypographyProps)[] = [
  "headingFont",
  "bodyFont",
  "headingWeight",
  "bodyWeight",
  "primaryColor",
  "headingSize",
  "bodySize",
  "headingLetterSpacing",
];

export function splitTypographyProps<T extends PageTypographyProps>(
  props: T,
): [PageTypographyProps, Omit<T, keyof PageTypographyProps>] {
  const type: PageTypographyProps = {};
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if ((TYPE_KEYS as string[]).includes(key)) (type as Record<string, unknown>)[key] = value;
    else rest[key] = value;
  }
  return [type, rest as Omit<T, keyof PageTypographyProps>];
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function buildPageCustomization(
  recipe: PageTypographyRecipe,
  type: PageTypographyProps,
): LandingPageCustomization {
  const rules: string[] = [];
  const families = new Set<string>();

  if (type.headingFont) {
    // the authored italics belong to the serif; a sans is set upright
    const sans = type.headingFont === "geist" || type.headingFont === "inter";
    rules.push(`${recipe.heading}{font-family:${STACKS[type.headingFont]} !important${sans ? ";font-style:normal" : ""}}`);
    // a sans sets wider than the authored serif; keep the hero word on screen on small viewports
    if (sans && recipe.headingSize?.compact) rules.push(recipe.headingSize.compact);
    if (GOOGLE_FAMILIES[type.headingFont]) families.add(GOOGLE_FAMILIES[type.headingFont]!);
  }
  if (type.headingWeight) rules.push(`${recipe.heading}{font-weight:${type.headingWeight}}`);
  if (type.bodyFont) {
    const upright = type.bodyFont === "geist" || type.bodyFont === "inter";
    rules.push(`${recipe.body}{font-family:${STACKS[type.bodyFont]}}`);
    if (upright && recipe.uprightBody) rules.push(`${recipe.uprightBody}{font-style:normal}`);
    if (GOOGLE_FAMILIES[type.bodyFont]) families.add(GOOGLE_FAMILIES[type.bodyFont]!);
  }
  if (type.bodyWeight) rules.push(`${recipe.body}{font-weight:${type.bodyWeight}}`);
  if (type.primaryColor && recipe.primaryVar && HEX.test(type.primaryColor)) {
    rules.push(`:root{${recipe.primaryVar}:${type.primaryColor}}`);
  }
  if (type.headingSize && recipe.headingSize) {
    const { selector, min, preferred, minWidth } = recipe.headingSize;
    const rule = `${selector}{font-size:clamp(${min},${preferred},${Math.round(type.headingSize)}px)}`;
    rules.push(minWidth ? `@media (min-width:${minWidth}px){${rule}}` : rule);
  }
  if (type.bodySize && recipe.bodySize) {
    const { selector, min, preferred } = recipe.bodySize;
    rules.push(`${selector}{font-size:clamp(${min},${preferred},${Math.round(type.bodySize)}px)}`);
  }
  if (typeof type.headingLetterSpacing === "number" && recipe.headingSize) {
    rules.push(`${recipe.headingSize.selector}{letter-spacing:${type.headingLetterSpacing}em}`);
  }

  if (!rules.length) return undefined;
  const fontHref = families.size
    ? `https://fonts.googleapis.com/css2?${[...families].map((f) => `family=${f}`).join("&")}&display=swap`
    : undefined;
  return { css: rules.join("\n"), fontHref };
}

export function usePageTypography(recipe: PageTypographyRecipe, type: PageTypographyProps) {
  const key = JSON.stringify(type);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => buildPageCustomization(recipe, type), [recipe, key]);
}

const STYLE_ID = "threeui-page-customization";
const FONT_ID = "threeui-page-customization-font";

export function applyPageCustomization(
  frame: HTMLIFrameElement | null,
  customization: LandingPageCustomization,
) {
  const doc = frame?.contentDocument;
  if (!doc?.head) return;
  doc.getElementById(STYLE_ID)?.remove();
  doc.getElementById(FONT_ID)?.remove();
  if (!customization) return;

  if (customization.fontHref) {
    const link = doc.createElement("link");
    link.id = FONT_ID;
    link.rel = "stylesheet";
    link.href = customization.fontHref;
    doc.head.appendChild(link);
  }
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = customization.css;
  doc.head.appendChild(style);
}

export function postPageCustomization(
  frame: HTMLIFrameElement | null,
  customization: LandingPageCustomization,
) {
  try {
    frame?.contentWindow?.postMessage(
      { type: "threeui:customization", customization: customization ?? null },
      window.location.origin,
    );
  } catch {
    /* a frame that has not navigated yet has no window to receive it */
  }
}
