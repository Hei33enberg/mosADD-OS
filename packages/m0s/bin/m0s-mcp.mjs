#!/usr/bin/env node
// m0s-mcp - the stdio shim alone, for hosts that want a single command: `m0s-mcp` == `m0s mcp`.
import { runShim, resolveUrl } from '../m0s.mjs';

runShim({ url: resolveUrl(process.env.M0S_MCP_URL) }).catch((e) => {
  process.stderr.write(`m0s-mcp: ${e.message}\n`);
  process.exitCode = 1;
});
