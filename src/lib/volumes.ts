/* The seven shelf volumes, in shelf order. Palettes are the shelf's
   own bindings, so the story above the shelf and the shelf itself
   speak in the same colours. */

export type Palette = {
  paper: string;
  paperDeep: string;
  ink: string;
  inkSoft: string;
  accent: string;
  accentInk: string;
};

export type Volume = {
  id: string;
  roman: string;
  title: string;
  palette: Palette;
};

export const EARTH: Palette = {
  paper: "#29251d",
  paperDeep: "#1d1a15",
  ink: "#eee2ca",
  inkSoft: "#c5b79e",
  accent: "#c3a47b",
  accentInk: "#29251d",
};

export const VOLUMES: Volume[] = [
  { id: "shield", roman: "I", title: "The Shield",
    palette: { paper: "#171a24", paperDeep: "#10131b", ink: "#f4eee6", inkSoft: "#b9b4ae", accent: "#c87046", accentInk: "#10131b" } },
  { id: "signal", roman: "II", title: "The Signal",
    palette: { paper: "#762f1b", paperDeep: "#572113", ink: "#fff0df", inkSoft: "#e3bfa8", accent: "#efc16d", accentInk: "#572113" } },
  { id: "growth", roman: "III", title: "Growth",
    palette: { paper: "#c3cf21", paperDeep: "#9eaa16", ink: "#171914", inkSoft: "#485015", accent: "#171a16", accentInk: "#f0f2c9" } },
  { id: "engage", roman: "IV", title: "Engage",
    palette: { paper: "#142a80", paperDeep: "#0b1953", ink: "#f3f5f2", inkSoft: "#b5c7e9", accent: "#dbe8f1", accentInk: "#0b1953" } },
  { id: "eye", roman: "V", title: "The Eye",
    palette: { paper: "#a62c21", paperDeep: "#7f1e17", ink: "#fff0e8", inkSoft: "#e9bbb2", accent: "#efb0aa", accentInk: "#7f1e17" } },
  { id: "groundwork", roman: "VI", title: "Groundwork",
    palette: { paper: "#ae2830", paperDeep: "#7f1822", ink: "#fff0e9", inkSoft: "#efb9b4", accent: "#ff8eab", accentInk: "#7f1822" } },
  { id: "credentials", roman: "VII", title: "Credentials",
    palette: { paper: "#7ea5b7", paperDeep: "#5e8699", ink: "#102a36", inkSoft: "#274b5a", accent: "#102a36", accentInk: "#e6f0f2" } },
];

export const volumeIndex = (id: string) => VOLUMES.findIndex((v) => v.id === id);

export function applyPalette(p: Palette) {
  const root = document.documentElement.style;
  root.setProperty("--paper", p.paper);
  root.setProperty("--paper-deep", p.paperDeep);
  root.setProperty("--ink", p.ink);
  root.setProperty("--ink-2", p.inkSoft);
  root.setProperty("--ink-3", `color-mix(in srgb, ${p.inkSoft} 72%, ${p.paper})`);
  root.setProperty("--accent", p.accent);
  root.setProperty("--accent-ink", p.accentInk);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", p.paper);
}

export const CONTACT = {
  email: "shodipoopeyemi@gmail.com",
  linkedin: "https://linkedin.com/in/opeyemishodipo",
  engage: "https://engagecl.com",
  cv: {
    security: "/cv/opeyemi-shodipo-security.pdf",
    data: "/cv/opeyemi-shodipo-data.pdf",
    growth: "/cv/opeyemi-shodipo-growth.pdf",
  },
};
