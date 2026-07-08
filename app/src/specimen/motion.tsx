// ============================================================
// SCROLL-DRIVEN ANIMATION PRIMITIVES
//   5 randomized reveal variants (re-picked on every re-entry)
//   5 randomized text modes      (re-picked on every re-entry)
//   Engagement experiment, smooth-scroll + parallax engine
// Ported from the Claude Design handoff (reveal.jsx).
// ============================================================
import { createElement, useEffect, useRef, useState, Children } from "react";
import type { CSSProperties, ElementType, ReactNode, RefObject } from "react";
import Lenis from "lenis";
import { getLenis, setLenis } from "./runtime";
import { COPY } from "./copy";

// ── Reduced motion ──────────────────────────────────────────
export const REDUCED =
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Mobile flag (live) — tames parallax/zoom on small screens ──
export const IS_MOBILE = () => typeof window !== "undefined" && window.innerWidth <= 640;

// ── useReveal ───────────────────────────────────────────────
// Fires (once) when the element's top crosses ~88% down the viewport.
// Uses IntersectionObserver — the browser computes intersection off the
// main thread, so NO getBoundingClientRect / layout read happens on
// scroll. This is what keeps fast scrolling jank-free even with dozens
// of reveals on the page. Latches on first show, then disconnects.
export function useReveal<T extends HTMLElement = HTMLElement>(_threshold = 0.25): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(REDUCED);
  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED) { if (REDUCED) setShown(true); return; }
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setShown(true); io.disconnect(); break; }
        }
      },
      // shrink the bottom of the root by 12% → trigger when the element's
      // top edge passes the 88%-down line (matches the old threshold).
      { rootMargin: "0px 0px -12% 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown];
}

// ── Shared rAF ticker ───────────────────────────────────────
const _tickers = new Set<() => void>();
let _tickRunning = false;
function _tickLoop() {
  _tickers.forEach((fn) => { try { fn(); } catch { /* noop */ } });
  if (_tickers.size) requestAnimationFrame(_tickLoop);
  else _tickRunning = false;
}
export function onTick(fn: () => void): () => void {
  _tickers.add(fn);
  if (!_tickRunning) { _tickRunning = true; requestAnimationFrame(_tickLoop); }
  return () => { _tickers.delete(fn); };
}

// ── Easings ─────────────────────────────────────────────────
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
// Springy overshoot — settles slightly past 1 then back, giving reveals "pop".
export const easeBackOut = (x: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

// ── useTween ────────────────────────────────────────────────
// Tweens 0→1 on first activation and STAYS at 1 forever after.
// `ease` can overshoot mid-flight (e.g. easeBackOut) but always ends at 1.
export function useTween(active: boolean, delay = 0, dur = 700, resetOnHide = false, ease: (x: number) => number = easeOutCubic): number {
  const [t, setT] = useState(REDUCED ? 1 : 0);
  const completedRef = useRef(false);
  useEffect(() => {
    if (REDUCED) { setT(1); completedRef.current = true; return; }
    if (!active) {
      if (resetOnHide && !completedRef.current) setT(0);
      return;
    }
    if (completedRef.current) return;
    let id = 0 as unknown as ReturnType<typeof setInterval>;
    const st = setTimeout(() => {
      const t0 = Date.now();
      id = setInterval(() => {
        const p = Math.min(1, (Date.now() - t0) / dur);
        setT(p >= 1 ? 1 : ease(p));
        if (p >= 1) { clearInterval(id); completedRef.current = true; }
      }, 16);
    }, delay);
    return () => { clearTimeout(st); clearInterval(id); };
  }, [active, delay, dur, resetOnHide, ease]);
  return t;
}

// ════════════════════════════════════════════════════════════
// REVEAL — 5 randomised entrance variants
// ════════════════════════════════════════════════════════════
type VariantFn = (t: number) => CSSProperties;
// `t` arrives springy (easeBackOut) so it can briefly exceed 1 — clamp
// the values that must stay valid (opacity, blur) while letting the
// transforms overshoot for a satisfying "pop".
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const REVEAL_VARIANTS: VariantFn[] = [
  // 0 — bold rise out of a soft blur
  (t) => ({ opacity: clamp01(t), transform: `translateY(${(1 - t) * 66}px)`, filter: `blur(${clamp01(1 - t) * 5}px)` }),
  // 1 — sweep in from the left with a little skew
  (t) => ({ opacity: clamp01(t), transform: `translateX(${(t - 1) * 80}px) skewX(${(1 - t) * 5}deg)`, filter: "none" }),
  // 2 — punchy scale-up (overshoots, then settles)
  (t) => ({ opacity: clamp01(t), transform: `scale(${0.68 + 0.32 * t})`, filter: "none" }),
  // 3 — deep focus pull (heavy blur clearing)
  (t) => ({ opacity: clamp01(t), transform: `translateY(${(1 - t) * 34}px)`, filter: `blur(${clamp01(1 - t) * 22}px)` }),
  // 4 — 3D flip up, hinged on its bottom edge
  (t) => ({ opacity: clamp01(t), transform: `perspective(1100px) rotateX(${(1 - t) * -34}deg) translateY(${(1 - t) * 48}px)`, transformOrigin: "center bottom", filter: "none" }),
];

// Calm entrance for large opaque content cards: a plain fade + tiny rise with
// NO overshoot, skew, 3D tilt, or blur. The springy variants overshoot past the
// resting position, which on stacked panels makes them jump over their
// neighbours (e.g. the dashboard panels riding up over the KPI stats).
const CALM_VARIANT: VariantFn = (t) => ({
  opacity: clamp01(t),
  transform: `translateY(${(1 - clamp01(t)) * 14}px)`,
  filter: "none",
});

interface RevealProps {
  children?: ReactNode;
  delay?: number;
  className?: string;
  threshold?: number;
  as?: ElementType;
  style?: CSSProperties;
  /** Use the non-overshooting fade-rise — for opaque content cards. */
  calm?: boolean;
}
export function Reveal({ children, delay = 0, className = "", threshold = 0.18, as = "div", style, calm = false }: RevealProps) {
  const [ref, shown] = useReveal(threshold);
  const variantRef = useRef<VariantFn | null>(null);
  const pickedRef = useRef(false);
  useEffect(() => {
    if (shown && !REDUCED && !pickedRef.current && !calm) {
      pickedRef.current = true;
      const idx = typeof exp.revealIdx === "number" ? exp.revealIdx : 0;
      variantRef.current = REVEAL_VARIANTS[idx] || REVEAL_VARIANTS[0];
    }
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps
  const t = useTween(shown, delay, calm ? 640 : 860, false, calm ? easeOutCubic : easeBackOut);
  const vfn = calm ? CALM_VARIANT : (variantRef.current || REVEAL_VARIANTS[0]);
  const st: CSSProperties = REDUCED ? { ...style } : { ...vfn(t), willChange: "opacity, transform, filter", ...style };
  return createElement(as, { ref, className, style: st }, children);
}

interface StaggerProps { children?: ReactNode; step?: number; className?: string; base?: number }
export function Stagger({ children, step = 70, className = "", base = 0 }: StaggerProps) {
  const arr = Children.toArray(children);
  return (
    <>
      {arr.map((child, i) => (
        <Reveal key={i} delay={base + i * step} className={className}>
          {child}
        </Reveal>
      ))}
    </>
  );
}

// ════════════════════════════════════════════════════════════
// TypeOnView — 5 randomised text animation modes
// ════════════════════════════════════════════════════════════
const DISPLAY_FONTS = [
  "'Space Grotesk', sans-serif",
  "'Archivo', sans-serif",
  "'Familjen Grotesk', sans-serif",
  "'Syne', sans-serif",
  "'Hanken Grotesk', sans-serif",
];
const TEXT_MODES = ["typewriter", "wordFade", "scramble", "cascade", "slideLines"];

// ════════════════════════════════════════════════════════════
// ENGAGEMENT EXPERIMENT
// Picks ONE font + ONE text-animation + ONE reveal-style per load,
// weighted by how long past visitors stayed ACTIVE (tab focused).
// ════════════════════════════════════════════════════════════
type ExpCell = { ms: number; n: number };
type ExpStore = Record<string, Record<string, ExpCell>>;
const EXP_KEY = "iw_exp_v3";
function _expLoad(): ExpStore { try { return JSON.parse(localStorage.getItem(EXP_KEY) || "{}") || {}; } catch { return {}; } }
function _expSave(s: ExpStore) { try { localStorage.setItem(EXP_KEY, JSON.stringify(s)); } catch { /* noop */ } }
function _expCat(store: ExpStore, cat: string) { return (store[cat] = store[cat] || {}); }
function _expCell(store: ExpStore, cat: string, key: string): ExpCell {
  const c = _expCat(store, cat);
  return (c[key] = c[key] || { ms: 0, n: 0 });
}
function _expPick(store: ExpStore, cat: string, keys: string[]): string {
  const stats = keys.map((k) => {
    const d = _expCat(store, cat)[k] || { ms: 0, n: 0 };
    return { k, avg: d.n > 0 ? d.ms / d.n : Infinity, n: d.n };
  });
  const unseen = stats.filter((s) => s.n === 0);
  if (unseen.length) return unseen[Math.floor(Math.random() * unseen.length)].k;
  if (Math.random() < 0.15) return keys[Math.floor(Math.random() * keys.length)];
  const maxA = Math.max(...stats.map((s) => s.avg));
  const temp = Math.max(1500, maxA * 0.35);
  const ws = stats.map((s) => Math.exp((s.avg - maxA) / temp));
  const sum = ws.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < stats.length; i++) { r -= ws[i]; if (r <= 0) return stats[i].k; }
  return stats[stats.length - 1].k;
}

const _expStore = _expLoad();
const _revealKeys = REVEAL_VARIANTS.map((_, i) => String(i));
export const exp = {
  font: REDUCED ? DISPLAY_FONTS[0] : _expPick(_expStore, "font", DISPLAY_FONTS),
  mode: REDUCED ? "typewriter" : _expPick(_expStore, "mode", TEXT_MODES),
  revealIdx: REDUCED ? 0 : parseInt(_expPick(_expStore, "reveal", _revealKeys), 10),
};

// ── Lazy fonts ──────────────────────────────────────────────
// Archivo / Familjen Grotesk / Syne are only used by the font
// experiment + the Tweaks picker, so they're kept OUT of the
// critical-path <link> and fetched on demand the first time one is
// actually chosen. The three core families ship in index.html.
const LAZY_FONT_SPECS: Record<string, string> = {
  "Archivo": "Archivo:ital,wght@0,400;0,600;1,400",
  "Familjen Grotesk": "Familjen+Grotesk:ital,wght@0,400;0,600;1,400",
  "Syne": "Syne:wght@400;600;700;800",
};
const _loadedFonts = new Set<string>();
export function ensureFontLoaded(family: string) {
  if (typeof document === "undefined") return;
  const spec = LAZY_FONT_SPECS[family];
  if (!spec || _loadedFonts.has(family)) return;
  _loadedFonts.add(family);
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  document.head.appendChild(l);
}

// apply the chosen display font globally (headlines read --serif)
if (typeof document !== "undefined" && !REDUCED) {
  ensureFontLoaded((exp.font.match(/'([^']+)'/) || [])[1] || "");
  document.documentElement.style.setProperty("--serif", exp.font);
  setTimeout(() => document.documentElement.style.setProperty("--serif", exp.font), 120);
}

// count one session for each chosen variant, then track active dwell
if (typeof window !== "undefined" && !REDUCED) {
  _expCell(_expStore, "font", exp.font).n++;
  _expCell(_expStore, "mode", exp.mode).n++;
  _expCell(_expStore, "reveal", String(exp.revealIdx)).n++;
  _expSave(_expStore);

  let lastTs = Date.now();
  const addActive = () => {
    const now = Date.now();
    const dt = now - lastTs;
    lastTs = now;
    if (dt <= 0 || dt > 60000) return;
    _expCell(_expStore, "font", exp.font).ms += dt;
    _expCell(_expStore, "mode", exp.mode).ms += dt;
    _expCell(_expStore, "reveal", String(exp.revealIdx)).ms += dt;
  };
  setInterval(() => {
    if (document.visibilityState === "visible" && document.hasFocus()) addActive();
    else lastTs = Date.now();
  }, 1000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") lastTs = Date.now();
    else { addActive(); _expSave(_expStore); }
  });
  window.addEventListener("blur", () => { addActive(); _expSave(_expStore); lastTs = Date.now(); });
  window.addEventListener("focus", () => { lastTs = Date.now(); });
  window.addEventListener("pagehide", () => { addActive(); _expSave(_expStore); });
  window.addEventListener("beforeunload", () => { addActive(); _expSave(_expStore); });
  setInterval(() => _expSave(_expStore), 5000);
}

export function expCurrent() {
  return {
    font: (exp.font.match(/'([^']+)'/) || [exp.font, exp.font])[1] as string,
    mode: exp.mode,
    revealIdx: exp.revealIdx,
  };
}

export interface Seg { text?: string; br?: boolean; className?: string }
interface TypeOnViewProps {
  children?: ReactNode;
  segments?: Seg[];
  text?: string;
  speed?: number;
  startDelay?: number;
  tag?: ElementType;
  className?: string;
  cursor?: boolean;
  threshold?: number;
  keepCursor?: boolean;
  onDone?: () => void;
}
export function TypeOnView({
  children, segments, text,
  speed = 26, startDelay = 120,
  tag = "span", className = "",
  cursor = true, threshold = 0.55,
  onDone,
}: TypeOnViewProps) {
  const segs: Seg[] = segments
    || (typeof text === "string" ? [{ text }] : null)
    || (typeof children === "string" ? [{ text: children }] : [{ text: String(children ?? "") }]);

  const full = segs.map((s) => (s.br ? "\n" : s.text || "")).join("");
  const [ref, shown] = useReveal(threshold);
  const modeRef = useRef<string | null>(null);
  const doneRef = useRef(false);
  const hasTypedRef = useRef(false);

  const [count, setCount] = useState(REDUCED ? full.length : 0);
  const [wordIdx, setWordIdx] = useState(REDUCED ? 999 : 0);
  const [scrambled, setScrambled] = useState<{ char: string; done: boolean }[]>(
    () => Array.from(full).map(() => ({ char: " ", done: false })),
  );
  const [cascadeT, setCascadeT] = useState(REDUCED ? 1 : 0);
  const [lineIdx, setLineIdx] = useState(REDUCED ? 999 : 0);
  const [, setFadeT] = useState(REDUCED ? 1 : 0);

  function done() {
    if (!doneRef.current) {
      doneRef.current = true;
      hasTypedRef.current = true;
      onDone?.();
    }
  }

  // Re-pick mode each time element enters
  useEffect(() => {
    if (!shown) {
      if (!hasTypedRef.current) setFadeT(0);
      return;
    }
    if (REDUCED) return;
    if (!hasTypedRef.current) {
      modeRef.current = exp.mode || TEXT_MODES[0];
      setCount(0);
      setWordIdx(0);
      // Seed with spaces, not visible glyphs — during startDelay the text
      // should hold blank space, not a wall of "?" (visible for seconds on
      // long-delay blocks like the bio).
      setScrambled(Array.from(full).map(() => ({ char: " ", done: false })));
      setCascadeT(0);
      setLineIdx(0);
      doneRef.current = false;
    } else {
      modeRef.current = "__fadeIn";
      setFadeT(1);
    }
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  // MODE 1: Typewriter — driven off the shared rAF ticker with time-based
  // progress. Frame-aligned (no mid-frame timer thrash) and self-correcting:
  // if the main thread stalls, the next frame jumps straight to the character
  // the elapsed time calls for, so typing stays smooth instead of bunching up
  // into bursts the way setInterval does under load.
  useEffect(() => {
    if (REDUCED || !shown || modeRef.current !== "typewriter") return;
    let t0 = 0;       // wall-clock start (set after startDelay, on first tick)
    let last = 0;     // last count pushed to state — avoid redundant setState
    const stop = onTick(() => {
      const now = performance.now();
      if (t0 === 0) { t0 = now + startDelay; return; }
      if (now < t0) return;
      const n = Math.min(full.length, Math.floor((now - t0) / speed) + 1);
      if (n !== last) { last = n; setCount(n); }
      if (n >= full.length) { stop(); done(); }
    });
    return stop;
  }, [shown, modeRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // MODE 2: Word fade
  const words = full.split(/(\s+)/);
  useEffect(() => {
    if (REDUCED || !shown || modeRef.current !== "wordFade") return;
    let i = 0;
    const interval = Math.max(30, speed * 2.5);
    const id = setInterval(() => {
      i++;
      setWordIdx(i);
      if (i >= words.length) { clearInterval(id); done(); }
    }, interval);
    return () => clearInterval(id);
  }, [shown, modeRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // MODE 3: Scramble
  useEffect(() => {
    if (REDUCED || !shown || modeRef.current !== "scramble") return;
    const chars = Array.from(full);
    const SOFT_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
    const step = speed * 0.8;
    let t0 = 0, lastPaint = 0;
    // Frame-synced + time-based, with the shimmer repaint capped to ~30fps so
    // it stays cheap and smooth (no per-tick full-string churn under load).
    const stop = onTick(() => {
      const now = performance.now();
      if (t0 === 0) { t0 = now + startDelay; return; }
      if (now < t0 || now - lastPaint < 33) return;
      lastPaint = now;
      const resolved = Math.floor((now - t0) / step) * 2;
      setScrambled(chars.map((orig, i) => {
        if (i < resolved) return { char: orig, done: true };
        if (orig === " " || orig === "\n") return { char: orig, done: false };
        return { char: SOFT_CHARS[Math.floor(Math.random() * SOFT_CHARS.length)], done: false };
      }));
      if (resolved > chars.length) { stop(); done(); }
    });
    return stop;
  }, [shown, modeRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // MODE 4: Cascade
  useEffect(() => {
    if (REDUCED || !shown || modeRef.current !== "cascade") return;
    const dur = Math.min(full.length * speed * 0.6 + 200, 1400);
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      setCascadeT(p);
      if (p >= 1) { clearInterval(id); done(); }
    }, 16);
    return () => clearInterval(id);
  }, [shown, modeRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // MODE 5: Slide lines
  useEffect(() => {
    if (REDUCED || !shown || modeRef.current !== "slideLines") return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setLineIdx(i);
      if (i >= segs.length) { clearInterval(id); done(); }
    }, speed * 6 + 80);
    return () => clearInterval(id);
  }, [shown, modeRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  const mode = REDUCED ? "typewriter" : (modeRef.current || "typewriter");
  const isDone = doneRef.current;
  const showCaret = cursor && !isDone && !REDUCED && mode !== "__fadeIn";
  const Tag = tag;
  const caret = showCaret ? <span className="type-caret" aria-hidden="true" /> : null;

  // Fade-in mode (re-entries after first type)
  if (mode === "__fadeIn" || hasTypedRef.current) {
    return createElement(
      Tag, { ref, className, style: { opacity: 1 } as CSSProperties },
      segs.map((s, i) => (s.br ? <br key={i} /> : <span key={i} className={s.className || undefined}>{s.text}</span>)),
    );
  }

  if (mode === "typewriter") {
    let remaining = count;
    const nodes = segs.map((s, i) => {
      if (s.br) { if (remaining <= 0) return null; remaining--; return <br key={i} />; }
      if (remaining <= 0) return null;
      const txt = s.text || "";
      const take = Math.min(txt.length, remaining);
      remaining -= take;
      return <span key={i} className={s.className || undefined}>{txt.slice(0, take)}</span>;
    });
    return createElement(Tag, { ref, className: className + (showCaret ? " typing" : "") }, nodes, caret);
  }

  if (mode === "wordFade") {
    let wi = 0;
    const nodes = segs.map((s, si) => {
      if (s.br) return <br key={si} />;
      const w = (s.text || "").split(/(\s+)/);
      return (
        <span key={si} className={s.className || undefined}>
          {w.map((word, j) => {
            if (/^\s+$/.test(word)) return word;
            const visible = wi++ < wordIdx;
            return (
              <span key={j} style={{ opacity: visible ? 1 : 0, display: "inline-block", transition: "opacity 300ms ease" }}>{word}</span>
            );
          })}
        </span>
      );
    });
    return createElement(Tag, { ref, className }, nodes, caret);
  }

  if (mode === "scramble") {
    let ci = 0;
    const nodes = segs.map((s, si) => {
      if (s.br) { ci++; return <br key={si} />; }
      const chars = Array.from(s.text || "");
      return (
        <span key={si} className={s.className || undefined}>
          {chars.map((_, j) => {
            const cell = scrambled[ci++] || { char: " ", done: false };
            return (
              <span key={j} style={{ fontFamily: "inherit", opacity: cell.done ? 1 : 0.45, transition: "opacity 60ms" }}>{cell.char}</span>
            );
          })}
        </span>
      );
    });
    return createElement(Tag, { ref, className }, nodes);
  }

  if (mode === "cascade") {
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    let ci = 0;
    const totalChars = full.replace(/\n/g, "").length;
    const nodes = segs.map((s, si) => {
      if (s.br) return <br key={si} />;
      const chars = Array.from(s.text || "");
      return (
        <span key={si} className={s.className || undefined}>
          {chars.map((ch, j) => {
            const charFraction = ci++ / Math.max(1, totalChars - 1);
            const charStart = charFraction * 0.7;
            const charProgress = Math.max(0, Math.min(1, (cascadeT - charStart) / 0.3));
            const e = ease(charProgress);
            return (
              <span key={j} style={{ display: "inline-block", opacity: e, transform: `translateY(${(1 - e) * 10}px)` }}>{ch === " " ? " " : ch}</span>
            );
          })}
        </span>
      );
    });
    return createElement(Tag, { ref, className }, nodes);
  }

  if (mode === "slideLines") {
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const nodes = segs.map((s, si) => {
      if (s.br) return <br key={si} />;
      const progress = Math.max(0, Math.min(1, (lineIdx - si) * 0.5));
      const e = ease(progress);
      return (
        <span key={si} className={s.className || undefined} style={{ display: "inline-block", whiteSpace: "pre-wrap", opacity: e, transform: `translateY(${(1 - e) * 20}px)` }}>{s.text}</span>
      );
    });
    return createElement(Tag, { ref, className }, nodes, caret);
  }

  return createElement(Tag, { ref, className }, full);
}

// ════════════════════════════════════════════════════════════
// PARALLAX ENGINE — one continuous rAF loop, ±70px clamp
// ════════════════════════════════════════════════════════════
interface ParallaxItem { el: HTMLElement; speed: number; axis: "x" | "y"; base: number }
export const parallaxEngine = (() => {
  const items = new Set<ParallaxItem>();
  const MAX_SHIFT = 110;
  const DAMP = 1.35;
  let rafActive = false;
  // smoothed scroll velocity → a tiny shared "speed lean" on parallax layers
  let lastSc = typeof window !== "undefined" ? window.scrollY || 0 : 0;
  let vel = 0;

  function paint() {
    const sc = window.scrollY || 0;
    const mob = IS_MOBILE();
    const cap = mob ? 30 : MAX_SHIFT;
    const scl = mob ? 0.45 : 1;
    // ease the velocity so the lean glides in and settles instead of snapping
    const scrollDelta = sc - lastSc;
    vel += (scrollDelta - vel) * 0.2;
    lastSc = sc;
    const lean = mob ? 0 : Math.max(-2.2, Math.min(2.2, vel * 0.06));
    for (const it of items) {
      let move = (sc - it.base) * it.speed * scl;
      if (move > cap) move = cap;
      else if (move < -cap) move = -cap;
      const skew = lean * (it.speed >= 0 ? 1 : -1);
      it.el.style.transform = it.axis === "x"
        ? `translate3d(${move.toFixed(2)}px,0,0) skewY(${skew.toFixed(2)}deg)`
        : `translate3d(0,${move.toFixed(2)}px,0) skewX(${skew.toFixed(2)}deg)`;
    }
    return Math.abs(scrollDelta) > 0.01 || Math.abs(vel) > 0.005;
  }
  function loop() {
    const keepRunning = paint();
    if (items.size && keepRunning) { rafActive = true; requestAnimationFrame(loop); }
    else rafActive = false;
  }
  function ensure() { if (!rafActive && items.size) { rafActive = true; requestAnimationFrame(loop); } }
  function recalcBases() {
    const sc = window.scrollY || 0;
    const vh = window.innerHeight || 1;
    for (const it of items) {
      const prev = it.el.style.transform;
      it.el.style.transform = "none";
      const r = it.el.getBoundingClientRect();
      it.el.style.transform = prev;
      it.base = sc + r.top + r.height / 2 - vh / 2;
    }
    paint();
  }
  if (typeof window !== "undefined") {
    window.addEventListener("scroll", ensure, { passive: true });
    window.addEventListener("resize", () => { recalcBases(); ensure(); });
    setTimeout(recalcBases, 80);
    setTimeout(recalcBases, 500);
    window.addEventListener("load", recalcBases);
  }
  return {
    add(el: HTMLElement, speed: number, axis: "x" | "y"): ParallaxItem {
      const sc = window.scrollY || 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const base = sc + r.top + r.height / 2 - vh / 2;
      const item: ParallaxItem = { el, speed: speed * DAMP, axis, base };
      items.add(item);
      ensure();
      return item;
    },
    remove(item: ParallaxItem) { items.delete(item); },
    recalc: recalcBases,
  };
})();

interface ParallaxProps extends Record<string, unknown> {
  children?: ReactNode;
  speed?: number;
  axis?: "x" | "y";
  className?: string;
  as?: ElementType;
  style?: CSSProperties;
}
export function Parallax({ children, speed = 0.08, axis = "y", className = "", as = "div", style, ...rest }: ParallaxProps) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED) return;
    if (IS_MOBILE()) return;
    const item = parallaxEngine.add(el, speed, axis);
    return () => parallaxEngine.remove(item);
  }, [speed, axis]);
  return createElement(as, { ref, className, style: { willChange: "transform", ...style }, ...rest }, children);
}

// ════════════════════════════════════════════════════════════
// SectionFx — scroll-progress-driven section entrance
// ════════════════════════════════════════════════════════════
interface SectionFxProps {
  children?: ReactNode;
  variant?: "zoomOut" | "left" | "up" | "zoomIn";
  className?: string;
  as?: ElementType;
  style?: CSSProperties;
  intensity?: number;
}
export function SectionFx({ children, variant = "up", className = "", as = "section", style, intensity = 1 }: SectionFxProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [p, setP] = useState(REDUCED ? 1 : 0);
  const peakRef = useRef(REDUCED ? 1 : 0);
  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED) { setP(1); return; }
    let raf = 0;
    const compute = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const startAt = vh * 0.95;
      const endAt = vh * 0.38;
      let prog = (startAt - r.top) / (startAt - endAt);
      prog = Math.max(0, Math.min(1, prog));
      if (prog > peakRef.current) { peakRef.current = prog; setP(prog); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const ease = (x: number) => 1 - Math.pow(1 - x, 3);
  const e = ease(p);
  const inv = 1 - e;
  let transform = "none";
  let origin = "center center";
  if (variant === "zoomOut") { transform = `scale(${1 + 0.06 * intensity * inv})`; origin = "center top"; }
  else if (variant === "zoomIn") { transform = `scale(${1 - 0.07 * intensity * inv})`; }
  else if (variant === "left") { transform = `translate3d(${56 * intensity * inv}px,0,0)`; }
  else if (variant === "up") { transform = `translate3d(0,${52 * intensity * inv}px,0)`; }

  const st: CSSProperties = { transform, transformOrigin: origin, opacity: 0.4 + 0.6 * e, willChange: "transform, opacity", ...style };
  return createElement(as, { ref, className, style: st }, children);
}

// ════════════════════════════════════════════════════════════
// ScrollProgress — top accent bar + live %
// ════════════════════════════════════════════════════════════
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const pctRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      if (pctRef.current) pctRef.current.textContent = String(Math.round(p * 100)).padStart(2, "0") + "%";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <div className="scroll-progress" aria-hidden="true">
      <div className="scroll-progress-bar" ref={barRef} />
      <div className="scroll-progress-pct" ref={pctRef}>00%</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ZoomScroll — cinematic edge-based zoom transition
// ════════════════════════════════════════════════════════════
interface ZoomScrollProps { children?: ReactNode; className?: string; as?: ElementType; from?: number; style?: CSSProperties }
export function ZoomScroll({ children, className = "", as = "div", from = 0.86, style }: ZoomScrollProps) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED) return;
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const mob = IS_MOBILE();
    const fromEff = mob ? Math.max(0.96, from) : Math.max(0.93, from);
    const oLo = mob ? 0.55 : 0.22, oHi = mob ? 0.45 : 0.78, bMax = mob ? 1 : 2.5;
    const OFF = mob ? 26 : 64; // vertical slide distance: rise in on enter, drift up on exit

    // Cache the element's document offset (parallax-engine style) so the
    // scroll path is pure arithmetic — no getBoundingClientRect, no React
    // re-render, no layout thrash on fast scrolls. Styles are written
    // straight to the node.
    let docTop = 0, docBot = 0, last = -1;
    const measure = () => {
      const prev = el.style.transform;
      el.style.transform = "none"; // read un-transformed geometry
      const r = el.getBoundingClientRect();
      el.style.transform = prev;
      const sc = window.scrollY || 0;
      docTop = sc + r.top;
      docBot = sc + r.bottom;
    };
    const paint = () => {
      const vh = window.innerHeight || 1;
      const sc = window.scrollY || 0;
      const topRel = (docTop - sc) / vh;
      const botRel = (docBot - sc) / vh;
      const enterT = Math.max(0, Math.min(1, (1 - topRel) / 0.75));
      const exitT = Math.max(0, Math.min(1, botRel / 0.75));
      const exiting = exitT < enterT;          // leaving via the top vs entering from below
      const t = ease(Math.min(enterT, exitT));
      if (Math.abs(t - last) < 0.002) return;
      last = t;
      const scale = fromEff + (1 - fromEff) * t;
      // Rise into place from below on enter (+OFF→0), then keep drifting up on
      // exit (0→−OFF). With the fade this pulls neighbours apart vertically so
      // they don't pile up / overlap mid-transition.
      const slide = (exiting ? -1 : 1) * (1 - t) * OFF;
      el.style.transform = `translate3d(0, ${slide.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
      el.style.opacity = (oLo + oHi * t).toFixed(3);
      el.style.filter = bMax ? `blur(${((1 - t) * bMax).toFixed(2)}px)` : "";
    };
    const onResize = () => { measure(); paint(); };
    measure(); paint();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", paint, { passive: true });
    setTimeout(onResize, 300); // re-measure after fonts/layout settle
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", paint);
    };
  }, [from]);

  const st: CSSProperties = REDUCED ? { ...style } : {
    transformOrigin: "center center",
    willChange: "transform, opacity, filter",
    ...style,
  };
  return createElement(as, { ref, className, style: st }, children);
}

// ════════════════════════════════════════════════════════════
// StartupIntro — full-screen loader shown ONCE per session
// ════════════════════════════════════════════════════════════
export function StartupIntro() {
  const [phase, setPhase] = useState<"counting" | "wipe" | "gone">("counting");
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (REDUCED) { setPhase("gone"); return; }
    // The intro exists to mask font loading with a moment of theatre; a
    // returning visitor this session already has warm fonts — skip straight in.
    try {
      if (sessionStorage.getItem("iw_seen_intro")) { setPhase("gone"); return; }
    } catch { /* private mode — always play it */ }
    document.documentElement.style.overflow = "hidden";
    getLenis()?.stop();

    // Hold the intro until web fonts are actually ready, so the hero is never
    // revealed in a fallback face (which would flash + reflow on swap). The bar
    // fills toward the top, then waits there until the fonts land. A safety cap
    // guarantees we never hang on a slow/failed font fetch.
    let fontsReady = false;
    const markReady = () => { fontsReady = true; };
    const fontsP = (typeof document !== "undefined" && document.fonts)
      ? document.fonts.ready : Promise.resolve();
    fontsP.then(markReady).catch(markReady);
    const safety = setTimeout(markReady, 5000);

    const minDur = 500;
    const t0 = Date.now();
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    let done = false;
    const id = setInterval(() => {
      const prog = Math.min(1, (Date.now() - t0) / minDur);
      const cap = fontsReady ? 1 : 0.9; // hold near the top until fonts are ready
      setPct(Math.round(Math.min(cap, ease(prog)) * 100));
      if (prog >= 1 && fontsReady && !done) {
        done = true;
        clearInterval(id);
        clearTimeout(safety);
        setPhase("wipe");
        try { sessionStorage.setItem("iw_seen_intro", "1"); } catch { /* private mode */ }
        setTimeout(() => {
          setPhase("gone");
          document.documentElement.style.overflow = "";
          getLenis()?.start();
          window.scrollTo(0, 0);
        }, 300);
      }
    }, 16);
    return () => { clearInterval(id); clearTimeout(safety); document.documentElement.style.overflow = ""; };
  }, []);

  if (phase === "gone") return null;

  const wordIn = Math.min(1, pct / 12);
  const chromeIn = Math.min(1, pct / 6);

  return (
    <div className={"startup" + (phase === "wipe" ? " startup-wipe" : "")}>
      <span className="su-reg su-tl" style={{ opacity: 0.6 * chromeIn }} />
      <span className="su-reg su-tr" style={{ opacity: 0.6 * chromeIn }} />
      <span className="su-reg su-bl" style={{ opacity: 0.6 * chromeIn }} />
      <span className="su-reg su-br" style={{ opacity: 0.6 * chromeIn }} />
      <div className="su-top mono" style={{ opacity: chromeIn }}>
        <span>{COPY.startup.topLeft}</span>
        <span>{COPY.startup.topRight}</span>
      </div>
      <div className="su-center">
        <div className="su-word serif" style={{ opacity: wordIn, transform: `translateY(${(1 - wordIn) * 26}px)` }}>
          {COPY.startup.wordPre}<span className="it">{COPY.startup.wordEm}</span>
        </div>
        <div className="su-bar">
          <div className="su-bar-fill" style={{ width: pct + "%" }} />
        </div>
      </div>
      <div className="su-bottom mono" style={{ opacity: chromeIn }}>
        <span>{COPY.startup.loading}</span>
        <span className="su-count">{String(pct).padStart(3, "0")}<span className="su-pct">%</span></span>
      </div>
    </div>
  );
}

// ── Lenis smooth scroll init ─────────────────────────────────
export function initLenis() {
  if (typeof window === "undefined" || REDUCED) return;
  // Touch devices scroll natively — Lenis only smooths the wheel, so skip it
  // on coarse pointers to keep momentum/inertia scrolling perfectly native.
  if (window.matchMedia?.("(pointer: coarse)").matches) return;
  if (getLenis()) return;
  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, touchMultiplier: 1.5, smoothWheel: true });
  setLenis(lenis);
  const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  setTimeout(() => parallaxEngine.recalc(), 120);
}
