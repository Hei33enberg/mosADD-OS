# apps/edge — moved

The Cloudflare Worker behind the mIRC edge transport (`mIRC_send_edge`, `mIRC_history_edge`, `mURL_*`) is part of the
hosted service, so its code left this public repository on 2026-09-29 (history up to commit `69e8b0d` stays here).
The tools that talk to it stay MIT in `packages/mcp/src/tools/mirc-edge.ts` and `murl.ts`.
