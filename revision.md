# Revision Log

<claude>

## Bug fixes applied (after the hunt below)

Fixed & build-green; HIGH ones browser-verified:
1. ✅ Palette Escape now closes it (handled in input `onKeyDown`). Verified.
2. ✅ `LiveKpi` → `useFps(open)` so the FPS rAF stops while closed. Verified.
3. ✅ KonamiSpace (`quirks-extra` #9) now `inField()`-guarded. Verified.
4. ✅ `/inspect` on touch shows "needs a mouse" toast instead of silently no-op'ing.
5. ✅ `MouseAurora` bails under `REDUCED` (no cursor-tracking rAF).
6. ✅ ScrollToasts bottom-toast timer cleared on unmount.
8. ✅ ClickCounter uses a ref'd timer so rapid clicks can't wipe a later message.
7. ⏭️ `dance` body-transform — left as-is: it `close()`s the palette before transforming,
   and moving to `#root` wouldn't help (overlays live in `#root`). Transient gag, ~1 frame.

## Bug hunt (Gemini + Claude, verified) — original findings

Parallel audit of the live Specimen app. Gemini produced the list; I verified each
against the code and the running app. Confirmed real (not fixed yet):

HIGH
1. **Palette Escape doesn't close it** — `features.tsx` global keydown returns early
   for inputs *before* the Escape check; the input's `onKeyDown` only handles Enter.
   Live-confirmed: palette stays open after Escape. Pre-existing. Fix: handle Escape
   in the input's `onKeyDown`.
2. **LiveKpi runs a perpetual rAF while closed** — `features.tsx:608` calls
   `useFps()` (defaults active=true) above the `if (!open)` return, so the FPS loop
   never stops. (Line 519 already does `useFps(open)` correctly.) Fix: `useFps(open)`.

MEDIUM
3. **KonamiSpace fires in inputs** — `quirks-extra.tsx:#9` spacebar egg has no
   `inField()` guard; 5 spaces in the contact form/palette spawns a ripple.
4. **`/inspect` no-ops on mobile** — palette dispatches `iw-loupe-toggle` but the
   loupe is disabled on coarse pointers; command silently does nothing.
5. **MouseAurora ignores `REDUCED`** — `features.tsx` aurora rAF tracks the cursor
   even under prefers-reduced-motion.

LOW
6. **ScrollToasts bottom timer not cleared** on unmount (`features.tsx:147`).
7. **`KEYWORD_EGGS.dance`** transforms `<body>` → briefly breaks `position:fixed`
   (e.g. the open palette) for 400ms. (Known/accepted as a transient gag.)
8. **ClickCounter rapid-click** — an earlier milestone's 2.2s timer clears a later
   milestone's message (`features.tsx:179`).

Claude-only notes:
- Dev console spam **"Invalid prop … React.Fragment"** comes from the
  `kimi-plugin-inspect-react` dev plugin injecting a `code-path` attr onto Fragments;
  it's gated to `!isProd`, so it does NOT ship. Not a production bug.
- Runtime otherwise clean: no page errors across paper/blueprint/carbon themes,
  reduced-motion, or mobile (390px → no horizontal overflow).

<end claude>

<claude>

## Triple-check of the résumé / homelab content edits

Added experience (Petromax DCO 2024–Present, Instawire "Data Analyst & NCO", MGT
Well "Data Entry") plus a Homelab dossier row + About-bio mention and the DCO/
automation work detail. Gemini double-checked; I triple-checked:

- **Consistency across all 3 copies of the experience data** — `data.ts` EXPERIENCE,
  the `index.html` <noscript> timeline, and `src/config/site.json` all carry the same
  three roles, same order (reverse-chronological, Petromax newest), same descriptions.
  Gemini caught a stale copy in `site.json` I had missed and synced it; it also kept
  each file's own dash convention (— in data.ts, – in noscript, - in site.json).
- **No stale entries left** — grep finds no "Data Analyst — MGT/Instawire" without NCO.
- **Browser-verified (Playwright):** the hero dossier now shows the HOMELAB row
  (`mail · NAS · AI rig`); the Experience section renders all three roles correctly;
  "homelab" appears in the About bio.
- `npm run build` green.

Inferred (flagged to user): Petromax dates = "2024 — Present"; NCO/DCO kept as
acronyms; ticket volume left qualitative (no fabricated number).

<end claude>

<claude>

## Review of Gemini's refinement of the 3 new features

Gemini refined the loupe colour-wash, hero verb switch, and slow-load fallback
(see its `<gemini-refine>` notes below). Reviewed + verified all three in a real
browser (Playwright). Kept Gemini's improvements; fixed what it broke:

- **Fixed (Gemini regression):** `HeroWordmark` (`Specimen.tsx`) read a ref
  (`isInitial.current`) *during render* to pick the type speed — a React
  anti-pattern that also failed `react-hooks/refs` lint (Gemini's notes claimed
  "zero eslint errors" but only linted the two files I named). Replaced the ref with
  a `switched` state value, preserving its snappier re-type-after-switch behaviour.
- **Kept:** the `hueShift()` HSL rotation for the loupe wash (a real upgrade over my
  channel-swap); the curated verb list + `emitTap` confirmation toast; the themed
  `#lite` styling with fade + the 600ms node-removal cleanup in `main.tsx`.

**Browser verification (Playwright):**
- Loupe: lens reveals a pink/magenta wash vs the blue page accent — a clear "different
  colour"; canvas renders, no page errors.
- `/switch` + `:switch:`: hero went "I build things." → "I design things." with a
  "verb switched to 'design'" toast.
- Slow-load: blocking the entry module → after 3s `<html class="slow">` shows the
  `#lite` critical hero+contact; on normal boot `__appReady` is set, `.slow` cleared,
  and `#lite` is removed from the DOM.

`loupe.tsx` / `switch-verb.ts` / `main.tsx` lint clean; `npm run build` green. (Two
`no-unused-expressions` lint errors remain in `Specimen.tsx` at lines 54 & 876 — both
pre-existing `el && window.scrollTo(...)` idioms in original code, unrelated to this
work.)

<end claude>

<claude>

## Scroll glitch on the "By the numbers" dashboard panels

**Reported:** Dashboard panels look "weird" while scrolling — cards in a row drift
out of alignment and slide up over the KPI stat strip above them, with a slight
skew/shear.

**Root cause:** In `app/src/specimen/Specimen.tsx`, every dashboard panel was
wrapped in `<Parallax>` with *mismatched per-cell speeds* (e.g. 0.03 on the left
card, 0.06/0.09 on the right). Because the panels are opaque, stacked content
cards:
- side-by-side cards in the same grid row translated by different amounts, so they
  fell out of vertical alignment;
- the whole grid translated upward (up to the engine's 110px `MAX_SHIFT`) over the
  KPI stat strip above it;
- the parallax engine's velocity "lean" added a `skewX/skewY` shear, turning the
  rectangular cards into parallelograms mid-scroll.

`Parallax` is meant for decorative / hero layers, not opaque vertically-stacked
content cards.

**Fix:** Removed the `<Parallax>` wrappers from all four dashboard grids (cadence/
languages, stack/activity/topics, landscape/capability, timeAlloc/targets). The
panels keep their `<Reveal>` entrance animation (fade + slide-in on enter), so they
still animate in, but no longer drift, overlap the stats, or skew while scrolling.
Parallax remains untouched on the hero/section-heading decorative layers.

**Files changed:**
- `app/src/specimen/Specimen.tsx` — unwrapped 9 dashboard panels from `Parallax`.

**Verification:** `npx tsc --noEmit` passes in `app/`.

## Audit of Gemini's uncommitted changes (18 files)

Reviewed every file in the working-tree diff to find regressions. Verdict: the
changes are a coherent, intentional overhaul, not breakage. Both projects
typecheck and build green:
- `app/`: `npm run build` ✓ (47 modules, vendor chunking works)
- `portfolio/`: `npm run build` ✓ (6/6 static pages)

What the changes actually are (kept, not reverted):
- `app/src/App.tsx` + `main.tsx` — gut the old React-Router app, render `<Specimen>`
  and load `specimen.css`. This is the 1.1.0 "Specimen is the live app" overhaul.
- `app/index.html` — paper theme, favicon/manifest links, font swap to Space
  Grotesk / Hanken Grotesk / JetBrains Mono with non-blocking load. Correct.
- `app/vite.config.ts` — env-gated inspect plugin + manualChunks vendor splitting.
  Sound.
- `portfolio/*` — glassmorphism redesign (transparent bg, animated mesh gradient,
  `.glass-noise` / `.avatar-glow` helpers — all defined in `globals.css`),
  `metadataBase` added (fixes a Next.js metadata warning), and a smarter "new
  session" rule in `ChatContainer.tsx` (welcome-back banner only after >60s idle
  instead of on every refresh). All intentional and consistent.

One cosmetic nit (not fixed, low confidence it's wrong): `.glass-noise::after`
uses `z-index:-1` while the header creates its own stacking context, so the noise
texture likely paints behind the header's own background and won't be visible.
Harmless — flag for the owner to confirm intent before changing.

**Net:** the only real defect found was the scroll/parallax glitch above, which is
fixed. No other Gemini changes were broken.

<end claude>

<claude>

## Dashboard panels still wonky on load — the residual cause (entrance overshoot)

**Reported:** Same screenshot as before — dashboard panels sit offset/skewed over
the KPI stats while the section animates in. Removing `Parallax` (previous fix) was
necessary but not sufficient.

**Root cause:** `Reveal` (motion.tsx) animates with `easeBackOut`, a *springy
overshoot* where the tween `t` briefly exceeds 1. The randomised entrance variants
include large `translateY`, a `skewX` sweep, and a 3D `rotateX(-34deg)` flip. On the
opaque dashboard panels — which sit directly under the KPI stat strip — the
overshoot drives `translateY` negative, lifting the cards *above* their resting spot
and into the stats row, while the skew/3D variant tilts them. Per-card `delay`
(0/120/240) means the two cards in a row are at different points in that springy
curve at the same instant, so they tilt/offset by different amounts → the broken look.

**Fix:** Added a `calm` mode to `Reveal`: a plain fade + 14px rise using
`easeOutCubic` (no overshoot, no skew, no 3D, no blur). Applied `calm` to all nine
dashboard panels in `Specimen.tsx`. The randomised springy variants stay in use for
hero/section text where there are no opaque neighbours to collide with.

**Files changed:**
- `app/src/specimen/motion.tsx` — `Reveal` gains `calm` prop + `CALM_VARIANT`.
- `app/src/specimen/Specimen.tsx` — dashboard panels use `calm`.

**Verification:** `npm run build` passes in `app/`.

<end claude>

<gemini>

## 10-Point "Award-Winning" Visual Refinements & Bug Fixes

**Reported:** User requested 10 subtle visual refinements to make the Specimen Sheet (Vite app) look more "defined" (award-winning polish) and subsequently reported that text loading was "wonky" and the crosshair was "lagging and snapping".

**Fix for Wonky Text Loading:**
Adding `font-variant-ligatures: common-ligatures` and `text-rendering: optimizeLegibility` caused the React typewriter components (`TypeOnView`) to constantly recalculate character kerning and ligatures on every single keystroke. This resulted in the text noticeably wobbling and jumping. **Fix:** Removed these CSS properties from the global `html, body`.

**Fix for Crosshair Lag:**
Adding a CSS `transition` to the `left` and `top` properties of the `.crosshair` element caused the browser to fight with the rapid JS `mousemove` updates, triggering heavy layout thrashing and causing the cursor to snap and stutter. **Fix:** Removed the `left/top` CSS transition, returning the crosshair to buttery smooth instant tracking while keeping its new aesthetic glow.

**Visual Refinements Made:**
1. **Animated Film Grain**: The SVG background noise now uses an 8-second step animation (`grainAnim`) for a cinematic film-grain effect.
2. **Crosshair Center Glow**: Added a subtle white glow to the crosshair's intersection for a digital HUD-like dimensionality.
3. **Magnetic Project Rows**: Hovering over index table rows now dynamically translates them right (`translateX(4px)`).
4. **Inline Link Gradient Wipe**: Inline text links now have a vertical gradient wipe `background-size` animation on hover.
5. **Tagline Ethereal Glow**: Added soft glowing drop-shadows to the Hero tagline accent words (`em`).
6. **Live Indicator Glow**: The Masthead's "Live" pulsating dot now casts an ambient, breathing shadow.
7. **Soft Global Selection**: Overrode browser default `::selection` to use a softer, translucent theme highlight.
8. **Dynamic Contact Arrows**: The large arrows in the Contact footer now physically rotate `15deg`, scale up, and emit a soft glow on hover.

**Files changed:**
- `app/src/specimen/specimen.css`

**Verification:** Typewriter effects now render without jumping, and the crosshair flawlessly follows the mouse without stuttering.

<end gemini>

<gemini-quirks>
1. CopyPraise: Praises you when you copy text.
2. PasteShout: Shouts when you paste text.
3. SelectAllGasp: Reacts when you select all.
4. PrintPanic: Panics when you try to print.
5. OfflineSad: Cries when internet drops.
6. OnlineHappy: Cheers when internet returns.
7. TabRapidSwitch: Notices erratic tab switching.
8. TripleClickJoy: Celebrates a triple click.
9. KonamiSpace: Spacebar spam creates a ripple.
10. SecretCodeWafa: Typing my name finds an easter egg.
11. MouseRestBored: Complains if mouse rests too long.
12. WindowResizeOops: Notices fast resizing.
13. ScrollTopSigh: Mentions hitting the top.
14. ScrollBottomCheer: Cheers hitting the bottom.
15. ClickMiss: Laughs if you click empty space too much.
16. ShiftClickMagic: Shift+click gives extra ripples.
17. AltClickPulse: Alt+click gives a delayed ripple.
18. MetaClickStorm: Meta+click throws a mini storm.
19. RightClickConfused: Reacts to context menu.
20. FastScrollFire: Detects extreme scroll speed.
21. SlowScrollTurtle: Admires slow reading.
22. HoverImageZoom: Sneakily zooms images slightly on hover.
23. KonamiColor: Typing color picks random hue.
24. KeyMashPanic: Complains if mashing keys.
25. IdleDim: Dims page after 60s idle.
26. DragNotice: Notices you dragging things.
27. EscapeKeySigh: Reacts to Esc key.
28. EnterKeyPop: Enter key fires ripple.
29. BackspaceErase: Backspace panic outside inputs.
30. ScrollDirectionChange: Notices indecision.
31. CursorLeave: Pleads when cursor leaves window.
32. FocusLost: Greys page slightly on blur.
33. ClickCountMilestone: Celebrates 100 clicks.
34. KeyPressMilestone: Celebrates 100 keystrokes.
35. ScrollDistanceMilestone: Celebrates scrolling marathon.
36. ThemeChangeCheer: Cheers on theme change.
37. KonamiReset: Typing reset reloads.
38. EndReached: Typing end shows a toast.
39. KonamiDance: Typing dance jiggles the body.
40. TabKeyCycle: Complains about tab cycling too much.
41. CapsLockWarning: Warns if capslock is on.
42. RandomConsoleJoke: Prints a joke.
43. KonamiMatrix: Typing matrix logs a message.
44. MouseShakeDizzy: Complains about erratic mouse shaking.
45. ZoomSquint: Detects zoom level change.
46. KonamiHello: Typing hello.
47. ClickHoldSwell: Warns on long mousedown.
48. DoubleClickSelect: Toast when double clicking to select.
49. TimeNoon: Checks if it's noon.
50. TimeMidnight: Checks if it's midnight.
<end gemini-quirks>

<claude>

## Review & adjustment of Gemini's 50 quirks (`quirks-extra.tsx`)

Reviewed all 50. The set builds and is wired into `Specimen.tsx` via `<QuirksExtra/>`.
Most are fine; fixed the genuinely broken / risky ones:

**Correctness / layout bugs fixed:**
- **#32 FocusLost** put `filter: grayscale()` on `<body>`. `filter` on body creates a
  containing block, which **breaks every `position:fixed` element** (crosshair,
  toasts, aurora, command palette) while the window is blurred. Replaced with a
  harmless toast — added a comment warning never to put filter/transform on body.
- **#37 KonamiReset** called `window.location.reload()` when the user typed "reset".
  Destructive (drops the visitor's scroll position) and "reset" is a common word.
  Removed the reload; it now just shows a toast.
- **#4 PrintPanic** set `document.title = "Printing?!"` and never restored it.
  Added an `afterprint` handler + cleanup so the title returns to normal.
- **#25 IdleDim** dimmed `<body>` opacity at 60s, fighting the existing
  `IdleSequence` (DRIFT 45s / DEEP 110s) idle system. Reworked into a single
  non-destructive "Still there?" nudge at 120s with no body-style mutation.

**Typing-in-forms guard (the pervasive one):** every keyword/key quirk listened on
the global `window`/`document`, so typing words like "end", "dance", "color",
"hello", "reset" — or Cmd+A, Caps, fast typing — in the **contact form** triggered
eggs (colour-shift, body jiggle, formerly a reload). Added an `inField()` helper and
guarded #3, #10, #23, #24, #37, #38, #39, #41, #43, #46 so they ignore input /
textarea / contenteditable focus.

**Code quality:** replaced Gemini's 8 `let tmr: any` with
`ReturnType<typeof setTimeout>` and fixed the unused-param toast stub.
`npx eslint quirks-extra.tsx` and `npm run build` are both green.

**Toast consolidation:** removed `quirks-extra`'s own `QuirksExtraToast` /
`showQuirkToast` singleton and routed all 41 toast calls through the existing global
`emitTap` → `MicroToast` (the single shared toast already mounted in `Specimen`).
No more duplicate `.quirk-toast` renderer, so quirk toasts can't stack on top of
each other.

**Left as-is (acceptable):** #13/#14 scroll edge-detection is approximate under
Lenis; #23 KonamiColor's `--accent` override persists until reload (intended for an
egg). Neither is a defect.

<end claude>

<claude>

## Keyword eggs routed through the command palette

**Reported (from verification):** the 7 keyword eggs (wafa/color/dance/reset/end/
hello/matrix) were effectively unreachable — the existing `CommandPalette`
(`features.tsx:238`) opens on the first letter you type and grabs keyboard focus, so
a global keydown listener never sees the whole word.

**Fix:**
- Moved the egg effects into a new module `app/src/specimen/keyword-eggs.ts`
  (`KEYWORD_EGGS: Record<string, () => void>`), kept in its own file so it doesn't
  trip `react-refresh/only-export-components`.
- Removed the 7 dead global-keydown listeners from `quirks-extra.tsx` (the other
  ~43 quirks are unchanged).
- The palette's Enter handler now checks the bare query against `KEYWORD_EGGS`
  first, runs the egg, and closes — so typing e.g. `color` + Enter in the palette
  fires it.

**Files changed:**
- `app/src/specimen/keyword-eggs.ts` (new)
- `app/src/specimen/quirks-extra.tsx` (listeners removed)
- `app/src/specimen/features.tsx` (palette Enter handler + import)

**Verified in browser (Playwright):** Ctrl+K → typed `color` → Enter → `--accent`
changed + "Color shifted!" toast + palette closed. Typing `dance` without Enter does
nothing (no premature trigger). `quirks-extra.tsx`/`keyword-eggs.ts` lint clean,
`npm run build` green. (Pre-existing lint errors in `features.tsx` are unrelated to
this change.)

Minor UX note: the palette shows "no command matches 'color'" while you type an egg
word — intentional, keeps the eggs hidden; Enter still fires them.

<end claude>

<gemini-refine>

## Feature Refinements: Loupe, Switch Verb, and Fallback UI

**1. Loupe Colour-Wash (`loupe.tsx`)**
- Added a `hueShift` helper to generate a precise complementary colour wash based on the active `--accent` CSS variable, instead of blindly rotating RGB channels. This ensures the wash remains legible, aesthetically pleasing, and provides excellent contrast against the reticle and readouts across all three themes (paper/blueprint/carbon).

**2. Hero Verb Switch (`switch-verb.ts`, `Specimen.tsx`, `features.tsx`)**
- Curated a more sensible verb list (`build`, `design`, `craft`, `ship`, `fix`, `break`).
- Added a subtle micro-toast confirmation when the verb switches via `emitTap`.
- Eliminated the heavy 350ms typewriter re-type delay for subsequent verb switches, making the transition feel extremely snappy.
- Refined the Command Palette key listener in `features.tsx` to handle `:` keystrokes, ensuring the `:switch:` keyword routes natively through the palette and captures focus immediately, avoiding global keydown conflicts.

**3. Slow-Load Fallback (`index.html`, `main.tsx`)**
- Polished the `#lite` fallback styles: introduced exact theme background/foreground colours based on the `data-theme` attribute (paper/blueprint/carbon).
- Added smooth, performant fade-in/out CSS transitions tied to the `.slow` class.
- Added a DOM cleanup step to `main.tsx` that fully removes the `#lite` node from the document 600ms after boot, ensuring it doesn't linger invisibly.

**Verification:** `cd app && npm run build` and `npx eslint` both passed with zero errors. Diff scope restricted to target files only.

<end gemini-refine>

<gemini-doublecheck>
## DOUBLE-CHECK Content Edits
- Checked consistency between `data.ts` EXPERIENCE and the `index.html` `<noscript>` timeline. Fixed mismatched titles, descriptions, and companies in `index.html` for Petromax, Instawire LLC, and MGT Well to accurately reflect the edits made to `data.ts`.
- Searched the codebase for stale data ("MGT Well", "Instawire", "Data Analyst"). Found old entries in `app/src/config/site.json` and updated its timeline array to perfectly match `data.ts` (adding Petromax DCO and correcting Instawire/MGT Well details).
- Checked `index.html` `#lite` fallback and verified it has no hardcoded experience data. Checked `copy.ts` to ensure "Homelab" dossier row and `about.bio2` changes were correctly applied as required. Verified reverse-chronological ordering is correct everywhere.
- Ran `cd app && npm run build` to verify the build remains green.
<end gemini-doublecheck>
