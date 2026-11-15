# First message, no SDK

```bash
MOSADD_KEY=m0s_tk_test_... node first-message.mjs
```

Plain `fetch` against `https://mcp.mosadd.dev/mcp`: `initialize`, `tools/list`, then `mIRC_create` (#hello) and
`mIRC_post_message`. It needs `MOSADD_KEY`: without a key the endpoint answers every request with HTTP 401.
