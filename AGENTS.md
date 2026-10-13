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
- `scripts/github-stats.mjs`: regenerates the single combined `public/img/github-stats.svg` (totals, contributions heatmap, languages donut, npm trend lines) + `public/markdown/github-stats.md` + `stats-output/profile-README.md` via `npm run stats` (needs `gh-personal`; `GH_CMD=gh` in CI; npm registry/downloads APIs need no auth). No manual markdown stats tables — snapshot numbers live inside the SVG, per-package npm totals are live shields `npm/dt` badges. Runs manual-only via `.github/workflows/refresh-stats.yml` (workflow_dispatch, no schedule — scheduled re-renders just burn Actions minutes); `bojackduy/bojackduy` has a matching manual-only workflow syncing the profile README. NOTE: script must use the public `users/:login` endpoint, never `/user` (403s for Actions tokens). NOTE: npm downloads URLs must keep scoped names in `@scope/pkg` form (only escape other chars) — fully-encoded `%40scope%2Fpkg` misbehaves; all-time totals via `downloads/point/2020-01-01:<today>/<name>`. NOTE: never use `pathLength` for SVG donut/dash math — librsvg ignores it; use explicit arc coordinates instead.

## Conventions

- React APIs, hooks, stores, and components are auto-imported by `unplugin-auto-import`.
- Do not manually edit `src/auto-imports.d.ts`.
- Keep employer case studies portfolio-safe: no private source, credentials, customer data, or internal links.
- Preserve the central `disabled` filtering in `src/configs/index.ts`.
- Build warnings about the large main bundle are pre-existing.
