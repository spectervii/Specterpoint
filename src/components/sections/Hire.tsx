"use client";

import { useState } from "react";
import ApprovalCard, { type ApprovalQuestion } from "@/components/ApprovalCard";
import { Button } from "@/components/atoms/Button";
import LoadingState from "@/components/LoadingState";
import { CONTACT } from "@/lib/volumes";

const QUESTIONS: ApprovalQuestion[] = [
  { q: "What are you hiring for?", type: "radio", options: ["Security & IT", "Data & analytics", "Growth & marketing"] },
  { q: "What matters most?", type: "check", options: ["Clean, trusted data", "Launches that ship", "Secure, tested systems"] },
  { q: "Best next step?", type: "radio", options: ["An intro call", "Send me the CV", "I'll send a brief"] },
];

const AREA: Record<string, string> = {
  "Security & IT": "security and IT",
  "Data & analytics": "data and analytics",
  "Growth & marketing": "growth and marketing",
};

const NEXT: Record<string, string> = {
  "An intro call": "Could we set up a quick call?",
  "Send me the CV": "Could you send me your CV?",
  "I'll send a brief": "I'll follow up with a short brief.",
};

const list = (items: string[]) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

function compose(answers: Record<number, number[]>) {
  const pick = (q: number) => (answers[q] ?? []).map((i) => QUESTIONS[q].options[i]);
  const role = pick(0)[0];
  const area = role ? `your ${AREA[role] ?? role.toLowerCase()} work` : "your work";
  const subject = role ? `Saw your portfolio: ${role}` : "Saw your portfolio";
  const body = [
    "Hey Opeyemi,",
    "",
    [
      `I saw your portfolio, and I'd like to hear more about ${area}.`,
      pick(1).length ? `We care most about ${list(pick(1).map((x) => x.toLowerCase()))} right now.` : "",
      pick(2).length ? NEXT[pick(2)[0]] ?? "" : "",
    ]
      .filter(Boolean)
      .join(" "),
    "",
    "Thanks,",
  ].join("\n");
  return { subject, body };
}

const mailto = (subject: string, body: string) =>
  `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const LINKS = [
  { label: "Email", href: `mailto:${CONTACT.email}` },
  { label: "LinkedIn", href: CONTACT.linkedin, external: true },
  { label: "Security CV", href: CONTACT.cv.security, external: true },
  { label: "Data CV", href: CONTACT.cv.data, external: true },
  { label: "Growth CV", href: CONTACT.cv.growth, external: true },
];

type Draft = { subject: string; body: string };
type Status = "idle" | "sending" | "sent" | "error";

const field =
  "w-full rounded-control bg-inset px-3 py-2.5 font-sans text-[14px] text-ink shadow-hairline outline-none placeholder:text-ink-3 focus:shadow-[0_0_0_1.5px_var(--ink)]";

function SendStep({ draft, onBack }: { draft: Draft; onBack: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(draft.body);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const valid = name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) && message.trim().length > 1;

  const send = async () => {
    if (!valid || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/reach-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject: draft.subject, message, website }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="flex w-full max-w-80 flex-col gap-2" style={{ animation: "pop-in 260ms cubic-bezier(0.23,1,0.32,1) both" }}>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-tint py-1 pr-2.5 pl-1 text-[12.5px] font-medium text-green">
          <span className="flex size-4.5 items-center justify-center rounded-full bg-green text-white">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          </span>
          Sent
        </span>
        <p className="font-sans text-[13px] text-ink-2">Thanks, {name.split(" ")[0]}. Opeyemi will reply to {email}.</p>
      </div>
    );
  }

  return (
    <form
      className="w-full max-w-80 overflow-hidden rounded-card bg-surface shadow-card"
      style={{ animation: "fade-up 380ms cubic-bezier(0.23,1,0.32,1) both" }}
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <div className="primitive-card-pad flex flex-col gap-2.5 font-sans">
        <p className="text-[14px] font-medium text-ink">Where can Opeyemi reply?</p>
        <input className={field} placeholder="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Your name" maxLength={80} />
        <input className={field} placeholder="Your email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Your email" maxLength={254} />
        <textarea className={`${field} min-h-[132px] resize-none leading-relaxed`} value={message} onChange={(e) => setMessage(e.target.value)} aria-label="Message" maxLength={4000} />
        {/* honeypot */}
        <input tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
        {status === "error" && (
          <p className="text-[12.5px] leading-snug text-ink-2">
            That didn’t go through.{" "}
            <a className="underline" href={mailto(draft.subject, `${message}\n${name}`)}>
              Send it from your email app instead
            </a>
            .
          </p>
        )}
      </div>
      <div className="primitive-card-footer flex items-center justify-between gap-3 font-sans">
        {status === "sending" ? (
          <LoadingState label="Sending" variant="Dots" />
        ) : (
          <button type="button" onClick={onBack} className="text-[12.5px] font-medium text-ink-3 transition-colors hover:text-ink">
            Back
          </button>
        )}
        <Button type="submit" variant="accent" size="sm" disabled={!valid || status === "sending"}>
          Send
        </Button>
      </div>
    </form>
  );
}

export default function Hire() {
  const [draft, setDraft] = useState<Draft | null>(null);
  return (
    <section id="reach-out" data-palette="shelf" className="mx-auto grid min-h-svh w-full max-w-[1320px] content-center items-center gap-12 px-4 py-24 sm:px-10 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-8">
        <p className="kicker">Reach out</p>
        <h2 className="display text-[clamp(72px,14vw,220px)]">Let’s talk.</h2>
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
        {draft ? (
          <SendStep draft={draft} onBack={() => setDraft(null)} />
        ) : (
          <ApprovalCard
            questions={QUESTIONS}
            labels={{ send: "Next", customPlaceholder: "Something else…" }}
            resettable={false}
            onSubmitted={(answers) => setDraft(compose(answers))}
          />
        )}
      </div>
    </section>
  );
}
