/* Renders the three CVs to PDF.
 *   public/cv/*.pdf    the downloads on specterpoint.online (no phone number)
 *   cv-private/*.pdf   the versions to send directly (with phone number; gitignored)
 * Usage: node scripts/build-cvs.mjs   (needs Playwright's Chromium) */

import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTACT, CVS } from "./cv-content.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const NAMES = { growth: "Growth", data: "Data_Analytics", security: "IT_Cybersecurity" };

const esc = (s) => s.replace(/&(?!amp;)/g, "&amp;");

function html(cv, { phone }) {
  const contact = [CONTACT.email, phone && CONTACT.phone, CONTACT.linkedin, CONTACT.site, CONTACT.location].filter(Boolean).join(" • ");
  const section = (title, body) => `<section><h2>${title}</h2>${body}</section>`;
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: Letter; margin: 0.55in 0.68in 0.55in; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #23272e; font-size: 9.85pt; line-height: 1.4; }
  h1 { margin: 0; font-size: 27pt; font-weight: 800; letter-spacing: -0.02em; color: #2c3a4f; line-height: 1.05; }
  .headline { margin-top: 5px; font-size: 11.4pt; font-weight: 700; color: #5b7fa8; }
  .contact { margin-top: 4px; font-size: 8.3pt; color: #5b7fa8; }
  .rule { height: 3px; width: 80%; margin: 12px auto 4px; background: #4f6f96; border-radius: 2px; }
  section { margin-top: 11px; }
  h2 { margin: 0 0 7px; padding-bottom: 5px; border-bottom: 1px solid #c4d1e0; font-size: 8.4pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #5b7fa8; }
  p { margin: 0; }
  b { font-weight: 700; color: #1b1f24; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 28px; }
  .job { margin-top: 9px; break-inside: avoid; }
  .job h3 { margin: 0; font-size: 10.8pt; font-weight: 700; color: #23272e; }
  .org { color: #5b7fa8; font-size: 9.8pt; }
  .dates { color: #7a8088; font-size: 9pt; }
  ul { margin: 3px 0 0; padding-left: 16px; }
  li { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 3px 0; vertical-align: top; }
  td:first-child { width: 31%; font-weight: 700; padding-right: 12px; }
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 20px; break-inside: avoid; }
  .muted { color: #7a8088; font-size: 9pt; }
  .blue { color: #5b7fa8; font-size: 9.6pt; }
  .certs { columns: 2; column-gap: 28px; margin: 0; padding-left: 16px; }
</style></head><body>
  <h1>${CONTACT.name}</h1>
  <div class="headline">${esc(cv.headline)}</div>
  <div class="contact">${contact}</div>
  <div class="rule"></div>
  ${section("Profile", `<p>${cv.profile}</p>`)}
  ${section("Core Competencies", `<div class="grid2">${cv.competencies.map((c) => `<div>${esc(c)}</div>`).join("")}</div>`)}
  ${section("Professional Experience", cv.experience.map((j) => `
    <div class="job"><h3>${esc(j.title)}</h3><div class="org">${esc(j.org)}</div><div class="dates">${j.dates}</div>
    <ul>${j.bullets.map((b) => `<li>${b}</li>`).join("")}</ul></div>`).join(""))}
  ${section("Technical Skills", `<table>${cv.skills.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>`)}
  ${section("Certifications", `<ul class="certs">${cv.certs.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`)}
  ${section("Education", `<div class="grid3">${cv.education.map((e) => `<div><b>${esc(e.degree)}</b><div class="blue">${esc(e.school)}</div><div class="muted">${e.note}</div></div>`).join("")}</div>`)}
  ${section("References", `<div class="grid3">${cv.references.map((r) => `<div><b>${esc(r.name)}</b><div class="muted">${esc(r.role)}</div></div>`).join("")}</div>`)}
</body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage();
mkdirSync(join(root, "public/cv"), { recursive: true });
mkdirSync(join(root, "cv-private"), { recursive: true });
for (const cv of CVS) {
  for (const [phone, out] of [
    [false, join(root, `public/cv/opeyemi-shodipo-${cv.slug}.pdf`)],
    [true, join(root, `cv-private/Opeyemi_Shodipo_-_CV_${NAMES[cv.slug]}.pdf`)],
  ]) {
    await page.setContent(html(cv, { phone }), { waitUntil: "networkidle" });
    await page.pdf({ path: out, format: "Letter", printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: '<div style="width:100%;font-size:7pt;color:#9aa0a6;text-align:right;padding:0 0.55in"><span class="pageNumber"></span></div>' });
    console.log("wrote", out.replace(root + "/", ""));
  }
}
await browser.close();
