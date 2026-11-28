import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Dashboard from "@/components/light/Dashboard";
import { AREA_LIST, AREAS } from "@/lib/server/areas";
import { getSnapshot } from "@/lib/server/snapshot-cache";
import { DISCO_SEO, KEYWORDS, SITE } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return AREA_LIST.map((a) => {
    const [state, lga] = a.id.split("/");
    return { state, lga };
  });
}

type Props = { params: Promise<{ state: string; lga: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, lga } = await params;
  const a = AREAS.get(`${state}/${lga}`);
  if (!a) return {};
  const [disco, abbr] = DISCO_SEO[a.disco];
  const title = `Is there light in ${a.name}? Live NEPA light status · ${a.name}, ${a.state}`;
  const description = `Light in ${a.name}, ${a.state}: when power comes on, how long it stays, supply quality and a six-month calendar, from residents' reports. ${disco} (${abbr}) load allocation and the national grid, updated hourly.`;
  return {
    title,
    description,
    keywords: [`light in ${a.name}`, `NEPA ${a.name}`, `power outage ${a.name}`, `${a.name} electricity`, `${a.state} electricity`, disco, abbr, ...KEYWORDS],
    alternates: { canonical: `/area/${a.id}` },
    openGraph: { title, description, url: `${SITE}/area/${a.id}`, type: "website", siteName: "Specterpoint" },
  };
}

export default async function AreaRoute({ params }: Props) {
  const { state, lga } = await params;
  const a = AREAS.get(`${state}/${lga}`);
  if (!a) notFound();
  const snap = await getSnapshot();
  const [disco, abbr] = DISCO_SEO[a.disco];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Light status in ${a.name}, ${a.state}`,
    url: `${SITE}/area/${a.id}`,
    about: {
      "@type": "AdministrativeArea",
      name: `${a.name} Local Government Area`,
      containedInPlace: { "@type": "State", name: a.state === "FCT" ? "Federal Capital Territory" : `${a.state} State` },
      geo: { "@type": "GeoCoordinates", latitude: a.ll[0], longitude: a.ll[1] },
    },
    provider: { "@type": "Organization", name: `${disco} (${abbr})` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Nigeria", item: SITE },
        { "@type": "ListItem", position: 2, name: `${a.name}, ${a.state}`, item: `${SITE}/area/${a.id}` },
      ],
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Dashboard initial={snap} initialPlace={{ id: a.id, n: a.name, s: a.state, d: a.disco, c: a.c, b: a.box }} />
    </>
  );
}
