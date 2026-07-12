// ════════════════════════════════════════════════════════════
// Showcase scenes — the 3D side of the pinned project showcase.
//
// Driven by a single damped stage value sRef (0..8): three
// projects × three stages. Scenes sit side by side in world space
// and slide past the camera between projects, and a CameraRig
// interpolates between nine per-stage camera keyframes — so every
// stage is a full-viewport shot (wide, top-down, low-angle) rather
// than one static framing.
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
import {
  STAGES, TRIP_X, clamp, clusterTimelineAt, partRepulsionAt, portraitCameraScale,
  rackMotionAt, smooth,
} from "./choreography";

// ── Palette (CSS-token colors resolved at mount/theme flip) ──
export interface Palette {
  accent: THREE.Color;
  bg: THREE.Color;
  faint: THREE.Color;
  dark: boolean; // carbon theme?
}
// The file intentionally exports scene components and their shared palette
// factory; the latter is not a component and does not participate in refresh.
// eslint-disable-next-line react-refresh/only-export-components
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
const GOLD = new THREE.Color("#c9a54a");
const RED = new THREE.Color("#e5484d");
const FIG_MAT = new THREE.MeshBasicMaterial({ color: RED, wireframe: true, transparent: true, opacity: 0.85 });

const SPREAD = 22;         // world gap between project scenes

// Which project the camera is on, as a continuous value of stage s:
// holds on each project, slides 1 unit while s crosses 2→3 and 5→6.
const projOf = (s: number) => clamp(s - 2, 0, 1) + clamp(s - 5, 0, 1);
// Local stage inside project i: 0..2
const localOf = (s: number, i: number) => clamp(s - 3 * i, 0, 2);

// Shared unit geometry. Passing it as a prop keeps ownership outside R3F;
// per-mesh child materials/geometries remain free to dispose normally.
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const DUST_POSITIONS = (() => {
  const points = new Float32Array(200 * 3);
  let seed = 0x1a2b3c4d;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x1_0000_0000;
  };
  for (let i = 0; i < 200; i++) {
    points[i * 3] = (random() - 0.5) * 22;
    points[i * 3 + 1] = random() * 7 - 1.4;
    points[i * 3 + 2] = (random() - 0.5) * 10;
  }
  return points;
})();

// ── Camera rig — 9 full-screen keyframes ────────────────────
// [px,py,pz, lx,ly,lz] per stage, in active-scene coordinates
// (the active scene always converges to world x=0).
const CAMS: number[][] = [
  // Home lab: wide with the rack on screen-right → top-down over the
  // tray, tray on screen-left → low side shot tilted ~8° down into
  // the open node (components readable).
  [-2.0, 1.1, 8.4, -0.4, 0.7, 0],
  [1.4, 4.6, 2.8, 2.6, 0.0, 1.9],
  [-1.6, 1.35, 6.2, 0.6, 0.5, 0.9],
  // Rack Motion: wide, intruder entering left → close on the intruder
  // tripping the beam → the rack in lockdown, red.
  [1.2, 1.3, 10, 0.6, 0.8, 0],
  [-3.0, 1.9, 6.2, -0.6, 1.0, 0],
  [-0.6, 2.4, 6.4, 1.9, 1.1, 0],
  // Compute cluster: wide over exploded parts on the open side → over
  // the assembling node → pull back to the finished stack.
  [2.1, 0.9, 11.5, 2.1, 0.3, 0],
  [1.5, 2.15, 5.9, 0, 0.15, 0.2],
  [-2.0, 1.9, 8.0, 1.3, 0.3, 0],
];
const MOBILE_CAMS: Partial<Record<number, number[]>> = {
  // Keep the open tray and the full entry-to-rack composition above the
  // mobile bottom sheet without shrinking the hardware into thumbnails.
  2: [-0.4, 1.35, 7, 1.8, -0.3, 0.9],
  3: [-1.4, 1.3, 16, -2, -0.5, 0],
};
const _pos = new THREE.Vector3(), _look = new THREE.Vector3();
export function CameraRig({ sRef }: { sRef: React.RefObject<number> }) {
  const { camera, size } = useThree();
  useFrame(() => {
    const s = clamp(sRef.current, 0, STAGES - 1);
    const i0 = Math.min(STAGES - 2, Math.floor(s));
    const f = smooth(0, 1, s - i0);
    const mobile = size.width <= 880 || (size.height > size.width && size.width <= 1100);
    const a = (mobile ? MOBILE_CAMS[i0] : undefined) ?? CAMS[i0];
    const b = (mobile ? MOBILE_CAMS[i0 + 1] : undefined) ?? CAMS[i0 + 1];
    const scale = portraitCameraScale(size.width, size.height);
    const lx = a[3] + (b[3] - a[3]) * f;
    const ly = a[4] + (b[4] - a[4]) * f;
    const lz = a[5] + (b[5] - a[5]) * f;
    const px = a[0] + (b[0] - a[0]) * f;
    const py = a[1] + (b[1] - a[1]) * f;
    const pz = a[2] + (b[2] - a[2]) * f;
    _look.set(lx, ly - (scale - 1) * 0.9, lz);
    _pos.set(lx + (px - lx) * scale, ly + (py - ly) * scale, lz + (pz - lz) * scale);
    camera.position.copy(_pos);
    camera.lookAt(_look);
  });
  return null;
}

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
// (LEDs, lock, beacon) stay per-instance.
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
    <mesh geometry={UNIT_BOX} material={mat} scale={size} position={position} rotation={rotation} />
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

function labelTexture(text: string, danger = false): THREE.Texture {
  const key = `label|${danger ? "danger" : "default"}|${text}`;
  const hit = texCache.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 128;
  const g = cv.getContext("2d")!;
  g.fillStyle = danger ? "rgba(92, 12, 18, 0.94)" : "rgba(9, 13, 22, 0.9)";
  g.fillRect(4, 4, 504, 120);
  g.strokeStyle = danger ? "#ff5b61" : "rgba(208, 221, 255, 0.82)";
  g.lineWidth = 6;
  g.strokeRect(7, 7, 498, 114);
  g.fillStyle = "#ffffff";
  g.font = '700 44px "JetBrains Mono", monospace';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 256, 66);
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, tx);
  return tx;
}

function LabelSprite({ text, position, scale = [1.4, 0.35, 1], danger = false, materialRef }: {
  text: string;
  position: [number, number, number];
  scale?: [number, number, number];
  danger?: boolean;
  materialRef: (material: THREE.SpriteMaterial | null) => void;
}) {
  const texture = useMemo(() => labelTexture(text, danger), [danger, text]);
  return (
    <sprite position={position} scale={scale} renderOrder={20}>
      <spriteMaterial ref={materialRef} map={texture} transparent opacity={0} depthTest={false} depthWrite={false} toneMapped={false} />
    </sprite>
  );
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
function Led({ x, y, z, seed, color = LED_GREEN }: { x: number; y: number; z: number; seed: number; color?: THREE.Color }) {
  const intensity = seed % 4 === 0 ? 0.45 : 2.2;
  return (
    <mesh geometry={UNIT_BOX} scale={[0.035, 0.035, 0.02]} position={[x, y, z]}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} metalness={0} roughness={0.4} />
    </mesh>
  );
}

// ── Server rack ─────────────────────────────────────────────
export const RACK_W = 2.2, RACK_D = 1.5, UNIT_H = 0.3, GAP = 0.045, UNITS = 8;
export const RACK_H = UNITS * (UNIT_H + GAP) + 0.34;

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
                      <Box size={[0.34, 0.018, 0.045]} color={accent} emissive={accent} emissiveIntensity={1.6} position={[0, 0.075, -0.27]} />
                      {[-0.16, 0.16].map((z) => (
                        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.078, z]}>
                          <circleGeometry args={[0.09, 20]} />
                          <meshStandardMaterial color={METAL_MID} metalness={0.7} roughness={0.35} />
                        </mesh>
                      ))}
                    </group>
                  ))}
                  {[0, 1, 2, 3, 4, 5].map((r) => (
                    <group key={r} position={[-0.5 + r * 0.17, 0.07, -0.42]}>
                      <Box size={[0.035, 0.11, 0.3]} color={PCB} metalness={0.15} roughness={0.65} />
                      {[-0.09, 0, 0.09].map((z) => (
                        <Box key={z} size={[0.012, 0.055, 0.055]} color={BEZEL} position={[0.024, 0.012, z]} metalness={0.1} roughness={0.7} />
                      ))}
                      <Box size={[0.012, 0.018, 0.26]} color={GOLD} position={[0.024, -0.048, 0]} metalness={0.7} roughness={0.25} />
                    </group>
                  ))}
                  <group position={[0.72, 0.08, -0.42]}>
                    <Box size={[0.34, 0.12, 0.3]} color={METAL_MID} metalness={0.7} roughness={0.35} />
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.065, 0]}>
                      <circleGeometry args={[0.11, 24]} />
                      <meshStandardMaterial color={BEZEL} metalness={0.45} roughness={0.5} />
                    </mesh>
                  </group>
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
  const pts = useRef<THREE.Points>(null);
  const grid = useRef<THREE.GridHelper>(null);
  useEffect(() => {
    const m = grid.current?.material as THREE.Material | undefined;
    if (m) { m.transparent = true; m.opacity = pal.dark ? 0.12 : 0.18; m.needsUpdate = true; }
  }, [pal]);
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
      <fog attach="fog" args={[pal.bg, 12, 26]} />
      <ambientLight intensity={pal.dark ? 0.9 : 1.0} />
      <directionalLight position={[5, 9, 6]} intensity={pal.dark ? 2.4 : 2.2} />
      {/* frontal fill so bezels and faces read instead of silhouetting */}
      <directionalLight position={[0, 2, 12]} intensity={pal.dark ? 1.5 : 0.7} />
      <directionalLight position={[-6, 4, -4]} intensity={0.7} color={pal.accent} />
      {/* floor grid — kept small + faint so the horizon melts into fog.
          Colors go through args (a material child would leak the helper's
          own material); opacity is set on the built-in material above. */}
      <gridHelper ref={grid} args={[40, 40, pal.faint, pal.faint]} position={[0, -1.44, 0]} />
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
          <bufferAttribute attach="attributes-position" args={[DUST_POSITIONS, 3]} />
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
  useFrame(() => {
    const s = sRef.current;
    if (!root.current) return;
    const x = (0 - projOf(s)) * SPREAD;
    root.current.position.x = x;
    if (Math.abs(x) > 13) return; // fully offscreen — skip the choreography
    const l = localOf(s, 0);
    const slide = smooth(0.15, 0.95, l);
    const open = smooth(1.15, 1.95, l);
    if (spin.current) {
      // stage 1: swing the rack so the tray rides out toward open floor;
      // stage 2: swing past center so the tray exits screen-right, away
      // from the text panel on the left
      spin.current.rotation.y = -0.5 + 0.42 * smooth(0.2, 1, l) + 0.55 * smooth(1.2, 2, l);
    }
    if (tray.current) tray.current.position.z = slide * 1.75;
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
      <group ref={spin} position={[1.8, -1.44, 0]}>
        <ServerRack accent={pal.accent} openRefs={openRefs} />
        <ShadowBlob scale={6} opacity={pal.dark ? 0.6 : 0.35} />
        <pointLight position={[0, RACK_H + 0.8, 1.4]} intensity={6} color={pal.accent} distance={7} />
      </group>
    </group>
  );
}

// ── Scene 1 · Rack Motion ───────────────────────────────────
// The intruder stays a red hologram-wireframe on purpose — it's the
// detection overlay, not a person — but now it walks, trips a beam,
// and sets off a beacon; the rack answers by going red and locking.
function Limb({ len, pos, swingRef }: { len: number; pos: [number, number, number]; swingRef: (g: THREE.Group | null) => void }) {
  return (
    <group position={pos} ref={swingRef}>
      <mesh material={FIG_MAT} position={[0, -len * 0.24, 0]}>
        <boxGeometry args={[0.11, len * 0.48, 0.11]} />
      </mesh>
      <mesh material={FIG_MAT} position={[0, -len * 0.5, 0]}>
        <sphereGeometry args={[0.075, 10, 8]} />
      </mesh>
      <mesh material={FIG_MAT} position={[0, -len * 0.76, 0]}>
        <boxGeometry args={[0.09, len * 0.48, 0.09]} />
      </mesh>
    </group>
  );
}
export function RackMotionScene({ sRef, pal }: { sRef: React.RefObject<number>; pal: Palette }) {
  const root = useRef<THREE.Group>(null);
  const fig = useRef<THREE.Group>(null);
  const figShadow = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  const limbs = useRef<(THREE.Group | null)[]>([]);
  const lock = useRef<THREE.Group>(null);
  const shackle = useRef<THREE.Group>(null);
  const lockMat = useRef<THREE.MeshStandardMaterial>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringT0 = useRef(-1);
  const redLight = useRef<THREE.PointLight>(null);
  const lockLight = useRef<THREE.PointLight>(null);
  const beaconMat = useRef<THREE.MeshStandardMaterial>(null);
  const sweep = useRef<THREE.Group>(null);
  const sweepMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const tripMat = useRef<THREE.MeshStandardMaterial>(null);
  const lockdownLabel = useRef<THREE.SpriteMaterial>(null);
  const sweepTexture = useMemo(() => radialTexture("rgba(229,72,77,0.9)", "rgba(229,72,77,0)"), []);
  useFrame(({ clock }, delta) => {
    const s = sRef.current;
    if (!root.current) return;
    const rx = (1 - projOf(s)) * SPREAD;
    root.current.position.x = rx;
    if (Math.abs(rx) > 13) return; // fully offscreen — skip the choreography
    const l = localOf(s, 1);
    const now = clock.elapsedTime;
    const motion = rackMotionAt(l);
    if (fig.current) {
      // walks in, freezes when the beam trips, presses on, recoils at lockdown
      fig.current.position.x = motion.x;
      fig.current.position.y = -1.44 + (motion.moving ? Math.abs(Math.sin(now * 6.4)) * 0.045 : 0);
      fig.current.rotation.z = -0.05 * motion.alarm + 0.12 * motion.locked;
    }
    if (figShadow.current) figShadow.current.position.x = motion.x;
    if (head.current) {
      // caught-in-the-act head snap toward the beacon during the alarm
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, motion.alarm > 0.3 ? 0.8 + Math.sin(now * 2.2) * 0.25 : 0, 8, delta);
    }
    // walk cycle — legs and arms counter-swing while moving
    const amp = motion.moving ? 0.55 : 0;
    for (let i = 0; i < limbs.current.length; i++) {
      const g = limbs.current[i];
      if (!g) continue;
      const phase = i % 2 === 0 ? 0 : Math.PI;
      let target = amp * Math.sin(now * 6.4 + phase) * (i < 2 ? 1 : 0.7);
      if (i === 2) target -= motion.alarm * 0.95;
      if (i === 3) target += motion.alarm * 0.45;
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, target, 16, delta);
    }
    // detection blink — outline + red light strobe together with the siren
    const strobe = Math.sin(now * 9) > 0 ? 1 : 0.15;
    FIG_MAT.opacity = 0.85 - motion.alarm * 0.6 * (1 - strobe);
    if (redLight.current) redLight.current.intensity = motion.alarm * 10 * strobe;
    // tripwire beam glows until crossed, flares at the crossing
    if (tripMat.current) {
      tripMat.current.emissiveIntensity = motion.crossed ? 3.5 * strobe * Math.max(motion.alarm, 0.2) : 1.1 + Math.sin(now * 3) * 0.3;
    }
    // beacon dome + rotating sweep blades run during alarm and lockdown
    const siren = Math.max(motion.alarm, motion.locked * 0.85);
    if (beaconMat.current) beaconMat.current.emissiveIntensity = 0.3 + siren * 3.4 * strobe;
    if (sweep.current) sweep.current.rotation.y = now * 5;
    for (const mat of sweepMats.current) if (mat) mat.opacity = siren * 0.52;
    // lockdown: padlock in, shackle shut, rack washed red
    if (lock.current) {
      lock.current.scale.setScalar(Math.max(0.001, motion.lockIn));
      lock.current.position.y = RACK_H * 0.85 + 0.75 + (1 - motion.lockIn) * 0.5;
    }
    if (shackle.current) shackle.current.position.y = 0.26 - 0.13 * motion.shut;
    if (lockMat.current) {
      lockMat.current.emissive.copy(motion.shut > 0.5 ? RED : pal.accent);
      lockMat.current.emissiveIntensity = 0.25 + motion.shut * 2.2;
    }
    if (lockLight.current) lockLight.current.intensity = motion.locked * 9;
    if (lockdownLabel.current) lockdownLabel.current.opacity = motion.locked;
    if (ring.current && ringMat.current) {
      // pulse phase starts when the lock shuts, not at a random clock point
      if (motion.shut > 0.99 && ringT0.current < 0) ringT0.current = now;
      if (motion.shut <= 0.99) ringT0.current = -1;
      if (ringT0.current >= 0 && now < ringT0.current) ringT0.current = now;
      const ringT = ringT0.current >= 0 ? ((now - ringT0.current) % 1.6) / 1.6 : 0;
      ring.current.scale.setScalar(0.5 + ringT * 4);
      ringMat.current.opacity = ringT0.current >= 0 ? (1 - ringT) * 0.5 : 0;
    }
  });
  return (
    <group ref={root} position={[SPREAD, 0, 0]}>
      {/* the rack being protected */}
      <group position={[1.3, -1.44, 0]} rotation={[0, -0.35, 0]}>
        <ServerRack accent={pal.accent} scale={0.85} />
        <ShadowBlob scale={5} opacity={pal.dark ? 0.6 : 0.35} />
        {/* alarm beacon on the cabinet roof */}
        <group position={[0, RACK_H * 0.85 + 0.12, 0]}>
          <mesh geometry={UNIT_BOX} scale={[0.22, 0.06, 0.22]}>
            <meshStandardMaterial color={METAL_MID} metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <sphereGeometry args={[0.11, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial ref={beaconMat} color={RED} emissive={RED} emissiveIntensity={0.3} roughness={0.25} />
          </mesh>
          {/* rotating light blades */}
          <group ref={sweep} position={[0, 0.1, 0]}>
            {[0, Math.PI / 2].map((r, i) => (
              <mesh key={r} rotation={[0, r, 0]}>
                <planeGeometry args={[3.2, 0.48]} />
                <meshBasicMaterial ref={(m) => { sweepMats.current[i] = m; }} map={sweepTexture} color="#ffffff" transparent opacity={0}
                  blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
            ))}
          </group>
        </group>
        {/* padlock */}
        <group ref={lock} position={[0, RACK_H * 0.85 + 0.75, 0]}>
          <mesh geometry={UNIT_BOX} scale={[0.5, 0.4, 0.2]}>
            <meshStandardMaterial ref={lockMat} color={METAL_MID} metalness={0.85} roughness={0.25} emissive={pal.accent} emissiveIntensity={0.25} />
          </mesh>
          <group ref={shackle} position={[0, 0.26, 0]}>
            <mesh>
              <torusGeometry args={[0.17, 0.045, 10, 24, Math.PI]} />
              <meshStandardMaterial color={METAL_MID} metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </group>
        <LabelSprite
          text="LOCKDOWN"
          position={[0, RACK_H * 0.85 + 1.32, 0]}
          scale={[1.8, 0.45, 1]}
          danger
          materialRef={(material) => { lockdownLabel.current = material; }}
        />
        {/* red lockdown wash */}
        <pointLight ref={lockLight} position={[0, RACK_H * 0.5, 1.6]} color={RED} intensity={0} distance={7} />
        {/* lockdown ground pulse */}
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.9, 1, 48]} />
          <meshBasicMaterial ref={ringMat} color={RED} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* tripwire beam across the intruder's path */}
      <mesh geometry={UNIT_BOX} scale={[0.025, 0.025, 3.4]} position={[TRIP_X, -1.0, 0.4]}>
        <meshStandardMaterial ref={tripMat} color={RED} emissive={RED} emissiveIntensity={1.1} transparent opacity={0.9} />
      </mesh>
      {/* intruder */}
      <group ref={fig} position={[-5.4, -1.44, 0.4]}>
        <mesh ref={head} material={FIG_MAT} position={[0, 1.72, 0]}><sphereGeometry args={[0.17, 14, 10]} /></mesh>
        <mesh material={FIG_MAT} position={[0, 1.25, 0]}><capsuleGeometry args={[0.2, 0.42, 6, 10]} /></mesh>
        <mesh material={FIG_MAT} position={[0, 0.91, 0]}><boxGeometry args={[0.38, 0.16, 0.22]} /></mesh>
        <Limb len={0.58} pos={[-0.27, 1.48, 0]} swingRef={(g) => { limbs.current[2] = g; }} />
        <Limb len={0.58} pos={[0.27, 1.48, 0]} swingRef={(g) => { limbs.current[3] = g; }} />
        <Limb len={0.9} pos={[-0.12, 0.88, 0]} swingRef={(g) => { limbs.current[0] = g; }} />
        <Limb len={0.9} pos={[0.12, 0.88, 0]} swingRef={(g) => { limbs.current[1] = g; }} />
        <pointLight ref={redLight} position={[0, 1.3, 0.5]} color={RED} intensity={0} distance={5} />
      </group>
      <group ref={figShadow} position={[-5.4, 0, 0.4]}>
        <ShadowBlob scale={3} opacity={0.25} position={[0, -1.43, 0]} />
      </group>
    </group>
  );
}

// ── Scene 2 · Compute cluster ───────────────────────────────
// Stage 0: every part of a node — board, CPU, RAM, GPUs, drives,
// PSU — floats exploded across the open side. Stage 1: they fly
// together into one chassis. Stage 2: five more blades join it in
// a stack, and the control plane lights the links.
interface PartSpec {
  kind: "board" | "cpu" | "ram" | "gpu" | "nvme" | "psu";
  label: string;
  size: [number, number, number];
  color: THREE.Color;
  seat: [number, number, number];
  exp: [number, number, number];
  rot: [number, number, number];
  emissive?: THREE.Color;
  emissiveIntensity?: number;
}
const PARTS: PartSpec[] = [
  { kind: "board", label: "MAINBOARD", size: [1.42, 0.035, 0.9], color: PCB, seat: [0, 0.04, 0], exp: [0.8, 1.6, 0.4], rot: [0.5, 0.4, 0.3], emissive: PCB, emissiveIntensity: 0.25 },
  { kind: "cpu", label: "CPU", size: [0.24, 0.06, 0.24], color: BEZEL, seat: [-0.32, 0.09, -0.12], exp: [3.7, 2.2, -0.5], rot: [0.8, 0.2, 0.5] },
  { kind: "ram", label: "RAM 01", size: [0.04, 0.13, 0.32], color: PCB, seat: [-0.06, 0.12, -0.3], exp: [0, 0.8, 0.8], rot: [0.2, 0.9, 0.6] },
  { kind: "ram", label: "RAM 02", size: [0.04, 0.13, 0.32], color: PCB, seat: [0.03, 0.12, -0.3], exp: [1.2, 0.8, 1.1], rot: [0.7, 0.1, 0.9] },
  { kind: "ram", label: "RAM 03", size: [0.04, 0.13, 0.32], color: PCB, seat: [0.12, 0.12, -0.3], exp: [4, 1, 0.9], rot: [0.4, 0.6, 0.2] },
  { kind: "ram", label: "RAM 04", size: [0.04, 0.13, 0.32], color: PCB, seat: [0.21, 0.12, -0.3], exp: [3, 0.8, -0.8], rot: [0.9, 0.3, 0.7] },
  { kind: "gpu", label: "GPU 01", size: [0.36, 0.13, 0.62], color: METAL_DARK, seat: [0.45, 0.12, 0.16], exp: [4, 1.3, 0.6], rot: [0.3, 0.7, 0.4] },
  { kind: "gpu", label: "GPU 02", size: [0.36, 0.13, 0.62], color: METAL_DARK, seat: [0.02, 0.12, 0.16], exp: [0.2, 0.6, -0.4], rot: [0.6, 0.5, 0.8] },
  { kind: "nvme", label: "NVME 01", size: [0.3, 0.07, 0.4], color: PCB, seat: [-0.5, 0.09, 0.22], exp: [1.5, 2.5, -0.7], rot: [0.2, 0.8, 0.1] },
  { kind: "nvme", label: "NVME 02", size: [0.3, 0.07, 0.4], color: PCB, seat: [-0.5, 0.17, 0.22], exp: [2.7, 2.7, 0.7], rot: [0.5, 0.2, 0.6] },
  { kind: "psu", label: "PSU", size: [0.32, 0.14, 0.32], color: METAL_MID, seat: [0.55, 0.12, -0.28], exp: [3.5, 0.7, 1.0], rot: [0.1, 0.5, 0.9] },
];
const BLADES = 6;
const NODE_SLOT = 3; // the assembled node becomes this blade in the stack
const STACK_X = 0.3;
const HUB_X = 2.65;
const SCATTER: [number, number, number][] = [
  [-3.4, 1.9, -0.9], [3.1, 2.4, 0.5], [-2.6, -0.5, 1.1],
  [0, 0, 0], // slot taken by the assembled node
  [-3.6, 0.9, 0.3], [2.6, -1.1, -0.6],
];
const POINTER_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const POINTER_HIT = new THREE.Vector3();
const POINTER_LOCAL = new THREE.Vector3();
export function K8sScene({ sRef, pal }: { sRef: React.RefObject<number>; pal: Palette }) {
  const { pointer, camera, raycaster, gl } = useThree();
  const root = useRef<THREE.Group>(null);
  const node = useRef<THREE.Group>(null);
  const nodeLid = useRef<THREE.Group>(null);
  const parts = useRef<(THREE.Group | null)[]>([]);
  const partLabels = useRef<(THREE.SpriteMaterial | null)[]>([]);
  const blades = useRef<(THREE.Group | null)[]>([]);
  const hub = useRef<THREE.Group>(null);
  const hubRotor = useRef<THREE.Group>(null);
  const core = useRef<THREE.MeshStandardMaterial>(null);
  const linkMat = useRef<THREE.LineBasicMaterial>(null);
  const finePointer = useMemo(() =>
    typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  []);
  const finals = useMemo(() => Array.from({ length: BLADES }, (_, i): [number, number, number] => [STACK_X, -0.75 + i * 0.4, 0]), []);
  const linkGeo = useMemo(() => {
    const pts: number[] = [];
    for (const f of finals) pts.push(HUB_X, 0.28, 0, f[0] + 0.8, f[1], f[2]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [finals]);
  useEffect(() => () => linkGeo.dispose(), [linkGeo]);
  useFrame(({ clock }) => {
    const s = sRef.current;
    if (!root.current) return;
    const rx = (2 - projOf(s)) * SPREAD;
    root.current.position.x = rx;
    if (Math.abs(rx) > 13) return; // fully offscreen — skip the choreography
    const l = localOf(s, 2);
    const now = clock.elapsedTime;
    const timeline = clusterTimelineAt(l);
    let repelPointer: THREE.Vector3 | null = null;
    if (finePointer && timeline.labelOpacity > 0 && node.current && gl.domElement.matches(":hover")) {
      camera.updateMatrixWorld();
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(POINTER_PLANE, POINTER_HIT)) {
        node.current.updateWorldMatrix(true, false);
        POINTER_LOCAL.copy(POINTER_HIT);
        node.current.worldToLocal(POINTER_LOCAL);
        repelPointer = POINTER_LOCAL;
      }
    }
    // stage 0→1: exploded parts drift, then fly into the chassis
    for (let i = 0; i < parts.current.length; i++) {
      const p = parts.current[i];
      if (!p) continue;
      const spec = PARTS[i];
      const drift = (1 - timeline.assemble) * Math.sin(now * 0.6 + i * 1.9) * 0.06;
      const x = spec.exp[0] + (spec.seat[0] - spec.exp[0]) * timeline.assemble;
      const y = spec.exp[1] + (spec.seat[1] - spec.exp[1]) * timeline.assemble;
      const z = spec.exp[2] + (spec.seat[2] - spec.exp[2]) * timeline.assemble;
      const [repelX, repelY] = repelPointer
        ? partRepulsionAt(x, y, repelPointer.x, repelPointer.y, timeline.labelOpacity)
        : [0, 0];
      p.position.set(x + repelX, y + drift + repelY, z);
      p.rotation.set(spec.rot[0] * (1 - timeline.assemble), spec.rot[1] * (1 - timeline.assemble) + (1 - timeline.assemble) * now * 0.06, spec.rot[2] * (1 - timeline.assemble));
      p.scale.setScalar(1 + (1 - timeline.assemble) * 0.18);
      const label = partLabels.current[i];
      if (label) label.opacity = timeline.labelOpacity;
    }
    // stage 1→2: lid closes, node slides into the stack slot
    if (nodeLid.current) {
      nodeLid.current.position.y = 0.4 - 0.21 * timeline.close;
      const m = nodeLid.current.children[0] as THREE.Mesh | undefined;
      const mat = m?.material as THREE.MeshStandardMaterial | undefined;
      if (mat) mat.opacity = timeline.close;
    }
    if (node.current) {
      node.current.position.set(
        0.2 + (finals[NODE_SLOT][0] - 0.2) * timeline.toStack,
        -0.4 + (finals[NODE_SLOT][1] + 0.4) * timeline.toStack,
        finals[NODE_SLOT][2] * timeline.toStack,
      );
    }
    // the other five blades fly in behind it
    for (let i = 0; i < blades.current.length; i++) {
      const b = blades.current[i];
      if (!b) continue;
      const sc = SCATTER[i], f = finals[i];
      const dr = (1 - timeline.gather) * Math.sin(now * 0.7 + i * 1.3) * 0.04;
      b.position.set(
        sc[0] + (f[0] - sc[0]) * timeline.gather,
        sc[1] + (f[1] - sc[1]) * timeline.gather + dr,
        sc[2] + (f[2] - sc[2]) * timeline.gather,
      );
      b.rotation.z = (1 - timeline.gather) * (i % 2 ? 0.35 : -0.3);
      b.rotation.x = (1 - timeline.gather) * (i % 3 ? -0.2 : 0.25);
      const appear = smooth(0, 0.2, timeline.gather);
      b.scale.setScalar(Math.max(0.001, appear));
      b.visible = appear > 0.01; // hidden while stage 0/1 focus on the parts
    }
    if (hub.current) {
      hub.current.scale.setScalar(Math.max(0.001, timeline.hubIn));
    }
    if (hubRotor.current) hubRotor.current.rotation.z = now * 0.18;
    if (core.current) core.current.emissiveIntensity = 0.8 + Math.sin(now * 2.4) * 0.4 * timeline.linked;
    if (linkMat.current) linkMat.current.opacity = timeline.linked * (0.55 + 0.25 * Math.sin(now * 3));
  });
  return (
    <group ref={root} position={[SPREAD * 2, 0, 0]}>
      {/* the hero node: chassis + exploded parts */}
      <group ref={node} position={[0.2, -0.4, 0]}>
        {/* open chassis */}
        <Box size={[1.6, 0.05, 1.0]} color={METAL_DARK} position={[0, -0.03, 0]} />
        <Box size={[0.05, 0.2, 1.0]} color={METAL_DARK} position={[-0.78, 0.07, 0]} />
        <Box size={[0.05, 0.2, 1.0]} color={METAL_DARK} position={[0.78, 0.07, 0]} />
        <Box size={[1.5, 0.12, 0.03]} color={BEZEL} position={[0, 0.05, 0.5]} roughness={0.35} />
        <Led x={0.62} y={0.05} z={0.52} seed={31} color={pal.accent} />
        {/* lid slides shut when the node joins the stack */}
        <group ref={nodeLid} position={[0, 0.4, 0]}>
          <mesh geometry={UNIT_BOX} scale={[1.56, 0.03, 0.96]}>
            <meshStandardMaterial color={METAL_MID} metalness={0.85} roughness={0.3} transparent opacity={0} />
          </mesh>
        </group>
        {/* the parts */}
        {PARTS.map((spec, i) => (
          <group key={i} ref={(el) => { parts.current[i] = el; }} position={spec.exp}>
            <Box size={spec.size} color={spec.color} emissive={spec.emissive} emissiveIntensity={spec.emissiveIntensity ?? 0} />
            <LabelSprite
              text={spec.label}
              position={[0, spec.size[1] * 0.5 + 0.28, 0]}
              materialRef={(material) => { partLabels.current[i] = material; }}
            />
            {spec.kind === "board" && <>
              <Box size={[0.34, 0.018, 0.3]} color={METAL_MID} position={[-0.32, 0.027, -0.12]} metalness={0.65} roughness={0.35} />
              {[-0.06, 0.03, 0.12, 0.21].map((x) => (
                <Box key={x} size={[0.025, 0.014, 0.3]} color={BEZEL} position={[x, 0.026, -0.3]} metalness={0.2} roughness={0.7} />
              ))}
              <Box size={[0.64, 0.01, 0.018]} color={pal.accent} emissive={pal.accent} emissiveIntensity={0.9} position={[0.2, 0.026, 0.25]} />
              <Box size={[0.018, 0.01, 0.42]} color={pal.accent} emissive={pal.accent} emissiveIntensity={0.9} position={[0.5, 0.026, 0.04]} />
            </>}
            {spec.kind === "cpu" && (
              <Box size={[0.2, 0.018, 0.2]} color={METAL_MID} position={[0, 0.038, 0]} metalness={0.9} roughness={0.18} />
            )}
            {spec.kind === "ram" && <>
              {[-0.09, 0, 0.09].map((z) => (
                <Box key={z} size={[0.012, 0.07, 0.055]} color={BEZEL} position={[0.026, 0.012, z]} metalness={0.1} roughness={0.7} />
              ))}
              <Box size={[0.012, 0.02, 0.27]} color={GOLD} position={[0.026, -0.055, 0]} metalness={0.7} roughness={0.25} />
            </>}
            {spec.kind === "gpu" && <>
              {[-0.16, 0.16].map((z) => (
                <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, z]}>
                  <circleGeometry args={[0.1, 24]} />
                  <meshStandardMaterial color={METAL_MID} metalness={0.7} roughness={0.35} />
                </mesh>
              ))}
              <Box size={[0.38, 0.018, 0.04]} color={pal.accent} emissive={pal.accent} emissiveIntensity={1.5} position={[0, 0.072, -0.29]} />
              <Box size={[0.28, 0.014, 0.035]} color={GOLD} position={[0, -0.071, 0.08]} metalness={0.7} roughness={0.25} />
            </>}
            {spec.kind === "nvme" && <>
              {[-0.1, 0.07].map((z) => (
                <Box key={z} size={[0.2, 0.018, 0.1]} color={BEZEL} position={[0, 0.044, z]} metalness={0.1} roughness={0.7} />
              ))}
              <Box size={[0.22, 0.012, 0.035]} color={GOLD} position={[0, 0.043, 0.18]} metalness={0.7} roughness={0.25} />
            </>}
            {spec.kind === "psu" && <>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.075, 0]}>
                <circleGeometry args={[0.11, 24]} />
                <meshStandardMaterial color={BEZEL} metalness={0.45} roughness={0.5} />
              </mesh>
              {[-0.08, 0, 0.08].map((x) => (
                <Box key={x} size={[0.025, 0.012, 0.24]} color={METAL_DARK} position={[x, 0.078, 0]} metalness={0.4} roughness={0.55} />
              ))}
            </>}
          </group>
        ))}
      </group>
      {/* the rest of the stack */}
      {SCATTER.map((sc, i) => i === NODE_SLOT ? null : (
        <group key={i} ref={(el) => { blades.current[i] = el; }} position={sc} visible={false}>
          <Box size={[1.6, 0.18, 1.0]} color={METAL_DARK} roughness={0.5} />
          <Box size={[1.5, 0.1, 0.03]} color={BEZEL} position={[0, 0, 0.51]} roughness={0.35} />
          <Led x={0.62} y={0} z={0.53} seed={i * 7 + 3} color={i % 3 === 1 ? LED_AMBER : LED_GREEN} />
          <Led x={0.53} y={0} z={0.53} seed={i * 7 + 9} color={pal.accent} />
        </group>
      ))}
      {/* control plane hub */}
      <group ref={hub} position={[HUB_X, 0.28, 0]}>
        <group ref={hubRotor}>
          <mesh>
            <torusGeometry args={[0.31, 0.045, 10, 32]} />
            <meshBasicMaterial color={pal.accent} transparent opacity={0.9} />
          </mesh>
          {Array.from({ length: 7 }, (_, i) => {
            const angle = i * Math.PI * 2 / 7;
            return (
              <mesh key={i} position={[Math.cos(angle) * 0.16, Math.sin(angle) * 0.16, 0]} rotation={[0, 0, angle - Math.PI / 2]}>
                <boxGeometry args={[0.04, 0.28, 0.04]} />
                <meshBasicMaterial color={pal.accent} transparent opacity={0.9} />
              </mesh>
            );
          })}
        </group>
        <mesh>
          <sphereGeometry args={[0.16, 16, 12]} />
          <meshStandardMaterial ref={core} color={pal.accent} emissive={pal.accent} emissiveIntensity={1} metalness={0.2} roughness={0.3} />
        </mesh>
      </group>
      <lineSegments geometry={linkGeo}>
        <lineBasicMaterial ref={linkMat} color={pal.accent} transparent opacity={0} />
      </lineSegments>
      <ShadowBlob scale={6} opacity={pal.dark ? 0.5 : 0.3} position={[0.8, -1.43, 0]} />
    </group>
  );
}
