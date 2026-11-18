/* Sends a Reach out message to Opeyemi's inbox through Resend.
 *
 * Vercel environment variables:
 *   RESEND_API_KEY   required. Until it is set this route answers 503 and
 *                    the card falls back to opening the visitor's mail app.
 *   REACH_OUT_TO     optional, defaults to Opeyemi's address.
 *   REACH_OUT_FROM   optional. Defaults to Resend's shared test sender,
 *                    which can only deliver to the Resend account's own
 *                    address; set it to e.g. "Specterpoint <hello@specterpoint.online>"
 *                    once that domain is verified in Resend. */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TO = process.env.REACH_OUT_TO || "shodipoopeyemi@gmail.com";
const FROM = process.env.REACH_OUT_FROM || "Specterpoint <onboarding@resend.dev>";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

// a light per-instance limit: a handful of sends per visitor per hour
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 4;
const recent = new Map<string, number[]>();

function limited(key: string) {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) return true;
  hits.push(now);
  recent.set(key, hits);
  if (recent.size > 5000) recent.clear();
  return false;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r/g, "").trim().slice(0, max) : "");
const oneLine = (s: string) => s.replace(/\s+/g, " ");
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // honeypot: people never see this field, bots fill it in
  if (clean(data.website, 200)) return NextResponse.json({ ok: true });

  const name = oneLine(clean(data.name, 80));
  const email = clean(data.email, 254).toLowerCase();
  const subject = oneLine(clean(data.subject, 140)) || "Saw your portfolio";
  const message = clean(data.message, 4000);

  if (!name || !EMAIL.test(email) || message.length < 2) {
    return NextResponse.json({ error: "invalid" }, { status: 422 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip) || limited(email)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const text = `${message}\n\n${name}\n${email}\n\n(Sent from the Reach out card on specterpoint.online)`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1b1f24">${escapeHtml(message)
    .split("\n")
    .join("<br>")}<br><br><strong>${escapeHtml(name)}</strong><br><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a><br><br><span style="color:#8a8f98;font-size:12px">Sent from the Reach out card on specterpoint.online</span></div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: `${name} <${email}>`, subject: `${subject} (from ${name})`, text, html }),
    });
    if (!res.ok) {
      console.error("reach-out: resend refused", res.status, await res.text().catch(() => ""));
      return NextResponse.json({ error: "send_failed" }, { status: 502 });
    }
  } catch (err) {
    console.error("reach-out: resend unreachable", err);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
