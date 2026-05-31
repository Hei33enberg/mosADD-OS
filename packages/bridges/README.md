# @mosadd/bridges

Bridge Provider Pack — let mosadd users reach contacts on existing networks (Matrix, Discord, Telegram, Slack, Signal, WhatsApp, iMessage) **without forcing those contacts to sign up for mosadd**.

> Phase 1 alpha: TypeScript interface + 3 scaffold adapters (Matrix, Discord, Telegram). Real protocol wiring lands per-bridge in follow-ups to [LINEAR-2168](https://linear.app/ip-ra/issue/LINEAR-2168). Adapters currently throw `BridgeNotImplementedError` from their handlers — the shape is locked, the wires are not.

## Why bridges

Every new messenger fights "but all my friends are on WhatsApp/Telegram". mosadd's OS framing turns that into a feature: `add mTELEGRAM` and the user can reach Telegram contacts from a single mosadd MCP call — no fork in their network.

This package is design-adopted from the [Hermes Agent](https://github.com/NousResearch/Hermes-Agent) (MIT, Nous Research) `gateway/platforms/` pattern. See the project [NOTICE](../../NOTICE) for full attribution.

## Shape

```ts
import { getBridge, type BridgeProvider } from "@mosadd/bridges";

const matrix: BridgeProvider = getBridge("matrix");
await matrix.verifyConfig({ homeserver: "...", access_token: "...", user_id: "@bot:..." });
await matrix.sendMessage(config, { to: "!roomId:server", text: "hi from mosadd" });
```

`BridgeProvider` is uniform across networks — every bridge implements `verifyConfig`, `sendMessage`, `listMessages`, and `resolveHandle`. Network-specific config shape (token, session, homeserver, …) is validated inside each adapter.

## Bridges in this package

| Bridge | Status | Upstream license | Notes |
|---|---|---|---|
| `MatrixBridge` | scaffold | Apache-2.0 (matrix-bot-sdk planned) | First-class — federation reaches the whole Matrix network with one bot account |
| `DiscordBridge` | scaffold | MIT (discord.js / discord-api-types planned) | Bot token, channel + DM scope |
| `TelegramBridge` | scaffold | MIT (telegraf / gram.js planned) | Two modes — Bot API and MTProto user session |

Coming next (per [LINEAR-2168](https://linear.app/ip-ra/issue/LINEAR-2168)):

- `SlackBridge` — workspace bots (Phase 1 P1)
- `SignalBridge` — linked device, signal-cli-rest-api (Phase 1 P1)
- `WhatsAppBridge` — Business Cloud API (Phase 2, legal review)
- `iMessageBridge` — Mac-only via Blue Bubbles or BlueBubbles-Server (Phase 2, legal review)

## BYOK config

Every bridge takes a network-specific config object — see each adapter's TypeScript types for the exact shape. Adapters validate eagerly: `verifyConfig({})` throws with an actionable error.

Env-var convention (for the MCP server to surface):

| Bridge | Env vars |
|---|---|
| Matrix | `MOSADD_MATRIX_HOMESERVER`, `MOSADD_MATRIX_ACCESS_TOKEN`, `MOSADD_MATRIX_USER_ID` |
| Discord | `MOSADD_DISCORD_TOKEN`, `MOSADD_DISCORD_GUILD` (optional) |
| Telegram (bot) | `MOSADD_TELEGRAM_BOT_TOKEN` |
| Telegram (user) | `MOSADD_TELEGRAM_API_ID`, `MOSADD_TELEGRAM_API_HASH`, `MOSADD_TELEGRAM_SESSION` |

## Contributing a new bridge

1. Open a [module proposal issue](https://github.com/Hei33enberg/mosadd-os/issues/new?template=module_proposal.yml) with the network name and your rationale.
2. After RFC accepts (see [governance](../../GOVERNANCE.md)), implement the `BridgeProvider` interface in `packages/bridges/src/<network>/index.ts`.
3. Add the bridge to the `bridges` registry in `packages/bridges/src/index.ts`.
4. Wire it into the MCP server with a tool surface in `packages/mcp/src/tools/<network>.ts` (see how `mIRC` does it — straight pattern to copy).
5. Add a SKILL for Claude users in `skills/<network>/SKILL.md`.

## License

Apache-2.0. See [LICENSE](../../LICENSE) and [NOTICE](../../NOTICE).
