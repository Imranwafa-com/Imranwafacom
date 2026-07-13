export const STAGES = 9;
export const SHOWCASE_HEIGHT_VH = 780;
export const TRIP_X = -1.7;

export const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x));
export const clamp01 = (x: number) => clamp(x, 0, 1);

export function smooth(start: number, end: number, value: number) {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

export const bell = (value: number, center: number, radius: number) =>
  smooth(center - radius, center, value) * (1 - smooth(center, center + radius, value));

export function scrollStagePosition(scrollY: number, top: number, span: number) {
  return clamp01((scrollY - top) / Math.max(1, span)) * (STAGES - 0.0001);
}

export function stageFromScroll(scrollY: number, top: number, span: number) {
  return clamp(Math.round(scrollStagePosition(scrollY, top, span)), 0, STAGES - 1);
}

export function magnetizeStagePosition(position: number) {
  const bounded = clamp(position, 0, STAGES - 1);
  if (bounded >= STAGES - 1) return STAGES - 1;
  const base = Math.floor(bounded);
  return base + smooth(0.06, 0.94, bounded - base);
}

export const dampStage = (current: number, target: number, delta: number) =>
  current + (target - current) * (1 - Math.exp(-4.2 * Math.min(delta, 0.05)));

const PANEL_PLACEMENTS = [
  "side-l", "side-r", "side-l", "side-t", "side-l", "side-r", "side-l", "side-t", "side-l",
] as const;

export const panelPlacementForStage = (stage: number) =>
  PANEL_PLACEMENTS[Math.round(clamp(stage, 0, STAGES - 1))];

const REPEL_RADIUS = 1.35;
const REPEL_PUSH = 0.5;

export function partRepulsionAt(
  partX: number,
  partY: number,
  pointerX: number,
  pointerY: number,
  amount: number,
) {
  const dx = partX - pointerX;
  const dy = partY - pointerY;
  const distance = Math.hypot(dx, dy);
  if (amount <= 0 || distance < 1e-6 || distance >= REPEL_RADIUS) return [0, 0] as const;

  const push = REPEL_PUSH * (1 - distance / REPEL_RADIUS) ** 2 * clamp01(amount) / distance;
  return [dx * push, dy * push] as const;
}

export function rackMotionAt(local: number) {
  const enter = smooth(0.05, 0.85, local);
  const approach = smooth(1.15, 1.7, local);
  const locked = smooth(1.7, 1.92, local);
  const x = -5.4 + 3.7 * enter + 1.05 * approach - 0.35 * locked;
  const crossed = x >= TRIP_X - 0.04;

  return {
    enter,
    approach,
    locked,
    x,
    crossed,
    alarm: crossed ? bell(local, 1.02, 0.78) : 0,
    lockIn: smooth(1.35, 1.6, local),
    shut: smooth(1.7, 1.92, local),
    moving: (enter > 0.02 && enter < 0.98) || (approach > 0.02 && approach < 0.98),
  };
}

export function clusterTimelineAt(local: number) {
  const assemble = smooth(0.08, 0.95, local);
  return {
    assemble,
    labelOpacity: 1 - assemble,
    close: smooth(1.02, 1.28, local),
    toStack: smooth(1.1, 1.65, local),
    gather: smooth(1.2, 1.92, local),
    hubIn: smooth(1.55, 1.78, local),
    linked: smooth(1.65, 1.96, local),
  };
}

export function portraitCameraScale(width: number, height: number) {
  const aspect = width / Math.max(1, height);
  return 1 + clamp((0.9 - aspect) * 1.1, 0, 0.55);
}
