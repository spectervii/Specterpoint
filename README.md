# specterpoint.online

Portfolio of Opeyemi Shodipo. Next.js (App Router) + Tailwind v4.

- `public/landing-pages/` – the two ThreeUI pages (Field Manuals showcase, Complete Shelf), tailored and self-hosted with their media
- `src/components/threeui/` – the frame host, typography seam and host-boundary adaptations (scroll handoff, off-screen pausing)
- `src/components/sections/` – the chain (Signal → Growth → Shield → Platform), shelf, Ask and Hire sections
- `scripts/build-cvs.mjs` – regenerates the three CVs from `scripts/cv-content.mjs`

```bash
npm install
npm run dev
```

```bash
node scripts/build-cvs.mjs
```
