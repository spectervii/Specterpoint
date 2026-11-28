import type { Metadata } from "next";
import Link from "next/link";
import Bulb from "@/components/light/Bulb";
import { DISCO_SEO, KEYWORDS, SITE } from "@/lib/seo";

const TITLE = "Nigeria electricity guide: bands, feeders, tariffs, metering and grid data";
const DESCRIPTION =
  "Plain definitions of the terms behind Nigeria's power supply: NEPA light, grid collapse, load shedding, Band A to E, feeders, MYTO tariffs, metering, ATC&C losses, generation and the agencies and DisCos, with where to download the data.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    ...KEYWORDS, "Band A feeders list", "tariff migration", "band downgrade", "33kV feeder", "11kV feeder", "injection substation",
    "distribution transformer", "metering gap", "smart meter", "meter rollout", "capping order", "Meter Asset Provider", "NMMP",
    "ATC&C losses", "energy billed", "energy received", "generation capacity", "available capacity", "wheeling capacity",
    "gas constraint", "electrification rate", "energy access", "mini-grid", "solar home system", "captive power",
    "embedded generation", "IPP", "self-generation", "Light Up Lagos", "street lights", "rural electrification", "REA",
    "LASERC", "NBET", "Market Operator", "NBS electricity report", "NERC quarterly report", "electricity dataset csv",
  ],
  alternates: { canonical: "/guide" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE}/guide`, type: "article", siteName: "Specterpoint" },
};

type Term = [string, string];
const SECTIONS: { id: string; title: string; terms: Term[] }[] = [
  {
    id: "outages",
    title: "Supply and outages",
    terms: [
      ["NEPA light / light status", "Everyday Nigerian words for grid electricity, after the old National Electric Power Authority. \"Is there light?\" means \"is the grid supplying power here now?\""],
      ["Power outage / blackout", "A loss of supply. It may be local (a feeder or transformer), or wide when the grid itself fails."],
      ["Grid collapse / system collapse", "The national grid losing balance between generation and demand, tripping power stations and cutting supply across much of the country until it is rebuilt."],
      ["Load shedding", "Deliberately switching some feeders off when there is not enough power for every area, usually in rotation."],
      ["Tripping / feeder tripping", "Protection equipment cutting a line or feeder off automatically after a fault or overload."],
      ["Fault clearing / power restoration", "Finding and fixing the cause of an outage and switching supply back on."],
    ],
  },
  {
    id: "bands",
    title: "Service bands, feeders and tariffs",
    terms: [
      ["Band A to Band E", "NERC's service bands set by how many hours of supply a feeder gives a day: Band A at least 20 hours, Band B at least 16, Band C at least 12, Band D at least 8 and Band E at least 4. The band sets the tariff on that feeder."],
      ["Hours of supply", "How long a feeder actually delivers power in a day. Feeders that fall short of their band's minimum should be moved down (band downgrade); better supply can move a feeder up (band upgrade)."],
      ["Service Reflective Tariff (SRT)", "Tariffs priced to reflect the cost and quality of the service a customer receives, which is why they are tied to bands."],
      ["MYTO", "The Multi-Year Tariff Order: NERC's framework that sets electricity prices for each DisCo, reviewed periodically (an electricity tariff review)."],
      ["33kV and 11kV feeders", "Distribution lines leaving an injection substation at 33,000 or 11,000 volts. Outages and bands are usually announced per feeder."],
      ["Injection substation", "Where power from the transmission network is stepped down and sent out on 33kV or 11kV feeders."],
      ["Distribution transformer", "The transformer on your street that steps power down to the voltage homes use."],
      ["Feeder availability", "The share of time a feeder is energised and supplying customers."],
    ],
  },
  {
    id: "metering",
    title: "Metering, billing and customers",
    terms: [
      ["Metering gap", "The number of customers without a working meter."],
      ["Prepaid and smart meters", "Meters that measure what you use. Prepaid meters take tokens in advance; smart meters can also report readings remotely."],
      ["Estimated billing", "Bills based on an estimate instead of a meter reading. NERC caps how much unmetered customers can be charged (the capping order)."],
      ["MAP", "Meter Asset Provider: companies licensed under NERC's MAP regulations to supply and install meters for DisCos."],
      ["NMMP", "The National Mass Metering Programme, the federal scheme to give unmetered customers free meters."],
      ["Metered and unmetered customers", "DisCo customers with and without meters. Together they make up active electricity customers."],
      ["Revenue collection", "How much of what a DisCo bills it actually collects."],
      ["ATC&C losses", "Aggregate Technical, Commercial and Collection losses: the share of energy a DisCo receives that it never gets paid for, through line losses, theft, billing gaps and unpaid bills."],
    ],
  },
  {
    id: "grid",
    title: "Generation and grid statistics",
    terms: [
      ["Power generation / peak generation", "The megawatts power stations send to the grid. The peak is the day's highest; off-peak is the lowest. This site shows both daily, from NIGGRID."],
      ["Load allocation / MW allocated", "How much of the available power the system operator assigns to each DisCo. It is the closest official figure to how much power reaches an area, and it appears on every area page here."],
      ["Energy received / energy billed", "Energy a DisCo receives from the transmission network (TCN), and the energy it bills its customers, usually in MWh or GWh."],
      ["Installed, available and wheeling capacity", "Installed capacity is what power stations could produce on paper; available capacity is what they can run today; wheeling capacity is how much the transmission network can carry."],
      ["Transmission loss", "Energy lost between power stations and DisCos. NIGGRID reports it daily."],
      ["Grid frequency", "Nigeria's grid runs at 50 Hz. Large swings away from 50 Hz mean generation and demand are out of balance, which can lead to a collapse."],
      ["Gas constraint", "Thermal power stations producing less than they could for lack of gas supply, a common reason for low generation."],
      ["Electrification rate / energy access", "The share of people or households connected to electricity, on or off the grid."],
    ],
  },
  {
    id: "offgrid",
    title: "Off-grid, solar and backup power",
    terms: [
      ["Off-grid electricity", "Power that does not come from the national grid: generators, solar systems and mini-grids."],
      ["Mini-grid / interconnected mini-grid", "A small local network serving a community. Interconnected mini-grids also link to a DisCo's network."],
      ["Solar home system (SHS)", "Panels, battery and inverter for a single home."],
      ["Captive power / self-generation", "Power a business or home produces for its own use, very often from petrol or diesel generators."],
      ["Embedded generation", "Power stations connected directly to a distribution network rather than the national grid."],
      ["IPP", "Independent Power Producer: a privately owned power station selling electricity."],
    ],
  },
  {
    id: "lagos",
    title: "Street lighting and public infrastructure",
    terms: [
      ["Light Up Lagos", "Lagos State's programme for street lighting and power to public facilities."],
      ["Lagos State Electricity Board (LSEB)", "The Lagos agency responsible for public lighting and the state's power projects."],
      ["Rural electrification", "Bringing power to communities without it, led federally by the Rural Electrification Agency (REA)."],
    ],
  },
  {
    id: "agencies",
    title: "Agencies and operators",
    terms: [
      ["NERC", "Nigerian Electricity Regulatory Commission: the national regulator for tariffs, bands, metering and licences."],
      ["LASERC", "Lagos State Electricity Regulatory Commission, the state regulator in Lagos under the Electricity Act 2023."],
      ["NISO", "Nigerian Independent System Operator: runs the grid and publishes the NIGGRID figures this site reads."],
      ["TCN", "Transmission Company of Nigeria: owns and runs the high-voltage transmission network."],
      ["NBET and the Market Operator (MO)", "NBET buys bulk power from generators; the Market Operator runs the market's settlement."],
      ["NBS, REA, ECN and LBS", "National Bureau of Statistics, Rural Electrification Agency, Energy Commission of Nigeria and Lagos Bureau of Statistics: sources of official electricity statistics and reports."],
      ["GenCos", "Generation companies, such as Egbin, Transcorp, Geregu and the Kainji, Jebba and Shiroro hydro stations."],
    ],
  },
];

export default function Guide() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Nigeria electricity terms",
    url: `${SITE}/guide`,
    hasDefinedTerm: SECTIONS.flatMap((s) => s.terms.map(([name, description]) => ({ "@type": "DefinedTerm", name, description }))),
  };
  return (
    <div className="min-h-svh">
      <div className="wash" aria-hidden />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="top">
        <Link className="name inline-flex items-center gap-1.5" href="/"><Bulb className="size-[22px]" />Specterpoint</Link>
      </header>
      <main className="mx-auto w-full max-w-[760px] px-4 pb-16 pt-6">
        <article className="leaf rounded-[10px] px-[clamp(18px,4vw,44px)] py-[clamp(22px,4vw,40px)]">
          <div className="relative z-[1]">
            <p className="caps">Guide</p>
            <h1 className="mt-2 text-[clamp(22px,3.2vw,32px)] font-bold leading-tight">Nigeria electricity, in plain words</h1>
            <nav aria-label="Sections" className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2">
              {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className="underline decoration-line underline-offset-2 hover:text-ink">{s.title}</a>)}
              <a href="#data" className="underline decoration-line underline-offset-2 hover:text-ink">Data and downloads</a>
            </nav>

            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="mt-9 scroll-mt-6">
                <h2 className="caps !text-[11px] !text-ink">{s.title}</h2>
                <dl className="mt-3 grid gap-3">
                  {s.terms.map(([t, d]) => (
                    <div key={t} className="border-t border-line pt-3">
                      <dt className="text-[14px] font-bold">{t}</dt>
                      <dd className="mt-1 text-[13px] leading-relaxed text-ink-2">{d}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}

            <section id="data" className="mt-9 scroll-mt-6">
              <h2 className="caps !text-[11px] !text-ink">DisCos</h2>
              <ul className="mt-3 grid gap-1 text-[13px] text-ink-2 sm:grid-cols-2">
                {Object.values(DISCO_SEO).map(([name, abbr]) => <li key={abbr}><span className="font-bold text-ink">{abbr}</span> · {name}</li>)}
              </ul>
              <h2 className="caps mt-9 !text-[11px] !text-ink">Data and downloads</h2>
              <dl className="mt-3 grid gap-3 text-[13px] leading-relaxed text-ink-2">
                <div className="border-t border-line pt-3">
                  <dt className="font-bold text-ink">This site&apos;s dataset (CSV)</dt>
                  <dd className="mt-1">
                    Six months by date: national peak, off-peak, energy and frequency, each DisCo&apos;s load allocation, and hours of light by LGA from residents.{" "}
                    <a href="/api/export" download className="font-bold text-g4 underline underline-offset-2">Download CSV</a>. Each area page has its own download too.
                    Free to reuse under{" "}
                    <a href="https://creativecommons.org/licenses/by/4.0/" className="underline underline-offset-2" rel="license">CC BY 4.0</a>: credit Specterpoint. Grid figures come from NIGGRID (NISO) and Nigeria Power Data.
                  </dd>
                </div>
                <div className="border-t border-line pt-3">
                  <dt className="font-bold text-ink">Official sources</dt>
                  <dd className="mt-1">
                    NIGGRID (NISO) for daily grid performance and DisCo allocations; NERC quarterly reports for bands, metering, billing, collection and ATC&amp;C losses; NBS electricity reports for customers and energy billed by DisCo. Searching with &quot;dataset&quot;, &quot;quarterly report&quot;, &quot;filetype:csv&quot;, &quot;filetype:xlsx&quot; or &quot;filetype:pdf&quot; finds the downloadable tables.
                  </dd>
                </div>
              </dl>
            </section>

            <p className="mt-10 text-[12px]"><Link href="/" className="font-bold underline underline-offset-2">See light in your area →</Link></p>
          </div>
        </article>
      </main>
    </div>
  );
}
