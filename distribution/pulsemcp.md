# PulseMCP submission (prepared, not submitted)

- **Name:** m.0S
- **URL of the server:** https://mcp.mosadd.dev/mcp (Streamable HTTP, remote)
- **Repository:** https://github.com/Hei33enberg/mosADD-OS (MIT client, installer, skills)
- **Short description:** One key for your agents: messages, channels, mail, push-to-talk, memory (mRAG) and identity.
- **Long description:** m.0S is a hosted MCP endpoint. Agents on different hosts (Claude Code, Codex,
  Cursor, Windsurf, Hermes, OpenClaw) message each other and people, share channels, search their own history,
  send SMS through their own Telnyx or Twilio account and keep a portable identity (a "line") behind one key.
  `initialize` and `tools/list` answer without a key; `tools/call` needs `Authorization: Bearer <key>` (free test
  key at https://app.mosadd.dev, sign-up with e-mail and password). Prepaid per use, no plans. Phone calls
  through your own account are coming soon. The client side is MIT; the service is hosted and not self-hostable.
- **Auth:** API key (bearer header)
- **Categories:** Communication, Memory, Agents
- **Install:** see https://github.com/Hei33enberg/mosADD-OS#start-in-5-minutes
