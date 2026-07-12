// ════════════════════════════════════════════════════════════
// Showcase — pinned scroll-driven 3D scenes for the top three
// personal projects. See scenes.tsx for the 3D side.
//
// Scroll model: the section maps to 9 STAGES (3 projects × 3
// phases). Raw scroll drags a magnetic target between stage stops,
// and monotonic damping eases the displayed value toward it — so
// motion resists, glides, then settles without overshoot.
// Native scrolling is never hijacked.
//
// Scroll-perf: offsets are cached (measure on width-resize only),
// the scroll listener is arithmetic + ref writes, and React state
// changes only on the 9 discrete stage transitions.
// ════════════════════════════════════════════════════════════
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { COPY } from "../copy";
import { REDUCED } from "../motion";
import { THEME_EVENT } from "../theme";
import {
  Ambience, CameraRig, HomelabScene, RackMotionScene, K8sScene,
  makePalette, type Palette,
} from "./scenes";
import {
  STAGES, dampStage, magnetizeStagePosition, panelSideForStage,
  scrollStagePosition, stageFromScroll,
} from "./choreography";

const SC = COPY.showcase;

// ── Damped stage driver ─────────────────────────────────────
// One monotonic value for everything: scenes read sRef each frame.
function StageDriver({ targetRef, sRef }: { targetRef: React.RefObject<number>; sRef: React.RefObject<number> }) {
  const initialized = useRef(false);
  useFrame((_, delta) => {
    if (!initialized.current) {
      initialized.current = true;
      sRef.current = targetRef.current;
      return;
    }
    sRef.current = dampStage(sRef.current, targetRef.current, delta);
  });
  return null;
}

function SceneRoot({ targetRef, pal }: { targetRef: React.RefObject<number>; pal: Palette }) {
  const sRef = useRef(0);
  return (
    <>
      <StageDriver targetRef={targetRef} sRef={sRef} />
      <CameraRig sRef={sRef} />
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
  const targetRef = useRef(0); // continuous magnetic position 0..8
  const [phaseKey, setPhaseKey] = useState(0); // committed stage for the panel
  const [vis, setVis] = useState(() => typeof IntersectionObserver === "undefined");
  const [pal, setPal] = useState<Palette>(makePalette);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<string>).detail;
      if (d === "paper" || d === "carbon") setPal(makePalette());
    };
    window.addEventListener(THEME_EVENT, on);
    return () => window.removeEventListener(THEME_EVENT, on);
  }, []);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // Cached-offset pattern (see motion.tsx): measure on width-resize only,
    // the scroll handler is arithmetic, a ref write, and one short settle
    // timer. React state changes only on the discrete stage transitions.
    let top = 0, span = 1, lastKey = -1, lastW = window.innerWidth, settleTimer = 0, active = true;
    const measure = () => {
      const r = el.getBoundingClientRect();
      top = (window.scrollY || 0) + r.top;
      span = Math.max(1, el.offsetHeight - window.innerHeight);
    };
    const onScroll = () => {
      const raw = scrollStagePosition(window.scrollY || 0, top, span);
      targetRef.current = magnetizeStagePosition(raw);
      // Hysteresis: hold the current stage until scroll clearly commits
      // past the midpoint. This changes only the copy; the 3D target keeps
      // dragging continuously between the magnetic stage stops.
      const k = Math.abs(raw - lastKey) > 0.58
        ? Math.max(0, Math.min(STAGES - 1, Math.round(raw)))
        : lastKey;
      if (k !== lastKey) { lastKey = k; setPhaseKey(k); }
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        const settled = stageFromScroll(window.scrollY || 0, top, span);
        targetRef.current = settled;
        if (settled !== lastKey) { lastKey = settled; setPhaseKey(settled); }
      }, 160);
    };
    // iOS fires resize when the address bar collapses mid-scroll — only
    // re-measure on width changes so rect reads stay off the scroll path.
    const onResize = () => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      measure(); onScroll();
    };
    const seed = () => {
      // Seed motion and copy from the restored scroll position.
      const stage = stageFromScroll(window.scrollY || 0, top, span);
      targetRef.current = magnetizeStagePosition(scrollStagePosition(window.scrollY || 0, top, span));
      lastKey = stage;
      setPhaseKey(stage);
    };
    measure(); seed();
    // The component now mounts at page load, long before layout settles —
    // fonts, charts, and lazy content above all shift our document offset.
    // Re-measure once everything is loaded, and again each time the
    // section approaches the viewport (IO fires well before pinning).
    const remeasure = () => { if (active) { measure(); onScroll(); } };
    window.addEventListener("load", remeasure);
    document.fonts?.ready.then(remeasure).catch(() => {});
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const io = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([e]) => {
      if (e.isIntersecting) remeasure();
      setVis(e.isIntersecting);
    }, { rootMargin: "50% 0px" });
    io?.observe(el);
    return () => {
      active = false;
      window.removeEventListener("load", remeasure);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(settleTimer);
      io?.disconnect();
    };
  }, []);

  const proj = SC.projects[Math.floor(phaseKey / 3)];
  const phase = proj.phases[phaseKey % 3];
  // Copy stays on one side for each project so phase changes do not
  // throw a large block of text across the viewport.
  const side = panelSideForStage(phaseKey);

  return (
    // 100%: fills the fixed-height reservation made by ShowcaseMount
    <div className="showcase" ref={wrapRef} style={{ height: "100%" }}>
      <div className="sc-sticky">
        {/* the panel node stays mounted (screen readers keep their place);
            only the changed text blocks are keyed to re-run the fade */}
        <div className={"sc-panel " + side}>
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
        {/* Canvas mounts with the page — never lazily on scroll — so the
            scenes are always ready. Visibility only pauses the loop. */}
        <div className="sc-stage" aria-hidden="true">
          {!canvasReady && <div className="sc-webgl-fallback">Interactive 3D is unavailable on this device.</div>}
          <Canvas dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }} camera={{ position: [-2, 1.1, 9.2], fov: 40 }}
            frameloop={vis ? "always" : "demand"}
            onCreated={() => setCanvasReady(true)}>
            <SceneRoot targetRef={targetRef} pal={pal} />
          </Canvas>
        </div>
      </div>
    </div>
  );
}

export default function Showcase() {
  return REDUCED ? <StaticShowcase /> : <LiveShowcase />;
}
