#!/usr/bin/env node
// What the hosted endpoint lists, as opposed to what @mosadd/mcp defines. The hub serves every @mosadd/mcp tool
// plus tools of its own (29.09: sms_send, call_start, call_status), so the public texts carry the hub's number.
//
//   node scripts/check-hub-tools.mjs          exit 1 when the live tools/list differs from distribution/hub-tools.json
//   node scripts/check-hub-tools.mjs --write  refresh distribution/hub-tools.json from the live endpoint
//
// Offline, packages/mcp/src/__tests__/tool-count-consistency.test.ts checks the snapshot against the registry and
// pins every public sentence that states the hub's count; this script is the live half (network, no key needed:
// initialize and tools/list are public).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const HUB_URL = process.env.M0S_MCP_URL || 'https://mcp.mosadd.dev/mcp';
export const SNAPSHOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'distribution', 'hub-tools.json');

async function rpc(url, headers, body) {
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(20_000) });
  const text = await r.text();
  const data = text.match(/^data: (.*)$/m);
  return { res: r, json: JSON.parse(data ? data[1] : text) };
}

export async function liveTools(url = HUB_URL) {
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
  const init = await rpc(url, headers, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'm0s-check-hub-tools', version: '1' } },
  });
  const sid = init.res.headers.get('mcp-session-id');
  if (sid) headers['mcp-session-id'] = sid;
  const list = await rpc(url, headers, { jsonrpc: '2.0', id: 2, method: 'tools/list' });
  const names = list.json.result.tools.map((t) => t.name).sort();
  return { endpoint: url, server_version: init.json.result.serverInfo.version, count: names.length, names };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const live = await liveTools();
  if (process.argv.includes('--write')) {
    writeFileSync(SNAPSHOT, JSON.stringify({ measured_at: new Date().toISOString().slice(0, 16) + 'Z', ...live }, null, 2) + '\n');
    console.log(`wrote ${SNAPSHOT}: ${live.count} tools, server ${live.server_version}`);
  } else {
    const snap = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
    const added = live.names.filter((n) => !snap.names.includes(n));
    const gone = snap.names.filter((n) => !live.names.includes(n));
    if (added.length || gone.length || live.server_version !== snap.server_version) {
      console.error(
        `hub drifted from distribution/hub-tools.json (${snap.measured_at}): ${live.count} tools now, ${snap.count} in the snapshot; ` +
          `new: ${added.join(', ') || '-'}; gone: ${gone.join(', ') || '-'}; server ${live.server_version} vs ${snap.server_version}. ` +
          `Run --write, then fix the texts the tool-count test names.`,
      );
      process.exit(1);
    }
    console.log(`hub matches distribution/hub-tools.json: ${live.count} tools, server ${live.server_version}`);
  }
}
