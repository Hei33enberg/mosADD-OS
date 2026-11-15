# ChatGPT and claude.ai connectors

These hosts add remote MCP servers as connectors that sign in with OAuth. The mosADD endpoint
(`https://mcp.mosadd.dev/mcp`) takes a bearer key and, since 2026-11-14, MCP sign-in too: it publishes
`/.well-known/oauth-protected-resource`, and its authorization server supports dynamic client registration. Add the
URL as a connector and sign in in the browser. The five-step smoke test has not been run in these hosts yet.

- mosadd.com accounts: the older endpoint `https://mcp.mosadd.com/mcp` does offer OAuth.
- mosADD keys: use a host that accepts a bearer header (see [docs/hosts.md](../../docs/hosts.md)).

What is live and what is planned: [roadmap](../../docs/roadmap.md).
