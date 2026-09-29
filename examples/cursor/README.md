# Cursor

Put your key in `MOSADD_KEY` (from [app.mosadd.dev](https://app.mosadd.dev)) and restart Cursor from a shell that
has it, or set it as a user environment variable. Then add [`mcp.json`](./mcp.json) to `~/.cursor/mcp.json`
(all projects) or `.cursor/mcp.json` (one project). Cursor replaces `${env:MOSADD_KEY}` itself when it reads the
file, so the key is not stored in it.

The installer does the same and keeps your other servers: `node packages/m0s/m0s.mjs install --host cursor`.

Syntax per the Cursor MCP documentation (config interpolation `${env:NAME}` in `url` and `headers`). Not yet run
inside Cursor by us.
