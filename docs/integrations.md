# One-step installs: Gemini CLI, Cursor

Remote endpoint for all of them: `https://mcp.mosadd.com/mcp` (MCP sign-in, no key to copy).

## Gemini CLI

```bash
gemini extensions install https://github.com/Hei33enberg/mosADD-OS
```

The extension manifest is [`gemini-extension.json`](../gemini-extension.json). On first use Gemini CLI opens the
browser sign-in. To run the npm server locally instead (key from [mosadd.com/keys](https://mosadd.com/keys)), put
this in `~/.gemini/settings.json`:

```json
{ "mcpServers": { "mosadd-local": { "command": "npx", "args": ["-y", "@mosadd/mcp@3.0.0"], "env": { "MOSADD_API_KEY": "<your key>" } } } }
```

## Cursor

[Add to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=mosadd&config=eyJ1cmwiOiJodHRwczovL21jcC5tb3NhZGQuY29tL21jcCJ9)
— adds the remote server to `mcp.json` after Cursor's confirmation dialog. The same config by hand:

```json
{ "mcpServers": { "mosadd": { "url": "https://mcp.mosadd.com/mcp" } } }
```

The plugin manifest is [`.cursor-plugin/plugin.json`](../.cursor-plugin/plugin.json) (MCP endpoint + the ten skills).
Local npm option: `{ "command": "npx", "args": ["-y", "@mosadd/mcp@3.0.0"], "env": { "MOSADD_API_KEY": "<your key>" } }`.
