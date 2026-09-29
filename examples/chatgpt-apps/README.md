# ChatGPT and claude.ai connectors

These hosts add remote MCP servers as connectors that sign in with OAuth. The m.0S endpoint
(`https://mcp.mosadd.dev/mcp`) takes a bearer key and does not offer OAuth yet, so it cannot be added there today.

- mosadd.com accounts: the older endpoint `https://mcp.mosadd.com/mcp` does offer OAuth.
- m.0S keys: use a host that accepts a bearer header (see [docs/hosts.md](../../docs/hosts.md)).

OAuth on the m.0S hub is on the [roadmap](../../docs/roadmap.md).
