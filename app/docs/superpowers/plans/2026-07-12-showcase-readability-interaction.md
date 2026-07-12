# Showcase Readability and Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the nine-stage showcase readable, interactive, shorter to scroll, mobile-safe, and able to boot in production.

**Architecture:** Keep the existing canvas, stage driver, and scene components. Extend the pure choreography module with authored panel placement, scroll height, and repulsion math; consume those helpers in the existing React/R3F/CSS flow. Delete forced Vite vendor chunking so Rollup can preserve valid module order.

**Tech Stack:** React 19, TypeScript 5.9, React Three Fiber 9, Three.js 0.185, Vite 7, CSS, Node's built-in test runner.

## Global Constraints

- Keep exactly nine showcase stages.
- Panel placement is `left, right, left, top, left, right, left, top, left` for stages `0..8`.
- Showcase height is `780vh` outside reduced-motion mode.
- Repulsion is fine-pointer/canvas-hover only and fades with `1 - assemble`.
- Portrait mobile is a `52dvh / 48dvh` scene/content split.
- Short mobile landscape is a `58vw / 42vw` scene/content split.
- Keep reduced-motion content in normal document flow.
- Add no dependency.

---

### Task 1: Production boot contract

**Files:**
- Create: `tests/production-chunks.test.ts`
- Modify: `package.json`
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: Vite's existing dynamic `Showcase` and `Resume` imports.
- Produces: a production chunk graph with no mutual imports.

- [ ] **Step 1: Write the failing production graph test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import type { OutputChunk } from "rollup";
import { build } from "vite";

test("production chunks have no mutual imports", async () => {
  const result = await build({ mode: "production", logLevel: "silent", build: { write: false } });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((entry) => entry.output);
  const chunks = new Map(
    outputs
      .filter((entry): entry is OutputChunk => entry.type === "chunk")
      .map((entry) => [entry.fileName, entry]),
  );

  for (const [name, chunk] of chunks) {
    for (const dependency of chunk.imports) {
      assert.equal(chunks.get(dependency)?.imports.includes(name), false, `${name} <-> ${dependency}`);
    }
  }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/production-chunks.test.ts`
Expected: FAIL naming `vendor-react` and `vendor-core`.

- [ ] **Step 3: Delete forced vendor partitioning**

Reduce `vite.config.ts` to the existing plugins and alias; remove the entire
`build.rollupOptions.output.manualChunks` block. Update `test:showcase` to run
both test files explicitly.

- [ ] **Step 4: Verify GREEN**

Run: `npm run test:showcase`
Expected: all choreography and production graph tests pass.

Run: `npm run build`
Expected: exit 0 with no `Circular chunk` warning.

### Task 2: Pure placement, cadence, and repulsion contract

**Files:**
- Modify: `src/specimen/showcase/choreography.ts`
- Modify: `tests/showcase-choreography.test.ts`

**Interfaces:**
- Produces: `SHOWCASE_HEIGHT_VH`, `panelPlacementForStage(stage)`, and `partRepulsionAt(partX, partY, pointerX, pointerY, amount)`.
- Consumers: `Specimen.tsx`, `Showcase.tsx`, and `scenes.tsx`.

- [ ] **Step 1: Add failing placement, cadence, and repulsion tests**

```ts
assert.deepEqual(Array.from({ length: STAGES }, (_, stage) => panelPlacementForStage(stage)), [
  "side-l", "side-r", "side-l", "side-t", "side-l", "side-r", "side-l", "side-t", "side-l",
]);
assert.equal(SHOWCASE_HEIGHT_VH, 780);
assert.equal((SHOWCASE_HEIGHT_VH - 100) / STAGES, 680 / 9);

assert.deepEqual(partRepulsionAt(2, 0, 0, 0, 0), [0, 0]);
assert.deepEqual(partRepulsionAt(2, 0, 0, 0, 1), [0, 0]);
const full = partRepulsionAt(0.5, 0, 0, 0, 1);
const half = partRepulsionAt(0.5, 0, 0, 0, 0.5);
assert.ok(full[0] > 0);
assert.equal(half[0], full[0] * 0.5);
assert.deepEqual(partRepulsionAt(0, 0, 0, 0, 1), [0, 0]);
assert.ok(Math.hypot(...full) <= 0.5);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:showcase`
Expected: FAIL because the new exports do not exist.

- [ ] **Step 3: Implement the smallest helpers**

```ts
export const SHOWCASE_HEIGHT_VH = 780;
const PANEL_PLACEMENTS = [
  "side-l", "side-r", "side-l", "side-t", "side-l", "side-r", "side-l", "side-t", "side-l",
] as const;
export const panelPlacementForStage = (stage: number) =>
  PANEL_PLACEMENTS[Math.round(clamp(stage, 0, STAGES - 1))];

const REPEL_RADIUS = 1.35;
const REPEL_PUSH = 0.5;
export function partRepulsionAt(partX: number, partY: number, pointerX: number, pointerY: number, amount: number) {
  const dx = partX - pointerX;
  const dy = partY - pointerY;
  const distance = Math.hypot(dx, dy);
  if (amount <= 0 || distance < 1e-6 || distance >= REPEL_RADIUS) return [0, 0] as const;
  const push = REPEL_PUSH * (1 - distance / REPEL_RADIUS) ** 2 * clamp01(amount) / distance;
  return [dx * push, dy * push] as const;
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm run test:showcase`
Expected: all tests pass.

### Task 3: Integrate stage layout, pointer response, and mobile split

**Files:**
- Modify: `src/specimen/Specimen.tsx`
- Modify: `src/specimen/showcase/Showcase.tsx`
- Modify: `src/specimen/showcase/scenes.tsx`
- Modify: `src/specimen/specimen.css`

**Interfaces:**
- Consumes: `SHOWCASE_HEIGHT_VH`, `panelPlacementForStage`, and `partRepulsionAt` from Task 2.
- Produces: authored desktop panel placement, fine-pointer part repulsion, and disjoint mobile scene/copy cells.

- [ ] **Step 1: Use the tested height and placement**

Import `SHOWCASE_HEIGHT_VH` in `Specimen.tsx` and set the live wrapper height to
`` `${SHOWCASE_HEIGHT_VH}vh` ``. Replace `panelSideForStage` with
`panelPlacementForStage` in `Showcase.tsx`.

- [ ] **Step 2: Apply pointer repulsion in the existing K8s frame loop**

Use `useThree()` to read `pointer`, `camera`, `raycaster`, and `gl`. Reuse
module-level `THREE.Plane`/`THREE.Vector3` scratch values. Only calculate a
pointer hit when `matchMedia("(hover: hover) and (pointer: fine)").matches`,
`gl.domElement.matches(":hover")`, `node.current` exists, and
`timeline.labelOpacity > 0`. Convert the hit with `node.current.worldToLocal`
and add `partRepulsionAt(...)` to each freshly computed part position.

- [ ] **Step 3: Replace crossing panel motion with authored placements**

Give `.sc-panel` an opaque square-edged scrim and no `left` transition. Add a
`.side-t` placement and `scFadeT`; keep left/right directional fades. Hide
`.side-t .sc-specs` so the top treatment remains compact.

- [ ] **Step 4: Replace the mobile overlay with disjoint cells**

In the existing mobile query, set `.sc-stage { bottom: 48dvh; }` and make the
panel a solid, full-width `48dvh` dock at the bottom. Add a short-landscape
coarse-pointer query with `.sc-stage { right: 42vw; bottom: 0; }` and a right
panel dock of `42vw`. Reset `.side-l`, `.side-r`, and `.side-t` transforms in
both mobile layouts.

- [ ] **Step 5: Run scoped verification**

Run: `npm run test:showcase`
Expected: all tests pass.

Run: `npm run build`
Expected: exit 0 and no circular-chunk warning.

Run: `npx eslint vite.config.ts src/specimen/Specimen.tsx src/specimen/showcase/Showcase.tsx src/specimen/showcase/scenes.tsx src/specimen/showcase/choreography.ts tests/showcase-choreography.test.ts tests/production-chunks.test.ts`
Expected: exit 0.

Run: `git diff --check`
Expected: no output.

### Task 4: Runtime verification and PR update

**Files:**
- Modify only files implicated by confirmed runtime findings.

**Interfaces:**
- Consumes: the completed implementation and production output.
- Produces: fresh desktop/mobile/boot evidence on PR #20.

- [ ] **Step 1: Run a production preview**

Run: `npm run preview -- --host 127.0.0.1`

- [ ] **Step 2: Verify boot state in a browser**

After seven seconds, verify `window.__appReady === true`, `.slow` is absent,
`#lite` is removed, `#root` has children, and the console has no module
initialization error.

- [ ] **Step 3: Verify layouts and interaction**

Check all nine desktop stages, specifically stage 1 on the right and stages 3
and 7 at the top. Check portrait and short-landscape mobile splits. At stage 6,
hover the canvas with a fine pointer and verify nearby parts move away, then
assemble and verify repulsion reaches zero.

- [ ] **Step 4: Commit and push**

```bash
git add package.json vite.config.ts src/specimen/Specimen.tsx src/specimen/showcase/Showcase.tsx src/specimen/showcase/choreography.ts src/specimen/showcase/scenes.tsx src/specimen/specimen.css tests/showcase-choreography.test.ts tests/production-chunks.test.ts docs/superpowers/specs/2026-07-12-showcase-readability-interaction-design.md docs/superpowers/plans/2026-07-12-showcase-readability-interaction.md
git commit -m "fix(showcase): improve readability and production boot"
git push
```

Expected: PR #20 updates and Vercel passes.
