// ════════════════════════════════════════════════════════════
// InteractiveBG — physics dot-field canvas background.
//  • every dot is a spring (pos+vel) → organic wobble, not snap
//  • pointer repels AND swirls dots based on cursor velocity
//  • motion leaves a fading WAKE; lit dots link into constellation lines
//  • click/tap = ripple shock; touch + scroll drive it on mobile
//  • ambient breathing shimmer when idle
// Ported from the Claude Design handoff (bg.jsx).
// ════════════════════════════════════════════════════════════
import { useEffect, useRef } from "react";
import { setRippleFn } from "./runtime";

type RGB = [number, number, number];
interface Dot { bx: number; by: number; x: number; y: number; vx: number; vy: number; lit: number; breathe: number }
interface WakePoint { x: number; y: number; t0: number; vx: number; vy: number }
interface Ripple { x: number; y: number; t0: number }

function resolveRGB(varName: string, fallback: RGB): RGB {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (!raw) return fallback;
    const probe = document.createElement("span");
    probe.style.color = raw; probe.style.display = "none";
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    const m = c.match(/\d+(\.\d+)?/g);
    return m ? [Math.round(+m[0]), Math.round(+m[1]), Math.round(+m[2])] : fallback;
  } catch { return fallback; }
}

export function InteractiveBG() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1, spacing = 46;
    let dots: Dot[] = [], cols = 0, rows = 0;
    let mx = -9999, my = -9999;
    let tmx = -9999, tmy = -9999;
    let pvx = 0, pvy = 0;
    let lastPX: number | null = null, lastPY = 0, lastPT = 0;
    let wake: WakePoint[] = [];
    let ripples: Ripple[] = [];
    let accent: RGB = [80, 120, 245], ink: RGB = [150, 150, 160];
    let raf = 0, frame = 0, idleFrames = 0;
    let scrollE = 0, lastSc = 0;
    const mobile = () => window.innerWidth <= 640;

    function readColors() {
      accent = resolveRGB("--accent", [80, 120, 245]);
      ink = resolveRGB("--ink-3", [150, 150, 160]);
    }

    function build() {
      dots = [];
      cols = Math.ceil(w / spacing) + 1;
      rows = Math.ceil(h / spacing) + 1;
      const ox = (w - (cols - 1) * spacing) / 2;
      const oy = (h - (rows - 1) * spacing) / 2;
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++)
          dots.push({ bx: ox + i * spacing, by: oy + j * spacing, x: ox + i * spacing, y: oy + j * spacing, vx: 0, vy: 0, lit: 0, breathe: 0 });
    }

    function resize() {
      // Cap DPR well below the device max — the canvas backing store is
      // width·dpr × height·dpr × 4 bytes, so 2.0 → 1.5 roughly halves it.
      dpr = Math.min(mobile() ? 1.25 : 1.5, window.devicePixelRatio || 1);
      w = window.innerWidth; h = window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      spacing = mobile() ? 50 : 56; // sparser grid → fewer dots to simulate
      build(); readColors();
    }

    const R = 300, R2 = R * R;

    function physics(now: number) {
      mx += (tmx - mx) * 0.22;
      my += (tmy - my) * 0.22;
      const speed = Math.min(60, Math.hypot(pvx, pvy));
      const swirlK = Math.min(1, speed / 26);
      scrollE *= 0.92;
      wake = wake.filter((p) => now - p.t0 < 650);
      ripples = ripples.filter((r) => now - r.t0 < 1100);
      const breathe = Math.sin(now * 0.0006) * 0.5 + 0.5;

      for (let n = 0; n < dots.length; n++) {
        const d = dots[n];
        let fx = 0, fy = 0, lit = 0;

        const dx = d.x - mx, dy = d.y - my;
        const dd2 = dx * dx + dy * dy;
        if (dd2 < R2) {
          const dist = Math.sqrt(dd2) || 0.001;
          const f = 1 - dist / R, fe = f * f;
          fx += (dx / dist) * fe * 2.4;
          fy += (dy / dist) * fe * 2.4;
          const cross = (pvx * dy - pvy * dx) > 0 ? 1 : -1;
          fx += (-dy / dist) * fe * swirlK * 2.6 * cross;
          fy += (dx / dist) * fe * swirlK * 2.6 * cross;
          lit = Math.max(lit, fe * (0.7 + 0.5 * swirlK));
        }

        for (let k = 0; k < wake.length; k++) {
          const p = wake[k];
          const age = (now - p.t0) / 650;
          const wdx = d.x - p.x, wdy = d.y - p.y;
          const wd2 = wdx * wdx + wdy * wdy;
          const WR = 120;
          if (wd2 < WR * WR) {
            const wd = Math.sqrt(wd2) || 0.001;
            const wf = (1 - wd / WR) * (1 - age);
            fx += (p.vx * 0.05 + (wdx / wd) * 0.5) * wf;
            fy += (p.vy * 0.05 + (wdy / wd) * 0.5) * wf;
            lit = Math.max(lit, wf * 0.5);
          }
        }

        for (let k = 0; k < ripples.length; k++) {
          const rp = ripples[k];
          const age = (now - rp.t0) / 1100;
          const ringR = age * 430;
          const rdx = d.x - rp.x, rdy = d.y - rp.y;
          const rd = Math.hypot(rdx, rdy) || 0.001;
          const diff = Math.abs(rd - ringR);
          if (diff < 50) {
            const infl = (1 - diff / 50) * (1 - age);
            fx += (rdx / rd) * infl * 4.4;
            fy += (rdy / rd) * infl * 4.4;
            lit = Math.max(lit, infl);
          }
        }

        if (scrollE > 0.4) {
          fx += Math.sin(d.by * 0.02 + now * 0.004) * scrollE * 0.06;
          fy += Math.cos(d.bx * 0.018 + now * 0.005) * scrollE * 0.08;
          lit = Math.max(lit, Math.min(0.3, scrollE * 0.012));
        }

        fx += (d.bx - d.x) * 0.045;
        fy += (d.by - d.y) * 0.045;
        d.vx = (d.vx + fx) * 0.86;
        d.vy = (d.vy + fy) * 0.86;
        d.x += d.vx; d.y += d.vy;
        d.lit += (lit - d.lit) * 0.25;
        d.breathe = breathe;
      }
    }

    function render() {
      ctx!.clearRect(0, 0, w, h);
      ctx!.lineWidth = 1;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const d = dots[j * cols + i];
          if (d.lit < 0.18) continue;
          if (i + 1 < cols) {
            const r1 = dots[j * cols + i + 1];
            const a = Math.min(d.lit, r1.lit) * 0.55;
            if (a > 0.05) { ctx!.strokeStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${a.toFixed(3)})`; ctx!.beginPath(); ctx!.moveTo(d.x, d.y); ctx!.lineTo(r1.x, r1.y); ctx!.stroke(); }
          }
          if (j + 1 < rows) {
            const r2 = dots[(j + 1) * cols + i];
            const a = Math.min(d.lit, r2.lit) * 0.55;
            if (a > 0.05) { ctx!.strokeStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${a.toFixed(3)})`; ctx!.beginPath(); ctx!.moveTo(d.x, d.y); ctx!.lineTo(r2.x, r2.y); ctx!.stroke(); }
          }
        }
      }
      for (let n = 0; n < dots.length; n++) {
        const d = dots[n];
        const base = 0.13 + d.breathe * 0.05;
        const a = Math.min(0.95, base + d.lit * 0.8);
        const rad = 1 + d.lit * 3.2;
        const t = Math.min(1, d.lit * 1.35);
        const cr = Math.round(ink[0] + (accent[0] - ink[0]) * t);
        const cg = Math.round(ink[1] + (accent[1] - ink[1]) * t);
        const cb = Math.round(ink[2] + (accent[2] - ink[2]) * t);
        ctx!.fillStyle = `rgba(${cr},${cg},${cb},${a.toFixed(3)})`;
        ctx!.beginPath(); ctx!.arc(d.x, d.y, rad, 0, 6.2832); ctx!.fill();
      }
    }

    function loop() {
      const now = performance.now();
      // When nothing is happening (no pointer, wake, ripples or scroll),
      // drop to ~30fps — the ambient breathe stays smooth but CPU halves.
      const active = wake.length > 0 || ripples.length > 0 || scrollE > 0.4
        || (Math.abs(pvx) + Math.abs(pvy)) > 0.4 || tmx > -9999;
      idleFrames = active ? 0 : idleFrames + 1;
      if (!(idleFrames > 24 && (frame & 1))) { physics(now); render(); }
      pvx *= 0.9; pvy *= 0.9;
      if (frame++ % 120 === 0) readColors();
      raf = requestAnimationFrame(loop);
    }

    function feedPointer(x: number, y: number) {
      const now = performance.now();
      if (lastPX !== null) {
        const dt = Math.max(8, now - lastPT);
        pvx = pvx * 0.5 + ((x - lastPX) / dt) * 16 * 0.5;
        pvy = pvy * 0.5 + ((y - lastPY) / dt) * 16 * 0.5;
        wake.push({ x, y, t0: now, vx: pvx, vy: pvy });
        if (wake.length > 22) wake.shift();
      }
      lastPX = x; lastPY = y; lastPT = now;
      tmx = x; tmy = y;
    }

    // public hook so quirks can fire ripples (double-click bursts, konami storm)
    setRippleFn((x: number, y: number) => {
      ripples.push({ x, y, t0: performance.now() });
      if (ripples.length > 10) ripples.shift();
    });

    const onPointerMove = (e: MouseEvent) => feedPointer(e.clientX, e.clientY);
    const onPointerDown = (e: MouseEvent) => {
      ripples.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
      if (ripples.length > 6) ripples.shift();
    };
    const onLeave = () => { tmx = -9999; tmy = -9999; lastPX = null; };
    const onTouchMove = (e: TouchEvent) => { const t = e.touches[0]; if (t) feedPointer(t.clientX, t.clientY); };
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) { feedPointer(t.clientX, t.clientY); ripples.push({ x: t.clientX, y: t.clientY, t0: performance.now() }); }
    };
    const onTouchEnd = () => { setTimeout(onLeave, 350); };
    const onScroll = () => {
      const sc = window.scrollY || 0;
      scrollE = Math.min(30, scrollE + Math.abs(sc - lastSc) * 0.12);
      lastSc = sc;
    };

    resize();
    if (reduce) { render(); return () => setRippleFn(null); }

    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    window.addEventListener("iw-theme", readColors); // instant recolor on theme flip
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      window.removeEventListener("iw-theme", readColors);
      cancelAnimationFrame(raf);
      setRippleFn(null);
    };
  }, []);

  return <canvas className="bg-canvas" ref={canvasRef} aria-hidden="true" />;
}
