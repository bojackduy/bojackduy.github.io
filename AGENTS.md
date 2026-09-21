# AGENTS.md

## Project

Interactive macOS-style portfolio for Trinh Chan Duy (`bojackduy`). Built with React 18, TypeScript, Vite, UnoCSS, Zustand, Framer Motion, and react-rnd.

## Commands

```bash
npm run dev
npm run lint
npm run build
```

The production build is emitted to `docs/` for GitHub Pages.

## Content map

- `src/configs/apps.tsx`: dock and desktop apps
- `src/configs/bear.tsx`: portfolio note navigation
- `src/configs/launchpad.ts`: external project shortcuts
- `src/configs/websites.ts`: Safari bookmarks
- `src/configs/terminal.tsx`: fake terminal filesystem
- `public/markdown/`: biography, experience, and project case studies
- `src/configs/user.ts`: profile name and avatar
- `scripts/github-stats.mjs`: regenerates `public/img/github-stats.svg` + `public/markdown/github-stats.md` via `npm run stats` (needs `gh-personal`)

## Conventions

- React APIs, hooks, stores, and components are auto-imported by `unplugin-auto-import`.
- Do not manually edit `src/auto-imports.d.ts`.
- Keep employer case studies portfolio-safe: no private source, credentials, customer data, or internal links.
- Preserve the central `disabled` filtering in `src/configs/index.ts`.
- Build warnings about the large main bundle are pre-existing.
