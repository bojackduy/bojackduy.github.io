# Trinh Chan Duy — Portfolio

An interactive macOS-style portfolio for [Trinh Chan Duy](https://github.com/bojackduy), a backend software engineer and open-source developer working across production systems, AI-enabled products, and developer tooling.

## Highlights

- Production experience at Tiger Tribe / HEINEKEN and Spartan
- Detailed, portfolio-safe case studies for six product areas
- Open-source projects including OpenCode Loopd, Telescope, LazyJira, and LazyConfluence
- Responsive macOS-style desktop with draggable windows, Launchpad, Spotlight, Safari, and Terminal

## Development

```bash
npm ci
npm run dev
```

Validation:

```bash
npm run lint
npm run build
```

GitHub stats: the card is a manual snapshot — regenerate it with the
`refresh-stats` workflow (manual dispatch from the Actions tab) or locally
(requires `gh-personal`):

```bash
npm run stats
```

The npm badges and star chart render live on every view, so no scheduled
refresh runs; the matching workflow in `bojackduy/bojackduy` syncs the
profile README from the snapshot on manual dispatch.

The production build is written to `docs/` and served by GitHub Pages from the `main` branch.

## Credits

Adapted from [Renovamen/playground-macos](https://github.com/Renovamen/playground-macos) and [chu0jz013/chu0jz013.github.io](https://github.com/chu0jz013/chu0jz013.github.io).
