import Dashboard from "@/components/light/Dashboard";
import { getSnapshot } from "@/lib/server/snapshot-cache";
import { SITE } from "@/lib/seo";

export const revalidate = 300;

export default async function Home() {
  const snap = await getSnapshot();
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "WebSite", name: "Specterpoint", url: SITE },
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Nigeria electricity availability by area and DisCo",
      description:
        "Daily national grid generation (peak, off-peak, energy, frequency) from NIGGRID, each DisCo's load allocation, and hours of light by LGA reported by residents. Last six months, updated hourly.",
      url: SITE,
      keywords: ["NEPA light", "power outage", "grid collapse", "load allocation", "Nigeria electricity statistics", "DisCo"],
      isAccessibleForFree: true,
      license: "https://creativecommons.org/licenses/by/4.0/",
      creditText: "Specterpoint (specterpoint.online). Grid figures: NISO NIGGRID and Nigeria Power Data. Boundaries: geoBoundaries / GRID3.",
      spatialCoverage: { "@type": "Place", name: "Nigeria" },
      temporalCoverage: snap?.grid.daily[0] ? `${snap.grid.daily[0].d}/..` : undefined,
      creator: { "@type": "Person", name: "Opeyemi Shodipo", url: "https://shodipo.vercel.app" },
      distribution: [{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${SITE}/api/export` }],
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Dashboard initial={snap} />
    </>
  );
}
