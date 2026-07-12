// ════════════════════════════════════════════════════════════
// Showcase scenes — the 3D side of the pinned project showcase.
//
// Driven by a single spring-damped stage value sRef (0..8): three
// projects × three stages. Scenes sit side by side in world space
// and slide past the camera between projects; within a project the
// same spring eases each stage's animation, so everything shares
// one "resistance → glide to the next stage" feel.
//
// Aesthetic: dark brushed-metal hardware under real lighting, with
// the site accent as LED/glow color — plus ambience (fog, floor
// grid, dust, glow wash) that stays put while the hardware swishes
// through it.
// ════════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { resolveRGB } from "../bg";

// ── Palette (CSS-token colors resolved at mount/theme flip) ──
export interface Palette {
  accent: THREE.Color;
  bg: THREE.Color;
  faint: THREE.Color;
  dark: boolean; // carbon theme?
}
export function makePalette(): Palette {
  const c = (rgb: [number, number, number]) => new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
  const bg = c(resolveRGB("--paper", [251, 251, 252]));
  return {
    accent: c(resolveRGB("--accent", [25, 79, 227])),
    bg,
    faint: c(resolveRGB("--ink-3", [150, 150, 160])),
    dark: bg.getHSL({ h: 0, s: 0, l: 0 }).l < 0.5,
  };
}

// Fixed hardware colors — a dark rack reads "real" on both themes.
const METAL_DARK = new THREE.Color("#232834");
const METAL_MID = new THREE.Color("#343b4d");
const BEZEL = new THREE.Color("#414a61");
const PCB = new THREE.Color("#123524");
const LED_GREEN = new THREE.Color("#35d07f");
const LED_AMBER = new THREE.Color("#ffb224");
const RED = new THREE.Color("#e5484d");

export const STAGES = 9;   // 3 projects × 3 phases
const SPREAD = 20;         // world gap between project scenes

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const clamp01 = (x: number) => clamp(x, 0, 1);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// bell(x) around c with radius r — used for "phase 2 only" effects
const bell = (x: number, c: number, r: number) => smooth(c - r, c, x) * (1 - smooth(c, c + r, x));

// Which project the camera is on, as a continuous value of stage s:
// holds on each project, slides 1 unit while s crosses 2→3 and 5→6.
const projOf = (s: number) => clamp(s - 2, 0, 1) + clamp(s - 5, 0, 1);
// Local stage inside project i: 0..2
const localOf = (s: number, i: number) => clamp(s - 3 * i, 0, 2);

// Shared unit geometries (dispose={null} everywhere they're used).
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

// ── tiny building blocks ────────────────────────────────────
interface BoxProps {
  size: [number, number, number];
  color: THREE.Color;
  position?: [number, number, number];
  rotation?: [number, number, number];
  metalness?: number;
  roughness?: number;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  opacity?: number;
}
// Static box materials are shared via a module cache — dozens of
// slabs otherwise allocate identical materials. Animated materials
// (LEDs, lock) stay per-instance.
const matCache = new Map<string, THREE.MeshStandardMaterial>();
function boxMaterial(color: THREE.Color, metalness: number, roughness: number, emissive: THREE.Color, emissiveIntensity: number, opacity: number) {
  const key = `${color.getHexString()}|${metalness}|${roughness}|${emissive.getHexString()}|${emissiveIntensity}|${opacity}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color, metalness, roughness, emissive, emissiveIntensity,
      transparent: opacity < 1, opacity,
    });
    matCache.set(key, m);
  }
  return m;
}
function Box({ size, color, position, rotation, metalness = 0.6, roughness = 0.45, emissive, emissiveIntensity = 0, opacity = 1 }: BoxProps) {
  const mat = boxMaterial(color, metalness, roughness, emissive ?? color, emissiveIntensity, opacity);
  return (
    <mesh geometry={UNIT_BOX} material={mat} dispose={null} scale={size} position={position} rotation={rotation} />
  );
}

// A soft radial-gradient texture (glow / contact shadow). Cached at
// module level — a handful of variants ever exist, shared by all
// users and never disposed, so theme flips can't leak GPU textures.
const texCache = new Map<string, THREE.Texture>();
function radialTexture(inner: string, outer: string): THREE.Texture {
  const key = inner + "|" + outer;
  const hit = texCache.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const g = cv.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tx = new THREE.CanvasTexture(cv);
  tx.needsUpdate = true;
  texCache.set(key, tx);
  return tx;
}

// Contact shadow blob under a piece of hardware.
function ShadowBlob({ scale = 5, opacity = 0.45, position }: { scale?: number; opacity?: number; position?: [number, number, number] }) {
  const tex = useMemo(() => radialTexture("rgba(0,0,0,0.85)", "rgba(0,0,0,0)"), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position ?? [0, 0.01, 0]} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

// ── Blinking status LEDs ────────────────────────────────────
// One shared blink clock; each LED offsets it so the wall of lights
// feels alive without per-LED state.
function Led({ x, y, z, seed, color = LED_GREEN }: { x: number; y: number; z: number; seed: number; color?: THREE.Color }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!mat.current) return;
    const t = clock.elapsedTime * (1.6 + (seed % 5) * 0.23) + seed * 1.7;
    // mostly-on with occasional dips — like disk/net activity lights
    const on = Math.sin(t) + Math.sin(t * 2.7 + seed) > -0.4;
    mat.current.emissiveIntensity = on ? 2.2 : 0.15;
  });
  return (
    <mesh geometry={UNIT_BOX} dispose={null} scale={[0.035, 0.035, 0.02]} position={[x, y, z]}>
      <meshStandardMaterial ref={mat} color={color} emissive={color} emissiveIntensity={2} metalness={0} roughness={0.4} />
    </mesh>
  );
}

// ── Server rack ─────────────────────────────────────────────
export const RACK_W = 2.2, RACK_D = 1.5, UNIT_H = 0.3, GAP = 0.045, UNITS = 8;
const RACK_H = UNITS * (UNIT_H + GAP) + 0.34;

// One 1U server: chassis, front bezel, handles, vents, LEDs.
function ServerUnit({ y, seed, accent }: { y: number; seed: number; accent: THREE.Color }) {
  const w = RACK_W - 0.3, d = RACK_D - 0.16;
  const front = d / 2;
  return (
    <group position={[0, y, 0]}>
      <Box size={[w, UNIT_H, d]} color={METAL_DARK} roughness={0.55} />
      {/* bezel face */}
      <Box size={[w - 0.1, UNIT_H - 0.06, 0.03]} color={BEZEL} position={[0, 0, front]} roughness={0.35} />
      {/* rack-ear handles */}
      <Box size={[0.05, UNIT_H - 0.1, 0.05]} color={METAL_MID} position={[-w / 2 + 0.07, 0, front]} />
      <Box size={[0.05, UNIT_H - 0.1, 0.05]} color={METAL_MID} position={[w / 2 - 0.07, 0, front]} />
      {/* vent slots */}
      {[-0.28, -0.14, 0, 0.14].map((vx, i) => (
        <Box key={i} size={[0.1, UNIT_H - 0.14, 0.012]} color={METAL_DARK} position={[vx - 0.25, 0, front + 0.018]} roughness={0.9} metalness={0.1} />
      ))}
      {/* drive/status LEDs */}
      <Led x={w / 2 - 0.2} y={0.04} z={front + 0.022} seed={seed} color={seed % 3 === 2 ? LED_AMBER : LED_GREEN} />
      <Led x={w / 2 - 0.28} y={0.04} z={front + 0.022} seed={seed + 11} color={LED_GREEN} />
      <Led x={w / 2 - 0.2} y={-0.05} z={front + 0.022} seed={seed + 23} color={accent} />
    </group>
  );
}

// The full cabinet. When `openRefs` is passed (homelab), unit
// `PULLED` becomes a tray that rides rails and opens its lid.
const PULLED = 4;
export interface OpenRefs {
  tray: React.RefObject<THREE.Group | null>;
  lid: React.RefObject<THREE.Group | null>;
  guts: React.RefObject<THREE.Group | null>;
  rails: React.RefObject<THREE.Group | null>;
}
export function ServerRack({ accent, openRefs, scale = 1 }: { accent: THREE.Color; openRefs?: OpenRefs; scale?: number }) {
  const w = RACK_W - 0.3, d = RACK_D - 0.16;
  const unitY = (u: number) => 0.32 + u * (UNIT_H + GAP);
  return (
    <group scale={scale}>
      {/* frame posts + caps */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <Box key={`${sx}${sz}`} size={[0.1, RACK_H, 0.1]} color={METAL_MID}
            position={[(RACK_W / 2) * sx, RACK_H / 2, (RACK_D / 2) * sz]} roughness={0.3} metalness={0.85} />
        )))}
      <Box size={[RACK_W + 0.14, 0.1, RACK_D + 0.14]} color={METAL_MID} position={[0, RACK_H + 0.03, 0]} metalness={0.85} roughness={0.3} />
      <Box size={[RACK_W + 0.14, 0.14, RACK_D + 0.14]} color={METAL_MID} position={[0, 0.07, 0]} metalness={0.85} roughness={0.3} />
      {/* side + back panels */}
      <Box size={[0.03, RACK_H - 0.2, RACK_D - 0.05]} color={METAL_DARK} position={[-RACK_W / 2 - 0.02, RACK_H / 2, 0]} roughness={0.4} metalness={0.8} />
      <Box size={[0.03, RACK_H - 0.2, RACK_D - 0.05]} color={METAL_DARK} position={[RACK_W / 2 + 0.02, RACK_H / 2, 0]} roughness={0.4} metalness={0.8} />
      <Box size={[RACK_W - 0.05, RACK_H - 0.2, 0.03]} color={METAL_DARK} position={[0, RACK_H / 2, -RACK_D / 2 - 0.02]} roughness={0.4} metalness={0.8} />

      {Array.from({ length: UNITS }, (_, u) => {
        const y = unitY(u);
        if (u === PULLED && openRefs) {
          return (
            <group key={u}>
              {/* rails that appear as the tray extends */}
              <group ref={openRefs.rails} position={[0, y - UNIT_H / 2 + 0.02, 0]}>
                <Box size={[0.05, 0.04, RACK_D + 0.7]} color={METAL_MID} position={[-w / 2 + 0.05, 0, 0.35]} metalness={0.9} roughness={0.25} />
                <Box size={[0.05, 0.04, RACK_D + 0.7]} color={METAL_MID} position={[w / 2 - 0.05, 0, 0.35]} metalness={0.9} roughness={0.25} />
              </group>
              <group ref={openRefs.tray} position={[0, y, 0]}>
                {/* open-top chassis: floor + low sides + front bezel */}
                <Box size={[w, 0.04, d]} color={METAL_DARK} position={[0, -UNIT_H / 2 + 0.02, 0]} />
                <Box size={[0.04, UNIT_H - 0.08, d]} color={METAL_DARK} position={[-w / 2 + 0.02, -0.02, 0]} />
                <Box size={[0.04, UNIT_H - 0.08, d]} color={METAL_DARK} position={[w / 2 - 0.02, -0.02, 0]} />
                <Box size={[w - 0.1, UNIT_H - 0.06, 0.03]} color={BEZEL} position={[0, 0, d / 2]} roughness={0.35} />
                <Led x={w / 2 - 0.2} y={0.04} z={d / 2 + 0.022} seed={99} color={accent} />
                {/* lid, hinged at the back edge */}
                <group ref={openRefs.lid} position={[0, UNIT_H / 2 - 0.04, -d / 2]}>
                  <Box size={[w - 0.06, 0.025, d]} color={METAL_MID} position={[0, 0, d / 2]} metalness={0.85} roughness={0.3} />
                </group>
                {/* internals — PCB, 4 GPUs, RAM banks, PSU */}
                <group ref={openRefs.guts} position={[0, -UNIT_H / 2 + 0.05, 0]}>
                  <Box size={[w - 0.16, 0.02, d - 0.16]} color={PCB} metalness={0.15} roughness={0.65} emissive={PCB} emissiveIntensity={0.25} />
                  {[0, 1, 2, 3].map((g) => (
                    <group key={g} position={[-0.62 + g * 0.42, 0.09, 0.22]}>
                      <Box size={[0.32, 0.14, 0.6]} color={METAL_DARK} roughness={0.5} />
                      <Box size={[0.34, 0.03, 0.56]} color={accent} emissive={accent} emissiveIntensity={1.6} metalness={0.2} roughness={0.4} position={[0, 0.075, 0]} />
                      {/* fan disc */}
                      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.078, -0.16]}>
                        <circleGeometry args={[0.09, 20]} />
                        <meshStandardMaterial color={METAL_MID} metalness={0.7} roughness={0.35} />
                      </mesh>
                    </group>
                  ))}
                  {[0, 1, 2, 3, 4, 5].map((r) => (
                    <Box key={r} size={[0.035, 0.11, 0.3]} color={r % 2 ? METAL_MID : BEZEL}
                      position={[-0.5 + r * 0.17, 0.07, -0.42]} metalness={0.4} roughness={0.5} />
                  ))}
                  <Box size={[0.34, 0.12, 0.3]} color={METAL_MID} position={[0.72, 0.08, -0.42]} metalness={0.7} roughness={0.35} />
                </group>
              </group>
            </group>
          );
        }
        return <ServerUnit key={u} y={y} seed={u * 13 + 5} accent={accent} />;
      })}
    </group>
  );
}

// ── Ambience: fog, floor grid, dust, glow wash ──────────────
// Stays in world space while the hardware swishes through it.
export function Ambience({ pal }: { pal: Palette }) {
  const { scene } = useThree();
  const pts = useRef<THREE.Points>(null);
  const grid = useRef<THREE.GridHelper>(null);
  useEffect(() => {
    const m = grid.current?.material as THREE.Material | undefined;
    if (m) { m.transparent = true; m.opacity = pal.dark ? 0.12 : 0.18; m.needsUpdate = true; }
  }, [pal]);
  // fog matching the page background — hardware fades into the paper
  useEffect(() => {
    scene.fog = new THREE.Fog(pal.bg, 11, 24);
    return () => { scene.fog = null; };
  }, [scene, pal]);
  const positions = useMemo(() => {
    const a = new Float32Array(160 * 3);
    for (let i = 0; i < 160; i++) {
      a[i * 3] = (Math.random() - 0.5) * 18;
      a[i * 3 + 1] = Math.random() * 6 - 1.2;
      a[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return a;
  }, []);
  const glow = useMemo(
    () => radialTexture(pal.dark ? "rgba(80,120,245,0.28)" : "rgba(25,79,227,0.13)", "rgba(0,0,0,0)"),
    [pal],
  );
  useFrame(({ clock }) => {
    if (pts.current) {
      pts.current.rotation.y = clock.elapsedTime * 0.012;
      pts.current.position.y = Math.sin(clock.elapsedTime * 0.18) * 0.15;
    }
  });
  return (
    <>
      <ambientLight intensity={pal.dark ? 0.9 : 1.0} />
      <directionalLight position={[5, 9, 6]} intensity={pal.dark ? 2.4 : 2.2} />
      {/* frontal fill so bezels and faces read instead of silhouetting */}
      <directionalLight position={[0, 2, 12]} intensity={pal.dark ? 1.5 : 0.7} />
      <directionalLight position={[-6, 4, -4]} intensity={0.7} color={pal.accent} />
      {/* floor grid — kept small + faint so the horizon melts into fog.
          Colors go through args (a material child would leak the helper's
          own material); opacity is set on the built-in material below. */}
      <gridHelper ref={grid} args={[34, 34, pal.faint, pal.faint]} position={[0, -1.44, 0]} />
      {/* soft accent wash behind the stage — kept smaller than the view
          so the gradient dies out before the canvas edge shows a seam */}
      <mesh position={[1, 1.2, -5]} scale={[13, 8, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glow} transparent opacity={1} depthWrite={false}
          blending={pal.dark ? THREE.AdditiveBlending : THREE.NormalBlending} />
      </mesh>
      {/* dust motes */}
      <points ref={pts}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.035} color={pal.dark ? "#8fa4d8" : "#7c86a8"} transparent
          opacity={pal.dark ? 0.5 : 0.4} sizeAttenuation depthWrite={false} />
      </points>
    </>
  );
}

// ── Scene 0 · Home lab ──────────────────────────────────────
export function HomelabScene({ sRef, pal }: { sRef: React.RefObject<number>; pal: Palette }) {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const tray = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const guts = useRef<THREE.Group>(null);
  const rails = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const s = sRef.current;
    if (!root.current) return;
    const x = (0 - projOf(s)) * SPREAD;
    root.current.position.x = x;
    if (Math.abs(x) > 12) return; // fully offscreen — skip the choreography
    const l = localOf(s, 0);
    const slide = smooth(0.15, 0.95, l);
    const open = smooth(1.15, 1.95, l);
    if (spin.current) {
      // slow idle orbit + gentle stage-driven swing toward the open node
      spin.current.rotation.y = -0.5 + 0.28 * smooth(0, 2, l) + Math.sin(clock.elapsedTime * 0.25) * 0.03;
    }
    if (tray.current) tray.current.position.z = slide * 1.55;
    if (rails.current) rails.current.scale.z = 0.2 + slide * 0.8;
    if (lid.current) lid.current.rotation.x = -1.75 * open;
    if (guts.current) {
      guts.current.visible = open > 0.01;
      const k = 0.6 + 0.4 * open;
      guts.current.scale.setScalar(k);
      guts.current.position.y = -UNIT_H / 2 + 0.05 + (1 - open) * -0.04;
    }
  });
  const openRefs: OpenRefs = { tray, lid, guts, rails };
  return (
    <group ref={root}>
      <group ref={spin} position={[0, -1.44, 0]}>
        <ServerRack accent={pal.accent} openRefs={openRefs} />
        <ShadowBlob scale={6} opacity={pal.dark ? 0.6 : 0.35} />
        <pointLight position={[0, RACK_H + 0.8, 1.4]} intensity={6} color={pal.accent} distance={7} />
      </group>
    </group>
  );
}

// ── Scene 1 · Rack Motion ───────────────────────────────────
// The intruder stays a red hologram-wireframe on purpose — it's the
// detection overlay, not a person — but now it walks.
function Limb({ mat, len, pos, swingRef }: { mat: THREE.Material; len: number; pos: [number, number, number]; swingRef: (g: THREE.Group | null) => void }) {
  return (
    <group position={pos} ref={swingRef}>
      <mesh material={mat} position={[0, -len / 2, 0]}>
        <boxGeometry args={[0.1, len, 0.1]} />
      </mesh>
    </group>
  );
}
export function RackMotionScene({ sRef, pal }: { sRef: React.RefObject<number>; pal: Palette }) {
  const root = useRef<THREE.Group>(null);
  const fig = useRef<THREE.Group>(null);
  const limbs = useRef<(THREE.Group | null)[]>([]);
  const lock = useRef<THREE.Group>(null);
  const shackle = useRef<THREE.Group>(null);
  const lockMat = useRef<THREE.MeshStandardMaterial>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringT0 = useRef(-1);
  const redLight = useRef<THREE.PointLight>(null);
  const figMat = useMemo(() => new THREE.MeshBasicMaterial({ color: RED, wireframe: true, transparent: true, opacity: 0.85 }), []);
  useFrame(({ clock }, delta) => {
    const s = sRef.current;
    if (!root.current) return;
    const rx = (1 - projOf(s)) * SPREAD;
    root.current.position.x = rx;
    if (Math.abs(rx) > 12) return; // fully offscreen — skip the choreography
    const l = localOf(s, 1);
    const now = clock.elapsedTime;
    const enter = smooth(0.05, 0.85, l);
    const approach = smooth(1.15, 1.75, l);
    const moving = (enter > 0.02 && enter < 0.98) || (approach > 0.02 && approach < 0.98);
    if (fig.current) {
      fig.current.position.x = -5.2 + 2.6 * enter + 1.35 * approach;
      fig.current.position.y = -1.44 + (moving ? Math.abs(Math.sin(now * 6.4)) * 0.045 : 0);
    }
    // walk cycle — legs and arms counter-swing while moving
    const amp = moving ? 0.55 : 0;
    for (let i = 0; i < limbs.current.length; i++) {
      const g = limbs.current[i];
      if (!g) continue;
      const phase = i % 2 === 0 ? 0 : Math.PI;
      const target = amp * Math.sin(now * 6.4 + phase) * (i < 2 ? 1 : 0.7);
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, target, 16, delta);
    }
    // stage 2: detection blink — outline + red light pulse together
    const blink = bell(l, 1, 0.55);
    const pulse = 0.5 + 0.5 * Math.sin(now * 7);
    figMat.opacity = 0.85 - blink * 0.65 * pulse;
    if (redLight.current) redLight.current.intensity = blink * 9 * pulse + (approach > 0.9 ? 2 : 0);
    // stage 3: lock scales in, shackle drops, ground ring pulses out
    const lockIn = smooth(1.35, 1.6, l);
    const shut = smooth(1.7, 1.92, l);
    if (lock.current) {
      lock.current.scale.setScalar(Math.max(0.001, lockIn));
      lock.current.position.y = RACK_H * 0.85 + 0.75 + (1 - lockIn) * 0.5;
    }
    if (shackle.current) shackle.current.position.y = 0.26 - 0.13 * shut;
    if (lockMat.current) lockMat.current.emissiveIntensity = 0.25 + shut * 1.6;
    if (ring.current && ringMat.current) {
      // pulse phase starts when the lock shuts, not at a random clock point
      if (shut > 0.99 && ringT0.current < 0) ringT0.current = now;
      if (shut <= 0.99) ringT0.current = -1;
      const ringT = ringT0.current >= 0 ? ((now - ringT0.current) % 1.6) / 1.6 : 0;
      ring.current.scale.setScalar(0.5 + ringT * 4);
      ringMat.current.opacity = ringT0.current >= 0 ? (1 - ringT) * 0.5 : 0;
    }
  });
  return (
    <group ref={root}>
      {/* the rack being protected */}
      <group position={[1.8, -1.44, 0]} rotation={[0, -0.35, 0]}>
        <ServerRack accent={pal.accent} scale={0.85} />
        <ShadowBlob scale={5} opacity={pal.dark ? 0.6 : 0.35} />
        {/* padlock */}
        <group ref={lock} position={[0, RACK_H * 0.85 + 0.75, 0]}>
          <mesh geometry={UNIT_BOX} dispose={null} scale={[0.5, 0.4, 0.2]}>
            <meshStandardMaterial ref={lockMat} color={METAL_MID} metalness={0.85} roughness={0.25} emissive={pal.accent} emissiveIntensity={0.25} />
          </mesh>
          <group ref={shackle} position={[0, 0.26, 0]}>
            <mesh>
              <torusGeometry args={[0.17, 0.045, 10, 24, Math.PI]} />
              <meshStandardMaterial color={METAL_MID} metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </group>
        {/* lockdown ground pulse */}
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.9, 1, 48]} />
          <meshBasicMaterial ref={ringMat} color={pal.accent} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* intruder */}
      <group ref={fig} position={[-5.2, -1.44, 0.6]}>
        <mesh material={figMat} position={[0, 1.62, 0]}><sphereGeometry args={[0.15, 12, 9]} /></mesh>
        <mesh material={figMat} position={[0, 1.14, 0]}><boxGeometry args={[0.4, 0.58, 0.22]} /></mesh>
        <Limb mat={figMat} len={0.52} pos={[-0.28, 1.4, 0]} swingRef={(g) => { limbs.current[2] = g; }} />
        <Limb mat={figMat} len={0.52} pos={[0.28, 1.4, 0]} swingRef={(g) => { limbs.current[3] = g; }} />
        <Limb mat={figMat} len={0.85} pos={[-0.12, 0.85, 0]} swingRef={(g) => { limbs.current[0] = g; }} />
        <Limb mat={figMat} len={0.85} pos={[0.12, 0.85, 0]} swingRef={(g) => { limbs.current[1] = g; }} />
        <pointLight ref={redLight} position={[0, 1.3, 0.5]} color={RED} intensity={0} distance={5} />
      </group>
      <ShadowBlob scale={3} opacity={0.25} position={[-2.4, -1.43, 0.6]} />
    </group>
  );
}

// ── Scene 2 · Compute cluster ───────────────────────────────
const BLADES = 6;
const SCATTER: [number, number, number][] = [
  [-2.9, 1.7, -0.9], [2.6, 2.2, 0.5], [-2.0, -0.3, 1.1],
  [3.0, 0.1, -1.3], [-3.2, 0.7, 0.3], [2.1, -0.9, -0.6],
];
export function K8sScene({ sRef, pal }: { sRef: React.RefObject<number>; pal: Palette }) {
  const root = useRef<THREE.Group>(null);
  const blades = useRef<(THREE.Group | null)[]>([]);
  const hub = useRef<THREE.Group>(null);
  const core = useRef<THREE.MeshStandardMaterial>(null);
  const linkMat = useRef<THREE.LineBasicMaterial>(null);
  const finals = useMemo(() => Array.from({ length: BLADES }, (_, i): [number, number, number] => [-0.9, -0.75 + i * 0.4, 0]), []);
  const linkGeo = useMemo(() => {
    const pts: number[] = [];
    for (const f of finals) pts.push(1.6, 0.28, 0, f[0] + 0.8, f[1], f[2]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [finals]);
  useFrame(({ clock }) => {
    const s = sRef.current;
    if (!root.current) return;
    const rx = (2 - projOf(s)) * SPREAD;
    root.current.position.x = rx;
    if (Math.abs(rx) > 12) return; // fully offscreen — skip the choreography
    const l = localOf(s, 2);
    const now = clock.elapsedTime;
    const gather = smooth(0.1, 0.98, l); // fully seated by the stage-1 snap point
    for (let i = 0; i < blades.current.length; i++) {
      const b = blades.current[i];
      if (!b) continue;
      const sc = SCATTER[i], f = finals[i];
      const drift = (1 - gather) * Math.sin(now * 0.7 + i * 1.3) * 0.1;
      b.position.set(
        sc[0] + (f[0] - sc[0]) * gather,
        sc[1] + (f[1] - sc[1]) * gather + drift,
        sc[2] + (f[2] - sc[2]) * gather,
      );
      b.rotation.z = (1 - gather) * (i % 2 ? 0.35 : -0.3);
      b.rotation.x = (1 - gather) * (i % 3 ? -0.2 : 0.25);
    }
    const hubIn = smooth(1.05, 1.35, l);
    const linked = smooth(1.3, 1.85, l);
    if (hub.current) {
      hub.current.scale.setScalar(Math.max(0.001, hubIn));
      hub.current.rotation.y = now * 0.5;
    }
    if (core.current) core.current.emissiveIntensity = 0.8 + Math.sin(now * 2.4) * 0.4 * linked;
    if (linkMat.current) linkMat.current.opacity = linked * (0.55 + 0.25 * Math.sin(now * 3));
  });
  return (
    <group ref={root}>
      {SCATTER.map((sc, i) => (
        <group key={i} ref={(el) => { blades.current[i] = el; }} position={sc}>
          <Box size={[1.6, 0.18, 1.0]} color={METAL_DARK} roughness={0.5} />
          <Box size={[1.5, 0.1, 0.03]} color={BEZEL} position={[0, 0, 0.51]} roughness={0.35} />
          <Led x={0.62} y={0} z={0.53} seed={i * 7 + 3} color={i % 3 === 1 ? LED_AMBER : LED_GREEN} />
          <Led x={0.53} y={0} z={0.53} seed={i * 7 + 9} color={pal.accent} />
        </group>
      ))}
      {/* control plane hub */}
      <group ref={hub} position={[1.6, 0.28, 0]}>
        <mesh>
          <icosahedronGeometry args={[0.34, 0]} />
          <meshBasicMaterial color={pal.accent} wireframe transparent opacity={0.9} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.16, 16, 12]} />
          <meshStandardMaterial ref={core} color={pal.accent} emissive={pal.accent} emissiveIntensity={1} metalness={0.2} roughness={0.3} />
        </mesh>
      </group>
      <lineSegments geometry={linkGeo}>
        <lineBasicMaterial ref={linkMat} color={pal.accent} transparent opacity={0} />
      </lineSegments>
      <ShadowBlob scale={6} opacity={pal.dark ? 0.5 : 0.3} position={[-0.4, -1.43, 0]} />
    </group>
  );
}
