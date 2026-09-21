# More Projects

## [OpenCode Learn](https://github.com/bojackduy/opencode-learn)

A Socratic learning system for OpenCode with graded single/multi-select quizzes, durable Obsidian transcripts, research agents, and verified Mermaid/SVG teaching visuals.

![Learn quiz modal](/img/projects/learn.png)

*Learn's graded quiz modal inside OpenCode — multi-select with an explicit "I don't know" option.*

## [OpenCode Fork Lane](https://github.com/bojackduy/opencode-fork-lane)

Forks both an AI session and its Git checkout into a copy-on-write worktree. Dependency caches such as `node_modules` and Rust `target` can be carried via APFS/Linux reflinks with almost no extra storage.

## [nvim-herdr-navigation](https://github.com/bojackduy/nvim-herdr-navigation)

Seamless `Ctrl-h/j/k/l` navigation between Neovim splits and Herdr terminal panes without patching either application.

![Neovim and Herdr panes](/img/projects/nvim-herdr.gif)

*Neovim splits beside Herdr terminal panes — one set of Ctrl-h/j/k/l bindings moves across both.*

## [Tetris IO](https://github.com/bojackduy/tetris-io)

A deterministic modern Tetris engine in Rust with 7-bag RNG, SRS wall kicks, DAS/ARR timing, hold and ghost pieces, combos, and T-Spin detection. The workspace separates game rules from terminal rendering, persistence, and networking.

![Tetris gameplay in the terminal](/img/projects/tetris.gif)

*Terminal gameplay — falling tetrominoes with hold, ghost piece, and scoring.*

## RTSP/RTP Video Streaming

A Python client/server streamer separating RTSP/TCP control from RTP media transport. It supports UDP fragmentation and reassembly, RTP-over-TCP fallback for HD streams, multi-client handling with `select()`, and adaptive client buffering.

## [OpenCode System Override](https://github.com/bojackduy/opencode-system-override)

A narrowly scoped OpenCode hook that can replace or clear the assembled system prompt for selected agents while leaving every other request untouched.
