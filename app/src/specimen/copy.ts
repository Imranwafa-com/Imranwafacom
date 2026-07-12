// ════════════════════════════════════════════════════════════
// COPY — every user-facing string on the Specimen Sheet, in one
// place. Edit wording here without touching component logic.
//
//   • Plain strings render as-is.
//   • `Seg[]` arrays drive the typewriter / split-italic bits; set
//     `it: true` on a segment to italicise it, `br: true` for a
//     line break (see TypeOnView / renderSegs).
//   • `*Taps` arrays are the rotating quips fired when you tap an
//     otherwise-inert element (see microtaps.tsx).
//
// Structured records (projects, timeline, skills, contacts) live in
// data.ts; feature/easter-egg strings live in site-config.ts.
// ════════════════════════════════════════════════════════════
import type { Seg } from "./motion";

export interface MetaBlock { k: string; v: string; copy?: string; taps?: string[] }
export interface DossierRow { k: string; v: string; copy?: string; taps?: string[]; scrollTo?: string }
export interface KpiStat { label: string; value: string | number; unit: string }
export interface PanelText { title: Seg[]; meta: string }

export const COPY = {
  // ── Startup loader ────────────────────────────────────────
  startup: {
    topLeft: "IMRAN WAFA",
    topRight: "SPECIMEN SHEET · v3",
    wordPre: "I build ",
    wordEm: "things.",
    loading: "LOADING ASSETS",
  },

  // ── Masthead ──────────────────────────────────────────────
  masthead: {
    volume: "Vol. 03 / Iss. 01",
    volumeTaps: ["Vol. 03: the good one.", "every issue is the first issue.", "no back-issues. sorry."],
    location: "Washington · 38.9° N",
    locationTaps: ["38.9072° N, 77.0369° W. roughly.", "the DMV. it's probably humid.", "say hi if you're nearby."],
    greetings: {
      late: ["up late?", "burning the midnight oil?", "the site will be here tomorrow."],
      morning: ["good morning", "morning, you", "coffee first?"],
      afternoon: ["good afternoon", "afternoon, friend", "how's the day?"],
      evening: ["good evening", "evening, you", "winding down?"],
    },
    greetTitle: "(tap to re-greet)",
    center: "A SPECIMEN SHEET · IMRAN WAFA",
    centerTaps: ["a type-specimen sheet, but it's a person.", "press / anywhere for the command palette.", "yes, almost everything here is tappable."],
    liveLabel: "Live",
    liveTaps: ["live & deployed. hi from production.", "deployed on every push."],
    time12Msg: "12-hour time",
    time24Msg: "24-hour time",
    timeTitle: "(tap: 12/24h)",
    dateTitle: "(tap to copy)",
    theme: {
      title: "flip the lights",
      toDark: "lights off.",
      toLight: "lights on.",
      commitment: "flicking the lightswitch.",
      labelDark: "dark",
      labelLight: "light",
    },
  },

  // ── Hero ──────────────────────────────────────────────────
  hero: {
    metaLeft: [
      { k: "SUBJECT", v: "Imran H. Wafa", copy: "Imran H. Wafa" },
      { k: "DISCIPLINE", v: "Operations · Data · Systems", taps: ["operations · data · systems: keeping things up and making sense of them.", "i wear all three hats. badly photographed."] },
      { k: "EST.", v: "2020", taps: ["active since 2020.", "five years of keeping things up."] },
    ] as MetaBlock[],
    metaRight: [
      { k: "FOLIO N°", v: "001 / 008", taps: ["folio one of eight. keep scrolling.", "you are here. roughly."] },
      { k: "EDITION", v: "v0.0.1 · 2026", taps: ["v0.0.1: still very much zero-point-zero.", "published 2026."] },
      { k: "FORMAT", v: "Specimen sheet", taps: ["a type-specimen, but for a person.", "format: printed-page energy, on the web."] },
    ] as MetaBlock[],
    wordmark: [{ text: "I build" }, { br: true }, { text: "things.", className: "it" }] as Seg[],
    wordmarkSub: "and I keep them running",
    tagline: [
      { text: "Operations & data. I keep network and database systems up in 24/7 environments, then turn the mess into dashboards people can act on, and I sweat the details: " },
      { text: "uptime, signals, all of it.", className: "tag-em" },
    ] as Seg[],
    dossierLeft: [
      { k: "Currently", v: "Data Analytics, B.S.", taps: ["finishing the degree. slowly but surely.", "the analytics track, the useful one."] },
      { k: "Stack", v: "Linux · SQL · Python", copy: "Linux · SQL · Python" },
      { k: "Lately", v: "uptime · automation · data", taps: ["monitoring, automation, and sweating the details.", "reliability is just caring out loud."] },
      { k: "Homelab", v: "mail · NAS · AI rig", taps: ["self-hosted: a box for SMTP + a couple of APIs, a NAS for storage, and a dedicated AI rig.", "yes, I run my own mail server. on purpose."] },
    ] as DossierRow[],
    dossierRight: [
      { k: "Status", v: "Open to work", taps: ["open to work, let's talk.", "the paper version lives at /resume."], scrollTo: "contact" },
      { k: "Replies", v: "Within 48h", taps: ["usually faster than 48h.", "weekends included."] },
    ] as DossierRow[],
    coffee: {
      k: "Coffee",
      v: "Black, no sugar",
      title: "(tap for a refill)",
      // {n} is replaced with the current count
      first: "☕ one for you.",
      few: "☕ ×{n}, refilled.",
      many: "☕ ×{n}. easy, tiger.",
      problem: "☕ ×{n}. limit reached.",
    },
    kpis: [
      { label: "Uptime sustained", value: "99.9", unit: "%" },
      { label: "MTTD cut", value: "30", unit: "%" },
      { label: "Daily volume", value: "$2B+", unit: "/day" },
      { label: "Dedup accuracy lift", value: "23", unit: "%" },
      { label: "Years in ops / data", value: "5", unit: "yrs" },
    ] as KpiStat[],
  },

  // ── Scroller (marquee strip) ──────────────────────────────
  scroller: [
    "Now shipping: miLoader v0.4",
    "Reading: The Pragmatic Engineer",
    "Listening: lo-fi & jazz",
    "Currently learning: Rust",
    "Open to collaborations",
    "Based in Washington, DC",
    "contact@imranwafa.com",
  ],

  // ── Section headers (resume order, top to bottom) ─────────
  sections: {
    about: { num: "§ 01 / DOSSIER", hint: "(the short read)", title: [{ text: "A quick " }, { text: "introduction.", className: "it" }] as Seg[], meta: "SUBJECT FILE" },
    education: { num: "§ 02 / EDUCATION", hint: "(still enrolled, still curious)", title: [{ text: "Where I " }, { text: "studied.", className: "it" }] as Seg[], meta: "ACADEMIC" },
    certs: { num: "§ 03 / CERTS", hint: "(some useful, some framed)", title: [{ text: "Paper " }, { text: "trail.", className: "it" }] as Seg[], meta: "CREDENTIALS" },
    work: { num: "§ 04 / PERSONAL", hint: "(selected works)", title: [{ text: "Personal " }, { text: "projects.", className: "it" }] as Seg[] },
    experience: { num: "§ 05 / EXPERIENCE", hint: "(where the rent came from)", title: [{ text: "Where I've " }, { text: "worked.", className: "it" }] as Seg[], meta: "WORK HISTORY" },
    workprojects: { num: "§ 06 / WORK", hint: "(shipped on someone's dime)", title: [{ text: "On the " }, { text: "clock.", className: "it" }] as Seg[], meta: "AVAILABLE ON REQUEST" },
    dash: { num: "§ 07 / METRICS", hint: "(numbers don't lie. mostly.)", title: [{ text: "By the " }, { text: "numbers.", className: "it" }] as Seg[], meta: "DATA · 2020-2025" },
    contact: { num: "§ 08 / CORRESPOND", hint: "(inbox open)", title: [{ text: "Drop a " }, { text: "line.", className: "it" }] as Seg[], meta: "04 CHANNELS · <48H REPLY" },
  },

  // ── Dashboard panels ──────────────────────────────────────
  dash: {
    cadence: { title: [{ text: "Shipping " }, { text: "cadence", className: "it" }] as Seg[], meta: "PROJECTS / YEAR", footShipped: "● shipped", footStarted: "○ started" },
    languages: { title: [{ text: "Languages", className: "it" }, { text: " by share" }] as Seg[], meta: "% OF LoC", foot: "ACROSS PROJECT REPOS" },
    stack: { title: [{ text: "Stack " }, { text: "usage", className: "it" }] as Seg[], meta: "% OF PROJECTS" },
    activity: { title: [{ text: "Activity", className: "it" }, { text: " · 26 wks" }] as Seg[], meta: "COMMITS", less: "less", more: "more" },
    topics: { title: [{ text: "Topic " }, { text: "cloud", className: "it" }] as Seg[], meta: "WEIGHTED", footIdle: "CLICK A TAG TO FILTER THE PROJECTS ABOVE", footActivePrefix: "filtering projects by ", footActiveSuffix: " · click again to clear" },
    subhead: "§ 07.5 · DEEPER CUTS",
    landscape: { title: [{ text: "Project " }, { text: "landscape", className: "it" }] as Seg[], meta: "LoC × FILES × COMMITS", foot: "BUBBLE SIZE = COMMIT VOLUME · HOVER FOR DETAIL" },
    capability: { title: [{ text: "Capability " }, { text: "profile", className: "it" }] as Seg[], meta: "SELF-ASSESSED", foot: "SIX AXES · NORMALISED 0-100" },
    timeAlloc: { title: [{ text: "Time " }, { text: "allocation", className: "it" }] as Seg[], meta: "TYPICAL WEEK", foot: "EACH CELL = 1% OF FOCUSED HOURS" },
    targets: { title: [{ text: "Annual " }, { text: "targets", className: "it" }] as Seg[], meta: "YTD · 2026", foot: "FOUR METRICS · SELF-SET" },
  },

  // ── Work / projects ───────────────────────────────────────
  work: {
    metaTemplate: "{shown} OF {total} ENTRIES · {commits} COMMITS",
    summary: [
      { text: "{count} projects, " },
      { text: "{loc}k lines", className: "tag-em" },
      { text: ", " },
      { text: "{commits} commits", className: "tag-em" },
      { text: ". Click a row to expand, a column header to sort, a tag in the cloud above to filter." },
    ] as Seg[],
    filteringPrefix: "filtering by ",
    clearLabel: "clear ×",
    barsLabel: "Commits · click to focus",
    headers: { num: "N°", title: "Title", desc: "Description", loc: "LoC", commits: "Commits", files: "Trend · Files" },
    emptyPrefix: "No projects match \"",
    emptySuffix: "\". ",
    emptyClear: "clear filter",
    detail: { year: "Year", type: "Type", status: "Status", stack: "Stack", loc: "LoC", commits: "Commits", files: "Files", link: "View source ↗" },
  },

  // ── Featured project showcase (pinned 3D scenes, top 3) ───
  showcase: {
    hint: "SCROLL — THE SCENE ADVANCES",
    projects: [
      {
        kicker: "FEATURED 01 · HOMELAB / INFRA",
        title: "The home lab.",
        specs: [
          ["Hypervisor", "Proxmox VE"],
          ["Memory", "1.5 TB RAM"],
          ["GPU", "4× NVIDIA V100 · local LLMs"],
          ["Provisioning", "Terraform + Ansible"],
          ["Security", "VLANs · hardened access"],
        ] as [string, string][],
        phases: [
          { h: "The rack.", body: "Proxmox VE on a full rack: 1.5 TB of RAM, four NVIDIA V100s, and every VM and container the lab runs. This is where anything I build gets tested before it touches something that matters." },
          { h: "One node, on rails.", body: "Slide a node out and everything is serviceable: compute, storage, and the GPU box that handles local LLM inference. Hardware problems get fixed at the rack, not debugged in software." },
          { h: "Provisioned as code.", body: "Inside: four V100s for LLM work, ZFS-backed storage, segmented VLANs. All of it declared in Terraform and Ansible — the whole lab rebuilds from a repo, not from memory." },
        ],
      },
      {
        kicker: "FEATURED 02 · HOMELAB / SECURITY",
        title: "Rack Motion.",
        specs: [
          ["Detection", "Camera + motion tracking"],
          ["Stack", "Python · OpenCV"],
          ["Trigger", "~10 ft from the rack"],
          ["Response", "Lockdown + alert + log"],
        ] as [string, string][],
        phases: [
          { h: "Someone walks in.", body: "A camera watches the room. Motion detection picks up a person the moment they enter and starts tracking their path — every entry becomes an event with a timestamp." },
          { h: "Tracked and flagged.", body: "The figure is followed frame to frame and flagged red. The system doesn't care who you say you are — only what the camera sees near the lab." },
          { h: "Ten feet out, it locks.", body: "Close within range of the rack and it locks down: access shut, alert fired, footage kept. It answers one question — who touched my servers — with logs to prove it." },
        ],
      },
      {
        kicker: "FEATURED 03 · HOMELAB / COMPUTE",
        title: "Compute cluster.",
        specs: [
          ["Orchestration", "Kubernetes"],
          ["Hardware", "Compute blades · one pool"],
          ["IaC", "Terraform + declarative manifests"],
          ["Rebuild", "Bare metal → one command"],
        ] as [string, string][],
        phases: [
          { h: "A pile of blades.", body: "Separate compute blades, each too small to matter on its own. Individually they're spare parts — the point was never the hardware." },
          { h: "One machine.", body: "Kubernetes joins them into a single cluster: one pool of CPU, memory, and storage that schedules whatever I throw at it." },
          { h: "Rebuildable from zero.", body: "Terraform provisions it and the manifests declare it. A rebuild from bare metal is a command, not a weekend — that's the infrastructure-as-code part." },
        ],
      },
    ],
  },

  // ── Work projects (NDA'd — shown as a redacted manifest) ──
  workProjects: {
    title: [{ text: "Client & " }, { text: "team work.", className: "it" }] as Seg[],
    body: "Most of my professional work lives behind NDAs and locked-down systems: NOC monitoring, dashboards, internal tooling, and data pipelines built on the clock. Case studies are available on request.",
    note: "Under NDA",
    cta: "Request the details ↗",
    ctaHref: "mailto:contact@imranwafa.com?subject=Work%20projects",
    manifestLabel: "Manifest · partial",
    manifest: [
      { k: "Monitoring & alerting", v: "██████ · in prod", taps: ["the good kind of pager silence.", "it pages before the users notice."] },
      { k: "KPI dashboards", v: "████ · Power BI", taps: ["the wall of charts the shift actually reads."] },
      { k: "Data pipelines", v: "█████ · nightly", taps: ["ETL that survives bad inputs. mostly."] },
      { k: "Runbooks & tooling", v: "███ · internal", taps: ["written so 3am-me can follow them."] },
    ],
    manifestFoot: "details redacted · available on request",
  },

  // ── About / dossier ───────────────────────────────────────
  about: {
    bio1: [
      { text: "My background splits between keeping the lights on in a NOC and querying the resulting data to figure out why they flickered. I care about infrastructure that " },
      { text: "actually stays up", className: "tag-em" },
      { text: ", not just works on a good day. There's a difference and most setups skip it." },
    ] as Seg[],
    bio2: [
      { text: "When I'm not watching a NOC queue or a wall of dashboards, I'm probably tearing down an engine, or scripting away a chore that took less time by hand. Worth it though. I also run a homelab: a server for my own mail and a couple of APIs, a NAS for storage, and an AI rig for local models." },
    ] as Seg[],
    stats: [
      { label: "Years in the field", value: "5", unit: "active" },
      { label: "Certifications", value: "5", unit: "earned" },
      { label: "Projects", value: "", unit: "public" }, // value filled from data
      { label: "Coffee / day", value: "3.2", unit: "cups" },
    ] as KpiStat[],
    skillCopyTitle: "(tap to copy)",
  },

  // ── Contact ───────────────────────────────────────────────
  contact: {
    display: [{ text: "Send me" }, { br: true }, { text: "something " }, { text: "interesting.", className: "it" }] as Seg[],
    sub: "Open to work · collaborations · long emails about typography",
    numPrefix: "N° ",
  },

  // ── Colophon ──────────────────────────────────────────────
  colophon: {
    name: { v: "Imran Wafa", taps: ["that's me. hi.", "you've reached the bottom. respect."] },
    email: { v: "contact@imranwafa.com", copy: "contact@imranwafa.com", title: "(tap to copy)" },
    github: { v: "github.com/imranhwafa", copy: "github.com/imranhwafa", title: "(tap to copy)" },
    colophonTitle: { v: "Colophon", taps: ["the fine print, lovingly set.", "every site deserves a colophon."] },
    font1: { v: "Set in Space Grotesk", taps: ["Space Grotesk: for the big, confident bits.", "yes, the type is part of the point."] },
    font2: { v: "& JetBrains Mono", taps: ["JetBrains Mono: for the numbers & code.", "monospace makes data feel honest."] },
    copyright: { v: "© 2026", taps: ["© and all that.", "no rights reserved against curiosity."] },
    visitFirst: ["first time? welcome aboard."],
    visitReturn: ["visit N° {n}. you keep coming back.", "the counter lives in your browser, just so you know."],
    visitPrefix: "Your visit N° ",
    updatedPrefix: "Last updated ",
  },

  // ── Quirks / personality layer ────────────────────────────
  quirks: {
    tabAway: ["← still here.", "← paused.", "← tab idle."],
    selection: [
      "quote freely.",
      "yes, you can quote me on that.",
      "good pull.",
    ],
    overdriveOn: "overdrive engaged",
    overdriveOff: "overdrive disengaged",
    overdriveBadge: "OVERDRIVE",
    clickCounter: {
      3: "you noticed it's clickable. nice.",
      5: "still clicking? respect.",
      8: "this isn't going to do anything dramatic.",
      12: "okay you're committed now.",
      20: "twenty clicks. noted with respect.",
    } as Record<number, string>,
  },

  // ── Data-viz tap reactions ({…} filled from the datum) ────
  viz: {
    donut: "{label}: {value}% of the code.",
    gauge: "{label}: {value}{unit}. on track.",
    waffle: "{label}: a real slice of the week.",
    heatmap: "{date}: {commits} commits that day.",
    heatmapEmpty: "{date}: a rare day off.",
    radar: "{axis}: {value}/100, self-assessed.",
    bubble: "{label}: {loc}k LoC · {files} files · {commits} commits.",
    stat: "{label}: {value}{unit}",
    line: "{label}: {value} that year.",
  },

  // ── Idle screensaver — escalates the longer you sit still ──
  idle: {
    driftHint: "idle. the dots carry on…",
    deepTitle: "you've gone quiet.",
    deepLines: [
      "so the page kept itself busy.",
      "the dots are pacing without you.",
      "move anything and it all snaps back.",
    ],
    wakeHint: "move to wake",
  },
};
