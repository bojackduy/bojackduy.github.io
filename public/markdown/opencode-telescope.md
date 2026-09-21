# [OpenCode Telescope](https://github.com/bojackduy/opencode-telescope)

A local-first search engine for AI coding conversations. Telescope indexes session history in the background and provides fast scoped search without sending private chats to a hosted service.

## Highlights

- SQLite FTS5 for lexical retrieval plus optional vector search
- Six-worker non-blocking indexing architecture
- Incremental synchronization optimized from roughly 101 seconds to about 100 milliseconds
- Live previews and scoped search across projects, sessions, and messages
- 150 automated tests

Built with TypeScript, Bun, SolidJS, OpenTUI, SQLite, `sqlite-vec`, and local embedding infrastructure. Published as [`@bojackduy/opencode-telescope`](https://www.npmjs.com/package/@bojackduy/opencode-telescope), with more than 7,900 downloads by September 2026.
