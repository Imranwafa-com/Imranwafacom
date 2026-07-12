// ════════════════════════════════════════════════════════════
// Showcase — pinned scroll-driven 3D scenes for the top three
// personal projects. See scenes.tsx for the 3D side.
//
// Scroll model: the section maps to 9 discrete STAGES (3 projects
// × 3 phases). Raw scroll picks a *target* stage with hysteresis,
// and a slightly-underdamped spring eases the displayed value
// toward it — so scrolling has a bit of resistance on each stage,
// then glides to the next instead of tracking the thumb 1:1.
// Native scrolling is never hijacked.
//
// Scroll-perf: offsets are cached (measure on width-resize only),
// the scroll listener is arithmetic + ref writes, and React state
// changes only on the 9 discrete stage transitions.
// ════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { COPY } from "../copy";
import { REDUCED } from "../motion";
import { currentTheme, THEME_EVENT } from "../theme";
import {
  Ambience, HomelabScene, RackMotionScene, K8sScene,
  makePalette, STAGES, type Palette,
} from "./scenes";

const SC = COPY.showcase;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// ── Spring-damped stage driver ──────────────────────────────
// One spring for everything: scenes read sRef each frame.
function StageSpring({ targetRef, sRef }: { targetRef: React.RefObject<number>; sRef: React.RefObject<number> }) {
  const vel = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const x = sRef.current, t = targetRef.current;
    // stiffness/damping tuned for "resistance, then glide": settles in
    // ~0.7s with a whisper of overshoot so the snap feels physical.
    vel.current += (t - x) * 46 * dt;
    vel.current *= Math.exp(-9.2 * dt);
    sRef.current = x + vel.current * dt;
  });
  return null;
}

function SceneRoot({ targetRef, theme }: { targetRef: React.RefObject<number>; theme: string }) {
  const sRef = useRef(targetRef.current);
  // resolveRGB probes the DOM — one read at mount, refreshed per theme flip.
  const [pal, setPal] = useState<Palette>(makePalette);
  useEffect(() => { setPal(makePalette()); }, [theme]);
  return (
    <>
      <StageSpring targetRef={targetRef} sRef={sRef} />
      <Ambience pal={pal} />
      <HomelabScene sRef={sRef} pal={pal} />
      <RackMotionScene sRef={sRef} pal={pal} />
      <K8sScene sRef={sRef} pal={pal} />
    </>
  );
}

// ── Reduced-motion / no-3D fallback: plain stacked blocks ───
function StaticShowcase() {
  return (
    <div className="showcase-static">
      {SC.projects.map((pr) => (
        <div className="sc-panel" key={pr.kicker}>
          <div className="sc-kicker mono">{pr.kicker}</div>
          <h3 className="sc-title serif">{pr.title}</h3>
          {pr.phases.map((ph) => (
            <p className="sc-phase-body" key={ph.h}><strong>{ph.h}</strong> {ph.body}</p>
          ))}
          <div className="sc-specs">
            {pr.specs.map(([k, v]) => <div className="row" key={k}><span>{k}</span><span>{v}</span></div>)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Live showcase — sticky viewport + stage-snap canvas ─────
function LiveShowcase() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef(0); // integer stage 0..8
  const [phaseKey, setPhaseKey] = useState(0); // mirrors targetRef for the panel
  const [vis, setVis] = useState(false);
  const [booted, setBooted] = useState(false); // latches true on first visibility
  const [theme, setThemeS] = useState(currentTheme());

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<string>).detail;
      if (d === "paper" || d === "carbon") setThemeS(d);
    };
    window.addEventListener(THEME_EVENT, on);
    return () => window.removeEventListener(THEME_EVENT, on);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // Cached-offset pattern (see motion.tsx): measure on width-resize only,
    // the scroll handler is pure arithmetic + a ref write. setState fires
    // only on the discrete stage transitions.
    let top = 0, span = 1, lastKey = -1, lastW = window.innerWidth;
    const measure = () => {
      const r = el.getBoundingClientRect();
      top = (window.scrollY || 0) + r.top;
      span = Math.max(1, el.offsetHeight - window.innerHeight);
    };
    const onScroll = () => {
      const raw = clamp01(((window.scrollY || 0) - top) / span) * (STAGES - 0.0001);
      // Hysteresis: hold the current stage until scroll clearly commits
      // past the midpoint — the "little bit of resistance".
      const t = targetRef.current;
      if (Math.abs(raw - t) > 0.58) targetRef.current = Math.max(0, Math.min(STAGES - 1, Math.round(raw)));
      const k = targetRef.current;
      if (k !== lastKey) { lastKey = k; setPhaseKey(k); }
    };
    // iOS fires resize when the address bar collapses mid-scroll — only
    // re-measure on width changes so rect reads stay off the scroll path.
    const onResize = () => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      measure(); onScroll();
    };
    measure();
    // initial: land exactly on the stage under the current scroll position
    targetRef.current = Math.max(0, Math.min(STAGES - 1, Math.round(clamp01(((window.scrollY || 0) - top) / span) * (STAGES - 0.0001))));
    setPhaseKey(targetRef.current);
    lastKey = targetRef.current;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const io = new IntersectionObserver(([e]) => {
      setVis(e.isIntersecting);
      if (e.isIntersecting) setBooted(true);
    }, { rootMargin: "50% 0px" });
    io.observe(el);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      io.disconnect();
    };
  }, []);

  const proj = SC.projects[Math.floor(phaseKey / 3)];
  const phase = proj.phases[phaseKey % 3];

  return (
    // 100%: fills the fixed-height reservation made by ShowcaseMount
    <div className="showcase" ref={wrapRef} style={{ height: "100%" }}>
      <div className="sc-sticky">
        {/* the panel node stays mounted (screen readers keep their place);
            only the changed text blocks are keyed to re-run the fade */}
        <div className="sc-panel">
          <div className="sc-fade" key={proj.kicker}>
            <div className="sc-kicker mono">{proj.kicker}</div>
            <h3 className="sc-title serif">{proj.title}</h3>
          </div>
          <div className="sc-fade" key={phaseKey}>
            <div className="sc-phase-h">{phase.h}</div>
            <p className="sc-phase-body">{phase.body}</p>
          </div>
          <div className="sc-fade" key={proj.kicker + "s"}>
            <div className="sc-specs">
              {proj.specs.map(([k, v]) => <div className="row" key={k}><span>{k}</span><span>{v}</span></div>)}
            </div>
          </div>
          <div className="sc-steps" aria-hidden="true">
            {[0, 1, 2].map((s) => <span key={s} className={"sc-step" + (s === phaseKey % 3 ? " on" : "")} />)}
          </div>
          <div className="sc-hint mono">{SC.hint}</div>
        </div>
        {/* Canvas stays mounted once visible — unmounting kills the WebGL
            context and remount jank lands mid-scroll. frameloop pauses it. */}
        <div className="sc-stage" aria-hidden="true">
          {booted && (
            <Canvas dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0.9, 9.4], fov: 38 }}
              frameloop={vis ? "always" : "never"}>
              <SceneRoot targetRef={targetRef} theme={theme} />
            </Canvas>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Showcase() {
  return REDUCED ? <StaticShowcase /> : <LiveShowcase />;
}
