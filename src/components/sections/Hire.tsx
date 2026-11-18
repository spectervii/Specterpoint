"use client";

import ApprovalCard, { type ApprovalQuestion } from "@/components/ApprovalCard";
import { CONTACT } from "@/lib/volumes";

const QUESTIONS: ApprovalQuestion[] = [
  { q: "What are you hiring for?", type: "radio", options: ["Security & IT", "Data & analytics", "Growth & marketing"] },
  { q: "What matters most?", type: "check", options: ["Clean, trusted data", "Launches that ship", "Secure, tested systems"] },
  { q: "Best next step?", type: "radio", options: ["An intro call", "Send me the CV", "I'll send a brief"] },
];

function draft(answers: Record<number, number[]>) {
  const pick = (q: number) => (answers[q] ?? []).map((i) => QUESTIONS[q].options[i]);
  const role = pick(0)[0] ?? "a role";
  const subject = `Hiring: ${role}`;
  const body = [
    "Hi Opeyemi,",
    "",
    `I'm hiring for ${role.toLowerCase()}.`,
    pick(1).length ? `What matters most: ${pick(1).join(", ").toLowerCase()}.` : "",
    pick(2).length ? `Next step: ${pick(2)[0].toLowerCase()}.` : "",
    "",
    "(Sent from specterpoint.online)",
  ]
    .filter((line, i, all) => line !== "" || all[i - 1] !== "")
    .join("\n");
  return `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const LINKS = [
  { label: "Email", href: `mailto:${CONTACT.email}` },
  { label: "LinkedIn", href: CONTACT.linkedin, external: true },
  { label: "Security CV", href: CONTACT.cv.security, external: true },
  { label: "Data CV", href: CONTACT.cv.data, external: true },
  { label: "Growth CV", href: CONTACT.cv.growth, external: true },
];

export default function Hire() {
  return (
    <section id="hire" data-palette="engagecl" className="mx-auto grid min-h-svh w-full max-w-[1320px] content-center items-center gap-12 px-4 py-24 sm:px-10 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-8">
        <p className="kicker">Hire</p>
        <h2 className="display text-[clamp(72px,14vw,220px)]">Hiring?</h2>
        <ul className="flex flex-wrap gap-2">
          {LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                {...(l.external ? { target: "_blank", rel: "noopener" } : {})}
                className="inline-flex min-h-11 items-center rounded-full border border-[var(--line-strong)] px-4 font-sans text-[13px] font-medium text-ink transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-paper"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="hire-scale flex w-full justify-start lg:justify-center">
        <ApprovalCard
          questions={QUESTIONS}
          labels={{ send: "Draft email", sentMessage: "Email drafted", customPlaceholder: "Something else…" }}
          onSubmitted={(answers) => {
            window.location.href = draft(answers);
          }}
        />
      </div>
    </section>
  );
}
