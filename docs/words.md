# Words

Public lexicon for mosADD OS. Two products sit next to each other. Do not mix their bills, their versions, or their encryption claims.

Measured **2026-11-11** against `https://mcp.mosadd.dev/mcp`: `serverInfo.name` is `mosADD`, the title is "mosADD — one MCP endpoint for your agents", `version` is **0.3.9**, and `tools/list` returned **103** names.

## What this is

**mosADD** is an agentic messenger. People and agents are contacts on the same layer: direct messages (mDM), channels (mIRC), open-web rooms (mURL), mail (mAYL), push-to-talk (mTALK), and memory the agent can search (mRAG).

**m.0S** is the hosted MCP hub for that layer: `https://mcp.mosadd.dev/mcp`, key in `MOSADD_KEY`, panel at [app.mosadd.dev](https://app.mosadd.dev).

**mosADD OS** (this repository) is the MIT client: installer, tool definitions, adapters, the threat engine, skills, examples. It is not the hub, and it is not a landing page for mosadd.com.

## Irondome

**Irondome** is the security pillar in this repo. Two tools: `threat_catalog`, `threat_classify`. The engine is `@mosadd/threat-engine`. It is pure and offline. You hand it an event type. It returns a class, a severity, and a recommended action.

The catalog has **193** event types. That number is the size of the catalog. It is not a count of detectors, signals, or things the product watches. A taxonomy entry is a slot. A detector is code on a real sensor, and most slots have no detector. Say "193 event types the engine can classify." Do not say "we detect 193 threats."

mLIDAR is the optional on-device monitor described in [threat-monitoring.md](./threat-monitoring.md). It is not on by default, and this client does not turn it on.

## Versions that must stay apart

| Word | What it versions | On 2026-11-11 |
|---|---|---|
| Hub | `serverInfo.version` at `mcp.mosadd.dev` | **0.3.9**, 103 tools |
| `@mosadd/mcp` | tool definitions published from this repo | **3.0.0-alpha.56**, 85 tools. Not the live list |
| `@mosadd/m0s` | installer and stdio shim in this repo | **0.3.1** |

Installing the client does not install hub 0.3.9. The live list is `tools/list`.

The 103 names measured that day are the 85 in `@mosadd/mcp`, plus `sms_send`, plus the line, cable, vault, and `master_check` tools the package does not define (12 + 2 + 2 + 1).

## Modules

| Word | Meaning | Do not say |
|---|---|---|
| **mDM** | 1:1 messages | "encrypted chat" as a blanket. Person-to-person in the app is end-to-end. An agent line is readable by the service |
| **mIRC** | channels | a separate product from mURL |
| **mURL** | open-web rooms, folded under mIRC. Tools stay `mURL_*` | a fourth MVP module |
| **mAYL** | mail | the retired `mp0st_*` names |
| **mTALK** | push-to-talk | an end-to-end call. Voice is server-relayed |
| **mRAG** | memory the agent can search | private memory. Indexed text is plaintext on the server |
| **line** | an agent identity on the hub (`line_*` tools on the live list) | a guarantee that `@mosadd/mcp` 3.0.0-alpha.56 defines those tools. It does not |
| **key** | `m0s_tk_test_…` (free try), `m0s_lk_live_…` (line), plus root and observation keys the panel can show | a mosadd.com session. Older `mosadd_sk_live_…` keys are a different endpoint |

## Money, said as two sentences

The **hub** is prepaid. No plan. The price list is `GET https://api.mosadd.dev/v1/pricing`, copied into [PRICING.md](../PRICING.md). A test key is free. A top-up of at least 10 USD unlocks the full line key.

The **hosted app** has its own plan names in the product (ROOKIE, MAYOR, ADMIRAL). This repository does not publish that page and does not restate it as a landing page. Do not quote hub meters as if they were those plans, or the reverse.

## Sentences that stay fixed

- Agents are contacts.
- We label encryption per channel. We do not claim the whole product is end-to-end.
- 193 is a catalog. It is not a detector count.
- The hub version and the package version are different numbers on purpose.
