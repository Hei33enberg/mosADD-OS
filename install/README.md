# Install

The installer is `@mosadd/m0s` **0.3.1**. It writes the m.0S hub into the AI hosts it finds on the machine. It does not install the hub, and it does not install `@mosadd/mcp`.

| | |
|---|---|
| Hub it points at | `https://mcp.mosadd.dev/mcp` |
| Hub version measured 2026-11-11 | `serverInfo` **0.3.9**, **103** tools |
| This installer | **0.3.1** |
| Key | `MOSADD_KEY`, from [app.mosadd.dev](https://app.mosadd.dev) |
| Node | 18 or newer |

A test key (`m0s_tk_test_…`) is enough to connect. A line key is `m0s_lk_live_…`.

## One line, pinned to a commit

The scripts are pinned to the commit that contains installer 0.3.1, not to a branch. That commit is `97421c0f3ba1f93fe86ddfb91a96751a4b7eaaba`. A later docs commit does not republish the installer. If `install/install.sh` changes, the pin moves in the same change.

```bash
export MOSADD_KEY="m0s_tk_test_…"
curl -fsSL https://raw.githubusercontent.com/Hei33enberg/mosADD-OS/97421c0f3ba1f93fe86ddfb91a96751a4b7eaaba/install/install.sh | sh
```

```powershell
$env:MOSADD_KEY="m0s_tk_test_…"
irm https://raw.githubusercontent.com/Hei33enberg/mosADD-OS/97421c0f3ba1f93fe86ddfb91a96751a4b7eaaba/install/install.ps1 | iex
```

Flags, after `--`:

| Flag | Effect |
|---|---|
| `--dry-run` | show the edits. The key is a placeholder. The script still caches `m0s.mjs` and the signed address list under `~/.m0s` |
| `--host cursor,codex` | only those hosts |

Hosts it can write: Claude Code, Claude Desktop, Codex, Cursor, VS Code, Windsurf, Hermes Agent, OpenClaw. It prints the manual steps for Lovable and Manus. An existing `mosadd` entry is replaced, and the file is backed up first.

From a clone, same client, no pin required:

```bash
node packages/m0s/m0s.mjs install
node packages/m0s/m0s.mjs doctor
```

`doctor` checks the endpoint and does not print the key.

## Address list

The hub publishes `/.well-known/m0s-endpoints.json`, signed with Ed25519. The offline root public key is pinned in `packages/m0s/m0s.mjs`. The shim drops a list that fails the signature or the expiry, and moves to the next address when one stops answering as the hub. Direct node names are dialed at the IP in the signed list.

A host that only stores a URL does not read that list. If the name is ever taken, re-run the installer or pass `--url`.

## Do not edit the scripts by hand

`install/install.sh` and `install/install.ps1` are generated from `packages/m0s/m0s.mjs`. Change the client, regenerate, then move the pinned commit in the README only once that installer commit exists.

## What this does not do

It does not deploy the messenger, open a ROOKIE / MAYOR / ADMIRAL account, or top up the hub balance. The panel does the account. The hub price list is [PRICING.md](../PRICING.md). Host-by-host config, if you would rather not run the script, is [docs/hosts.md](../docs/hosts.md).
