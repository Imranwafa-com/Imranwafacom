// ════════════════════════════════════════════════════════════
// Showcase — pinned scroll-driven 3D scenes for the top three
// personal projects (home lab rack, Rack Motion intrusion demo,
// Kubernetes blade cluster).
//
// One sticky viewport, one <Canvas>. The wrapper is N×260vh tall;
// scroll progress through it (0..N) picks the active project and
// its phase. Scenes sit side by side in world space and slide
// past the camera on project change — that's the "swish".
//
// Scroll-perf: offsets are cached (measure on resize only), the
// scroll listener writes a ref, and React state changes only on
// discrete phase transitions (9 total). The scenes read the ref
// in useFrame. Lazy-loaded — three.js never touches the main
// bundle (see ShowcaseMount in Specimen.tsx).
// ════════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { COPY } from "../copy";
import { REDUCED } from "../motion";
import { currentTheme, THEME_EVENT } from "../theme";
import { resolveRGB } from "../bg";

const SC = COPY.showcase;
const N = SC.projects.length;
const SPREAD = 18;      // world-space gap between scenes
const HOLD = 0.82;      // fraction of each unit spent on the scene; rest is the swish

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// Local phase progress (0..1) for scene i, given overall p (0..N).
const localT = (p: number, i: number) => clamp01((p - i) / HOLD);
// Continuous "which scene" value: hold on i, then slide to i+1.
const easedProj = (p: number) => {
  const i = Math.min(N - 1, Math.floor(p));
  return i + smooth(HOLD, 1, p - i);
};

// ── Theme-reactive colors (resolved from the CSS tokens) ────
interface Palette { accent: THREE.Color; ink: THREE.Color; faint: THREE.Color; red: THREE.Color }
function makePalette(): Palette {
  const c = (rgb: [number, number, number]) => new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
  return {
    accent: c(resolveRGB("--accent", [25, 79, 227])),
    ink: c(resolveRGB("--ink", [11, 13, 19])),
    faint: c(resolveRGB("--ink-3", [150, 150, 160])),
    red: new THREE.Color("#e5484d"),
  };
}

// ── Box with visible edges — the whole aesthetic is built on it ──
interface SlabProps {
  size: [number, number, number];
  color: THREE.Color;
  edge: THREE.Color;
  opacity?: number;
  edgeOpacity?: number;
  position?: [number, number, number];
}
function Slab({ size, color, edge, opacity = 0.07, edgeOpacity = 0.85, position }: SlabProps) {
  const geo = useMemo(() => new THREE.BoxGeometry(...size), [size]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);
  useEffect(() => () => { geo.dispose(); edges.dispose(); }, [geo, edges]);
  return (
    <group position={position}>
      <mesh geometry={geo}>
        <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={edge} transparent opacity={edgeOpacity} />
      </lineSegments>
    </group>
  );
}

// Rack frame + a stack of server slabs. `pulledRef`/`lidRef`/`gutsRef`
// are only wired for the homelab scene.
const RACK_W = 2.1, RACK_D = 1.4, UNIT_H = 0.34, UNITS = 7;
function Rack({ pal, pulledRef, lidRef, gutsRef, scale = 1 }: {
  pal: Palette;
  pulledRef?: React.RefObject<THREE.Group | null>;
  lidRef?: React.RefObject<THREE.Group | null>;
  gutsRef?: React.RefObject<THREE.Group | null>;
  scale?: number;
}) {
  const H = UNITS * (UNIT_H + 0.06) + 0.2;
  const post: [number, number, number] = [0.08, H, 0.08];
  const px = RACK_W / 2, pz = RACK_D / 2;
  const pulledIdx = 4;
  return (
    <group scale={scale}>
      {/* posts */}
      <Slab size={post} color={pal.ink} edge={pal.faint} position={[-px, H / 2, -pz]} />
      <Slab size={post} color={pal.ink} edge={pal.faint} position={[px, H / 2, -pz]} />
      <Slab size={post} color={pal.ink} edge={pal.faint} position={[-px, H / 2, pz]} />
      <Slab size={post} color={pal.ink} edge={pal.faint} position={[px, H / 2, pz]} />
      {/* servers */}
      {Array.from({ length: UNITS }, (_, u) => {
        const y = 0.28 + u * (UNIT_H + 0.06);
        const size: [number, number, number] = [RACK_W - 0.26, UNIT_H, RACK_D - 0.12];
        if (u === pulledIdx && pulledRef) {
          // The unit that rides out on rails; its lid hinges at the back
          // edge and the internals live inside, revealed on open.
          return (
            <group key={u} ref={pulledRef} position={[0, y, 0]}>
              {/* tray (open box: floor + low walls so the inside is visible) */}
              <Slab size={[size[0], 0.05, size[2]]} color={pal.accent} edge={pal.accent} position={[0, -UNIT_H / 2 + 0.03, 0]} edgeOpacity={1} />
              <Slab size={[0.04, UNIT_H * 0.8, size[2]]} color={pal.ink} edge={pal.faint} position={[-size[0] / 2 + 0.02, 0, 0]} />
              <Slab size={[0.04, UNIT_H * 0.8, size[2]]} color={pal.ink} edge={pal.faint} position={[size[0] / 2 - 0.02, 0, 0]} />
              {/* lid — hinged at the back edge */}
              <group ref={lidRef} position={[0, UNIT_H / 2 - 0.06, -size[2] / 2]}>
                <Slab size={[size[0], 0.04, size[2]]} color={pal.ink} edge={pal.accent} position={[0, 0, size[2] / 2]} edgeOpacity={1} />
              </group>
              {/* internals: 4 GPUs + RAM sticks, scaled in on open */}
              <group ref={gutsRef} scale={0}>
                {[0, 1, 2, 3].map((g) => (
                  <Slab key={g} size={[0.34, 0.12, 0.62]} color={pal.accent} edge={pal.accent}
                    opacity={0.28} edgeOpacity={1}
                    position={[-0.63 + g * 0.42, -UNIT_H / 2 + 0.14, 0.22]} />
                ))}
                {[0, 1, 2, 3, 4, 5].map((r) => (
                  <Slab key={"r" + r} size={[0.05, 0.14, 0.34]} color={pal.faint} edge={pal.faint}
                    position={[-0.55 + r * 0.22, -UNIT_H / 2 + 0.14, -0.38]} />
                ))}
              </group>
            </group>
          );
        }
        return <Slab key={u} size={size} color={pal.ink} edge={u === pulledIdx ? pal.accent : pal.faint} position={[0, y, 0]} opacity={0.1} />;
      })}
    </group>
  );
}

// ── Scene 0 · Home lab — rack → node slides out → opens up ──
function HomelabScene({ pRef, pal }: { pRef: React.RefObject<number>; pal: Palette }) {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const pulled = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const guts = useRef<THREE.Group>(null);
  useFrame(() => {
    const p = pRef.current;
    if (root.current) root.current.position.x = (0 - easedProj(p)) * SPREAD;
    const t = localT(p, 0);
    const slide = smooth(0.36, 0.6, t);
    const open = smooth(0.68, 0.94, t);
    if (spin.current) spin.current.rotation.y = -0.55 + 0.5 * smooth(0, 1, t);
    if (pulled.current) pulled.current.position.z = slide * 1.9;
    if (lid.current) lid.current.rotation.x = -1.9 * open;
    if (guts.current) {
      const s = Math.max(0.001, open);
      guts.current.scale.setScalar(s);
    }
  });
  return (
    <group ref={root}>
      <group ref={spin} position={[0, -1.3, 0]}>
        <Rack pal={pal} pulledRef={pulled} lidRef={lid} gutsRef={guts} />
      </group>
    </group>
  );
}

// ── Scene 1 · Rack Motion — intruder walks in, blinks red, lock shuts ──
function Figure({ mat }: { mat: THREE.Material }) {
  // ponytail: blocky wireframe humanoid — reads as "person" at this scale,
  // upgrade to a skinned model if it ever needs to actually walk.
  return (
    <group>
      <mesh material={mat} position={[0, 1.62, 0]}><sphereGeometry args={[0.15, 10, 8]} /></mesh>
      <mesh material={mat} position={[0, 1.15, 0]}><boxGeometry args={[0.38, 0.56, 0.2]} /></mesh>
      <mesh material={mat} position={[-0.27, 1.12, 0]}><boxGeometry args={[0.09, 0.5, 0.09]} /></mesh>
      <mesh material={mat} position={[0.27, 1.12, 0]}><boxGeometry args={[0.09, 0.5, 0.09]} /></mesh>
      <mesh material={mat} position={[-0.11, 0.42, 0]}><boxGeometry args={[0.11, 0.84, 0.11]} /></mesh>
      <mesh material={mat} position={[0.11, 0.42, 0]}><boxGeometry args={[0.11, 0.84, 0.11]} /></mesh>
    </group>
  );
}
function RackMotionScene({ pRef, pal }: { pRef: React.RefObject<number>; pal: Palette }) {
  const root = useRef<THREE.Group>(null);
  const fig = useRef<THREE.Group>(null);
  const lock = useRef<THREE.Group>(null);
  const shackle = useRef<THREE.Group>(null);
  const figMat = useMemo(() => new THREE.MeshBasicMaterial({ color: pal.red, wireframe: true, transparent: true, opacity: 0.9 }), [pal]);
  useEffect(() => () => figMat.dispose(), [figMat]);
  useFrame(({ clock }) => {
    const p = pRef.current;
    if (root.current) root.current.position.x = (1 - easedProj(p)) * SPREAD;
    const t = localT(p, 1);
    const now = clock.elapsedTime;
    const enter = smooth(0.02, 0.3, t);
    const approach = smooth(0.66, 0.88, t);
    if (fig.current) {
      fig.current.position.x = -4.6 + 2.3 * enter + 1.2 * approach;
      const moving = (enter > 0 && enter < 1) || (approach > 0 && approach < 1);
      fig.current.position.y = moving ? Math.abs(Math.sin(now * 7)) * 0.05 : 0;
    }
    // phase 2: the outline blinks red
    const blinking = t > 0.34 && t < 0.66;
    figMat.opacity = blinking ? 0.25 + 0.75 * Math.abs(Math.sin(now * 5)) : 0.9;
    // phase 3: lock scales in above the rack, shackle drops shut
    const lockIn = smooth(0.62, 0.74, t);
    const shut = smooth(0.8, 0.94, t);
    if (lock.current) lock.current.scale.setScalar(Math.max(0.001, lockIn));
    if (shackle.current) shackle.current.position.y = 0.3 - 0.14 * shut;
  });
  return (
    <group ref={root}>
      <group position={[1.6, -1.3, 0]}>
        <Rack pal={pal} scale={0.8} />
        {/* padlock hovering above the rack */}
        <group ref={lock} position={[0, 2.6, 0]}>
          <Slab size={[0.44, 0.34, 0.16]} color={pal.accent} edge={pal.accent} opacity={0.25} edgeOpacity={1} position={[0, 0, 0]} />
          <group ref={shackle} position={[0, 0.3, 0]}>
            <mesh>
              <torusGeometry args={[0.16, 0.035, 8, 20, Math.PI]} />
              <meshBasicMaterial color={pal.accent} wireframe transparent opacity={0.95} />
            </mesh>
          </group>
        </group>
      </group>
      <group ref={fig} position={[-4.6, -1.3, 0.4]}>
        <Figure mat={figMat} />
      </group>
      {/* floor line so the walk reads as ground */}
      <mesh position={[-1, -1.32, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 3]} />
        <meshBasicMaterial color={pal.faint} transparent opacity={0.05} />
      </mesh>
    </group>
  );
}

// ── Scene 2 · Compute cluster — scattered blades converge, links light ──
const BLADES = 6;
const SCATTER: [number, number, number][] = [
  [-2.6, 1.9, -0.8], [2.4, 2.3, 0.6], [-1.8, -0.4, 1.0],
  [2.8, 0.2, -1.2], [-2.9, 0.8, 0.4], [1.9, -0.9, -0.5],
];
function K8sScene({ pRef, pal }: { pRef: React.RefObject<number>; pal: Palette }) {
  const root = useRef<THREE.Group>(null);
  const blades = useRef<(THREE.Group | null)[]>([]);
  const hub = useRef<THREE.Mesh>(null);
  const linkMat = useRef<THREE.LineBasicMaterial>(null);
  const finals = useMemo(() => Array.from({ length: BLADES }, (_, i): [number, number, number] => [0, -0.9 + i * 0.42, 0]), []);
  const linkGeo = useMemo(() => {
    const pts: number[] = [];
    for (const f of finals) pts.push(1.9, 0.15, 0, f[0] + 0.75, f[1], f[2]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [finals]);
  useEffect(() => () => linkGeo.dispose(), [linkGeo]);
  useFrame(({ clock }) => {
    const p = pRef.current;
    if (root.current) root.current.position.x = (2 - easedProj(p)) * SPREAD;
    const t = localT(p, 2);
    const gather = smooth(0.1, 0.58, t);
    const now = clock.elapsedTime;
    blades.current.forEach((b, i) => {
      if (!b) return;
      const s = SCATTER[i], f = finals[i];
      const drift = (1 - gather) * Math.sin(now * 0.8 + i) * 0.08;
      b.position.set(
        s[0] + (f[0] - s[0]) * gather,
        s[1] + (f[1] - s[1]) * gather + drift,
        s[2] + (f[2] - s[2]) * gather,
      );
      b.rotation.z = (1 - gather) * (i % 2 ? 0.4 : -0.35);
    });
    const linked = smooth(0.66, 0.9, t);
    if (linkMat.current) linkMat.current.opacity = linked * 0.8;
    if (hub.current) {
      hub.current.scale.setScalar(Math.max(0.001, smooth(0.6, 0.72, t)));
      hub.current.rotation.y = now * 0.6;
    }
  });
  return (
    <group ref={root}>
      {SCATTER.map((s, i) => (
        <group key={i} ref={(el) => { blades.current[i] = el; }} position={s}>
          <Slab size={[1.5, 0.16, 0.95]} color={pal.ink} edge={pal.accent} opacity={0.1} edgeOpacity={0.9} />
        </group>
      ))}
      {/* control-plane hub + links to the stacked blades */}
      <mesh ref={hub} position={[1.9, 0.15, 0]}>
        <octahedronGeometry args={[0.3]} />
        <meshBasicMaterial color={pal.accent} wireframe transparent opacity={0.95} />
      </mesh>
      <lineSegments geometry={linkGeo}>
        <lineBasicMaterial ref={linkMat} color={pal.accent} transparent opacity={0} />
      </lineSegments>
    </group>
  );
}

function SceneRoot({ pRef, theme }: { pRef: React.RefObject<number>; theme: string }) {
  const pal = useMemo(() => makePalette(), [theme]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <HomelabScene pRef={pRef} pal={pal} />
      <RackMotionScene pRef={pRef} pal={pal} />
      <K8sScene pRef={pRef} pal={pal} />
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

// ── Live showcase — sticky viewport + scroll-driven canvas ──
function LiveShowcase() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pRef = useRef(0); // overall progress, 0..N
  const [phaseKey, setPhaseKey] = useState(0); // project*3 + phase
  const [vis, setVis] = useState(false);
  const [theme, setThemeS] = useState(currentTheme());

  useEffect(() => {
    const on = (e: Event) => setThemeS((e as CustomEvent<string>).detail as "paper" | "carbon");
    window.addEventListener(THEME_EVENT, on);
    return () => window.removeEventListener(THEME_EVENT, on);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // Cached-offset pattern (see motion.tsx): measure on resize only,
    // the scroll handler is pure arithmetic + a ref write. setState
    // fires only on the 9 discrete phase boundaries.
    let top = 0, span = 1;
    const measure = () => {
      const r = el.getBoundingClientRect();
      top = (window.scrollY || 0) + r.top;
      span = Math.max(1, el.offsetHeight - window.innerHeight);
    };
    const onScroll = () => {
      const p = clamp01(((window.scrollY || 0) - top) / span) * (N - 0.0001);
      pRef.current = p;
      const i = Math.floor(p);
      const k = i * 3 + Math.min(2, Math.floor(localT(p, i) * 3));
      setPhaseKey((prev) => (prev === k ? prev : k));
    };
    const onResize = () => { measure(); onScroll(); };
    measure(); onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // Mount the canvas a bit before it scrolls into view; unmount far away.
    const io = new IntersectionObserver(([e]) => setVis(e.isIntersecting), { rootMargin: "50% 0px" });
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
    <div className="showcase" ref={wrapRef} style={{ height: `${N * 260}vh` }}>
      <div className="sc-sticky">
        <div className="sc-panel" key={phaseKey}>
          <div className="sc-kicker mono">{proj.kicker}</div>
          <h3 className="sc-title serif">{proj.title}</h3>
          <div className="sc-phase-h">{phase.h}</div>
          <p className="sc-phase-body">{phase.body}</p>
          <div className="sc-specs">
            {proj.specs.map(([k, v]) => <div className="row" key={k}><span>{k}</span><span>{v}</span></div>)}
          </div>
          <div className="sc-steps" aria-hidden="true">
            {[0, 1, 2].map((s) => <span key={s} className={"sc-step" + (s === phaseKey % 3 ? " on" : "")} />)}
          </div>
          <div className="sc-hint mono">{SC.hint}</div>
        </div>
        <div className="sc-stage" aria-hidden="true">
          {vis && (
            <Canvas dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 1.4, 8.8], fov: 38 }}>
              <SceneRoot pRef={pRef} theme={theme} />
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
