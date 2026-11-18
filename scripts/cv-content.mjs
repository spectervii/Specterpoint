/* Source of truth for the three CVs. Edit here, then run
   `node scripts/build-cvs.mjs`. */

const MM_HOM = { title: "Head of Marketing (Marketing Lead)", org: "MinieMoney", dates: "September 2026 - Present" };
const MM_AN = { title: "Data / Financial Analyst & UX Analyst", org: "MinieMoney", dates: "July 2025 - September 2026" };
const ENGAGE = { title: "Founder", org: "engagecl.com", dates: "Independent venture" };

const YAHSHUD = {
  title: "Head, Data & Strategy (Administrative Lead)",
  org: "Yahshud LTD",
  dates: "March 2024 - March 2025",
  bullets: [
    "Improved operational workflow by <b>20%</b> through system and communication audits and corrective action plans.",
    "Supported data-backed performance and budget evaluations for consultancy clients (universities and private firms).",
    "Delivered reports and dashboards on time; part of the research team behind the RAIN investment app.",
  ],
};

const BULB = {
  title: "Marketing & Data Assistant (Admin & Reporting Support)",
  org: "The Bulb Africa",
  dates: "2019 - 2024",
  bullets: [
    "Supported performance reporting for public sector programmes, including Nigeria's national 3MTT initiative.",
    "Coordinated product, design and marketing teams to keep campaign deliverables on time and on brief.",
    "Created templates for stakeholder updates, client presentations and programme deliverables.",
  ],
};

const CERTS = [
  'CCNA: Introduction to Networks (Cisco Networking Academy, Sep 2026) · <a href="https://www.credly.com/badges/31e76847-b8bf-4fb3-8f46-7b6b89ea390a">verify on Credly</a>',
  "CCNA: Switching, Routing, and Wireless Essentials (Cisco Networking Academy, Sep 2026)",
  "CCNA: Enterprise Networking, Security, and Automation (Cisco Networking Academy, Oct 2026)",
  "CyberOps Associate (Cisco Networking Academy, Nov 2026)",
  "Data Analytics Certification",
  "Google Analytics Certified",
  "Google Ads Certified",
  "Meta Ads Certified",
];

const EDUCATION = [
  { degree: "MSc, Political Science (Public Administration)", school: "University of Lagos", note: "2026 | GPA: 4.2" },
  { degree: "BSc, Visual Communication", school: "University of Nigeria", note: "2021" },
  { degree: "BEd, Art Education", school: "University of Nigeria", note: "2021 | 3.9, Second Class Upper Honours" },
];

const REFERENCES = [
  { name: "Wande Adams", role: "Managing Partner, The Bulb Africa" },
  { name: "Abduljabbar Oyekan", role: "Managing Director, Yahshud LTD" },
  { name: "Gbolahan Faniran", role: "CEO/Founder, MinieMoney Finance LTD" },
];

export const CVS = [
  {
    slug: "growth",
    headline: "Growth & Marketing | 4,000 to 40,000 Users in 12 Months | Fintech",
    profile:
      "Growth marketer and Head of Marketing at MinieMoney, a Nigerian consumer fintech, where I helped take the app from <b>4,000 to 40,000 users in 12 months</b>. I find when and where customers respond, then build the campaigns, timing and tools around it, including <b>engagecl.com</b>, my own platform for push, WhatsApp, SMS and email. Seven years across fintech, consultancy and national programmes; a former data analyst, so every campaign is judged on numbers.",
    competencies: [
      "Acquisition (Meta & Google Ads)", "Send-time & Behavioural Targeting",
      "Lifecycle, CRM & WhatsApp Journeys", "Multichannel: Push, WhatsApp, SMS, Email",
      "Launches & Go-to-Market", "Funnel & Conversion Analysis",
      "Content & Short-form Video", "SQL, Python, Looker Studio, Power BI",
    ],
    experience: [
      { ...MM_HOM, bullets: [
        "Helped grow MinieMoney from <b>4,000 to 40,000 users in 12 months (10×)</b> through targeted, well-timed messaging and the 3.0 launch.",
        "Own marketing and growth for savings, payments, bills, family accounts, card and the Wendy WhatsApp assistant, reporting results to the CEO.",
        "Led the <b>MinieMoney 3.0 launch</b> (1 October 2026) end to end: launch plan, timelines, 8+ video ads and a how-to film series per product.",
        "Run segment-led campaigns for teens, families and business customers across social, WhatsApp, SMS, email and in-app; supported onboarding of corporate clients in October 2026.",
        "Manage creators and partners: briefs, quality standards and reviews that turn what works into reusable playbooks.",
      ] },
      { ...MM_AN, bullets: [
        "Found that users were active in consistent daily windows and moved email and push delivery into them (intelligent send-time), a key lever in the 10× growth.",
        "Analysed product and transaction data to find drop-off points and growth opportunities, and presented them as campaigns and product fixes.",
        "Part of the team that built MinieMoney's <b>anti-fraud system</b>, blocking multiple-account creation and false identities so growth stayed genuine.",
      ] },
      { ...ENGAGE, bullets: [
        "Built <b>engagecl.com</b> after recurring delivery hiccups across separate tools: one platform for push, WhatsApp, SMS and email that tracks every customer's history.",
      ] },
      YAHSHUD,
      BULB,
    ],
    skills: [
      ["Growth & Acquisition", "Meta and Google Ads, segmentation, send-time optimisation, campaign testing, referral and onboarding journeys, launch planning"],
      ["Messaging & CRM", "Push, WhatsApp, SMS and email; customer tracking and lifecycle journeys (engagecl.com)"],
      ["Analytics", "SQL, Python, Excel, Power BI, Looker Studio, Google Analytics"],
      ["Content & Creative", "Short-form video ads, how-to films, AI video tools, brand guidelines"],
      ["Soft Skills", "Ownership, stakeholder management, clear communication, attention to detail, problem solving"],
    ],
  },
  {
    slug: "data",
    headline: "Data & Business Analyst | Behavioural Insight to Growth | SQL, Python, Power BI",
    profile:
      "Data and business analyst with seven years across consumer fintech, consultancy and national programmes. At MinieMoney I turned behavioural data into growth: spotting the daily windows when users are active and timing every message to them, part of the work that took the app from <b>4,000 to 40,000 users in 12 months</b>. I build the pipelines and dashboards leadership runs on, and present findings that become decisions.",
    competencies: [
      "SQL & Python Analysis", "Behavioural & Cohort Analysis",
      "Dashboards & BI (Power BI, Looker Studio)", "KPI Design & Performance Reporting",
      "Data Pipelines & Automation", "Segmentation & Send-time Targeting",
      "Presenting Insights to Leadership", "Data Quality & Validation",
    ],
    experience: [
      { ...MM_HOM, bullets: [
        "Own company performance reporting (users, active users, deposits, transfers, savings, revenue) for the CEO, with month-to-date comparisons.",
        "Built an automated <b>data pipeline</b> (Python, SQLite) that ingests daily transaction exports, de-duplicates by transaction ID and publishes a password-protected BI site, refreshed daily via GitHub Actions and Vercel.",
        "Defined revenue and KPI rules with leadership so every report uses the same definitions.",
        "Part of the team behind MinieMoney's <b>anti-fraud system</b>, which blocks duplicate accounts and false identities at sign-up.",
      ] },
      { ...MM_AN, bullets: [
        "Found that users were active in consistent daily windows; used it to time email and push delivery, a key driver of growth from <b>4,000 to 40,000 users in 12 months</b>.",
        "Built targeting segments from transaction and app data so messages reached the right customers at the right time.",
        "Presented insights to marketing, product and leadership and turned them into campaigns and product fixes.",
        "Documented data-quality issues (duplicates, missing days, double-counted flows) so reports could be trusted.",
      ] },
      { ...ENGAGE, bullets: [
        "Founded a multichannel platform (push, WhatsApp, SMS, email) that keeps one record of every customer, after diagnosing delivery problems in our marketing stack.",
      ] },
      YAHSHUD,
      BULB,
    ],
    skills: [
      ["Data & Analysis", "SQL, Python, SQLite, Excel (pivot tables, lookups, modelling)"],
      ["BI & Reporting", "Power BI, Looker Studio, Google Analytics, live web dashboards"],
      ["Data Engineering Basics", "Automated ingestion of CSV exports, de-duplication, GitHub Actions scheduling"],
      ["Workflow Tools", "Jira, Google Workspace, Microsoft Office, Slack, Zendesk"],
      ["Soft Skills", "Structured problem solving, clear communication, stakeholder management, attention to detail"],
    ],
  },
  {
    slug: "security",
    headline: "IT Analyst | Fraud Prevention, QA & Security Operations | CCNA Track & CyberOps Associate",
    profile:
      "IT and security-minded analyst who has completed Cisco's full CCNA course track and CyberOps Associate, with seven years in fintech and digital programmes. At MinieMoney I was part of the team that built the <b>anti-fraud system</b> blocking duplicate accounts and false identities at sign-up, protecting a user base that grew from <b>4,000 to 40,000 in 12 months</b>. Hands-on with QA, access control and automation. Looking for a role in IT support, IT operations, IT analysis or cybersecurity.",
    competencies: [
      "Fraud Prevention & Identity Checks", "Cybersecurity Foundations",
      "Networking: Routing, Switching & Wireless", "Security Monitoring & Incident Response",
      "Software QA & Release Testing", "IT Support & Troubleshooting",
      "Scripting & Automation (Python, SQL)", "Ticketing & Issue Tracking (Jira, Zendesk)",
    ],
    experience: [
      { ...MM_HOM, bullets: [
        "Part of the team that built MinieMoney's <b>anti-fraud system</b>, blocking multiple-account creation and false identities at sign-up.",
        "Built and maintain an automated data pipeline and internal web dashboard (Python, SQLite, GitHub Actions, Vercel) with password login and admin-only pages for sensitive data.",
        "Manage scheduled jobs and fix failures (network outages, expired tokens, missing source files), with logs and alerts so issues are caught the same day.",
        "Oversee marketing operations and customer messaging as the user base grew from 4,000 to 40,000 in 12 months.",
      ] },
      { ...MM_AN, bullets: [
        "Ran quality assurance testing across product releases (Jira, qTest, TestFlight, Firebase Test Lab), checking functionality and reporting defects for resolution.",
        "Analysed daily, weekly and monthly product and transaction data to spot anomalies and recommend corrective actions.",
        "Worked with product and engineering teams to communicate issues clearly and confirm fixes.",
      ] },
      { ...ENGAGE, bullets: [
        "Built a single platform for push, WhatsApp, SMS and email with customer tracking, after spotting recurring delivery failures across separate tools.",
      ] },
      YAHSHUD,
      BULB,
    ],
    skills: [
      ["IT & Networking", "CCNA course track: networks, routing, switching, wireless, enterprise networking and automation; troubleshooting, macOS and Windows"],
      ["Security", "Security monitoring and incident response (CyberOps Associate), fraud prevention, identity checks, access control, data protection"],
      ["QA & Ticketing", "Jira, qTest, TestFlight, Firebase Test Lab, Zendesk"],
      ["Scripting & Data", "Python, SQL, SQLite, Excel, Power BI, GitHub Actions"],
      ["Soft Skills", "Attention to detail, documentation, process discipline, clear communication, problem solving"],
    ],
  },
].map((cv) => ({ ...cv, certs: CERTS, education: EDUCATION, references: REFERENCES }));

export const CONTACT = {
  name: "Opeyemi Michael Shodipo",
  email: "shodipoopeyemi@gmail.com",
  phone: "+2347056290285",
  linkedin: "linkedin.com/in/opeyemishodipo",
  site: "specterpoint.online",
  engage: "engagecl.com",
  location: "Lagos, Nigeria (remote)",
};
