#!/usr/bin/env bash
set -euo pipefail

# Build portfolio → docs/ for GitHub Pages.
cd "$(dirname "$0")"

npm ci
npm run build            # vite build -> docs/ (outDir trong vite.config.ts)

# Disable Jekyll processing for the Vite build.
touch docs/.nojekyll

echo "Done -> docs/. Commit docs/ and push; Pages serves main /docs."
