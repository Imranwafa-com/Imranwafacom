# Showcase Readability, Interaction, and Boot Design

## Goal

Update PR #20 so every showcase stage keeps its copy readable, the exploded
compute parts react to a real mouse pointer, the scroll cadence is shorter,
mobile uses a deliberate non-overlapping composition, and production can boot
instead of remaining on the lightweight fallback.

## Confirmed boot failure

The current production build forces dependencies into `vendor-react` and
`vendor-core`. Those emitted chunks import each other, and `vendor-core`
accesses a React binding before `vendor-react` finishes initialization. Module
evaluation fails before `main.tsx` sets `window.__appReady`, so `index.html`
adds the `slow` class after three seconds and never removes the lite fallback.

Delete the custom `manualChunks` policy. The existing dynamic imports for the
showcase and resume already give Vite the correct lazy boundaries; forced
vendor buckets are unnecessary and unsafe.

## Desktop composition

Use an authored placement per stage instead of one side per project:

| Stage | Placement | Reason |
|---|---|---|
| 0 | left | rack begins on the right |
| 1 | right | top-down tray fills the left, as shown in the supplied screenshot |
| 2 | left | open node exits toward the right |
| 3 | top | intruder and rack occupy opposite sides |
| 4 | left | tracked figure is centered/right |
| 5 | right | locked rack is centered/left |
| 6 | left | exploded parts are concentrated center/right |
| 7 | top | assembled node occupies the center |
| 8 | left | final stack and control plane sit center/right |

The panel snaps to the authored placement while keyed inner content performs a
short directional fade. It never animates `left` across the subject. Every
desktop placement gets a square-edged, high-opacity paper/carbon scrim with a
subtle border and blur. Top placements hide repeated hardware specs to remain
compact; those specs remain present in the neighboring stages.

## Pointer interaction

While compute parts are exploded, reuse R3F's normalized pointer and raycaster.
Intersect the pointer ray with world `z=0`, convert the hit to the node's local
space, and apply a bounded radial XY offset to each part. The offset is computed
from the part's freshly derived base position every frame, so there is no drift.

Repulsion is active only when `(hover: hover) and (pointer: fine)` matches and
the canvas itself is hovered. Its amount is the existing `labelOpacity`
(`1 - assemble`), so it fades to zero as parts assemble. No DOM listener, new
dependency, or React state is added.

## Scroll cadence

Reduce the showcase reservation from `900vh` to `780vh`. With the sticky
viewport removed, the active span falls from `800vh` to `680vh`, shortening the
nine-stage cadence by 15%. Keep the existing magnetic target and damping.

## Mobile composition

Portrait mobile is a true split viewport: the canvas owns the upper `52dvh`
and an opaque content dock owns the lower `48dvh`. Copy never overlays the 3D
subject. The dock retains internal scrolling only for unusually short screens.

Short mobile landscape uses a horizontal split: scene on the left `58vw`, copy
dock on the right `42vw`. All desktop left/right/top transforms are reset in
mobile queries. Reduced-motion remains the existing in-flow static showcase.

## Verification

- Pure tests cover all nine placements, the `780vh` cadence, and repulsion
  direction, radius, strength, zero-distance, and maximum magnitude.
- A production-build regression test uses Vite with `write: false` and rejects
  mutual imports between emitted chunks.
- `npm run build` must emit no `Circular chunk` warning.
- The production entry must set `window.__appReady`, remove `.slow`, remove
  `#lite`, and render a root child in a browser.
- Desktop stage 1 must place copy on the right; stages 3 and 7 must place it at
  the top. Portrait and short-landscape layouts must keep scene and copy cells
  disjoint.

## Scope

No new dependency, automatic collision solver, new asset pipeline, scroll
jack, or pointer behavior on touch devices.
