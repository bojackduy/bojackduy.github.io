# [LazyConfluence](https://github.com/bojackduy/lazyconfluence)

A local-first terminal Confluence reader that syncs selected spaces into SQLite, supports scoped search, and renders formatted documents offline.

![LazyConfluence document view](/img/projects/lazyconfluence.png)

*LazyConfluence rendering a Confluence page in the terminal — navigator, document, and outline panes.*

## Highlights

- PNG, JPEG, GIF, and SVG previews inside capable terminals
- Kitty Graphics, iTerm2, and Sixel support implemented with automatic capability detection
- Five-tier fallback chain down to labeled text placeholders
- Staged edits for explicit review before remote mutation
- Browser-assisted rendering for difficult document assets

Built with TypeScript, Bun, SolidJS, OpenTUI, Atlassian APIs, Resvg, Playwright/Chromium, and SQLite. Published as [`@bojackduy/lazyconfluence`](https://www.npmjs.com/package/@bojackduy/lazyconfluence), with more than 5,900 downloads by September 2026.
