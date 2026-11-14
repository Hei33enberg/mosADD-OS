# RFC 0006 — The messenger format (`messenger.json`) for mosADD Studio

- **Status:** Draft
- **Author:** @Hei33enberg
- **Created:** 2026-11-14
- **Last updated:** 2026-11-14
- **Linear ticket:** (none yet)
- **Supersedes:** (none)
- **Superseded by:** (none)

## Summary

mosADD Studio (planned for mosadd.dev) lets a creator assemble their own messenger from mosADD blocks — push-to-talk, channels, direct messages, mail, memory, agents — give it a name and a theme, and ship it to Android, desktop and the web. This RFC defines the single file that describes such a messenger, `messenger.json`, and the package that owns it, `@mosadd/messenger`: a Zod schema, a published JSON Schema, a validator with four layers (shape, consistency, accessibility, honesty and trademark), a contrast checker and a migration entry point.

The central rule: **a studio never generates messenger code.** Every messenger runs the same reviewed mosADD client; only this file differs. Encryption, identity and transport cannot be configured from it, so neither a theme nor a prompt can weaken them.

## Motivation

- A white-label messenger built by copying the app per customer is the failure mode this repository already warns against ("a tenant is a parameter, not a copy"). One description file per messenger keeps one client and many brands.
- An AI agent that edits code can break encryption by accident. An agent that edits a validated description cannot.
- Creators need a format that is versioned, diff-able and checkable offline, so the same check runs in the studio, on the build machine and in the app at start-up.
- Accessibility must be a gate, not a suggestion: a theme below WCAG 2.2 AA contrast must not ship.

## Detailed design

### The file

```jsonc
{
  "$schema": "https://mosadd.dev/schema/messenger/1.json",
  "format": "mosadd.messenger",
  "formatVersion": 1,                 // changes only on a breaking change
  "id": "port-radio",                 // slug, unique per creator
  "revision": 7,                      // +1 on every release, each revision is frozen
  "appVersion": "1.2.0",              // semver, assigned by the studio
  "template": "crew-ptt@1",           // optional: where it started
  "brand":    { "name", "shortName", "description", "icon", "languages", "defaultLanguage", "privacyPolicy", "poweredBy" },
  "core":     { "line": "mosadd-core@1", "channel": "stable" },   // the only core setting: which line of the client
  "blocks":   [ { "id": "identity" | "mtalk" | "mirc" | "mdm" | "madd" | "mkeeper" | "mrag" | "mayl" | "murl" | "offline", "enabled", "settings" } ],
  "layout":   { "tabs": [ "mtalk", "mirc", "mdm", "madd" ], "home": "mtalk" },
  "theme":    { "id", "version", "base", "defaultMode", "modes", "tokens": { "dark": {…}, "light": {…} }, "fonts", "radius", "density" },
  "releases": { "android": {…}, "desktop": {…}, "web": {…}, "channel": "beta" },
  "instance": { "hosting", "network": { "listedInMosaddDirectory": false } },
  "budget":   { "monthlyUsd", "overBudget" },
  "privacy":  { "telemetry", "crashReports" }
}
```

Keys that start with `_` are comments and are ignored. Any other unknown key is an error.

Block ids follow RFC 0001 module names in lower case (`mtalk` = mTALK, `mirc` = mIRC, …). Each block has its own strict `settings` object; the full shapes live in `packages/messenger/src/schema.ts` and the generated `packages/messenger/schema/messenger-1.json`.

Theme tokens (per mode): `background, surface, border, text, textMuted, accent, onAccent, warning, error, pttTransmit, pttListen`, all `#rrggbb`. `border` is decorative; the client draws control outlines with `textMuted`.

### The validator

```ts
validateMessenger(input: unknown): {
  ok: boolean;                 // true when there is no issue of level "error"
  issues: Issue[];
  messenger?: Messenger;       // parsed value when the shape is valid
}

interface Issue {
  level: "error" | "warning";  // an error blocks a release, a warning does not
  path: string;                // JSON Pointer, e.g. "/theme/tokens/light/textMuted"
  code: string;                // e.g. "SHAPE", "CONTRAST", "TAB_NOT_ENABLED", "TRADEMARK", "HONESTY"
  message: string;
  hint?: string;
}
```

Four layers, in order:

1. **Shape.** The Zod schema (strict objects, bounded strings, `#rrggbb` colours, reverse-DNS Android package names).
2. **Consistency.** Identity is present and on; block ids are unique; tabs and home name enabled blocks; agent and channel settings that depend on another block require it; the offline block requires a bundled Android shell; at least one release target is on.
3. **Accessibility.** WCAG 2.2 relative-luminance contrast, per mode: text pairs ≥ 4.5:1 (`text`, `textMuted` on `background` and `surface`; `onAccent` on `accent`), interface colours ≥ 3:1 (`accent`, `pttTransmit`, `pttListen`, `error` on `background`). Every listed mode needs tokens. Fonts come from an allowlist of fonts that may be bundled.
4. **Honesty and trademark.** A creator's name must not contain "mosadd" (TRADEMARK.md: "Runs on mosADD" is fine, "mosADD Something" is not). Creator copy (description, channel names, agent role) is checked against the claims this project never makes: blanket encryption, encrypted channels, voice or agents, hiding who messaged whom, and marketing absolutes (the list is `docs/security/e2ee-posture.md`).

### Versions and migrations

- `formatVersion` is an integer. Additive, optional fields keep the version; a breaking change bumps it and ships a pure `migrate(n → n+1)` step.
- `migrateMessenger(input)` lifts an older document to the current version, and returns `FORMAT_TOO_NEW` for a version the package does not know.
- `revision` is monotonic per messenger. A release freezes the revision; rolling back means releasing an older revision again.

### CLI

```bash
npx @mosadd/messenger check messenger.json   # prints issues, exits 1 on any error
npx @mosadd/messenger schema                 # prints the JSON Schema
```

## Drawbacks

- One more format to keep stable. Mitigated by `formatVersion`, migrations and a drift test between the Zod schema and the committed JSON Schema.
- The honesty rules for creator copy overlap with `scripts/honesty-rules.mjs`. They have different owners on purpose: the repository script guards this repository's prose; the package guards what creators write into their apps, which must run inside the studio and the app without the repository.

## Rationale and alternatives

- **Generate code per messenger (the "app builder" approach).** Rejected: every generated app becomes a separate security review, and a prompt could remove encryption.
- **Hand-written TypeScript types plus a minimal validator.** Rejected: no published schema for other tools, no versioning, no useful error paths.
- **JSON Schema as the source.** Workable, but the rest of this repository validates with Zod (`@mosadd/protocol`), so the schema is generated from Zod.

## Prior art

- `@mosadd/protocol` — Zod schemas for wire messages.
- `skins/` `.mosaddskin` — CSS-only skins for the embed widget; the theme tokens here are meant to map onto it.
- Web app manifests and Capacitor/Electron builder configs — the release section mirrors what those tools need.

## Unresolved questions

- The mapping from theme tokens to the app's CSS variables and to the widget's `--m-*` variables.
- The directory protocol behind `instance.network.listedInMosaddDirectory` (federation of messengers). The flag is defined; the network is not built.
- Hosting outside mosADD (`instance.hosting: "anywhere" | "mixed"`) is a planned mode. Nothing in this repository runs it today; the field exists so descriptions do not change when it ships.

## Future possibilities

- A studio agent that edits the file only through JSON Patch operations, each validated before it applies.
- Signed revisions delivered to installed apps without a reinstall (theme, blocks, layout).
- More templates beyond `crew-ptt` and `community`.
