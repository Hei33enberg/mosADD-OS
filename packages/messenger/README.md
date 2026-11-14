# @mosadd/messenger

The `messenger.json` format for mosADD Studio ([RFC 0006](../../docs/rfcs/0006-messenger-format.md)): one file that describes a messenger built from mosADD blocks — its brand, blocks, layout, theme and release targets — plus the validator that decides whether it may ship.

> **A module of [mosADD](https://github.com/Hei33enberg/mosadd-os) — the comms layer for AI agents, and the humans who direct them.**

Status: `0.1.0`, not published to npm yet. The studio that uses it (mosadd.dev) is not live.

## The rule behind it

A messenger built in the studio does not get generated code. Every messenger runs the same mosADD client; only this file differs. Identity, encryption and transport cannot be set from it, so a theme or a prompt cannot weaken them.

## Check a file

```bash
pnpm --filter @mosadd/messenger build
node packages/messenger/dist/cli.js check packages/messenger/templates/crew-ptt.json
# OK — 0 error(s), 0 warning(s)
node packages/messenger/dist/cli.js schema > messenger-1.json
```

`check` exits with 1 when there is any error. `--json` prints the issues as JSON.

```ts
import { validateMessenger } from "@mosadd/messenger";

const { ok, issues } = validateMessenger(JSON.parse(text));
// issues: [{ level: "error", path: "/theme/tokens/light/textMuted", code: "CONTRAST",
//            message: "textMuted on background is 2.40:1, below the WCAG AA minimum of 4.5:1", hint: "…" }]
```

## What the validator checks

| Layer | Examples of codes |
|---|---|
| Shape (Zod, strict) | `SHAPE` — unknown key, a colour that is not `#rrggbb`, a bad package name. Keys starting with `_` are comments. |
| Consistency | `IDENTITY_MISSING`, `TAB_NOT_ENABLED`, `HOME_NOT_IN_TABS`, `NEEDS_MIRC`, `OFFLINE_NEEDS_BUNDLED`, `PACKAGE_RESERVED`, `NO_TARGET` |
| Accessibility (WCAG 2.2 AA) | `CONTRAST` — text pairs below 4.5:1, interface colours below 3:1; `TOKENS_MISSING`; warning `PTT_STATES_CLOSE` |
| Honesty and trademark | `HONESTY` — encryption claims the client cannot keep (only 1:1 direct messages between people are end-to-end encrypted); `TRADEMARK` — a creator's app cannot be named after mosADD |

An error blocks a release. A warning does not; warnings also mark planned features (`DIRECTORY_PLANNED`, `HOSTING_PLANNED`, `MACOS_LATER`).

## Templates

- `templates/crew-ptt.json` — push-to-talk for a crew, channels, direct messages, an on-duty agent, theme "Port night".
- `templates/community.json` — channels first, direct messages, a welcome agent, a room on the website, theme "Track day".

Both pass with no errors and no warnings; the test suite keeps it that way.

## JSON Schema

`schema/messenger-1.json` is generated from the Zod schema (`pnpm build && pnpm schema`). A test fails when the two drift apart.

## Versions

`formatVersion` changes only on a breaking change, and every change ships a migration step (`migrateMessenger`). A document newer than the package is refused with `FORMAT_TOO_NEW`.

## License

MIT
