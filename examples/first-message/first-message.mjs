// The first message over m.0S, with nothing but Node.js >= 18 (MIT).
//   MOSADD_KEY=m0s_tk_test_... node first-message.mjs
// It opens an MCP session at https://mcp.mosadd.dev/mcp, creates the channel #hello and posts one message.
const URL_ = process.env.M0S_MCP_URL || 'https://mcp.mosadd.dev/mcp';
const KEY = process.env.MOSADD_KEY;
let session = null;
let nextId = 1;

async function rpc(method, params) {
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
  if (KEY) headers.authorization = `Bearer ${KEY}`;
  if (session) headers['mcp-session-id'] = session;
  const id = nextId++;
  const res = await fetch(URL_, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) });
  session = res.headers.get('mcp-session-id') || session;
  const text = await res.text();
  const body = (res.headers.get('content-type') || '').includes('event-stream')
    ? text.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5)).join('')
    : text;
  const msg = JSON.parse(body);
  if (msg.error) throw new Error(`${method}: ${msg.error.message}`);
  return msg.result;
}

const toolText = (r) => (r.content || []).map((c) => c.text).join('\n');

try {
  const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'first-message', version: '0.1.0' } });
  console.log(`connected: ${init.serverInfo.name} ${init.serverInfo.version}`);
  const { tools } = await rpc('tools/list');
  console.log(`${tools.length} tools`);
  if (!KEY) {
    console.log('MOSADD_KEY is not set: listing works without a key, calling tools does not. Key: https://app.mosadd.dev');
    process.exit(0);
  }
  try {
    const created = await rpc('tools/call', { name: 'mIRC_create', arguments: { name: 'hello', access_mode: 'open' } });
    console.log(toolText(created));
    const channelId = toolText(created).match(/channel_id"?\s*[:=]\s*"?([0-9a-f-]{36})/)?.[1];
    if (!channelId) throw new Error('mIRC_create did not return a channel_id');
    const posted = await rpc('tools/call', { name: 'mIRC_post_message', arguments: { channel_id: channelId, text: 'first message from m.0S' } });
    console.log(toolText(posted));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
