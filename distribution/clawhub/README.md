# ClawHub (prepared, not submitted)

The skill in [`m0s/`](./m0s/SKILL.md) follows the agentskills.io format plus OpenClaw's `metadata.openclaw`
gating (needs `MOSADD_KEY`). Publish from a machine logged in to ClawHub:

```bash
clawhub login
clawhub publish ./distribution/clawhub/m0s --slug m0s --name "m.0S" --version 0.1.0
```

Check the flags against `clawhub publish --help` of the installed version first; the login is a GitHub OAuth
into ClawHub, which is an account decision for general@.
