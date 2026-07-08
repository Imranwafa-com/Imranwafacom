// ════════════════════════════════════════════════════════════
// QUIRKS — personality layer
//   TabWatcher       title pleads when you tab away
//   SelectionSnark   selecting a chunk of text gets a comment
//   DoubleClickBurst dbl-click anywhere → dot-field shockwave
//   KonamiEgg        ↑↑↓↓←→←→BA → overdrive mode + ripple storm
//   PanelTilt        3D tilt on dashboard panels (desktop)
//   ShakeShuffle     shaking phone fires ripples (mobile)
// Ported from the Claude Design handoff (quirks.jsx).
// ════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import { fireRipple } from "./runtime";
import { COPY } from "./copy";
import { REDUCED } from "./motion";

// ── TabWatcher ──────────────────────────────────────────────
function TabWatcher() {
  useEffect(() => {
    const orig = document.title;
    const msgs = COPY.quirks.tabAway;
    let i = 0;
    const onVis = () => {
      if (document.hidden) document.title = msgs[i++ % msgs.length];
      else document.title = orig;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); document.title = orig; };
  }, []);
  return null;
}

// ── Quirk toast (shared) ────────────────────────────────────
function useQuirkToast(): [string | null, (m: string, ms?: number) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const tmr = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = (m: string, ms = 2600) => {
    clearTimeout(tmr.current);
    setMsg(m);
    tmr.current = setTimeout(() => setMsg(null), ms);
  };
  return [msg, show];
}

// ── SelectionSnark ──────────────────────────────────────────
function SelectionSnark() {
  const [msg, show] = useQuirkToast();
  const fired = useRef(0);
  useEffect(() => {
    const lines = COPY.quirks.selection;
    const onUp = () => {
      const s = window.getSelection && window.getSelection()?.toString();
      if (s && s.length > 40 && fired.current < 3) {
        show(lines[fired.current % lines.length]);
        fired.current++;
      }
    };
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!msg) return null;
  return <div className="quirk-toast">{msg}</div>;
}

// ── ClickPulse — every single click anywhere ripples ────────
// Makes the whole page feel tactile: a click on any "dead" element
// or empty space sends a ripple through the dot-field. Skips the
// controls that already give their own feedback (.tap handles its
// own ripple; inputs/panels would be distracting).
function ClickPulse() {
  useEffect(() => {
    if (REDUCED) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest("input, textarea, select, .tap, .palette, .twk-panel, .twk-launch, .no-pulse")) return;
      fireRipple(e.clientX, e.clientY);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}

// ── DoubleClickBurst ────────────────────────────────────────
function DoubleClickBurst() {
  useEffect(() => {
    const onDbl = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, input, .palette, .twk-panel")) return;
      fireRipple(e.clientX, e.clientY);
      setTimeout(() => fireRipple(e.clientX, e.clientY), 130);
    };
    document.addEventListener("dblclick", onDbl);
    return () => document.removeEventListener("dblclick", onDbl);
  }, []);
  return null;
}

// ── KonamiEgg ───────────────────────────────────────────────
function KonamiEgg() {
  const [on, setOn] = useState(false);
  const [msg, show] = useQuirkToast();
  useEffect(() => {
    const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let pos = 0;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = (k === seq[pos]) ? pos + 1 : (k === seq[0] ? 1 : 0);
      if (pos === seq.length) {
        pos = 0;
        setOn((v) => !v);
        show(!on ? COPY.quirks.overdriveOn : COPY.quirks.overdriveOff);
        for (let i = 0; i < 8; i++) {
          setTimeout(() => fireRipple(Math.random() * window.innerWidth, Math.random() * window.innerHeight), i * 110);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [on]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    document.documentElement.classList.toggle("overdrive", on);
  }, [on]);
  return (
    <>
      {on && <div className="overdrive-badge mono">{COPY.quirks.overdriveBadge}</div>}
      {msg && <div className="quirk-toast">{msg}</div>}
    </>
  );
}

// ── PanelTilt — 3D tilt on .panel (desktop) ─────────────────
function PanelTilt() {
  useEffect(() => {
    if (window.innerWidth <= 900) return;
    const MAXT = 4;
    const onMove = (e: MouseEvent) => {
      const p = (e.target as HTMLElement).closest<HTMLElement>(".panel");
      if (!p) return;
      const r = p.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      p.style.transform = `perspective(900px) rotateX(${(-py * MAXT).toFixed(2)}deg) rotateY(${(px * MAXT).toFixed(2)}deg) translateZ(0)`;
      p.classList.add("tilting");
    };
    const onOut = (e: MouseEvent) => {
      const p = (e.target as HTMLElement).closest<HTMLElement>(".panel");
      if (!p) return;
      if (p.contains(e.relatedTarget as Node)) return;
      p.style.transform = "";
      p.classList.remove("tilting");
    };
    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);
  return null;
}

// ── ShakeShuffle — shake the phone, stir the field ──────────
function ShakeShuffle() {
  useEffect(() => {
    if (!window.DeviceMotionEvent) return;
    let last = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
      const now = Date.now();
      if (mag > 38 && now - last > 1600) {
        last = now;
        for (let i = 0; i < 5; i++) {
          setTimeout(() => fireRipple(Math.random() * window.innerWidth, Math.random() * window.innerHeight), i * 120);
        }
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, []);
  return null;
}

// ── Bundle ──────────────────────────────────────────────────
export function Quirks() {
  return (
    <>
      <TabWatcher />
      <SelectionSnark />
      <ClickPulse />
      <DoubleClickBurst />
      <KonamiEgg />
      <PanelTilt />
      <ShakeShuffle />
    </>
  );
}
