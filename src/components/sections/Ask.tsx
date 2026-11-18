"use client";

import { useMemo, useState } from "react";
import StreamingText, { type StreamingSource, type StreamingToken } from "@/components/StreamingText";
import { CONTACT } from "@/lib/volumes";

const mono = (letter: string, bg: string, fg: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='16' fill='${bg}'/><text x='32' y='44' text-anchor='middle' font-family='Helvetica,Arial,sans-serif' font-weight='700' font-size='30' fill='${fg}'>${letter}</text></svg>`,
  )}`;

const LINKEDIN: StreamingSource = { name: "LinkedIn", domain: "linkedin.com", href: CONTACT.linkedin, image: mono("in", "#182a43", "#c87046") };
const ENGAGE: StreamingSource = { name: "engagecl.com", domain: "engagecl.com", href: CONTACT.engage, image: mono("e", "#566044", "#eadfc7") };
const cv = (name: string, href: string): StreamingSource => ({ name, domain: "specterpoint.online", href, image: mono("O", "#945a3e", "#eadfc7") });

type Answer = { q: string; a: [string, string]; sources: StreamingSource[] };

const ANSWERS: Answer[] = [
  {
    q: "Who is Opeyemi?",
    a: [
      "Head of Marketing at MinieMoney. Took the app from 4,000 to 40,000 users in twelve months by reading when people show up and meeting them there.",
      "Built engagecl.com to run every channel from one place. Lagos, working remote.",
    ],
    sources: [cv("Growth CV", CONTACT.cv.growth), LINKEDIN, ENGAGE],
  },
  {
    q: "For a security team?",
    a: [
      "Cisco CCNA trained. Helped build MinieMoney's anti-fraud system, which stops duplicate accounts and false identities at sign-up.",
      "Locks sensitive data behind role-based access and tests every release before it ships.",
    ],
    sources: [cv("IT & Cybersecurity CV", CONTACT.cv.security), LINKEDIN, ENGAGE],
  },
  {
    q: "For a data team?",
    a: [
      "Found that users came alive in the same daily windows, and turned that into send-times that grew the base tenfold.",
      "SQL, Python, Power BI, Looker Studio, and presentations leaders act on.",
    ],
    sources: [cv("Data & Analytics CV", CONTACT.cv.data), LINKEDIN, ENGAGE],
  },
  {
    q: "For a growth team?",
    a: [
      "4,000 to 40,000 users in a year: targeted segments, messages timed to user rhythms, and the MinieMoney 3.0 launch.",
      "Then built engagecl.com so push, WhatsApp, SMS and email stop breaking.",
    ],
    sources: [cv("Growth CV", CONTACT.cv.growth), ENGAGE, LINKEDIN],
  },
];

const words = (s: string): StreamingToken[] => s.split(" ").map((text) => ({ text }));

export default function Ask() {
  const [i, setI] = useState(0);
  const answer = ANSWERS[i];
  const content = useMemo(() => [...words(answer.a[0]), { text: "", cite: true }, ...words(answer.a[1])], [answer]);
  const followUps = ANSWERS.filter((_, k) => k !== i).map((x) => x.q);

  return (
    <section id="ask" data-palette="shelf" className="mx-auto grid min-h-svh w-full max-w-[1320px] items-center gap-10 px-4 py-24 sm:px-10 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-4">
        <p className="kicker">Ask</p>
        <h2 key={answer.q} className="display text-[clamp(52px,8vw,128px)]" style={{ animation: "fade-up 500ms cubic-bezier(0.23,1,0.32,1) both" }}>
          {answer.q}
        </h2>
      </div>
      <div className="ask-scale w-full">
        <StreamingText
          key={i}
          content={content}
          sources={answer.sources}
          followUps={followUps}
          labels={{ sources: "3 sources", followUps: "Ask next" }}
          loop={false}
          onFollowUp={(text) => setI(ANSWERS.findIndex((x) => x.q === text))}
        />
      </div>
    </section>
  );
}
