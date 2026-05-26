# Security Policy

## Reporting a vulnerability

If you've found a security vulnerability in mosadd, **please do not open a public GitHub issue**. Instead:

**Email:** `security@mosadd.com` (PGP key: TBD)

Include:
- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Suggested mitigation (if any)
- Whether you intend to publish a write-up after the fix lands

We will:
- Acknowledge receipt within **48 hours**
- Provide an initial assessment within **5 business days**
- Coordinate with you on disclosure timing
- Credit you in the security advisory (unless you prefer anonymity)

## Severity classification

We follow CVSS 3.1.

| Severity | Response time | Patch ETA |
|---|---|---|
| Critical | < 24h | < 7 days |
| High | < 48h | < 14 days |
| Medium | < 5 days | < 30 days |
| Low | < 14 days | Next release |

## Scope

In scope:
- `@m0ssad/*` packages on npm
- `forks/livekit-server/` (our fork only — upstream issues go to LiveKit)
- `forks/` other vendored OSS — upstream-first if applicable
- mosadd MCP server
- `mcp.mosadd.com` hosted endpoint
- `hub.mosadd.com` dashboard

Out of scope:
- Issues in unaffiliated user applications
- Social engineering attacks against contributors
- Physical attacks
- Issues already publicly disclosed without coordination

## Bug bounty

mosadd does not currently run a paid bug bounty. We do offer:
- Public recognition in the [security advisories](https://github.com/mosadd/os/security/advisories)
- mosadd swag for non-trivial findings
- Priority support on the commercial hub

Paid bounty program is on the roadmap once we reach scale.

## Supported versions

Until v3.0.0 stable releases:
- `3.0.0-alpha.*` — best-effort
- `3.0.0-beta.*` — security patches within SLA

After v3.0.0 stable:
- Current major version: full support
- Previous major: security patches only, 12 months after new major releases
