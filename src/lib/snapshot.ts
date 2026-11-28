import type { AreaStats } from "./stats";

/** One day of official grid performance (or a backfilled peak). */
export type DailyRow = {
  d: string;
  peak: number;
  off: number | null;
  mwh: number | null;
  fh: number | null;
  fl: number | null;
  src: string;
};

export type SourceHealth = {
  id: string;
  name: string;
  url: string;
  role: string;
  lastOk: string | null;
  lastRun: string | null;
  ok: boolean | null;
  error: string | null;
};

/** Everything the page shows, rebuilt by the hourly job and served from cache. */
export type Snapshot = {
  updatedAt: string;
  grid: {
    status: "steady" | "low" | "collapse" | "unknown";
    typicalMwh: number | null;
    latest: DailyRow | null;
    daily: DailyRow[];
    /** complete readings from the last 30 hours */
    readings: { t: string; mw: number; src: string }[];
  };
  discos: Record<string, { mw: number; share: number; avg30: number }>;
  /** disco → Lagos date → average MW allocated that day */
  discoDaily: Record<string, Record<string, number>>;
  discosAsAt: string | null;
  discosSource: string | null;
  totalAllocatedMw: number;
  areas: Record<string, AreaStats>;
  contributions: { week: number; areas: number };
  sources: SourceHealth[];
};

export const DISCO_NAMES: Record<string, string> = {
  abuja: "Abuja Electric", benin: "Benin Electric", eko: "Eko Electric", enugu: "Enugu Electric",
  ibadan: "Ibadan Electric", ikeja: "Ikeja Electric", jos: "Jos Electric", kaduna: "Kaduna Electric",
  kano: "Kano Electric", portharcourt: "Port Harcourt Electric", yola: "Yola Electric",
};
