// Portfolio content + analytics data for the Specimen Sheet.
// Ported from the Claude Design handoff (app.jsx).

export interface Project {
  n: string;
  title: string;
  desc: string;
  long: string;
  tags: string[];
  year: string;
  status: string;
  type: string;
  link: string;
  metrics: { loc: number; commits: number; stars: number; files: number; deps: number };
  trend: number[];
}

export const PROJECTS: Project[] = [
  {
    n: "01", title: "Home Lab",
    desc: "A Proxmox cluster with 1.5TB of RAM and four V100s. Where I break things safely.",
    long: "Proxmox host with 1.5TB RAM and 4× NVIDIA V100 GPUs for local LLM work, running a stack of VMs and LXC containers: Linux servers, monitoring, and services behind a reverse proxy. Everything is provisioned as code — Terraform + Ansible — with VLAN segmentation and hardened access. Where I test anything before it touches something that matters.",
    tags: ["Proxmox", "Terraform", "Linux", "Homelab"],
    year: "2025", status: "running", type: "Homelab / Infra",
    link: "https://github.com/imranhwafa",
    metrics: { loc: 3400, commits: 210, stars: 0, files: 64, deps: 0 },
    trend: [2, 4, 6, 8, 10, 12, 14, 16, 18, 21],
  },
  {
    n: "02", title: "Rack Motion",
    desc: "Motion-triggered intrusion detection for the server rack. Someone gets close, the rack locks down.",
    long: "Camera + motion detection watching the rack: a person entering the room is detected and tracked, and if they close within range of the rack it triggers an alert and locks down access. Built to answer a simple question — who touched my servers — with logs to prove it.",
    tags: ["Python", "OpenCV", "Security", "Homelab"],
    year: "2025", status: "active", type: "Homelab / Security",
    link: "https://github.com/imranhwafa",
    metrics: { loc: 2100, commits: 96, stars: 0, files: 28, deps: 8 },
    trend: [1, 2, 4, 5, 7, 8, 10, 11, 12, 13],
  },
  {
    n: "03", title: "Compute Cluster",
    desc: "Kubernetes across compute blades, linked into one machine that does what I need.",
    long: "Multiple compute blades joined into a single Kubernetes cluster — one pool of CPU, memory, and storage instead of a pile of separate boxes. The whole thing is infrastructure-as-code: Terraform provisions it, the manifests are declarative, and a rebuild from bare metal is a command, not a weekend.",
    tags: ["Kubernetes", "Terraform", "Linux", "Homelab"],
    year: "2025", status: "running", type: "Homelab / Compute",
    link: "https://github.com/imranhwafa",
    metrics: { loc: 2800, commits: 132, stars: 0, files: 46, deps: 4 },
    trend: [1, 3, 5, 7, 9, 10, 11, 12, 13, 14],
  },
  {
    n: "04", title: "NAS",
    desc: "A TrueNAS build that holds everything and has yet to lose a byte.",
    long: "TrueNAS on a ZFS pool: snapshots, scheduled scrubs, and replication so the backups have backups. Serves media, file shares, and storage for the homelab. Quiet, boring, and exactly how storage should be.",
    tags: ["TrueNAS", "ZFS", "Storage", "Homelab"],
    year: "2024", status: "running", type: "Homelab / Storage",
    link: "https://github.com/imranhwafa",
    metrics: { loc: 1200, commits: 88, stars: 0, files: 22, deps: 0 },
    trend: [1, 2, 3, 4, 5, 6, 7, 8, 8, 9],
  },
  {
    n: "05", title: "Home Network",
    desc: "VLANs, a real firewall, and monitoring so I actually know when something is wrong.",
    long: "Segmented home network: VLANs for trust boundaries, a proper firewall, DNS-level filtering, and monitoring with alerting. The lab I actually run my own runbooks against, which is how the work ones got good.",
    tags: ["Networking", "pfSense", "VLAN", "Homelab"],
    year: "2024", status: "running", type: "Homelab / Network",
    link: "https://github.com/imranhwafa",
    metrics: { loc: 800, commits: 64, stars: 0, files: 14, deps: 0 },
    trend: [1, 2, 3, 4, 4, 5, 6, 6, 7, 7],
  },
  {
    n: "06", title: "FloUwer",
    desc: "A browser that watches what you do and replays it. Has AI in it. Got out of hand fast.",
    long: "Built on Electron. Records your workflows, replays them with AI in the loop, works with a few different LLM backends. Started as a weekend project and kind of took over.",
    tags: ["Electron", "React", "TypeScript", "AI"],
    year: "2024", status: "shipped", type: "Desktop / AI",
    link: "https://github.com/imranhwafa",
    metrics: { loc: 12400, commits: 284, stars: 47, files: 96, deps: 38 },
    trend: [4, 6, 8, 10, 14, 22, 31, 38, 44, 47],
  },
  {
    n: "07", title: "miLoader",
    desc: "A little daemon that watches your Mac's resources and tries to keep things from going sideways.",
    long: "Runs in the background, monitors memory and CPU in real time, and uses ML to guess when things are about to spike. Throttles runaway processes before they ruin your day. Wrote it because my laptop kept dying mid-compile.",
    tags: ["C++", "AI", "macOS"],
    year: "2024", status: "active", type: "System / ML",
    link: "https://github.com/imranhwafa",
    metrics: { loc: 6800, commits: 162, stars: 21, files: 41, deps: 6 },
    trend: [2, 3, 5, 7, 9, 12, 14, 17, 19, 21],
  },
  {
    n: "08", title: "JabBit",
    desc: "Chrome extension that handles repetitive browser tasks so I don't have to.",
    long: "Auto-fills forms and runs multi-step workflows in the browser. Saved me a lot of clicking. Still use it.",
    tags: ["Python", "Automation", "AI"],
    year: "2023", status: "shipped", type: "Extension",
    link: "https://github.com/imranhwafa",
    metrics: { loc: 3200, commits: 94, stars: 12, files: 22, deps: 11 },
    trend: [1, 2, 4, 5, 6, 8, 9, 10, 11, 12],
  },
  {
    n: "09", title: "imranwafa.com",
    desc: "The site you're on right now. A type-specimen sheet that happens to be a person.",
    long: "React and TypeScript with a hand-rolled motion engine — no animation library on this page. Command palette, a blueprint loupe, and more easter eggs than strictly necessary.",
    tags: ["React", "TypeScript", "Vite"],
    year: "2025", status: "live", type: "Web",
    link: "https://imranwafa.com",
    metrics: { loc: 4900, commits: 138, stars: 9, files: 64, deps: 29 },
    trend: [0, 1, 2, 3, 5, 6, 7, 8, 9, 9],
  },
  {
    n: "10", title: "Component Library",
    desc: "React components I got tired of rebuilding from scratch.",
    long: "Radix UI plus Framer Motion. Accessible by default, animated because why not. Mostly an excuse to build components I actually like using.",
    tags: ["React", "Radix", "Storybook"],
    year: "2024", status: "active", type: "Library",
    link: "https://github.com/imranhwafa",
    metrics: { loc: 5100, commits: 76, stars: 18, files: 52, deps: 22 },
    trend: [3, 5, 6, 9, 11, 13, 15, 16, 17, 18],
  },
  {
    n: "11", title: "CLI Toolkit",
    desc: "CLI tools to stop doing the same setup steps by hand every time.",
    long: "Scaffolding, code generation, the boring stuff. Used daily.",
    tags: ["Node.js", "CLI", "TypeScript"],
    year: "2023", status: "active", type: "Tools",
    link: "https://github.com/imranhwafa",
    metrics: { loc: 2400, commits: 58, stars: 7, files: 18, deps: 9 },
    trend: [1, 2, 3, 4, 5, 5, 6, 6, 7, 7],
  },
];

// Aggregate analytics
export const TOTALS = PROJECTS.reduce(
  (a, p) => ({
    loc: a.loc + p.metrics.loc,
    commits: a.commits + p.metrics.commits,
    stars: a.stars + p.metrics.stars,
    files: a.files + p.metrics.files,
  }),
  { loc: 0, commits: 0, stars: 0, files: 0 },
);

export interface DonutSlice { label: string; value: number; color: string }
export const LANG_DIST: DonutSlice[] = [
  { label: "TypeScript", value: 38, color: "oklch(0.62 0.18 250)" },
  { label: "Python", value: 24, color: "var(--accent)" },
  { label: "C++", value: 14, color: "oklch(0.62 0.16 25)" },
  { label: "JavaScript", value: 12, color: "oklch(0.72 0.16 95)" },
  { label: "Other", value: 12, color: "var(--ink-3)" },
];

// Mirrors the hero dossier ("Stack: Linux · SQL · Python") — ops first.
export const STACK_USAGE = [
  { label: "Linux", value: 92 },
  { label: "SQL", value: 84 },
  { label: "Python", value: 72 },
  { label: "React / TS", value: 61 },
  { label: "Docker", value: 55 },
  { label: "Power BI", value: 46 },
];

export interface ChartSeries { label: string; color: string; data: { x: number; y: number }[] }
export const SHIP_TREND: ChartSeries[] = [
  {
    label: "Shipped", color: "var(--accent)", data: [
      { x: 2020, y: 1 }, { x: 2021, y: 3 }, { x: 2022, y: 5 },
      { x: 2023, y: 8 }, { x: 2024, y: 12 }, { x: 2025, y: 6 },
    ],
  },
  {
    label: "Started", color: "var(--ink-3)", data: [
      { x: 2020, y: 2 }, { x: 2021, y: 4 }, { x: 2022, y: 7 },
      { x: 2023, y: 11 }, { x: 2024, y: 14 }, { x: 2025, y: 9 },
    ],
  },
];

export interface TagWeight { name: string; weight: number }
// Every name here must match at least one Project.tags entry
// (case-insensitive) — the cloud filters the index table, and a tag
// with no matches dead-ends into an empty table.
export const TAG_WEIGHTS: TagWeight[] = [
  { name: "React", weight: 5 },
  { name: "TypeScript", weight: 5 },
  { name: "Python", weight: 4 },
  { name: "AI", weight: 4 },
  { name: "Homelab", weight: 4 },
  { name: "Linux", weight: 3 },
  { name: "automation", weight: 3 },
  { name: "Networking", weight: 3 },
  { name: "Kubernetes", weight: 3 },
  { name: "Terraform", weight: 3 },
  { name: "Security", weight: 2 },
  { name: "C++", weight: 2 },
  { name: "Electron", weight: 2 },
  { name: "Proxmox", weight: 2 },
  { name: "ZFS", weight: 2 },
  { name: "Node.js", weight: 2 },
  { name: "Storage", weight: 1 },
  { name: "CLI", weight: 1 },
  { name: "pfSense", weight: 1 },
];

export const SKILLS = [
  { label: "Operations", items: "NOC monitoring, incident response, SLA & uptime, on-call, Jira, runbooks" },
  { label: "Systems & Networking", items: "Linux, TCP/IP, DNS, DHCP, switches & routers, monitoring & alerting" },
  { label: "Data Center & Hardware", items: "Rack & stack, component diagnostics, cabling, RMA & lifecycle" },
  { label: "Data & Reporting", items: "SQL, Python, Power BI, ETL/ELT, AWS, Snowflake, KPI dashboards" },
  { label: "Languages", items: "English, Spanish, Farsi, Tajiki, Dari, Pashto, Russian, Arabic" },
];

// Resume entries — Education / Certs / Experience share one shape and
// render through the same timeline-row component (see ResumeSection).
export interface ResumeEntry { period: string; title: string; sub: string; desc: string; upcoming?: boolean }

export const EDUCATION: ResumeEntry[] = [
  { period: "In progress", title: "B.S. Data Analytics", sub: "Undergraduate", desc: "Still going: the analytics track, where the statistics actually point at something useful." },
];

export const CERTS: ResumeEntry[] = [
  { period: "Upcoming", title: "CCNA", sub: "Cisco · studying", desc: "Routing and switching for real: the cert that formalizes the network side of the NOC work.", upcoming: true },
  { period: "Upcoming", title: "Network+", sub: "CompTIA · studying", desc: "Vendor-neutral networking, protocols, topologies, and troubleshooting, on paper this time.", upcoming: true },
  { period: "Google", title: "IT Support / Data Analytics", sub: "Certificate", desc: "The genuinely useful track: SQL, dashboards, support fundamentals, and how to read data without fooling yourself." },
  { period: "CompTIA", title: "Core IT & Hardware", sub: "Certificate", desc: "Foundational IT and component-level fundamentals, the stuff that earns its keep on a data-center floor." },
  { period: "AI Academy", title: "AI & Machine Learning", sub: "Certificate", desc: "ML foundations: how models train, where they help, and where they quietly don't." },
  { period: "Goldman Sachs", title: "Data", sub: "Certificate", desc: "Markets-grade data work, treating big, messy datasets like the decisions ride on them." },
  { period: "JPMorgan", title: "Software Engineering", sub: "Certificate", desc: "Job-sim engineering: shipping against real specs, constraints, and reviews." },
];

export const EXPERIENCE: ResumeEntry[] = [
  { period: "2024-2025", title: "Network / Database Ops", sub: "Petromax LLC · Washington, DC", desc: "Ran network and database infrastructure across multiple facilities in a 24/7 NOC: ~99.9% uptime, hands-on hardware and DB work, and incident response inside SLA. Built the monitoring and alerting that cut mean-time-to-detect ~30%, plus the dashboards and runbooks the rest of the shift leaned on." },
  { period: "2021-2024", title: "Data Analyst", sub: "Instawire LLC · McLean, VA", desc: "Federal anti-money-laundering work: combed $2B+ in daily transactions for anomalies, duplicates, and suspicious patterns. Power BI dashboards for triage and clustering logic that bumped duplicate-detection accuracy ~23%, plus data-quality builds across credit and behavioral datasets." },
  { period: "2020-2021", title: "Data Specialist", sub: "Mgtwell LLC · Alexandria, VA", desc: "Processed large-scale datasets and built the ETL plus automated cleansing and dedup that kept reporting honest. Learned exactly what bad data looks like up close, and how to fix it at the source." },
];

export const CONTACTS = [
  { num: "01", name: "GitHub", desc: "where the actual code lives", href: "https://github.com/imranhwafa" },
  { num: "02", name: "LinkedIn", desc: "the formal version of me", href: "https://www.linkedin.com/in/imran-w-9741082a3" },
  { num: "03", name: "Email", desc: "hit me up, I check it", href: "mailto:contact@imranwafa.com" },
  { num: "04", name: "Phone", desc: "+1 (703) 364-9357", href: "tel:+17033649357" },
];

// ── Capability profile (radar) — 0..1 per axis ──────────────
export interface RadarAxis { axis: string; value: number }
export const RADAR_SKILLS: RadarAxis[] = [
  { axis: "Operations", value: 0.90 },
  { axis: "Data / BI", value: 0.86 },
  { axis: "Networking", value: 0.80 },
  { axis: "Automation", value: 0.78 },
  { axis: "Hardware", value: 0.70 },
  { axis: "Cloud", value: 0.64 },
];

// ── Annual targets (radial gauges) ──────────────────────────
export interface Gauge { label: string; value: number; unit: string; digits?: number }
export const GAUGES: Gauge[] = [
  { label: "Uptime", value: 99.9, unit: "%", digits: 1 },
  { label: "SLA met", value: 98, unit: "%" },
  { label: "MTTD cut", value: 30, unit: "%" },
  { label: "Auto-resolved", value: 64, unit: "%" },
];

// ── Time allocation (waffle, sums to 100) ───────────────────
export interface WaffleSlice { label: string; value: number; color: string }
export const TIME_ALLOC: WaffleSlice[] = [
  { label: "Monitoring / ops", value: 40, color: "var(--accent)" },
  { label: "Data & reporting", value: 28, color: "oklch(0.72 0.16 95)" },
  { label: "Automation", value: 20, color: "oklch(0.62 0.18 250)" },
  { label: "Docs & handoff", value: 12, color: "oklch(0.62 0.16 25)" },
];
