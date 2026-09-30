// The hub's signed address list (/.well-known/m0s-endpoints.json) as the client reads it: signature against the pinned
// key, expiry, version floor, key rotation, and failover of the stdio shim between two local servers.
// Keys are generated per run; nothing secret lives in the repository. The hub side of the same format:
// Hei33enberg/m0s-hub apps/control/src/endpoints/list.ts (payload = exact bytes, Ed25519, keyid = sha256(pub)[0..16]).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import { generateKeyPairSync, sign } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import {
  DEFAULT_URL,
  ENDPOINTS_KEYS,
  ENDPOINTS_PATH,
  EndpointsError,
  endpointsKeyId,
  verifyEndpoints,
  refreshEndpoints,
  loadEndpointsCache,
  mcpCandidates,
  listSources,
  chooseEndpoint,
  runShim,
  doctor,
  install,
} from '../m0s.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'm0s-ep-'));

function keyPair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return { priv: privateKey, pub: Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url').toString('base64') };
}

/** Sign like the hub does: Ed25519 over the UTF-8 bytes of the payload string. */
function signed(payload, ...signers) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return {
    m0s_endpoints: 1,
    payload: text,
    signatures: signers.map((k) => ({ keyid: endpointsKeyId(k.pub), alg: 'ed25519', sig: sign(null, Buffer.from(text, 'utf8'), k.priv).toString('base64') })),
  };
}

function payload({ version = Math.floor(Date.now() / 1000), issued = Date.now() - 60_000, ttlMs = 7 * 86400_000, endpoints, next = null } = {}) {
  return {
    type: 'm0s-endpoints',
    format: 1,
    version,
    issued_at: new Date(issued).toISOString(),
    expires_at: new Date(issued + ttlMs).toISOString(),
    next_pubkey: next,
    endpoints,
  };
}

const reason = (fn) => {
  try {
    fn();
    return 'accepted';
  } catch (e) {
    if (e instanceof EndpointsError) return e.reason;
    throw e;
  }
};

const EP = [
  { url: 'https://mcp.hub.test/mcp', service: 'mcp', family: 'A', region: 'tlv', role: 'primary', weight: 100 },
  { url: 'https://api.hub.test/', service: 'api', family: 'A', region: 'tlv', role: 'primary', weight: 100 },
  { url: 'https://1-2-3-4.sslip.io/mcp', service: 'mcp', family: 'direct', region: 'tlv', role: 'backup', weight: 50 },
  { url: 'https://5-6-7-8.sslip.io/', service: 'hub', family: 'direct', region: 'bom', role: 'backup', weight: 20 },
];

describe('signed address list: verification', () => {
  const k = keyPair();
  const other = keyPair();

  it('a list signed by the pinned key is accepted; addresses come out preferred first', () => {
    const list = verifyEndpoints(signed(payload({ endpoints: EP }), k), { keys: [k.pub] });
    expect(list.version).toBeGreaterThan(0);
    expect(mcpCandidates(list)).toEqual(['https://mcp.hub.test/mcp', 'https://1-2-3-4.sslip.io/mcp']);
    expect(listSources(list)).toEqual([
      `https://mcp.hub.test${ENDPOINTS_PATH}`,
      `https://api.hub.test${ENDPOINTS_PATH}`,
      `https://1-2-3-4.sslip.io${ENDPOINTS_PATH}`,
      `https://5-6-7-8.sslip.io${ENDPOINTS_PATH}`,
    ]);
    expect(mcpCandidates(null)).toEqual([DEFAULT_URL]);
  });

  it('bad signature = rejected: changed address, unpinned key, zeroed signature, no signature, forged keyid', () => {
    const doc = signed(payload({ endpoints: EP }), k);
    const forged = { ...doc, payload: doc.payload.replace('https://mcp.hub.test/mcp', 'https://mcp.seized.test/mcp') };
    expect(forged.payload).not.toBe(doc.payload);
    expect(reason(() => verifyEndpoints(forged, { keys: [k.pub] }))).toBe('bad_signature');
    expect(reason(() => verifyEndpoints(doc, { keys: [other.pub] }))).toBe('bad_signature');
    expect(reason(() => verifyEndpoints({ ...doc, signatures: [{ ...doc.signatures[0], sig: Buffer.alloc(64).toString('base64') }] }, { keys: [k.pub] }))).toBe('bad_signature');
    expect(reason(() => verifyEndpoints({ ...doc, signatures: [] }, { keys: [k.pub] }))).toBe('bad_signature');
    const byOther = signed(forged.payload, other);
    byOther.signatures[0].keyid = endpointsKeyId(k.pub);
    expect(reason(() => verifyEndpoints(byOther, { keys: [k.pub] }))).toBe('bad_signature');
    expect(reason(() => verifyEndpoints({ payload: doc.payload }, { keys: [k.pub] }))).toBe('bad_document');
  });

  it('expired list = rejected; a list issued in the future too', () => {
    const old = signed(payload({ endpoints: EP, issued: Date.now() - 8 * 86400_000 }), k);
    expect(reason(() => verifyEndpoints(old, { keys: [k.pub] }))).toBe('expired');
    const future = signed(payload({ endpoints: EP, issued: Date.now() + 3600_000 }), k);
    expect(reason(() => verifyEndpoints(future, { keys: [k.pub] }))).toBe('not_yet_valid');
  });

  it('a signed list still cannot send a key over plain http (outside loopback)', () => {
    const list = verifyEndpoints(signed(payload({ endpoints: [...EP, { url: 'http://plain.test/mcp', service: 'mcp', role: 'primary', weight: 1000 }] }), k), { keys: [k.pub] });
    expect(mcpCandidates(list)).not.toContain('http://plain.test/mcp');
  });

  it('the shipped client pins exactly one real Ed25519 key (32 bytes), not a placeholder', () => {
    expect(ENDPOINTS_KEYS).toHaveLength(1);
    expect(Buffer.from(ENDPOINTS_KEYS[0], 'base64')).toHaveLength(32);
    expect(Buffer.from(ENDPOINTS_KEYS[0], 'base64').toString('base64')).toBe(ENDPOINTS_KEYS[0]);
  });
});

// Two local "hubs": A = the primary that dies, B = the backup that keeps answering. Both can serve the list.
describe('signed address list: fetch, cache and shim failover (2 local servers)', () => {
  const k = keyPair();
  const servers = {};
  const hits = { A: [], B: [] };
  const mode = { A: 'down', B: 'up' };
  let doc;
  let listFor;

  function hub(name) {
    return createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        hits[name].push({ method: req.method, url: req.url, idem: req.headers['idempotency-key'] || null, body });
        if (req.url === ENDPOINTS_PATH) {
          if (name === 'A' && mode.A !== 'up') return res.writeHead(502, { 'content-type': 'text/html' }).end('<html>bad gateway</html>');
          res.writeHead(200, { 'content-type': 'application/json' });
          return res.end(JSON.stringify(doc));
        }
        if (name === 'A' && mode.A === 'down') return res.writeHead(502, { 'content-type': 'text/html' }).end('<html>bad gateway</html>');
        if (name === 'A' && mode.A === 'parked') return res.writeHead(200, { 'content-type': 'text/html' }).end('<html>this domain has been seized</html>');
        if (req.method === 'DELETE') return res.writeHead(204).end();
        const msg = JSON.parse(body);
        if (!('id' in msg)) return res.writeHead(202).end();
        res.writeHead(200, { 'content-type': 'application/json' });
        if (msg.method === 'initialize') return res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: '2025-06-18', capabilities: {}, serverInfo: { name: `hub-${name}`, version: 't' } } }));
        res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { served_by: name } }));
      });
    });
  }

  beforeAll(async () => {
    for (const name of ['A', 'B']) {
      servers[name] = hub(name);
      await new Promise((r) => servers[name].listen(0, '127.0.0.1', r));
    }
    const base = (n) => `http://127.0.0.1:${servers[n].address().port}`;
    listFor = (version = Math.floor(Date.now() / 1000)) =>
      signed(
        payload({
          version,
          endpoints: [
            { url: `${base('A')}/mcp`, service: 'mcp', family: 'A', region: 'tlv', role: 'primary', weight: 100 },
            { url: `${base('A')}/`, service: 'api', family: 'A', region: 'tlv', role: 'primary', weight: 100 },
            { url: `${base('B')}/mcp`, service: 'mcp', family: 'direct', region: 'bom', role: 'backup', weight: 20 },
            { url: `${base('B')}/`, service: 'hub', family: 'direct', region: 'bom', role: 'backup', weight: 20 },
          ],
        }),
        k,
      );
    doc = listFor();
  });
  afterAll(() => {
    for (const s of Object.values(servers)) s.close();
  });

  const shim = async (lines, opts) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const errors = new PassThrough();
    let out = '';
    let err = '';
    output.on('data', (c) => (out += c));
    errors.on('data', (c) => (err += c));
    const done = runShim({ input, output, errors, key: 'm0s_tk_test_k', env: {}, ...opts });
    for (const l of lines) input.write(JSON.stringify(l) + '\n');
    input.end();
    await done;
    return { msgs: out.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)), err };
  };

  it('refresh: the first place with a valid list wins; forged and expired copies are skipped; the list is cached', async () => {
    const forged = { ...doc, payload: doc.payload.replace('"backup"', '"primary"') };
    const expired = signed(payload({ endpoints: EP, issued: Date.now() - 9 * 86400_000 }), k);
    const bad = (d) => async () => new Response(JSON.stringify(d), { status: 200, headers: { 'content-type': 'application/json' } });
    const routes = { 'https://forged.test/l': bad(forged), 'https://expired.test/l': bad(expired) };
    const fetchImpl = (u, o) => (routes[u] ? routes[u]() : fetch(u, o));
    const file = join(tmp(), 'endpoints.json');
    const b = `http://127.0.0.1:${servers.B.address().port}${ENDPOINTS_PATH}`;
    const r = await refreshEndpoints({ keys: [k.pub], file, sources: ['https://forged.test/l', 'https://expired.test/l', b], bootstrap: [], fetchImpl });
    expect(r.tried.map((t) => t.reason)).toEqual(['bad_signature', 'expired']);
    expect(r.source).toBe(b);
    expect(r.updated).toBe(true);
    expect(mcpCandidates(r.list)[1]).toMatch(/\/mcp$/);
    const cached = loadEndpointsCache(file, { keys: [k.pub] });
    expect(cached.list.version).toBe(r.list.version);
    expect(loadEndpointsCache(file, { keys: [keyPair().pub] }), 'the cache is re-verified on load').toBeNull();
  });

  it('refresh: a lower version than the cached one is a rollback and is refused; the cache stays', async () => {
    const file = join(tmp(), 'endpoints.json');
    const newer = listFor(Math.floor(Date.now() / 1000) + 600);
    writeFileSync(file, JSON.stringify({ doc: newer, trusted_next: [] }));
    const b = `http://127.0.0.1:${servers.B.address().port}${ENDPOINTS_PATH}`;
    const r = await refreshEndpoints({ keys: [k.pub], file, sources: [b], bootstrap: [] });
    expect(r.tried.some((t) => t.reason === 'rollback')).toBe(true);
    expect(r.source).toBe('cache');
    expect(r.list.version).toBe(JSON.parse(newer.payload).version);
  });

  it('rotation: next_pubkey announced by a trusted list is trusted afterwards, without a new client', async () => {
    const next = keyPair();
    const file = join(tmp(), 'endpoints.json');
    const announce = signed(payload({ version: 100, endpoints: EP, next: next.pub }), k);
    const byNext = signed(payload({ version: 200, endpoints: EP }), next);
    const serve = (d) => async () => new Response(JSON.stringify(d), { status: 200 });
    let r = await refreshEndpoints({ keys: [k.pub], file, sources: ['https://x.test/l'], bootstrap: [], fetchImpl: serve(byNext) });
    expect(r.list, 'unknown key before the announcement').toBeNull();
    r = await refreshEndpoints({ keys: [k.pub], file, sources: ['https://x.test/l'], bootstrap: [], fetchImpl: serve(announce) });
    expect(r.list.version).toBe(100);
    r = await refreshEndpoints({ keys: [k.pub], file, sources: ['https://x.test/l'], bootstrap: [], fetchImpl: serve(byNext) });
    expect(r.list.version).toBe(200);
  });

  it('shim: primary answers 502 -> the same messages go to the backup; a tools/call keeps one Idempotency-Key', async () => {
    const file = join(tmp(), 'endpoints.json');
    writeFileSync(file, JSON.stringify({ doc, trusted_next: [] }));
    hits.A.length = 0;
    hits.B.length = 0;
    mode.A = 'down';
    const { msgs, err } = await shim(
      [
        { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'mDM_list', arguments: {} } },
        { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '0' } } },
      ],
      { list: { file, keys: [k.pub], bootstrap: [] } },
    );
    expect([...msgs].sort((a, b) => a.id - b.id)).toEqual([
      { jsonrpc: '2.0', id: 1, result: { protocolVersion: '2025-06-18', capabilities: {}, serverInfo: { name: 'hub-B', version: 't' } } },
      { jsonrpc: '2.0', id: 2, result: { served_by: 'B' } },
    ]);
    expect(err).toMatch(/did not answer as the hub; now using http:\/\/127\.0\.0\.1:\d+\/mcp \(signed address list\)/);
    const callA = hits.A.filter((h) => h.method === 'POST' && h.url === '/mcp' && h.body.includes('tools/call'));
    const callB = hits.B.filter((h) => h.method === 'POST' && h.url === '/mcp' && h.body.includes('tools/call'));
    expect(callA).toHaveLength(1);
    expect(callB).toHaveLength(1);
    expect(callB[0].idem).toMatch(/^[0-9a-f-]{36}$/);
    expect(callA[0].idem, 'one Idempotency-Key across both tries: the hub answers a repeat with 409, never runs it twice').toBe(callB[0].idem);
  });

  it('shim: a seized domain (200 text/html instead of MCP) counts as dead too', async () => {
    const file = join(tmp(), 'endpoints.json');
    writeFileSync(file, JSON.stringify({ doc, trusted_next: [] }));
    mode.A = 'parked';
    const { msgs } = await shim([{ jsonrpc: '2.0', id: 5, method: 'tools/list' }], { list: { file, keys: [k.pub], bootstrap: [] } });
    expect(msgs).toEqual([{ jsonrpc: '2.0', id: 5, result: { served_by: 'B' } }]);
    mode.A = 'down';
  });

  it('shim, fresh install (no cache) and the default address dead: fetches the list from a bootstrap address and moves', async () => {
    const file = join(tmp(), 'endpoints.json');
    const deadDefault = (u, o) => fetch(u === DEFAULT_URL ? 'http://127.0.0.1:9/mcp' : u, o);
    const { msgs } = await shim([{ jsonrpc: '2.0', id: 9, method: 'tools/list' }], {
      fetchImpl: deadDefault,
      list: { file, keys: [k.pub], bootstrap: [`http://127.0.0.1:${servers.B.address().port}`] },
    });
    expect(msgs).toEqual([{ jsonrpc: '2.0', id: 9, result: { served_by: 'B' } }]);
    expect(existsSync(file), 'the verified list was cached for the next start').toBe(true);
  });

  it('shim with a fixed address (--url / M0S_MCP_URL) never leaves it', async () => {
    hits.B.length = 0;
    const a = `http://127.0.0.1:${servers.A.address().port}/mcp`;
    const { msgs } = await shim([{ jsonrpc: '2.0', id: 3, method: 'tools/list' }], { url: a, list: { file: join(tmp(), 'e.json'), keys: [k.pub], bootstrap: [] } });
    expect(msgs[0]).toMatchObject({ id: 3, error: { data: { status: 502 } } });
    expect(hits.B).toEqual([]);
  });

  it('doctor and the installer read the verified list; M0S_ENDPOINTS=off keeps both on the default address', async () => {
    const file = join(tmp(), 'endpoints.json');
    const b = `http://127.0.0.1:${servers.B.address().port}`;
    const lines = [];
    const rows = await doctor({ url: `${b}/mcp`, env: {}, log: (l) => lines.push(l), list: { file, keys: [k.pub], bootstrap: [b] } });
    expect(rows.find((r) => r[0] === 'list')).toEqual(['list', 'ok', expect.stringMatching(/^signed address list v\d+ .* 2 MCP addresses, first http:\/\/127\.0\.0\.1:\d+\/mcp$/)]);
    const home = tmp();
    const pick = await chooseEndpoint({ env: { M0S_USER_HOME: home }, keys: [k.pub], bootstrap: [b] });
    expect(pick.url).toBe(mcpCandidates(pick.list)[0]);
    expect(pick.list.version).toBe(JSON.parse(doc.payload).version);
    expect(JSON.parse(readFileSync(join(home, '.m0s', 'endpoints.json'), 'utf8')).doc).toEqual(doc);
    expect((await chooseEndpoint({ env: { M0S_ENDPOINTS: 'off' } })).url).toBe(DEFAULT_URL);
  });
});

describe('installer and the signed list', () => {
  it('Claude Desktop: an address taken from the list is not pinned (the shim keeps following the list); --url is', () => {
    const home = tmp();
    const env = { M0S_USER_HOME: home, APPDATA: join(home, 'AppData', 'Roaming'), XDG_CONFIG_HOME: join(home, '.config'), PATH: '' };
    const fromList = install({ hosts: ['claude-desktop'], url: 'https://mcp.other.test/mcp', env, dryRun: true, fromList: true });
    expect(JSON.parse(fromList[0].detail).mcpServers.mosadd.env.M0S_MCP_URL).toBeUndefined();
    const fixed = install({ hosts: ['claude-desktop'], url: 'https://mcp.other.test/mcp', env, dryRun: true });
    expect(JSON.parse(fixed[0].detail).mcpServers.mosadd.env.M0S_MCP_URL).toBe('https://mcp.other.test/mcp');
  });
});
