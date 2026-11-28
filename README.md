# specterpoint.online

**Do you have light?** A live map of electricity across Nigeria, area by area, with the national grid alongside. It runs on its own once deployed: data is fetched, checked, stored and published every hour without anyone touching it.

Next.js 15 (App Router), React 19, Tailwind v4, Neon Postgres, hosted on Vercel.

## What it shows

| On the page | Where it comes from |
| --- | --- |
| Peak and off-peak generation, energy, frequency (daily) | NIGGRID home page (official, NISO) |
| Generation through the day (24h chart) | NIGGRID realtime reading, captured hourly; Nigeria Power Data history |
| MW allocated to each of the 11 DisCos | NIGGRID DisCo load profile; Nigeria Power Data as fallback |
| Past DisCo allocations, by date (each area's "supply" calendar) | Nigeria Power Data DisCo history, backfilled automatically |
| Each area: light now, when it comes on, how often, how long, quality, six-month calendar | Contributions from residents (On / Weak / Off) |
| Map and area names | geoBoundaries ADM1/ADM2 (CC BY 4.0, GRID3 2022), 774 LGAs |
| Streets for 32 cities: Lagos, Abuja, Port Harcourt, Warri/Effurun, Asaba, Benin City; Ibadan, Ogbomosho, Oyo, Abeokuta, Ota, Sagamu, Ijebu-Ode, Osogbo, Ile-Ife, Ilesa, Akure, Ado-Ekiti; Enugu, Nsukka, Onitsha, Awka, Nnewi, Owerri, Aba, Umuahia, Abakaliki | OpenStreetMap (ODbL), rebuilt monthly |
| Address search | Local list of LGAs and neighbourhoods, then OpenStreetMap Nominatim |

No public source publishes outages street by street, so area figures come from contributions. The official figures give the national and DisCo context.

## Architecture

```
GitHub Actions (hourly) ─┐
Vercel Cron (daily) ─────┴─> /api/cron/ingest ──> sources ──> Neon tables ──> snapshot row
                                                                              │
visitors ──> page / /api/snapshot <── Next cache (tag "snapshot") <───────────┘
                         │
                         └─ /api/contribute ──> contributions ──> area stats patched into snapshot
```

- `src/lib/server/sources.ts`: fetches and parses each source; every number is range-checked, so a layout change logs a failure instead of storing nonsense. Fetches retry twice with backoff.
- `src/lib/server/ingest.ts`: the job. NIGGRID first, Nigeria Power Data when NIGGRID fails; only readings where at least 18 power stations had reported are kept (earlier readings undercount). Days NIGGRID has not covered get a peak from complete readings, labelled with its source and never overwriting official figures. Old rows are pruned. Each step is written to `fetch_log`.
- `src/lib/stats.ts`: turns contributions into area stats. Reports minutes apart are merged, "on"/"weak" opens a spell of light and "off" closes it, and an unclosed spell is capped at 18 hours.
- Visitors never query the database: the job writes one snapshot row and revalidates the cache, so page views do not wake Neon. The page polls `/api/snapshot` every five minutes without reloading.
- `scripts/build-streets.py`: cuts OpenStreetMap extracts into small street tiles in `public/streets/` (overview tiles of main roads, then every street with names). The map fetches only the tiles in view once zoomed in, and searching an address in those cities zooms to street level.
- `scripts/build-geo.py`: rebuilds `public/geo/*.json` and `src/data/areas.json` from geoBoundaries files (needs `shapely`).

## Downloads

- `/api/export`: CSV of every day in the last six months: national figures, each DisCo's allocation, and every area with reports.
- `/api/export?area=lagos/ikeja`: one row per day for one area, with its DisCo and the national figures.
- Columns: `date, level, area_id, area, state, disco, light_hours, reports, disco_allocation_mw, national_peak_mw, national_offpeak_mw, national_energy_mwh, frequency_low_hz, frequency_high_hz, national_source`. Empty cells mean the source had nothing for that day.

## Schedule

| Job | When |
| --- | --- |
| Ingest (GitHub Actions, `.github/workflows/ingest.yml`) | every hour at :07, three attempts |
| Ingest backup (Vercel Cron, `vercel.json`) | daily 04:17 UTC |
| Page refresh in the browser | every 5 minutes while the tab is open |
| Street tiles (GitHub Actions, `.github/workflows/streets.yml`) | 2nd of each month, committed only if streets changed |
| DisCo history backfill | while under 60 days are stored: daily, or every 3 hours after a failure |
| Retention | grid readings 400 d, DisCo allocations 200 d, contributions 400 d, logs 90 d |

## Environment variables

| Name | Where | What |
| --- | --- | --- |
| `DATABASE_URL` | Vercel | Neon connection string (project `specterpoint-light`) |
| `CRON_SECRET` | Vercel and GitHub Actions secret | Shared secret for `/api/cron/ingest`; Vercel Cron sends it automatically |
| `HASH_SALT` | Vercel, optional | Salt for the anonymous reporter hash used in rate limits |
| `SITE_URL` | GitHub Actions variable, optional | Defaults to `https://www.specterpoint.online` |

## Deploying

1. Add the variables above in Vercel and GitHub.
2. Push to `main`; Vercel deploys to production.
3. Run the workflow once by hand (Actions, Hourly ingest, Run workflow) to fill the snapshot straight away.

## Monitoring

- `GET /api/health`: 200 while the snapshot is under three hours old, 503 otherwise, with each source's last success. It reads the cache, so an uptime monitor can poll it freely.
- A failed GitHub run emails the repository owner.
- Recent fetches: `SELECT ran_at, source, ok, rows, duration_ms, detail FROM fetch_log ORDER BY ran_at DESC LIMIT 50;`

## Other notes

- Contributions: no accounts. The reporter is a salted hash of IP and browser, used only for limits (6 an hour, one per area every 10 minutes). Cross-site posts are refused.
- Security headers and caching live in `next.config.ts`; the browser only talks to this origin.
- `postcss` is pinned through `overrides` in `package.json`. Run `npm audit` before upgrading.

```bash
npm install
npm run dev
```

## Open source

Code: [GNU AGPL-3.0](LICENSE). Copyright (C) 2026 Opeyemi Shodipo. You can run, study, change and share it; if you run a modified version as a website, you must offer its source to its users too.

Data:
- the CSV this site publishes: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), credit Specterpoint
- streets: © OpenStreetMap contributors, [ODbL](https://opendatacommons.org/licenses/odbl/)
- boundaries: geoBoundaries / GRID3, CC BY 4.0
- grid figures: NISO NIGGRID and Nigeria Power Data, under their own terms

Contributions are welcome: open an issue or a pull request. To run it yourself you need a Postgres database (Neon works) with the tables below, and the environment variables above.

```sql
CREATE TABLE grid_readings (observed_at timestamptz, source text, total_mw numeric, frequency_hz numeric, gencos_reporting int, fetched_at timestamptz DEFAULT now(), PRIMARY KEY (observed_at, source));
CREATE TABLE grid_daily (day date PRIMARY KEY, peak_mw numeric, offpeak_mw numeric, energy_generated_mwh numeric, energy_sent_mwh numeric, freq_high numeric, freq_low numeric, source text, fetched_at timestamptz DEFAULT now());
CREATE TABLE disco_allocations (observed_at timestamptz, disco text, mw numeric, source text, PRIMARY KEY (observed_at, disco));
CREATE TABLE contributions (id bigserial PRIMARY KEY, area_id text NOT NULL, status text NOT NULL CHECK (status IN ('on','off','weak')), reported_at timestamptz NOT NULL DEFAULT now(), reporter text NOT NULL);
CREATE INDEX ON contributions (area_id, reported_at DESC);
CREATE INDEX ON contributions (reporter, reported_at DESC);
CREATE TABLE fetch_log (id bigserial PRIMARY KEY, ran_at timestamptz NOT NULL DEFAULT now(), job text, source text, ok boolean, rows int, duration_ms int, detail text);
CREATE TABLE snapshot (key text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
```
