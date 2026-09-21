# [OpenCode Loopd](https://github.com/bojackduy/opencode-loopd)

An autonomous background-goal runtime for OpenCode. It lets a parent chat stay interactive while isolated child sessions continue implementing, testing, and reporting progress.

## Highlights

- Event-driven state machine per goal
- Lease-based concurrency and cross-process file locking
- Serialized workspace-writing agents with parallel read-only work
- Host-owned completion checks and retry handling
- Modal OpenTUI dashboard for monitoring, steering, pausing, and recovery
- Scheduled goals for repetitive work

Built with TypeScript, Bun, the OpenCode SDK, SolidJS, and OpenTUI. Published as [`@bojackduy/opencode-loopd`](https://www.npmjs.com/package/@bojackduy/opencode-loopd), with 165 tests and more than 4,300 downloads by September 2026.
