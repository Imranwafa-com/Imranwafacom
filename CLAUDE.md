# ImranWafa.com 0.0.1

Personal portfolio website monorepo. The **live site is `app/`** — a single-page
editorial "specimen sheet" (Vite + React 19 + TypeScript). `portfolio/` is an
older Next.js iMessage-style variant kept for reference, not deployed.

## app/ — the live site

- `src/specimen/` is the entire homepage. `App.tsx` routes `/` → `Specimen` and
  `/resume` → a **lazy-loaded** react-pdf reader (keep it lazy — it pulls in
  pdfjs + framer-motion, ~1.9 MB).
- No Tailwind, no shadcn, no animation library on the homepage: styling is
  hand-written `specimen.css` with OKLCH tokens; motion is the custom engine in
  `specimen/motion.tsx`.
- Themes: `paper` (light, default) and `carbon` (dark) via `[data-theme]` token
  overrides in `specimen.css`; switching lives in `specimen/theme.ts`
  (persisted to `localStorage.iw_theme`, restored pre-paint by an inline script
  in `index.html`, broadcast on the `iw-theme` event).
- All user-facing copy in `specimen/copy.ts`; structured records in
  `specimen/data.ts`; feature/easter-egg strings in `specimen/site-config.ts`.
- Scroll-perf rule: never `getBoundingClientRect()` or `setState` on the scroll
  path — see the cached-offset pattern in `motion.tsx` before touching any
  scroll-linked effect.
- `npm run build` runs `tsc -b` but NOT eslint; lint has ~39 pre-existing
  errors from the deliberate ref-based motion architecture.

## Commands

```bash
cd app && npm run dev      # Vite dev server (5173)
cd app && npm run build    # TypeScript check + Vite build
cd app && npm run lint     # ESLint
```

## Content consistency

Experience/projects data exists in three places that must stay in sync:
`app/src/specimen/data.ts`, the `<noscript>` resume in `app/index.html`, and
`app/public/resume.pdf` (plus the panel copy on `/resume`).
