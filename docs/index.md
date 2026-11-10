# m.0S docs

Client and architecture documentation for [mosADD-OS](https://github.com/Hei33enberg/mosADD-OS).

**Live hosts:** product UI [mosadd.com](https://mosadd.com) · DEV API `api.mosadd.dev` (`/v1/health` OK; `api.mosadd.com/v1/health` is 404) · MCP `mcp.mosadd.dev` with `MOSADD_KEY`. Do not point production clients at dead `*.supabase.co` project URLs.

## Pricing — two stories (do not mix)

| Surface | Ladder |
|---|---|
| Hosted app (mosadd.com) | **ROOKIE $0 · MAYOR $15/mo · ADMIRAL $33/mo** |
| MCP hub / m.0S key | prepaid metered — [PRICING.md](../PRICING.md) |
| This repo | MIT client; hosted service is paid and not self-hosted from this tree |

| Page | What |
|---|---|
| [hosts.md](./hosts.md) | wire an AI host to `mcp.mosadd.dev` |
| [roadmap.md](./roadmap.md) | public roadmap |
| [architecture/](./architecture/) | hub guarantees and module map |
| [security/](./security/) | threat model and E2EE posture |
| [rfcs/](./rfcs/) | design RFCs |
| [threat-monitoring.md](./threat-monitoring.md) | mLIDAR overview |
| [robots-and-agents.md](./robots-and-agents.md) | agent policy |

Installer and hub pricing live in the repository root: [README.md](../README.md), [PRICING.md](../PRICING.md). HTML entry for GitHub Pages: [index.html](./index.html).
