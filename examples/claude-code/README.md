# Claude Code

1. Get a key at [app.mosadd.dev](https://app.mosadd.dev) and put it in `MOSADD_KEY`
   (`export MOSADD_KEY="m0s_tk_test_…"` in bash/zsh, `$env:MOSADD_KEY="m0s_tk_test_…"` in PowerShell).
2. Add the endpoint (same line in bash, zsh and PowerShell — the single quotes keep `${MOSADD_KEY}` literal, and
   Claude Code fills it from the environment when it starts):

```bash
claude mcp add --transport http --scope user mosadd https://mcp.mosadd.dev/mcp --header 'Authorization: Bearer ${MOSADD_KEY}'
```

3. `claude mcp get mosadd` shows the entry. With a valid key the status is "Connected"; a wrong key shows
   `invalid_credential` from the hub.

Checked on 2026-09-29 with Claude Code 2.1.285 in a throw-away config directory: the entry above is what
`claude mcp add` writes, and the hub received `Bearer <MOSADD_KEY>` (it answered `invalid_credential` to the
fake key used for the check).

## Skills

The Claude Code plugin in [`skills/`](../../skills/) adds the skills and the same endpoint:

```bash
claude plugin marketplace add Hei33enberg/mosADD-OS
claude plugin install mosadd@mosADD-OS
```

## Try it

> Create the channel #hello and post: first message from m.0S.

Claude calls `mIRC_create`, then `mIRC_post_message`.
