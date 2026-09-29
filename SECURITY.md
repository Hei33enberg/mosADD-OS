# Security Policy

## Reporting a vulnerability

Please do not open a public issue. Use one of:

- GitHub private vulnerability reporting: <https://github.com/Hei33enberg/mosADD-OS/security/advisories/new>
- Email `security@mosadd.com` (no PGP key published; ask for an encrypted channel in a first plain email if you need one)

Include a description, steps to reproduce, affected versions, and whether you plan to publish a write-up.

What we do: an agent confirms receipt within 48 hours; the fix is best effort, ordered by severity (CVSS 3.1).
m.0S is run by one maintainer with AI agents, so we do not promise fixed patch deadlines. We credit reporters in
the advisory unless they prefer otherwise. There is no paid bug bounty and no swag.

## Scope

In scope:
- this repository and the `@mosadd/*` npm packages built from it
- the hosted endpoints `mcp.mosadd.dev`, `api.mosadd.dev`, `app.mosadd.dev`
- the older endpoint `mcp.mosadd.com`

Out of scope: applications we do not run, social engineering, physical attacks, issues already disclosed publicly
without coordination.

## Supported versions

Pre-release (`3.0.0-alpha.*`, `@mosadd/m0s` `0.x`): fixes land in the next release only.
