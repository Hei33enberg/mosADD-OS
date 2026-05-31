# RFC 0001 — `m*` module naming convention

- **Status:** Accepted
- **Date:** 2026-05-27
- **Authors:** mosadd core team
- **Tracking:** [LINEAR-2140](https://linear.app/ip-ra/issue/LINEAR-2140)

## Summary

Every communication module in mosadd-os is named `m<NAME>` where `m` stands for **mosadd module** (and rhymes with the project name `m·os·add` = "man OS add"). Each module is an OS-level semantic primitive, not a vendor wrapper.

## Motivation

mosadd positions itself as the **operating system for human communications**, not as another SDK. To make the OS framing real and not just marketing, every public surface must reflect the modular OS metaphor:

- Linux exposes `socket()`, `pipe()`, `mkdir()` — semantic primitives, not "Microsoft IPC" or "Cisco network"
- mosadd exposes `mDM`, `mTALK`, `mROOM` — semantic primitives, not "Twilio chat" or "LiveKit room"

This naming choice has cascading effects on:
- MCP tool names (`mDM_send`, `mROOM_create_with_link`)
- Package paths (`@mosadd/core/modules/mDM`)
- LP / marketing copy
- RFC titles for future modules

## Naming rules

1. **Prefix `m`** — lowercase, no separator. Always.
2. **Module name** — UPPERCASE 2-8 letters, alphanumeric only. Examples: `mDM`, `mTALK`, `mIRC`, `mROOM`, `mIRL`.
3. **MCP tools** — `m<NAME>_<operation>` snake_case for operation. Examples: `mDM_send`, `mROOM_create_with_link`, `mTALK_start_session`.
4. **Bridges** — same convention, name is the external network: `mMATRIX`, `mDISCORD`, `mTELEGRAM`, `mSLACK`, `mSIGNAL`, `mWHATSAPP`, `mIMESSAGE`.
5. **No version suffix in name** — versioning via package version, not `mDM2` etc.

## Reserved modules (v3.0.0)

Native channels:
- `mDM` — Direct Messages
- `mTALK` — Push-to-Talk voice
- `mAIL` — Email
- `mCALL` — PSTN voice call
- `mIRC` — Persistent channels
- `mIRL` — Live-stream after-party
- `mROOM` — Ephemeral rooms + no-account join links

Bridges (Hermes-derived):
- `mMATRIX`, `mDISCORD`, `mTELEGRAM` (P0)
- `mSLACK`, `mSIGNAL` (P1)
- `mWHATSAPP`, `mIMESSAGE` (P2, legal review)

## Reserved future names (no implementation yet)

`mPOST`, `mWALL`, `mBROADCAST`, `mPING`, `mPAY`, `mVAULT`, `mFAX`, `mRSS`, `mNEWS`, `mMAP`.

To reserve a new name, open an RFC and tag it with the reserved name.

## Minimum bar for a new `m*` module

A new `m*` module is accepted only if:

1. It represents a **semantic primitive** of human communication, not a vendor or product wrapper
2. There are **≥2 viable backend providers** (vendor-agnostic)
3. **Threat radar hooks** are designed in from day 1 (every operation emits ≥1 event)
4. **MCP tool surface** is specified in the RFC
5. **Test coverage** plan is included
6. RFC accepts the [GOVERNANCE.md](../../GOVERNANCE.md) review process

## Rejected names / patterns

- `MM_*`, `MOS_*`, `MOSADD_*` — too verbose, breaks the rhythm
- Vendor-specific names like `mSENDGRID`, `mTWILIO` — not semantic primitives, those are providers under existing modules
- Mixed case like `mDm` or `Mdm` — strictly `m<UPPERCASE>`

## Drawbacks

- Visually unusual (`mDM` reads weirdly in some fonts)
- Conflicts with Microsoft "MDM" (Mobile Device Management) — acceptable, different domain
- Hard to autocomplete in IDEs that lowercase-prefer
- RFC overhead for every new module

## Alternatives considered

- `chan*` / `msg*` / `comm*` — too generic, lose the OS metaphor
- `mosadd_*` — too long, kills the tagline
- No prefix at all (`DM`, `TALK`, `ROOM`) — collides with standard JS globals and reserved words

## Decision

Adopt `m*` convention. All current and future modules follow this rule. RFC required to add modules.
