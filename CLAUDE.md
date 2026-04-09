# ImranWafa.com 0.0.1

Personal portfolio website monorepo.

## Project Structure

- `app/` - Main portfolio app (Vite + React 19 + TypeScript + Tailwind CSS 3 + shadcn/ui)
  - React Router for navigation (/, /about, /projects, /contact)
  - Framer Motion for animations
  - Vercel Speed Insights
- `portfolio/` - Next.js 14 portfolio variant (React 18 + TypeScript + Tailwind CSS 3)
  - App Router
  - Contact form API route with Nodemailer

## Commands

### app/
```bash
cd app && npm run dev      # Start dev server (Vite)
cd app && npm run build    # TypeScript check + Vite build
cd app && npm run lint     # ESLint
```

### portfolio/
```bash
cd portfolio && npm run dev    # Start Next.js dev server
cd portfolio && npm run build  # Next.js build
cd portfolio && npm run lint   # Next.js lint
```

## Key Conventions

- Tailwind CSS for styling with dark mode support (`dark:` prefix)
- shadcn/ui components in `app/src/components/ui/`
- Config-driven content in `app/src/lib/config.ts` and `app/src/config/`
- Page components in `app/src/pages/`, section components in `app/src/sections/`
