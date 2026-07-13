// ============================================================
// IMRAN WAFA — SPECIMEN SHEET
// Single-page editorial/engineering-monograph portfolio.
// Composition ported from the Claude Design handoff (app.jsx).
// ============================================================
import { Fragment, Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import {
  Parallax, Reveal, Stagger, TypeOnView, ScrollProgress, ZoomScroll, StartupIntro,
  useReveal, useTween, initLenis,
} from "./motion";
import type { Seg } from "./motion";
import { Sparkline, BarRow, Donut, Heatmap, Stat, LineChart, TagCloud, RadarChart, BubbleChart, RadialGauge, WaffleChart } from "./charts";
import {
  MouseAurora, useSectionTracker, ScrollToasts, ClickCounter,
  CommandPalette, TldrModal, SourceEgg, DebugHUD, consoleEgg,
} from "./features";
import { IdleSequence } from "./idle";
import { InteractiveBG } from "./bg";
import { CornerMarks, Magnetic, ScrambleText, AccentSpotlight } from "./interactions";
import { Loupe, LoupeToggle } from "./loupe";
import { REDUCED } from "./motion";
import { Quirks } from "./quirks";
import { currentVerb, SWITCH_EVENT } from "./switch-verb";
import { currentTheme, toggleTheme, THEME_EVENT, type ThemeName } from "./theme";
import { QuirksExtra } from "./quirks-extra";
import { Tap, MicroToast, emitTap } from "./microtaps";
import { tpl } from "./utils";
import { fireRipple } from "./runtime";
import { SHOWCASE_HEIGHT_VH } from "./showcase/choreography";
import { COPY, type MetaBlock as MetaBlockT, type DossierRow as DossierRowT } from "./copy";
import {
  PROJECTS, TOTALS, LANG_DIST, STACK_USAGE, SHIP_TREND, TAG_WEIGHTS, SKILLS, CONTACTS,
  EDUCATION, CERTS, EXPERIENCE, RADAR_SKILLS, GAUGES, TIME_ALLOC, type Project, type ResumeEntry,
} from "./data";

// ── Copy helpers ────────────────────────────────────────────
// Render a Seg[] as inline spans (for non-typewriter split-italic titles).
function Segs({ segs }: { segs: Seg[] }) {
  return <>{segs.map((s, i) => (s.br ? <br key={i} /> : <span key={i} className={s.className}>{s.text}</span>))}</>;
}
// A column of tappable hero meta blocks, driven by config.
function MetaBlocks({ blocks, className, speed }: { blocks: MetaBlockT[]; className: string; speed: number }) {
  return (
    <Parallax as="div" className={className} speed={speed}>
      {blocks.map((b) => (
        <Tap as="div" key={b.k} className="meta-block" copy={b.copy} msg={b.taps}>
          <span className="k">{b.k}</span><span className="v">{b.v}</span>
        </Tap>
      ))}
    </Parallax>
  );
}
// A tappable dossier row (Currently / Stack / Status / …), driven by config.
function DossierRow({ row }: { row: DossierRowT }) {
  return (
    <Tap as="div" className="row" copy={row.copy} msg={row.taps}
      onTap={row.scrollTo ? () => { const el = document.getElementById(row.scrollTo!); if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: "smooth" }); } : undefined}>
      <span>{row.k}</span><span>{row.v}</span>
    </Tap>
  );
}
// ── Helpers ─────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
function fmtTime(d: Date, hour12 = false) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12 });
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "2-digit" }).toUpperCase();
}

// ── Crosshair cursor follower ───────────────────────────────
function Crosshair() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!ref.current) return;
      ref.current.style.left = e.clientX + "px";
      ref.current.style.top = e.clientY + "px";
      setOn(true);
    };
    const onLeave = () => setOn(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);
  return <div ref={ref} className={"crosshair" + (on ? " on" : "")} aria-hidden="true" />;
}

// ── Masthead ────────────────────────────────────────────────
interface RevealTrProps extends HTMLAttributes<HTMLTableRowElement> { delay?: number }
function RevealTr({ children, delay = 0, ...props }: RevealTrProps) {
  const [ref, shown] = useReveal<HTMLTableRowElement>(0.08);
  const t = useTween(shown, delay, 550);
  return <tr ref={ref} style={{ opacity: t }} {...props}>{children}</tr>;
}

interface SecHeadProps { num: string; segments: Seg[]; meta: string; hint?: string }
function SecHead({ num, segments, meta, hint }: SecHeadProps) {
  const [ref, shown] = useReveal(0.4);
  const [hov, setHov] = useState(false);
  return (
    <header
      className={"sec-head" + (shown ? " drawn" : "")}
      ref={ref as React.RefObject<HTMLElement>}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <Parallax as="div" speed={0.08}>
        <Reveal as="div" className="sec-num"><ScrambleText text={num} /></Reveal>
      </Parallax>
      <Parallax as="h2" className="sec-title" speed={-0.03}>
        <TypeOnView tag="span" segments={segments} speed={32} threshold={0.4} />
        {hint && <span className={"sec-hint" + (hov ? " on" : "")}>{hint}</span>}
      </Parallax>
      <Parallax as="div" speed={0.10}>
        <Reveal as="div" className="sec-meta" delay={120}>{meta}</Reveal>
      </Parallax>
    </header>
  );
}

// ── Theme toggle (masthead) — paper ⇄ carbon ────────────────
function ThemeToggle() {
  const [theme, setThemeState] = useState<ThemeName>(() => currentTheme());
  const flips = useRef(0);
  const T = COPY.masthead.theme;
  useEffect(() => {
    // Stay in sync when the palette (or anything else) switches the theme.
    const on = (e: Event) => setThemeState((e as CustomEvent<ThemeName>).detail);
    window.addEventListener(THEME_EVENT, on);
    return () => window.removeEventListener(THEME_EVENT, on);
  }, []);
  const onClick = () => {
    const next = toggleTheme();
    flips.current++;
    emitTap(flips.current >= 3 ? T.commitment : next === "carbon" ? T.toDark : T.toLight);
  };
  return (
    <button
      className="theme-toggle mono"
      onClick={onClick}
      title={T.title}
      aria-pressed={theme === "carbon"}
    >
      <span className="tt-dot" aria-hidden="true" />{theme === "carbon" ? T.labelLight : T.labelDark}
    </button>
  );
}

function Masthead() {
  const now = useClock();
  const [hour12, setHour12] = useState(false);
  const [extra, setExtra] = useState(0); // re-greet nudge
  const M = COPY.masthead;
  const hr = now.getHours();
  const greets = hr < 5 ? M.greetings.late : hr < 12 ? M.greetings.morning : hr < 18 ? M.greetings.afternoon : M.greetings.evening;
  const greet = greets[extra % greets.length];
  return (
    <div className="masthead shell">
      <div className="masthead-l">
        <Tap msg={M.volumeTaps}>{M.volume}</Tap>
        <Tap msg={M.locationTaps}>{M.location}</Tap>
        <Tap as="span" className="masthead-greet" ripple={false} onTap={() => setExtra((n) => n + 1)} title={M.greetTitle}>{greet}</Tap>
      </div>
      <Tap as="div" className="masthead-c" msg={M.centerTaps}>{M.center}</Tap>
      <div className="masthead-r">
        <Tap copy={fmtDate(now)} title={M.dateTitle}>{fmtDate(now)}</Tap>
        <Tap as="span" ripple={false} onTap={() => { setHour12((v) => !v); emitTap(hour12 ? M.time24Msg : M.time12Msg); }} title={M.timeTitle}>{fmtTime(now, hour12)}</Tap>
        <ThemeToggle />
        <LoupeToggle />
      </div>
    </div>
  );
}

// ── Hero wordmark — verb is swappable via /switch (see switch-verb.ts) ──
function HeroWordmark() {
  const [verb, setVerb] = useState(currentVerb());
  // After the first switch, re-type faster/snappier. `switched` is state (not a
  // ref) so it's safe to read during render.
  const [switched, setSwitched] = useState(false);
  useEffect(() => {
    const on = (e: Event) => {
      setSwitched(true);
      setVerb((e as CustomEvent<string>).detail);
    };
    window.addEventListener(SWITCH_EVENT, on);
    return () => window.removeEventListener(SWITCH_EVENT, on);
  }, []);
  const segs: Seg[] = [{ text: `I ${verb}` }, { br: true }, { text: "things.", className: "it" }];
  // key={verb} remounts TypeOnView so the new verb re-types on each switch.
  return (
    <TypeOnView
      key={verb}
      tag="span"
      speed={switched ? 40 : 70}
      startDelay={switched ? 50 : 350}
      threshold={0.1}
      keepCursor={false}
      segments={segs}
    />
  );
}

// ── Hero ────────────────────────────────────────────────────
function Hero() {
  const coffee = useRef(0);
  return (
    <section className="hero shell">
      <CornerMarks inset={12} />

      <div className="hero-grid">
        <MetaBlocks blocks={COPY.hero.metaLeft} className="hero-meta-l" speed={0.22} />

        <Parallax as="div" className="wordmark serif" speed={-0.06} role="heading" aria-level={1} aria-label="Imran Wafa — I build things, and I keep them running">
          <ClickCounter>
            <HeroWordmark />
          </ClickCounter>
          <Reveal as="span" delay={1400} className="small">{COPY.hero.wordmarkSub}</Reveal>
        </Parallax>

        <MetaBlocks blocks={COPY.hero.metaRight} className="hero-meta-r" speed={0.26} />
      </div>

      <div className="hero-foot">
        <Parallax as="div" speed={0.03}>
          <TypeOnView
            tag="p"
            className="tagline"
            speed={16}
            startDelay={1500}
            threshold={0.1}
            segments={COPY.hero.tagline}
          />
        </Parallax>
        <Parallax as="div" speed={0.03}>
          <Reveal className="dossier" delay={1800}>
            {COPY.hero.dossierLeft.map((r) => <DossierRow key={r.k} row={r} />)}
          </Reveal>
        </Parallax>
        <Parallax as="div" speed={0.03}>
          <Reveal className="dossier" delay={1950}>
            {COPY.hero.dossierRight.map((r) => <DossierRow key={r.k} row={r} />)}
            <Tap as="div" className="row" ripple={false} onTap={() => {
              coffee.current++;
              const n = coffee.current;
              const c = COPY.hero.coffee;
              emitTap(n === 1 ? c.first : n < 5 ? tpl(c.few, { n }) : n < 10 ? tpl(c.many, { n }) : tpl(c.problem, { n }));
            }} title={COPY.hero.coffee.title}><span>{COPY.hero.coffee.k}</span><span>{COPY.hero.coffee.v}</span></Tap>
          </Reveal>
        </Parallax>
      </div>

      <Parallax as="div" className="kpi-strip" speed={0.03}>
        <Stat label={COPY.hero.kpis[0].label} value={99.9} unit={COPY.hero.kpis[0].unit} digits={1} trend={[99.2, 99.5, 99.7, 99.8, 99.9, 99.9]} />
        <Stat label={COPY.hero.kpis[1].label} value={30} unit={COPY.hero.kpis[1].unit} trend={[8, 14, 20, 26, 30, 30]} />
        <Stat label={COPY.hero.kpis[2].label} value={COPY.hero.kpis[2].value} unit={COPY.hero.kpis[2].unit} trend={[1.0, 1.3, 1.6, 1.8, 1.9, 2.0]} />
        <Stat label={COPY.hero.kpis[3].label} value={23} unit={COPY.hero.kpis[3].unit} trend={[6, 10, 14, 18, 21, 23]} />
        <Stat label={COPY.hero.kpis[4].label} value={5} unit={COPY.hero.kpis[4].unit} trend={[1, 2, 3, 4, 5, 5]} />
      </Parallax>
    </section>
  );
}

// ── Scroller (marquee strip) ────────────────────────────────
function Scroller() {
  const items = COPY.scroller.flatMap((s) => [s, "★"]);
  const repeated = [...items, ...items, ...items, ...items];
  const shiftRef = useRef<HTMLDivElement | null>(null);

  // Scroll velocity nudges the marquee like a flywheel, then it
  // eases back to rest — so the strip feels physically connected
  // to the page rather than looping in isolation.
  useEffect(() => {
    if (REDUCED) return;
    const el = shiftRef.current;
    if (!el) return;
    let lastY = window.scrollY;
    let off = 0, vel = 0, raf = 0;
    const onScroll = () => {
      const y = window.scrollY;
      vel += (y - lastY) * 0.55;
      lastY = y;
    };
    const tick = () => {
      off += vel;
      vel *= 0.86;
      off *= 0.88;
      if (Math.abs(off) < 0.05) off = 0;
      el.style.transform = `translateX(${off.toFixed(1)}px)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="scroller">
      <div className="scroller-shift" ref={shiftRef}>
        <div className="scroller-track">
          {repeated.map((s, i) => (s === "★"
            ? <span key={i} className="dot tap" onClick={(e) => !REDUCED && fireRipple(e.clientX, e.clientY)}>●</span>
            : <span key={i}>{s}</span>))}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard — analytics overview ──────────────────────────
interface DashboardProps { tagFilter: string | null; onSelectTag: (t: string | null) => void }
function Dashboard({ tagFilter, onSelectTag }: DashboardProps) {
  const ref = useSectionTracker("dash");
  return (
    <section className="section shell" id="dash" ref={ref}>
      <CornerMarks />
      <ZoomScroll as="div" from={0.85}>
        <SecHead
          num={COPY.sections.dash.num}
          hint={COPY.sections.dash.hint}
          segments={COPY.sections.dash.title}
          meta={COPY.sections.dash.meta}
        />

        <div className="about-stats">
          <Stat label={COPY.about.stats[0].label} value={COPY.about.stats[0].value} unit={COPY.about.stats[0].unit} trend={[1, 2, 3, 4, 5, 5]} />
          <Stat label={COPY.about.stats[1].label} value={COPY.about.stats[1].value} unit={COPY.about.stats[1].unit} trend={[2, 3, 4, 5, 6, 7, 8]} delta={14} />
          <Stat label={COPY.about.stats[2].label} value={PROJECTS.length} unit={COPY.about.stats[2].unit} trend={[1, 2, 3, 4, 5, 6]} />
          <Stat label={COPY.about.stats[3].label} value={COPY.about.stats[3].value} unit={COPY.about.stats[3].unit} trend={[2, 2.5, 3, 3.5, 3.2, 3.2]} />
        </div>

        <div className="dash-grid">
          <Reveal as="div" className="panel" delay={0} calm>
            <div className="panel-head">
              <div className="panel-title"><Segs segs={COPY.dash.cadence.title} /></div>
              <div className="panel-meta">{COPY.dash.cadence.meta}</div>
            </div>
            <LineChart series={SHIP_TREND} w={640} h={220} yMax={16} />
            <div className="panel-foot">
              <span style={{ color: "var(--accent)" }}>{COPY.dash.cadence.footShipped}</span>
              &nbsp;&nbsp;
              <span>{COPY.dash.cadence.footStarted}</span>
            </div>
          </Reveal>

          <Reveal as="div" className="panel" delay={120} calm>
            <div className="panel-head">
              <div className="panel-title"><Segs segs={COPY.dash.languages.title} /></div>
              <div className="panel-meta">{COPY.dash.languages.meta}</div>
            </div>
            <Donut data={LANG_DIST} size={180} thickness={20} />
            <div className="panel-foot">{COPY.dash.languages.foot}</div>
          </Reveal>
        </div>

        <div className="dash-grid-3">
          <Reveal as="div" className="panel" delay={0} calm>
            <div className="panel-head">
              <div className="panel-title"><Segs segs={COPY.dash.stack.title} /></div>
              <div className="panel-meta">{COPY.dash.stack.meta}</div>
            </div>
            {STACK_USAGE.map((s) => (
              <BarRow key={s.label} label={s.label} value={s.value} max={100} suffix="%" />
            ))}
          </Reveal>

          <Reveal as="div" className="panel" delay={120} calm>
            <div className="panel-head">
              <div className="panel-title"><Segs segs={COPY.dash.activity.title} /></div>
              <div className="panel-meta">{COPY.dash.activity.meta}</div>
            </div>
            <Heatmap weeks={26} seed={91} />
            <div className="panel-foot heatmap-legend">
              <span>{COPY.dash.activity.less}</span>
              <span className="swatch" style={{ background: "var(--rule)" }} />
              <span className="swatch" style={{ background: "oklch(from var(--accent) l c h / 0.30)" }} />
              <span className="swatch" style={{ background: "oklch(from var(--accent) l c h / 0.55)" }} />
              <span className="swatch" style={{ background: "oklch(from var(--accent) l c h / 0.80)" }} />
              <span className="swatch" style={{ background: "var(--accent)" }} />
              <span>{COPY.dash.activity.more}</span>
            </div>
          </Reveal>

          <Reveal as="div" className="panel" delay={240} calm>
            <div className="panel-head">
              <div className="panel-title"><Segs segs={COPY.dash.topics.title} /></div>
              <div className="panel-meta">{COPY.dash.topics.meta}</div>
            </div>
            <TagCloud tags={TAG_WEIGHTS} selected={tagFilter} onSelect={onSelectTag} />
            <div className="panel-foot">
              {tagFilter ? <>{COPY.dash.topics.footActivePrefix}<strong style={{ color: "var(--accent)" }}>{tagFilter}</strong>{COPY.dash.topics.footActiveSuffix}</> : COPY.dash.topics.footIdle}
            </div>
          </Reveal>
        </div>

        <div className="dash-subhead">
          <span className="dash-subhead-line" />
          <span className="dash-subhead-label">{COPY.dash.subhead}</span>
          <span className="dash-subhead-line" />
        </div>

        <div className="dash-grid">
          <Reveal as="div" className="panel" delay={0} calm>
            <div className="panel-head">
              <div className="panel-title"><Segs segs={COPY.dash.landscape.title} /></div>
              <div className="panel-meta">{COPY.dash.landscape.meta}</div>
            </div>
            <BubbleChart data={PROJECTS.map((p) => ({ label: p.title, x: p.metrics.loc, y: p.metrics.files, r: p.metrics.commits }))} />
            <div className="panel-foot">{COPY.dash.landscape.foot}</div>
          </Reveal>

          <Reveal as="div" className="panel" delay={120} calm>
            <div className="panel-head">
              <div className="panel-title"><Segs segs={COPY.dash.capability.title} /></div>
              <div className="panel-meta">{COPY.dash.capability.meta}</div>
            </div>
            <RadarChart data={RADAR_SKILLS} />
            <div className="panel-foot">{COPY.dash.capability.foot}</div>
          </Reveal>
        </div>

        <div className="dash-grid">
          <Reveal as="div" className="panel" delay={0} calm>
            <div className="panel-head">
              <div className="panel-title"><Segs segs={COPY.dash.timeAlloc.title} /></div>
              <div className="panel-meta">{COPY.dash.timeAlloc.meta}</div>
            </div>
            <WaffleChart data={TIME_ALLOC} />
            <div className="panel-foot">{COPY.dash.timeAlloc.foot}</div>
          </Reveal>

          <Reveal as="div" className="panel" delay={120} calm>
            <div className="panel-head">
              <div className="panel-title"><Segs segs={COPY.dash.targets.title} /></div>
              <div className="panel-meta">{COPY.dash.targets.meta}</div>
            </div>
            <div className="gauge-grid">
              {GAUGES.map((g) => (
                <RadialGauge key={g.label} label={g.label} value={g.value} unit={g.unit} digits={g.digits} />
              ))}
            </div>
            <div className="panel-foot">{COPY.dash.targets.foot}</div>
          </Reveal>
        </div>
      </ZoomScroll>
    </section>
  );
}

// ── Featured showcase — lazy 3D chunk (three.js stays out of
// the main bundle, like the /resume reader). The chunk mounts at
// page load — NOT on scroll-into-view — so the scenes are always
// booted by the time anyone reaches them; visibility only gates
// the render loop (inside Showcase). The wrapper reserves the
// full scroll height so nothing shifts while the chunk streams in.
const Showcase = lazy(() => import("./showcase/Showcase"));

function ShowcaseFallback() {
  return (
    <div className="showcase-loading" role="status" aria-live="polite">
      <span className="showcase-loading-line" aria-hidden="true" />
      <span>Loading interactive hardware scene…</span>
    </div>
  );
}

function ShowcaseMount() {
  return (
    // Nine compact stops: enough room to settle, without long empty drags.
    <div style={REDUCED ? undefined : { height: `${SHOWCASE_HEIGHT_VH}vh` }}>
      <Suspense fallback={<ShowcaseFallback />}><Showcase /></Suspense>
    </div>
  );
}

// ── Projects — interactive index table ──────────────────────
function projVal(p: Project, key: string): string | number {
  switch (key) {
    case "title": return p.title;
    case "year": return p.year;
    case "loc": return p.metrics.loc;
    case "commits": return p.metrics.commits;
    default: return p.n;
  }
}

interface ProjectIndexProps { tagFilter: string | null; onClearFilter: () => void }
function ProjectIndex({ tagFilter, onClearFilter }: ProjectIndexProps) {
  const [open, setOpen] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState("n");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const ref = useSectionTracker("work");

  const sorted = useMemo(() => {
    const list = tagFilter
      ? PROJECTS.filter((p) => p.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase()))
      : [...PROJECTS];
    const dir = sortDir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const av = projVal(a, sortKey), bv = projVal(b, sortKey);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return cmp * dir;
    });
  }, [tagFilter, sortKey, sortDir]);

  const click = (k: string) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "n" || k === "title" ? "asc" : "desc"); }
  };
  const arrow = (k: string) => (sortKey === k ? (sortDir === "asc" ? " ↑" : " ↓") : "");
  // Keyboard access for the sortable headers. No role override — a <th>
  // is natively a columnheader, which is what aria-sort is valid on.
  const sortableTh = (k: string) => ({
    onClick: () => click(k),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); click(k); } },
    tabIndex: 0,
    "aria-sort": (sortKey === k ? (sortDir === "asc" ? "ascending" : "descending") : "none") as "ascending" | "descending" | "none",
  });
  const maxCommits = Math.max(...PROJECTS.map((p) => p.metrics.commits));

  return (
    <section className="section shell" id="work" ref={ref}>
      <CornerMarks />
      <ZoomScroll as="div" from={0.84}>
        <SecHead
          num={COPY.sections.work.num}
          hint={COPY.sections.work.hint}
          segments={COPY.sections.work.title}
          meta={tpl(COPY.work.metaTemplate, { shown: sorted.length, total: PROJECTS.length, commits: TOTALS.commits })}
        />
      </ZoomScroll>

      {/* Pinned 3D showcase for the top three projects — kept outside
          ZoomScroll: a scaling ancestor fights position:sticky. */}
      <ShowcaseMount />

      <ZoomScroll as="div" from={0.84}>
        <div className="proj-summary">
          <div className="proj-summary-l">
            <TypeOnView
              tag="p" speed={14} startDelay={120} threshold={0.5}
              segments={COPY.work.summary.map((s) => (s.text ? { ...s, text: tpl(s.text, { count: PROJECTS.length === 9 ? "Nine" : String(PROJECTS.length), loc: (TOTALS.loc / 1000).toFixed(1), commits: TOTALS.commits }) } : s))}
            />
            {tagFilter && (
              <div className="filter-pill">
                {COPY.work.filteringPrefix}<strong>{tagFilter}</strong>
                <button onClick={onClearFilter}>{COPY.work.clearLabel}</button>
              </div>
            )}
          </div>
          <div className="proj-bars">
            <div className="label">{COPY.work.barsLabel}</div>
            {PROJECTS.map((p) => (
              <BarRow
                key={p.n}
                label={p.title}
                value={p.metrics.commits}
                max={maxCommits}
                suffix=""
                active={hoverRow === p.n}
                onClick={() => setOpen(PROJECTS.indexOf(p) === open ? null : PROJECTS.indexOf(p))}
              />
            ))}
          </div>
        </div>

        <table className="index-table">
          <thead>
            <tr className="idx-head">
              <th {...sortableTh("n")} className="idx-num idx-th">{COPY.work.headers.num}{arrow("n")}</th>
              <th {...sortableTh("title")} className="idx-th">{COPY.work.headers.title}{arrow("title")}</th>
              <th className="idx-th">{COPY.work.headers.desc}</th>
              <th {...sortableTh("loc")} className="idx-th">{COPY.work.headers.loc}{arrow("loc")}</th>
              <th {...sortableTh("commits")} className="idx-th">{COPY.work.headers.commits}{arrow("commits")}</th>
              <th className="idx-th idx-th-r">{COPY.work.headers.files}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, ri) => {
              const i = PROJECTS.indexOf(p);
              return (
                <Fragment key={p.n}>
                  <RevealTr
                    delay={ri * 60}
                    onClick={() => setOpen(open === i ? null : i)}
                    onMouseEnter={() => setHoverRow(p.n)}
                    onMouseLeave={() => setHoverRow(null)}
                  >
                    <td className="idx-num">{p.n}</td>
                    <td className="idx-title">
                      {p.title}
                      <span className="arrow">{open === i ? "↓" : "→"}</span>
                    </td>
                    <td className="idx-desc">{p.desc}</td>
                    <td className="idx-met">{(p.metrics.loc / 1000).toFixed(1)}k</td>
                    <td className="idx-met">{p.metrics.commits}</td>
                    <td className="idx-met idx-met-r">
                      <Sparkline data={p.trend} w={56} h={18} stroke="var(--accent)" />
                      <span className="idx-stars">{p.metrics.files}</span>
                    </td>
                  </RevealTr>
                  {open === i && (
                    <tr className="idx-detail">
                      <td colSpan={6}>
                        <div className="idx-detail-inner">
                          <div className="idx-detail-bar" />
                          <p className="idx-long">{p.long}</p>
                          <div className="idx-spec">
                            <div className="row"><span className="k">{COPY.work.detail.year}</span><span className="v">{p.year}</span></div>
                            <div className="row"><span className="k">{COPY.work.detail.type}</span><span className="v">{p.type}</span></div>
                            <div className="row"><span className="k">{COPY.work.detail.status}</span><span className="v">{p.status}</span></div>
                            <div className="row"><span className="k">{COPY.work.detail.stack}</span><span className="v">{p.tags.join(" · ")}</span></div>
                            <div className="idx-metrics">
                              <div className="idx-metric">{COPY.work.detail.loc}<span className="v">{(p.metrics.loc / 1000).toFixed(1)}k</span></div>
                              <div className="idx-metric">{COPY.work.detail.commits}<span className="v">{p.metrics.commits}</span></div>
                              <div className="idx-metric">{COPY.work.detail.files}<span className="v">{p.metrics.files}</span></div>
                            </div>
                            <a className="idx-link" href={p.link} target="_blank" rel="noreferrer">{COPY.work.detail.link}</a>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={6} className="idx-empty">{COPY.work.emptyPrefix}{tagFilter}{COPY.work.emptySuffix}<button onClick={onClearFilter}>{COPY.work.emptyClear}</button></td></tr>
            )}
          </tbody>
        </table>
      </ZoomScroll>
    </section>
  );
}

// ── About — dossier + timeline ──────────────────────────────
function About() {
  const ref = useSectionTracker("about");
  return (
    <section className="section shell" id="about" ref={ref}>
      <CornerMarks />
      <ZoomScroll as="div" from={0.85}>
        <SecHead
          num={COPY.sections.about.num}
          hint={COPY.sections.about.hint}
          segments={COPY.sections.about.title}
          meta={COPY.sections.about.meta}
        />

        <div className="dossier-grid">
          <div className="bio">
            <TypeOnView
              tag="p" speed={12} startDelay={150} threshold={0.5}
              segments={COPY.about.bio1}
            />
            <TypeOnView
              tag="p" speed={12} startDelay={2500} threshold={0.5} cursor={true}
              segments={COPY.about.bio2}
            />
          </div>

          <div className="skills">
            <Stagger step={90}>
              {SKILLS.map((s) => (
                <div key={s.label} className="skill">
                  <div className="label">{s.label}</div>
                  <Tap as="div" className="items" copy={s.items} title={COPY.about.skillCopyTitle}>{s.items}</Tap>
                </div>
              ))}
            </Stagger>
          </div>
        </div>

      </ZoomScroll>
    </section>
  );
}

// ── Resume sections (Education / Certs / Experience) ────────
// All three share the timeline-row layout; only the copy + data differ.
interface ResumeSectionProps {
  id: string;
  num: string;
  hint?: string;
  segments: Seg[];
  meta: string;
  rows: ResumeEntry[];
}
function ResumeSection({ id, num, hint, segments, meta, rows }: ResumeSectionProps) {
  const ref = useSectionTracker(id);
  return (
    <section className="section shell" id={id} ref={ref}>
      <CornerMarks />
      <ZoomScroll as="div" from={0.85}>
        <SecHead num={num} hint={hint} segments={segments} meta={meta} />
        <div className="timeline timeline-solo">
          <Stagger step={80}>
            {rows.map((t, i) => (
              <Tap as="div" key={i} className={`tl-row${t.upcoming ? " tl-row-upcoming" : ""}`} msg={[`${t.period} — ${t.title}.`, t.desc]}>
                <div className="tl-period">{t.period}</div>
                <div>
                  <div className="tl-title">{t.title}{t.upcoming && <span className="tl-badge">upcoming</span>}</div>
                  <div className="tl-sub">{t.sub}</div>
                </div>
                <div className="tl-desc">{t.desc}</div>
              </Tap>
            ))}
          </Stagger>
        </div>
      </ZoomScroll>
    </section>
  );
}

// ── Work projects — placeholder (real entries available on request) ──
function WorkProjects() {
  const ref = useSectionTracker("workprojects");
  const W = COPY.workProjects;
  return (
    <section className="section shell" id="workprojects" ref={ref}>
      <CornerMarks />
      <ZoomScroll as="div" from={0.85}>
        <SecHead
          num={COPY.sections.workprojects.num}
          hint={COPY.sections.workprojects.hint}
          segments={COPY.sections.workprojects.title}
          meta={COPY.sections.workprojects.meta}
        />
        <Reveal as="div" className="panel workproj-panel">
          <div className="panel-head">
            <div className="panel-title"><Segs segs={W.title} /></div>
            <div className="panel-meta">{W.note}</div>
          </div>
          <div className="workproj-grid">
            <div>
              <p className="workproj-body">{W.body}</p>
              <a className="idx-link" href={W.ctaHref}>{W.cta}</a>
            </div>
            <div className="workproj-manifest">
              <div className="label">{W.manifestLabel}</div>
              {W.manifest.map((r) => (
                <Tap as="div" key={r.k} className="row" msg={r.taps}>
                  <span>{r.k}</span><span className="redact">{r.v}</span>
                </Tap>
              ))}
              <div className="workproj-manifest-foot">{W.manifestFoot}</div>
            </div>
          </div>
        </Reveal>
      </ZoomScroll>
    </section>
  );
}

// ── Contact ─────────────────────────────────────────────────
function Contact() {
  const ref = useSectionTracker("contact");
  return (
    <section className="section shell" id="contact" ref={ref}>
      <CornerMarks />
      <ZoomScroll as="div" from={0.8}>
        <SecHead
          num={COPY.sections.contact.num}
          hint={COPY.sections.contact.hint}
          segments={COPY.sections.contact.title}
          meta={COPY.sections.contact.meta}
        />

        <div className="contact-grid">
          <div>
            <TypeOnView
              tag="h3" className="contact-display serif" speed={60} threshold={0.5}
              segments={COPY.contact.display}
            />
            <Reveal as="div" className="contact-sub" delay={400}>
              {COPY.contact.sub}
            </Reveal>
          </div>

          <div className="contact-list">
            <Stagger step={90}>
              {CONTACTS.map((c) => (
                <a key={c.num} className="contact-row" href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noreferrer" : undefined}>
                  <div className="num">{COPY.contact.numPrefix}{c.num}</div>
                  <div>
                    <div className="name serif">{c.name}</div>
                    <div className="desc">{c.desc}</div>
                  </div>
                  <Magnetic className="arrow-big" strength={0.5} radius={48}>↗</Magnetic>
                </a>
              ))}
            </Stagger>
          </div>
        </div>
      </ZoomScroll>
    </section>
  );
}

// ── Colophon ────────────────────────────────────────────────
function Colophon() {
  const now = useClock();
  const visits = useMemo(() => {
    try {
      const n = (parseInt(localStorage.getItem("iw_visits") || "0", 10) || 0) + 1;
      localStorage.setItem("iw_visits", String(n));
      return n;
    } catch { return 1; }
  }, []);
  return (
    <footer className="colophon shell">
      <CornerMarks />
      <div>
        <Tap as="div" className="big serif" msg={COPY.colophon.name.taps}>{COPY.colophon.name.v}</Tap>
        <Tap as="div" copy={COPY.colophon.email.copy} title={COPY.colophon.email.title}>{COPY.colophon.email.v}</Tap>
        <Tap as="div" copy={COPY.colophon.github.copy} title={COPY.colophon.github.title}>{COPY.colophon.github.v}</Tap>
      </div>
      <div className="c">
        <Tap as="div" className="big serif" msg={COPY.colophon.colophonTitle.taps}>{COPY.colophon.colophonTitle.v}</Tap>
        <Tap as="div" msg={COPY.colophon.font1.taps}>{COPY.colophon.font1.v}</Tap>
        <Tap as="div" msg={COPY.colophon.font2.taps}>{COPY.colophon.font2.v}</Tap>
      </div>
      <div className="r">
        <Tap as="div" className="big serif" msg={COPY.colophon.copyright.taps}>{COPY.colophon.copyright.v}</Tap>
        <Tap as="div" msg={visits === 1 ? COPY.colophon.visitFirst : COPY.colophon.visitReturn.map((m) => tpl(m, { n: visits }))}>{COPY.colophon.visitPrefix}{String(visits).padStart(3, "0")}</Tap>
        <Tap as="div" copy={fmtDate(now)}>{COPY.colophon.updatedPrefix}{fmtDate(now)}</Tap>
      </div>
    </footer>
  );
}

// ── App ─────────────────────────────────────────────────────
export default function Specimen() {
  const [tldrOpen, setTldrOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  useEffect(() => { consoleEgg(); initLenis(); }, []);
  return (
    <>
      <InteractiveBG />
      <AccentSpotlight />
      <Loupe />
      <StartupIntro />
      <ScrollProgress />
      <MouseAurora />
      <Crosshair />
      <Masthead />
      <main>
        <Hero />
        <Scroller />
        {/* ── Resume body, top to bottom ── */}
        <About />
        <ResumeSection id="education" num={COPY.sections.education.num} hint={COPY.sections.education.hint} segments={COPY.sections.education.title} meta={COPY.sections.education.meta} rows={EDUCATION} />
        <ResumeSection id="certs" num={COPY.sections.certs.num} hint={COPY.sections.certs.hint} segments={COPY.sections.certs.title} meta={COPY.sections.certs.meta} rows={CERTS} />
        <ProjectIndex tagFilter={tagFilter} onClearFilter={() => setTagFilter(null)} />
        <ResumeSection id="experience" num={COPY.sections.experience.num} hint={COPY.sections.experience.hint} segments={COPY.sections.experience.title} meta={COPY.sections.experience.meta} rows={EXPERIENCE} />
        <WorkProjects />
        {/* ── Everything else ── */}
        <Dashboard
          tagFilter={tagFilter}
          onSelectTag={(t) => {
            setTagFilter(t);
            if (t) {
              const el = document.getElementById("work");
              if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: "smooth" });
            }
          }}
        />
        <Contact />
      </main>
      <Colophon />
      <IdleSequence />
      <ScrollToasts />
      <CommandPalette openTldr={() => setTldrOpen(true)} />
      <TldrModal open={tldrOpen} onClose={() => setTldrOpen(false)} />
      <SourceEgg />
      <Quirks />
      <QuirksExtra />
      <MicroToast />
      <DebugHUD />
      <button id="tldr-modal-trigger" style={{ display: "none" }} onClick={() => setTldrOpen(true)} />
      <SpeedInsights />
    </>
  );
}
