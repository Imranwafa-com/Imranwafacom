# imranwafa.com

Personal site of Imran Wafa — an editorial **"specimen sheet"** portfolio: part type
specimen, part engineering monograph, with live dashboards, a command palette, a
blueprint loupe, two themes, and more easter eggs than strictly necessary.

Live at [imranwafa.com](https://imranwafa.com).

## Repository layout

| Directory    | What it is |
|--------------|------------|
| `app/`       | **The live site.** Vite + React 19 + TypeScript. Hand-rolled motion engine (no animation library on the homepage), OKLCH design tokens, paper/carbon themes. `/resume` is a lazy-loaded react-pdf paper-stack reader. |
| `portfolio/` | Earlier iMessage-style portfolio (Next.js 14). Kept for reference; not deployed. |

## Developing

```bash
cd app
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
npm run lint
```

## Notes for the curious

- All user-facing copy lives in `app/src/specimen/copy.ts`; structured content
  (projects, experience, charts) in `app/src/specimen/data.ts`.
- Design tokens (`--paper`, `--ink`, `--accent`, …) are defined once in
  `app/src/specimen/specimen.css`; the carbon (dark) theme is a token override
  on `[data-theme="carbon"]`.
- Press `/` on the site for the command palette. Try `/theme`, `/inspect`,
  `/secret`.

© MMXXVI Imran Wafa
