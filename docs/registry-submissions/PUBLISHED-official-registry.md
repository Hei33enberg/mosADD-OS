# mosADD is IN the official MCP Registry — how it got there, and how to update it

**Live since 2026-09-03 23:57 UTC.** Entry: `com.mosadd/mosadd-mcp`, status `active`.

```bash
curl "https://registry.modelcontextprotocol.io/v0/servers?search=mosadd"
```

## Why this file exists (the failure it replaces)

The submission playbook has been ready since June (`modelcontextprotocol-registry.md`) and the
listing still did not exist on 2026-09-03 — measured: `search=mosadd` returned **0 servers**, while
`marocain-mcp-server` and `strajkpolski-mcp` from the same GitHub account were both listed.

The reason was not the playbook. It was that the playbook's "easiest path" was
`.github/workflows/publish-mcp-registry.yml`, which authenticates by **GitHub OIDC — and GitHub
Actions is switched off for this org on purpose** (a cost decision; every run reports
`startup_failure` in 0 s). A publish path wired exclusively to a disabled runner is a publish path
that never runs, and nothing said so out loud. The fallback in the doc —
`mcp-publisher login github` — needs a **device code typed by a human**, so every future release
would have stood on the owner being awake.

**Both problems are gone: this listing is published by DOMAIN ownership.** No Actions, no browser,
no human, and the namespace is ours (`com.mosadd/*`) instead of a personal account
(`io.github.hei33enberg/*`).

## The three moving parts

| Part | Where | Note |
|---|---|---|
| Proof of domain | `m0ssad-3` → `apps/web/public/.well-known/mcp-registry-auth` | PUBLIC key only. Deployed by Vercel with the web app; served at `https://mosadd.com/.well-known/mcp-registry-auth`. |
| Manifest | `packages/mcp/server.registry.json` (this repo) | What the registry shows. `remotes` = the hosted gateway, i.e. the ONE-CLICK connector. |
| Private key | NOT stored anywhere in git | Regenerate freely — see below. Losing it costs one commit, not the listing. |

⛔ `packages/mcp/server.json` is a **different** manifest: the `io.github.hei33enberg/…` npm/stdio
entry that was never published. Keep them apart until the npm package's `mcpName` is migrated to
`com.mosadd/mosadd-mcp` (then the two collapse into one file with both `remotes` and `packages`).

## Update the listing (every release)

```bash
cd /c/mosadd-os/packages/mcp
# 1. bump "version" in server.registry.json to the released version
# 2. authenticate (see "if the key is lost" if this fails)
mcp-publisher login http --domain mosadd.com --private-key "$(cat <key>.hex)"
mcp-publisher publish server.registry.json
```

`mcp-publisher` is not vendored — download it per run:

```bash
curl -sSL -o mcp-publisher.tar.gz \
  https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_windows_amd64.tar.gz
tar xzf mcp-publisher.tar.gz
```

## If the key is lost (this is cheap, do not panic)

The private key proves we control `mosadd.com`, and we control the file that names the public half.
So regenerate both:

```bash
openssl genpkey -algorithm Ed25519 -out key.pem
PUB="$(openssl pkey -in key.pem -pubout -outform DER | tail -c 32 | base64 -w0)"
echo "v=MCPv1; k=ed25519; p=${PUB}" > /c/m0ssad-3/apps/web/public/.well-known/mcp-registry-auth
# commit + push m0ssad-3 → wait for the Vercel deploy (~2–3 min) → then:
PRIV="$(openssl pkey -in key.pem -noout -text | grep -A3 'priv:' | tail -n +2 | tr -d ' :\n')"
mcp-publisher login http --domain mosadd.com --private-key "$PRIV"
```

⛔ The login VERIFIES the live URL, so publish only after the deploy is actually serving the new
file. Measured 2026-09-03: Vercel took ~3 minutes; until then the path still returned the SPA
`index.html`, and a login against that fails.

## What this unlocks downstream

The official registry is the source that Glama, mcp.so, Smithery, PulseMCP and mcpservers.org
auto-index from — the per-registry drafts in this folder are now a **fallback**, to be used only if
an entry is still missing ~24 h after a publish. Check them, then update each file's status.

⛔ Still NOT covered by this and still open: **Anthropic's in-product Connectors directory** (the
curated list where Docusign / PubMed / idealista sit). That is a separate, human-reviewed
submission — it does not read the MCP registry.

## The same playbook for a sibling brand (3T3R and the rest)

It is domain-shaped, so every brand repeats it with its own domain and namespace — nothing here is
mosADD-specific except the two names:

1. Generate the Ed25519 pair.
2. Serve `v=MCPv1; k=ed25519; p=<pub>` at `https://<brand-domain>/.well-known/mcp-registry-auth`.
3. `mcp-publisher login http --domain <brand-domain> --private-key <hex>`
4. `server.json` with `name: "<reverse-dns>/<server>"` (e.g. `com.3t3r/3t3r-mcp`) and a `remotes`
   entry pointing at that brand's own gateway.
5. `mcp-publisher publish server.json`, then verify with the `curl` at the top.
