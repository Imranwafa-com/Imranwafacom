// ════════════════════════════════════════════════════════════
// MICROTAPS — "tap the things that usually do nothing" layer
//   Tap         polymorphic wrapper that wakes up otherwise-inert
//               editorial elements: a ripple at the click point, a
//               little quip, optional clipboard copy, press feedback.
//   MicroToast  single shared toast that any Tap (or emitTap) drives.
//   emitTap     fire a toast from anywhere without a <Tap> wrapper.
// Honours reduced-motion (skips the ripple, keeps the quip).
// ════════════════════════════════════════════════════════════
import { createElement, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { fireRipple } from "./runtime";
import { REDUCED } from "./motion";

const MICRO_EVENT = "iw-micro";

// Fire a micro-toast from anywhere.
export function emitTap(msg: string) {
  window.dispatchEvent(new CustomEvent(MICRO_EVENT, { detail: msg }));
}

// ── Tap ─────────────────────────────────────────────────────
// Makes any element react to a click/tap. `msg` may be a single
// line or a list to cycle through. `copy` writes to the clipboard
// (and, if no msg is given, announces the copy).
type TapEl = "span" | "div" | "td" | "li" | "p" | "strong";
interface TapProps {
  children: ReactNode;
  msg?: string | string[];
  copy?: string;
  className?: string;
  as?: TapEl;
  ripple?: boolean;
  title?: string;
  onTap?: (e: React.MouseEvent) => void;
}

export function Tap({
  children,
  msg,
  copy,
  className = "",
  as = "span",
  ripple = true,
  title,
  onTap,
}: TapProps) {
  const turn = useRef(0);

  const handle = (e: React.MouseEvent) => {
    if (ripple && !REDUCED) fireRipple(e.clientX, e.clientY);

    if (copy) {
      try { navigator.clipboard?.writeText(copy); } catch { /* noop */ }
    }

    let line: string | undefined;
    if (Array.isArray(msg)) {
      line = msg[turn.current % msg.length];
      turn.current++;
    } else if (msg) {
      line = msg;
    } else if (copy) {
      line = `copied — ${copy}`;
    }
    if (line) emitTap(line);

    // brief press flash
    const el = e.currentTarget as HTMLElement;
    el.classList.add("tapped");
    window.setTimeout(() => el.classList.remove("tapped"), 320);

    onTap?.(e);
  };

  return createElement(
    as,
    { className: ("tap " + className).trim(), onClick: handle, title },
    children
  );
}

// ── MicroToast ──────────────────────────────────────────────
export function MicroToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const tmr = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const onMsg = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setMsg(detail);
      clearTimeout(tmr.current);
      tmr.current = setTimeout(() => setMsg(null), 2400);
    };
    window.addEventListener(MICRO_EVENT, onMsg);
    return () => { window.removeEventListener(MICRO_EVENT, onMsg); clearTimeout(tmr.current); };
  }, []);
  if (!msg) return null;
  return <div className="micro-toast" key={msg}>{msg}</div>;
}
