// ════════════════════════════════════════════════════════════
// INTERACTIONS — premium micro-interaction layer
//   CornerMarks   crop/registration brackets that draw into the
//                 four corners of a section on reveal, and lock
//                 brighter as the cursor approaches.
//   Magnetic      cursor-gravity wrapper — pulls a target toward
//                 the pointer within reach, springs back on exit.
// On-brand with the specimen-sheet registration-mark language.
// Honours reduced-motion + mobile (both degrade to static).
// ════════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { REDUCED, IS_MOBILE, useReveal } from "./motion";

// ── CornerMarks ─────────────────────────────────────────────
// Drop inside any `position: relative` block. Brackets draw in
// when the block scrolls into view; proximity to the cursor
// lifts them from a resting glow to full accent ("lock-on").
export function CornerMarks({ inset = 14 }: { inset?: number }) {
  const [ref, shown] = useReveal<HTMLDivElement>(0.1);

  useEffect(() => {
    if (REDUCED || IS_MOBILE()) return;
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    let raf = 0;
    let near = 0, target = 0;
    let mx = -1, my = -1, tracking = false;
    // Cache the host's document offset so the per-frame proximity check is
    // pure arithmetic (no getBoundingClientRect → no layout thrash on
    // scroll). Re-measured only when the cursor (re)enters, covering any
    // reflow (e.g. an expanded project row pushing sections down).
    let docL = 0, docT = 0, hw = 0, hh = 0;
    const measure = () => {
      const r = host.getBoundingClientRect();
      docL = r.left + window.scrollX; docT = r.top + window.scrollY; hw = r.width; hh = r.height;
    };
    const tick = () => {
      if (tracking) {
        const left = docL - window.scrollX, top = docT - window.scrollY;
        const dx = Math.max(left - mx, 0, mx - (left + hw));
        const dy = Math.max(top - my, 0, my - (top + hh));
        target = Math.max(0, 1 - Math.hypot(dx, dy) / 260);
      }
      near += (target - near) * 0.12;
      el.style.setProperty("--cm-lock", near.toFixed(3));
      // idle out: nothing to animate and cursor not engaging → stop the loop
      // (saves 6 forever-running rAF loops); a mousemove kicks it back.
      if (!tracking && near < 0.001 && target < 0.001) { raf = 0; return; }
      raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onMove = (e: MouseEvent) => { if (!tracking) measure(); mx = e.clientX; my = e.clientY; tracking = true; kick(); };
    const onLeave = () => { tracking = false; target = 0; kick(); };
    measure();
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);

  return (
    <div
      className="corner-marks"
      ref={ref}
      data-shown={shown}
      style={{ inset }}
      aria-hidden="true"
    >
      <span className="cm tl" />
      <span className="cm tr" />
      <span className="cm bl" />
      <span className="cm br" />
    </div>
  );
}

// ── Magnetic ────────────────────────────────────────────────
// Wrap an interactive element. Within `radius` of its centre the
// child eases toward the pointer by `strength`; releases on exit.
interface MagneticProps {
  children: ReactNode;
  strength?: number;
  radius?: number;
  className?: string;
}
export function Magnetic({
  children,
  strength = 0.35,
  radius = 70,
  className = "",
}: MagneticProps) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (REDUCED || IS_MOBILE()) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = 0, ty = 0, x = 0, y = 0;
    let active = false;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const reach = Math.max(r.width, r.height) / 2 + radius;
      if (Math.hypot(dx, dy) < reach) {
        tx = dx * strength;
        ty = dy * strength;
        active = true;
        kick();
      } else if (active) {
        tx = 0; ty = 0; active = false;
        kick();
      }
    };
    // pointer leaving the window must release the element, otherwise
    // it stays displaced at its last pulled position.
    const onLeave = () => { tx = 0; ty = 0; active = false; kick(); };
    const tick = () => {
      const dx = tx - x;
      const dy = ty - y;
      x += dx * 0.15;
      y += dy * 0.15;
      el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
      if (active || Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength, radius]);

  return (
    <span ref={ref} className={"magnetic" + (className ? " " + className : "")}>
      {children}
    </span>
  );
}

// ── ScrambleText ────────────────────────────────────────────
// Decodes its text from random instrument glyphs when it scrolls
// into view, and re-scrambles on hover. Width stays stable because
// it only ever renders the original character count.
const SCRAMBLE_GLYPHS = "▖▘▝▗▚▞01234567/§·×#%";
export function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [out, setOut] = useState(text);
  const [ref, shown] = useReveal<HTMLSpanElement>(0.4);
  const raf = useRef(0);

  const run = useCallback(() => {
    if (REDUCED) return; // `out` already holds the final text
    const start = performance.now();
    const dur = 620;
    const step = () => {
      const p = Math.min(1, (performance.now() - start) / dur);
      const revealCount = Math.floor(p * text.length);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        s += ch === " " || i < revealCount
          ? ch
          : SCRAMBLE_GLYPHS[(Math.random() * SCRAMBLE_GLYPHS.length) | 0];
      }
      setOut(s);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else setOut(text);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
  }, [text]);

  useEffect(() => { if (shown) run(); }, [shown, run]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <span ref={ref} className={className} onMouseEnter={run} onClick={run} style={{ cursor: "pointer" }}>
      {out}
    </span>
  );
}

// ── AccentSpotlight ─────────────────────────────────────────
// Drives the --accent-grad spotlight on accent text (see specimen.css).
// The gradient is element-local, so we hand each accent word the cursor in ITS
// own coordinate space (--lx/--ly) — that keeps the centre exactly under the
// pointer even though the words sit inside transformed Parallax/Reveal/Type
// wrappers (a viewport-fixed background would anchor to those transforms and
// drift off-centre). Per frame: read every word's rect, then write coords only
// to the ones within reach; words that just left range get reset. rAF-coalesced
// and only runs while the mouse moves. Pointer-less devices never fire → flat
// accent, exactly as wanted.
// Keep in sync with the gradient rule in specimen.css.
const ACCENT_SEL = [
  ".grad-accent", ".wordmark .it", ".su-word .it",
  ".tagline em", ".tagline .tag-em", ".sec-title .it", ".sec-hint.on",
  ".masthead-greet", ".bio em", ".bio .tag-em", ".contact-display .it",
  ".contact-row:hover .arrow-big", ".proj-summary-l p em", ".proj-summary-l .tag-em",
  ".panel-title .it", ".tldr-modal h3 em", ".tag.tag-w5", ".tag:hover",
  ".bar-row.bar-active .bar-label", ".bar-row.bar-active .bar-value",
  ".heatmap-detail", ".heatmap-detail strong",
  ".filter-pill strong", ".toast-speed",
].join(",");
const SPOT_R = 340; // keep in sync with the gradient radius in specimen.css

export function AccentSpotlight() {
  useEffect(() => {
    // Intentionally NOT gated on REDUCED — it's a subtle cursor-driven colour
    // shift, not page motion, and pointer-less devices simply never trigger it.
    let raf = 0, mx = 0, my = 0, seen = false, lastMove = 0;
    const active = new Set<HTMLElement>();
    // Per-element CURRENT spotlight coords (local space). We ease these toward
    // the target each frame so the gradient glides to a new spot instead of
    // snapping — most visible after a scroll, when the word's rect jumps and the
    // target local coord shifts. Easing the cursor wouldn't fix that (the jump
    // comes from the rect, not the pointer), so we ease the per-element coord.
    const EASE = 0.2;
    const pos = new Map<HTMLElement, { x: number; y: number }>();
    const apply = () => {
      raf = 0;
      if (!seen) return; // no cursor yet → leave everything flat accent
      // Queried fresh each pass on purpose: accent nodes get replaced by React
      // (the per-second masthead clock, the typewriter wordmark, opened modals),
      // so a cached NodeList would hold stale refs. ~25 nodes is cheap enough.
      const els = document.querySelectorAll<HTMLElement>(ACCENT_SEL);
      const rects: DOMRect[] = [];
      els.forEach((el) => rects.push(el.getBoundingClientRect())); // read pass
      const next = new Set<HTMLElement>();
      let easing = false;
      els.forEach((el, i) => {                                     // write pass
        const r = rects[i];
        if (mx >= r.left - SPOT_R && mx <= r.right + SPOT_R && my >= r.top - SPOT_R && my <= r.bottom + SPOT_R) {
          const tx = mx - r.left, ty = my - r.top;
          let cur = pos.get(el);
          if (!cur) {
            cur = { x: tx, y: ty };   // entering range → snap in (no fly-from-edge)
            pos.set(el, cur);
          } else {
            cur.x += (tx - cur.x) * EASE;
            cur.y += (ty - cur.y) * EASE;
            if (Math.abs(tx - cur.x) > 0.5 || Math.abs(ty - cur.y) > 0.5) easing = true;
            else { cur.x = tx; cur.y = ty; }
          }
          el.style.setProperty("--lx", cur.x.toFixed(1) + "px");
          el.style.setProperty("--ly", cur.y.toFixed(1) + "px");
          next.add(el);
        }
      });
      active.forEach((el) => {
        if (!next.has(el)) { el.style.removeProperty("--lx"); el.style.removeProperty("--ly"); pos.delete(el); }
      });
      active.clear();
      next.forEach((el) => active.add(el));
      if (easing) raf = requestAnimationFrame(apply); // keep gliding until settled
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(apply); };
    const clear = () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      active.forEach((el) => { el.style.removeProperty("--lx"); el.style.removeProperty("--ly"); });
      active.clear();
      pos.clear();
    };

    // ── Mobile / touch ──────────────────────────────────────
    // No cursor to drive the spotlight, so anchor it to a fixed band in the
    // upper third of the viewport and recompute on scroll. Accent words light
    // up as they scroll up into the band and fade back to flat toward the
    // bottom of the screen — so the gradient rides the scroll. Same per-element
    // mechanism, just with a virtual (scroll-fixed) anchor instead of a cursor.
    if (window.matchMedia?.("(pointer: coarse)").matches) {
      const place = () => {
        mx = window.innerWidth / 2;
        my = window.innerHeight * 0.32;
        seen = true;
        schedule();
      };
      place();
      window.addEventListener("scroll", place, { passive: true });
      window.addEventListener("resize", place, { passive: true });
      return () => {
        window.removeEventListener("scroll", place);
        window.removeEventListener("resize", place);
        clear();
      };
    }

    // ── Desktop ─────────────────────────────────────────────
    // The spotlight follows the pointer. Two scroll cases:
    //  • scroll WHILE moving the mouse → recompute, so the spotlight stays glued
    //    to the cursor with fresh rects (and the rAF the mousemove queued isn't
    //    cancelled — that race was the old flicker bug).
    //  • idle scroll (pointer still) → do NOTHING. --lx/--ly are element-local,
    //    so leaving them be keeps the gradient locked to the same spot on the
    //    word; it just rides along as the word scrolls, instead of vanishing.
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; seen = true; lastMove = performance.now(); schedule(); };
    const onScroll = () => { if (performance.now() - lastMove < 150) schedule(); };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", clear, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", clear);
      clear();
    };
  }, []);
  return null;
}
