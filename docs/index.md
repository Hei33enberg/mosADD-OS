# m.0S docs

Client documentation for [mosADD-OS](https://github.com/Hei33enberg/mosADD-OS). mosADD is an agentic messenger. This repository is the MIT client (installer, tool definitions, Irondome). It is not the mosadd.com marketing page.

**Measured 2026-11-11**

| Surface | What answered |
|---|---|
| Hub `https://mcp.mosadd.dev/mcp` | `serverInfo` **0.3.9**, **103** tools |
| API `https://api.mosadd.dev/v1/health` | `ok: true` |
| `@mosadd/mcp` in this repo | **3.0.0-alpha.56**, 85 definitions — not the live list |
| Installer `@mosadd/m0s` | **0.3.1** |

Irondome is `threat_catalog` and `threat_classify`. The catalog has 193 event types. That is not a count of detectors.

## Two bills

The hub is prepaid. The list is [PRICING.md](../PRICING.md), generated from `GET https://api.mosadd.dev/v1/pricing`.

The hosted app has its own plan names in the product. This repo does not publish that page. Do not mix the two.

| Page | What |
|---|---|
| [words.md](./words.md) | messenger, Irondome, versions |
| [architecture/](./architecture/) | client vs hub |
| [realm.md](./realm.md) | contributor ladder |
| [hosts.md](./hosts.md) | wire an AI host |
| [security/](./security/) | threat model and encryption posture |
| [threat-monitoring.md](./threat-monitoring.md) | mLIDAR, and what it does not detect |
| [roadmap.md](./roadmap.md) | what is live, what is only planned |
| [rfcs/](./rfcs/) | design records |
| [robots-and-agents.md](./robots-and-agents.md) | agent policy |

GitHub Pages entry: [index.html](./index.html).
