# Glama (prepared, not submitted)

1. Copy `glama.json` to the repository root (it names the maintainer GitHub account).
2. On glama.ai, add or claim the server for `https://github.com/Hei33enberg/mosADD-OS`; connector URL
   `https://mcp.mosadd.dev/mcp`, auth: bearer header.
3. Glama's health check calls `initialize` and `tools/list`; the endpoint answers them only with a key or after MCP
   sign-in (OAuth), so give Glama a test key.

Listing text: the short and long descriptions in [`../pulsemcp.md`](../pulsemcp.md).
