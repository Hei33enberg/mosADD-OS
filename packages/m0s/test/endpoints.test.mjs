// The hub's signed address list (/.well-known/m0s-endpoints.json) as the client reads it: the ROOT key signs the content
// (which addresses exist, which online keys may vouch for freshness), an ONLINE key signs the envelope every minute; expiry,
// version floor, version bound to issued_at, root rotation, the newest list across places, IP pinning of direct addresses,
// and failover of the stdio shim between two local servers.
// Keys are generated per run; nothing secret lives in the repository. The hub side of the same format:
// Hei33enberg/m0s-hub apps/control/src/endpoints/list.ts (text = exact bytes, Ed25519, keyid = sha256(pub)[0..16]).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, request as realHttpRequest } from 'node:http';
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
  hostCandidates,
  listSources,
  chooseEndpoint,
  pinFor,
  pinnedFetch,
  runShim,
  doctor,
  install,
} from '../m0s.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'm0s-ep-'));
const DAY = 86400_000;

function keyPair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return { priv: privateKey, pub: Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url').toString('base64') };
}

const sigs = (text, signers) =>
  signers.map((k) => ({ keyid: endpointsKeyId(k.pub), alg: 'ed25519', sig: sign(null, Buffer.from(text, 'utf8'), k.priv).toString('base64') }));

/** Root-signed content, like infra/lenovo/endpoints-root.ts on the hub operator's machine. */
function sealContent({ endpoints, online, root, version, issued = Date.now() - 60_000, ttlMs = 180 * DAY, nextRoot = null }) {
  const text = JSON.stringify({
    type: 'm0s-endpoints-content',
    format: 1,
    version: version ?? Math.floor(issued / 1000),
    issued_at: new Date(issued).toISOString(),
    expires_at: new Date(issued + ttlMs).toISOString(),
    online_keys: online.map((k) => k.pub),
    next_root_pubkey: nextRoot,
    endpoints,
  });
  return { m0s_endpoints_content: 1, content: text, signatures: sigs(text, [root]) };
}

/** The envelope, like the hub's control signs it every minute with an online key. */
function envelope({ content, endpoints = [], version, issued = Date.now() - 60_000, ttlMs = 7 * DAY }, ...signers) {
  const text = JSON.stringify({
    type: 'm0s-endpoints',
    format: 1,
    version: version ?? Math.floor(issued / 1000),
    issued_at: new Date(issued).toISOString(),
    expires_at: new Date(issued + ttlMs).toISOString(),
    next_pubkey: null,
    endpoints,
    ...(content ? { content } : {}),
  });
  return { m0s_endpoints: 1, payload: text, signatures: sigs(text, signers) };
}

/** A complete list: content signed by `root` naming `online`, envelope signed by `online`. */
function chain({ root, online, endpoints, version, issued, ttlMs, cVersion, cIssued, cTtlMs, nextRoot }) {
  const content = sealContent({ endpoints, online: [online], root, version: cVersion, issued: cIssued, ttlMs: cTtlMs, nextRoot });
  return envelope({ content, endpoints, version, issued, ttlMs }, online);
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
  { url: 'https://1-2-3-4.sslip.io/mcp', service: 'mcp', family: 'direct', region: 'tlv', role: 'backup', weight: 50, ip: '1.2.3.4' },
  { url: 'https://5-6-7-8.sslip.io/', service: 'hub', family: 'direct', region: 'bom', role: 'backup', weight: 20 },
];

describe('signed address list: verification (root signs the content, an online key the envelope)', () => {
  const root = keyPair();
  const online = keyPair();
  const other = keyPair();

  it('a complete chain is accepted; addresses come out preferred first, direct ones with their IP', () => {
    const list = verifyEndpoints(chain({ root, online, endpoints: EP }), { keys: [root.pub] });
    expect(list.version).toBeGreaterThan(0);
    expect(list.content_version).toBeGreaterThan(0);
    expect(mcpCandidates(list)).toEqual(['https://mcp.hub.test/mcp', 'https://1-2-3-4.sslip.io/mcp']);
    expect(listSources(list)).toEqual([
      `https://mcp.hub.test${ENDPOINTS_PATH}`,
      `https://api.hub.test${ENDPOINTS_PATH}`,
      `https://1-2-3-4.sslip.io${ENDPOINTS_PATH}`,
      `https://5-6-7-8.sslip.io${ENDPOINTS_PATH}`,
    ]);
    expect(list.endpoints.find((e) => e.url.includes('5-6-7-8')).ip, 'IP read from the sslip.io name').toBe('5.6.7.8');
    expect(mcpCandidates(null)).toEqual([DEFAULT_URL]);
  });

  it('bad envelope signature = rejected: changed bytes, unlisted online key, zeroed signature, none, forged keyid', () => {
    const doc = chain({ root, online, endpoints: EP });
    const forged = { ...doc, payload: doc.payload.replace('"version":', '"version": ') };
    expect(reason(() => verifyEndpoints(forged, { keys: [root.pub] }))).toBe('bad_signature');
    const content = JSON.parse(doc.payload).content;
    expect(reason(() => verifyEndpoints(envelope({ content, endpoints: EP }, other), { keys: [root.pub] })), 'online key the root did not list').toBe('bad_signature');
    expect(reason(() => verifyEndpoints({ ...doc, signatures: [{ ...doc.signatures[0], sig: Buffer.alloc(64).toString('base64') }] }, { keys: [root.pub] }))).toBe('bad_signature');
    expect(reason(() => verifyEndpoints({ ...doc, signatures: [] }, { keys: [root.pub] }))).toBe('bad_signature');
    const byOther = envelope({ content, endpoints: EP }, other);
    byOther.signatures[0].keyid = endpointsKeyId(online.pub);
    expect(reason(() => verifyEndpoints(byOther, { keys: [root.pub] }))).toBe('bad_signature');
    expect(reason(() => verifyEndpoints({ payload: doc.payload }, { keys: [root.pub] }))).toBe('bad_document');
  });

  it('a taken-over hub node (online key, no root) cannot point the client anywhere', () => {
    const content = sealContent({ endpoints: EP, online: [online], root });
    const evil = [{ url: 'https://collector.test/mcp', service: 'mcp', family: 'A', region: 'tlv', role: 'primary', weight: 1000 }];
    // 1) its own address in the envelope next to the real content: ignored, addresses come from the content only
    const list = verifyEndpoints(envelope({ content, endpoints: evil }, online), { keys: [root.pub] });
    expect(mcpCandidates(list)).toEqual(['https://mcp.hub.test/mcp', 'https://1-2-3-4.sslip.io/mcp']);
    // 2) content signed with the online key instead of the root
    const fake = sealContent({ endpoints: evil, online: [online], root: online });
    expect(reason(() => verifyEndpoints(envelope({ content: fake, endpoints: evil }, online), { keys: [root.pub] }))).toBe('content_bad_signature');
    // 3) the real root signature over edited content
    const edited = { ...content, content: content.content.replace('https://mcp.hub.test/mcp', 'https://collector.test/mcp') };
    expect(edited.content).not.toBe(content.content);
    expect(reason(() => verifyEndpoints(envelope({ content: edited }, online), { keys: [root.pub] }))).toBe('content_bad_signature');
    // 4) an envelope without content is what a 0.3.0-era hub serves: not enough any more
    expect(reason(() => verifyEndpoints(envelope({ endpoints: EP }, online), { keys: [root.pub] }))).toBe('no_content');
    // 5) the root may sign the envelope itself (emergency: an online key to cut off)
    expect(reason(() => verifyEndpoints(envelope({ content }, root), { keys: [root.pub] }))).toBe('accepted');
  });

  it('expired or future envelope, expired or future content = rejected', () => {
    const at = (o) => reason(() => verifyEndpoints(chain({ root, online, endpoints: EP, ...o }), { keys: [root.pub] }));
    expect(at({ issued: Date.now() - 8 * DAY })).toBe('expired');
    expect(at({ issued: Date.now() + 3600_000 })).toBe('not_yet_valid');
    expect(at({ cIssued: Date.now() - 2 * DAY, cTtlMs: DAY })).toBe('content_expired');
    expect(at({ cIssued: Date.now() + 3600_000 })).toBe('content_not_yet_valid');
  });

  it('a version far ahead of its issued_at is refused (one bad list cannot lift the floor forever)', () => {
    const t = Date.now() - 60_000;
    const at = (o) => reason(() => verifyEndpoints(chain({ root, online, endpoints: EP, issued: t, cIssued: t, ...o }), { keys: [root.pub] }));
    expect(at({ version: Math.floor(t / 1000) + 60 })).toBe('accepted');
    expect(at({ version: 9_000_000_000 })).toBe('version_ahead');
    expect(at({ cVersion: 9_000_000_000 })).toBe('content_version_ahead');
  });

  it('a signed list still cannot send a key over plain http (outside loopback), nor to a name whose IP it contradicts', () => {
    const list = verifyEndpoints(
      chain({
        root,
        online,
        endpoints: [
          ...EP,
          { url: 'http://plain.test/mcp', service: 'mcp', role: 'primary', weight: 1000 },
          { url: 'https://9-9-9-9.sslip.io/mcp', service: 'mcp', role: 'backup', weight: 1, ip: '6.6.6.6' },
          { url: 'https://node.hub.test/mcp', service: 'mcp', role: 'backup', weight: 1, ip: 'not-an-ip' },
        ],
      }),
      { keys: [root.pub] },
    );
    expect(mcpCandidates(list)).toEqual(['https://mcp.hub.test/mcp', 'https://1-2-3-4.sslip.io/mcp']);
  });

  it('the shipped client pins exactly one real root key (32 bytes), the offline root, not the online key', () => {
    expect(ENDPOINTS_KEYS).toHaveLength(1);
    expect(Buffer.from(ENDPOINTS_KEYS[0], 'base64')).toHaveLength(32);
    expect(Buffer.from(ENDPOINTS_KEYS[0], 'base64').toString('base64')).toBe(ENDPOINTS_KEYS[0]);
    expect(endpointsKeyId(ENDPOINTS_KEYS[0])).toBe('7324bf836b133f80');
    expect(ENDPOINTS_KEYS, 'the online key of the hub nodes is not trusted on its own').not.toContain('RMLD4cVfMGHmvfC+14gljv7w1ELdVHHvornvUNT88FE=');
  });
});

describe('pinned IP: direct addresses are dialled at the IP the signed list names, not at what DNS answers', () => {
  it('pinFor: the ip of a list entry on the same host, else the IP of a sslip.io / nip.io name, else none', () => {
    const list = { endpoints: [{ url: 'https://node.hub.test/mcp', service: 'mcp', ip: '2a05:f480::1' }] };
    expect(pinFor('https://node.hub.test/.well-known/x', list)).toBe('2a05:f480::1');
    expect(pinFor('https://64-177-66-61.sslip.io/mcp', null)).toBe('64.177.66.61');
    expect(pinFor('https://1-2-3-4.nip.io/', null)).toBe('1.2.3.4');
    expect(pinFor('https://mcp.mosadd.dev/mcp', list)).toBeNull();
  });

  it('pinnedFetch connects to the pinned IP while the URL (TLS name, Host) stays the same', async () => {
    let seen;
    const fake = (url, opts, cb) => {
      seen = { url: String(url), opts };
      const req = new PassThrough();
      req.end = () => {
        opts.lookup(url.hostname, { all: true }, (err, addrs) => {
          seen.all = addrs;
          opts.lookup(url.hostname, {}, (e2, address, family) => {
            seen.one = { address, family };
            const res = new PassThrough();
            res.statusCode = 200;
            res.headers = { 'content-type': 'application/json' };
            cb(res);
            res.end('{"ok":true}');
          });
        });
      };
      return req;
    };
    const r = await pinnedFetch('https://64-177-66-61.sslip.io/mcp', { method: 'POST', headers: { authorization: 'Bearer k' }, body: '{}' }, '64.177.66.61', { requestImpl: fake });
    expect(await r.json()).toEqual({ ok: true });
    expect(seen.url).toBe('https://64-177-66-61.sslip.io/mcp');
    expect(seen.all).toEqual([{ address: '64.177.66.61', family: 4 }]);
    expect(seen.one).toEqual({ address: '64.177.66.61', family: 4 });
    expect(seen.opts.headers['content-length']).toBe(2);
  });

  it('a real request to a name that cannot resolve (.invalid) reaches the pinned IP', async () => {
    const srv = createServer((req, res) => res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ host: req.headers.host })));
    await new Promise((r) => srv.listen(0, '127.0.0.1', r));
    try {
      const port = srv.address().port;
      const r = await pinnedFetch(`http://m0s-pin-test.invalid:${port}/`, {}, '127.0.0.1');
      expect(await r.json(), 'Host header = the name, not the IP').toEqual({ host: `m0s-pin-test.invalid:${port}` });
    } finally {
      srv.close();
    }
  });

  it('hosts that keep only a URL never get a pinned address; the shim (Claude Desktop) keeps them', async () => {
    const list = { endpoints: EP.map((e) => ({ ...e, ip: pinFor(e.url, null) || undefined })) };
    expect(hostCandidates(list)).toEqual(['https://mcp.hub.test/mcp']);
    const onlyDirect = { endpoints: EP.filter((e) => e.family === 'direct') };
    expect(hostCandidates(onlyDirect)).toEqual([]);
  });
});

// Two local "hubs": A = the primary that dies, B = the backup that keeps answering. Both can serve the list.
describe('signed address list: fetch, cache and shim failover (2 local servers)', () => {
  const root = keyPair();
  const online = keyPair();
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

  const base = (n) => `http://127.0.0.1:${servers[n].address().port}`;
  const endpointsAB = () => [
    { url: `${base('A')}/mcp`, service: 'mcp', family: 'A', region: 'tlv', role: 'primary', weight: 100 },
    { url: `${base('A')}/`, service: 'api', family: 'A', region: 'tlv', role: 'primary', weight: 100 },
    { url: `${base('B')}/mcp`, service: 'mcp', family: 'direct', region: 'bom', role: 'backup', weight: 20 },
    { url: `${base('B')}/`, service: 'hub', family: 'direct', region: 'bom', role: 'backup', weight: 20 },
  ];

  beforeAll(async () => {
    for (const name of ['A', 'B']) {
      servers[name] = hub(name);
      await new Promise((r) => servers[name].listen(0, '127.0.0.1', r));
    }
    listFor = (version = Math.floor(Date.now() / 1000) - 60, endpoints = endpointsAB()) =>
      chain({ root, online, endpoints, version, issued: version * 1000, cIssued: Date.now() - 3600_000 });
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

  it('refresh: every place is asked, the NEWEST valid list wins (a seized name replaying an old one loses); forged and expired copies are skipped', async () => {
    const forged = { ...doc, payload: doc.payload.replace('"backup"', '"primary"') };
    const expired = chain({ root, online, endpoints: EP, issued: Date.now() - 9 * DAY });
    const older = listFor(Math.floor(Date.now() / 1000) - 3600);
    const serve = (d) => async () => new Response(JSON.stringify(d), { status: 200, headers: { 'content-type': 'application/json' } });
    const routes = { 'https://forged.test/l': serve(forged), 'https://expired.test/l': serve(expired), 'https://seized.test/l': serve(older) };
    const fetchImpl = (u, o) => (routes[u] ? routes[u]() : fetch(u, o));
    const file = join(tmp(), 'endpoints.json');
    const b = `${base('B')}${ENDPOINTS_PATH}`;
    const r = await refreshEndpoints({ keys: [root.pub], file, sources: ['https://seized.test/l', 'https://forged.test/l', 'https://expired.test/l', b], bootstrap: [], fetchImpl });
    expect(r.tried.map((t) => t.reason)).toEqual(['bad_signature', 'expired']);
    expect(r.source, 'the newer list from B beats the older one served first by the seized name').toBe(b);
    expect(r.list.version).toBe(JSON.parse(doc.payload).version);
    expect(r.updated).toBe(true);
    expect(mcpCandidates(r.list)[1]).toMatch(/\/mcp$/);
    const cached = loadEndpointsCache(file, { keys: [root.pub] });
    expect(cached.list.version).toBe(r.list.version);
    expect(loadEndpointsCache(file, { keys: [keyPair().pub] }), 'the cache is re-verified on load').toBeNull();
  });

  it('refresh: a lower version than the cached one is a rollback and is refused; the cache stays', async () => {
    const file = join(tmp(), 'endpoints.json');
    const newer = listFor(Math.floor(Date.now() / 1000));
    writeFileSync(file, JSON.stringify({ doc: newer, trusted_next: [] }));
    const b = `${base('B')}${ENDPOINTS_PATH}`;
    const r = await refreshEndpoints({ keys: [root.pub], file, sources: [b], bootstrap: [] });
    expect(r.tried.some((t) => t.reason === 'rollback')).toBe(true);
    expect(r.source).toBe('cache');
    expect(r.list.version).toBe(JSON.parse(newer.payload).version);
  });

  it('refresh: older CONTENT under a fresh envelope is a rollback too (a node replaying yesterday\'s addresses)', async () => {
    const file = join(tmp(), 'endpoints.json');
    const t = Date.now() - 120_000;
    const fresh = chain({ root, online, endpoints: endpointsAB(), issued: t, cIssued: t });
    writeFileSync(file, JSON.stringify({ doc: fresh, trusted_next: [] }));
    const replay = chain({ root, online, endpoints: endpointsAB(), issued: Date.now() - 60_000, cIssued: t - DAY });
    const fetchImpl = (u, o) => (u === 'https://x.test/l' ? Promise.resolve(new Response(JSON.stringify(replay), { status: 200 })) : fetch(u, o));
    const r = await refreshEndpoints({ keys: [root.pub], file, sources: ['https://x.test/l'], bootstrap: [], fetchImpl });
    expect(r.tried.find((x) => x.source === 'https://x.test/l')).toEqual({ source: 'https://x.test/l', reason: 'rollback' });
    expect(r.source).toBe('cache');
  });

  it('root rotation: next_root_pubkey announced by trusted content is trusted afterwards, without a new client', async () => {
    const nextRoot = keyPair();
    const file = join(tmp(), 'endpoints.json');
    const t = Math.floor(Date.now() / 1000) - 600;
    const announce = chain({ root, online, endpoints: endpointsAB(), version: t, issued: t * 1000, cIssued: t * 1000, nextRoot: nextRoot.pub });
    const byNext = chain({ root: nextRoot, online, endpoints: endpointsAB(), version: t + 60, issued: (t + 60) * 1000, cIssued: (t + 60) * 1000 });
    // x.test serves the document under test; the cached list's own (local) names answer as usual
    const serve = (d) => (u, o) => (u === 'https://x.test/l' ? Promise.resolve(new Response(JSON.stringify(d), { status: 200 })) : fetch(u, o));
    let r = await refreshEndpoints({ keys: [root.pub], file, sources: ['https://x.test/l'], bootstrap: [], fetchImpl: serve(byNext) });
    expect(r.list, 'unknown root before the announcement').toBeNull();
    r = await refreshEndpoints({ keys: [root.pub], file, sources: ['https://x.test/l'], bootstrap: [], fetchImpl: serve(announce) });
    expect(r.list.version).toBe(t);
    r = await refreshEndpoints({ keys: [root.pub], file, sources: ['https://x.test/l'], bootstrap: [], fetchImpl: serve(byNext) });
    expect(r.list.version).toBe(t + 60);
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
      { list: { file, keys: [root.pub], bootstrap: [] } },
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

  it('shim: a backup with a pinned IP is dialled at that IP (not through plain fetch)', async () => {
    const file = join(tmp(), 'endpoints.json');
    const pb = servers.B.address().port;
    const eps = endpointsAB().map((e) => (e.url.includes(`:${pb}/`) ? { ...e, url: e.url.replace('127.0.0.1', 'localhost'), ip: '127.0.0.1' } : e));
    const saved = doc;
    doc = listFor(undefined, eps); // the background refresh gets the same pinned list back from B
    writeFileSync(file, JSON.stringify({ doc, trusted_next: [] }));
    mode.A = 'down';
    const dialled = [];
    const requestImpl = (url, opts, cb) => {
      dialled.push(String(url));
      return realHttpRequest(url, opts, cb);
    };
    const plain = [];
    const fetchImpl = (u, o) => (plain.push(u), fetch(u, o));
    try {
      const { msgs } = await shim([{ jsonrpc: '2.0', id: 7, method: 'tools/list' }], { fetchImpl, list: { file, keys: [root.pub], bootstrap: [], requestImpl } });
      expect(msgs).toEqual([{ jsonrpc: '2.0', id: 7, result: { served_by: 'B' } }]);
      expect(dialled.filter((u) => u.endsWith('/mcp'))).toEqual([`http://localhost:${pb}/mcp`]);
      expect(plain.some((u) => u.includes(`localhost:${pb}`)), 'the pinned backup never went through plain fetch').toBe(false);
    } finally {
      doc = saved;
    }
  });

  it('shim: a seized domain (200 text/html instead of MCP) counts as dead too', async () => {
    const file = join(tmp(), 'endpoints.json');
    writeFileSync(file, JSON.stringify({ doc, trusted_next: [] }));
    mode.A = 'parked';
    const { msgs } = await shim([{ jsonrpc: '2.0', id: 5, method: 'tools/list' }], { list: { file, keys: [root.pub], bootstrap: [] } });
    expect(msgs).toEqual([{ jsonrpc: '2.0', id: 5, result: { served_by: 'B' } }]);
    mode.A = 'down';
  });

  it('shim, fresh install (no cache) and the default address dead: fetches the list from a bootstrap address and moves', async () => {
    const file = join(tmp(), 'endpoints.json');
    const deadDefault = (u, o) => fetch(u === DEFAULT_URL ? 'http://127.0.0.1:9/mcp' : u, o);
    const { msgs } = await shim([{ jsonrpc: '2.0', id: 9, method: 'tools/list' }], {
      fetchImpl: deadDefault,
      list: { file, keys: [root.pub], bootstrap: [base('B')] },
    });
    expect(msgs).toEqual([{ jsonrpc: '2.0', id: 9, result: { served_by: 'B' } }]);
    expect(existsSync(file), 'the verified list was cached for the next start').toBe(true);
  });

  it('shim with a fixed address (--url / M0S_MCP_URL) never leaves it', async () => {
    hits.B.length = 0;
    const a = `${base('A')}/mcp`;
    const { msgs } = await shim([{ jsonrpc: '2.0', id: 3, method: 'tools/list' }], { url: a, list: { file: join(tmp(), 'e.json'), keys: [root.pub], bootstrap: [] } });
    expect(msgs[0]).toMatchObject({ id: 3, error: { data: { status: 502 } } });
    expect(hits.B).toEqual([]);
  });

  it('doctor and the installer read the verified list; M0S_ENDPOINTS=off keeps both on the default address', async () => {
    const file = join(tmp(), 'endpoints.json');
    const b = base('B');
    const lines = [];
    const rows = await doctor({ url: `${b}/mcp`, env: {}, log: (l) => lines.push(l), list: { file, keys: [root.pub], bootstrap: [b] } });
    expect(rows.find((r) => r[0] === 'list')).toEqual(['list', 'ok', expect.stringMatching(/^signed address list v\d+, content v\d+ .* 2 MCP addresses, first http:\/\/127\.0\.0\.1:\d+\/mcp$/)]);
    const home = tmp();
    const pick = await chooseEndpoint({ env: { M0S_USER_HOME: home }, keys: [root.pub], bootstrap: [b] });
    expect(pick.url).toBe(mcpCandidates(pick.list)[0]);
    expect(pick.pinnedOnly).toBe(false);
    expect(pick.list.version).toBe(JSON.parse(doc.payload).version);
    expect(JSON.parse(readFileSync(join(home, '.m0s', 'endpoints.json'), 'utf8')).doc).toEqual(doc);
    expect((await chooseEndpoint({ env: { M0S_ENDPOINTS: 'off' } })).url).toBe(DEFAULT_URL);
  });

  it('installer: when only pinned (direct) addresses are left, a URL-only host gets the default, never a sslip.io name', async () => {
    const t = Math.floor(Date.now() / 1000) - 60;
    const only = chain({
      root,
      online,
      version: t,
      issued: t * 1000,
      endpoints: [
        { url: 'https://1-2-3-4.sslip.io/mcp', service: 'mcp', family: 'direct', region: 'tlv', role: 'backup', weight: 50 },
        { url: `${base('B')}/`, service: 'hub', family: 'direct', region: 'bom', role: 'backup', weight: 20 },
      ],
    });
    const home = tmp();
    const pick = await chooseEndpoint({
      env: { M0S_USER_HOME: home },
      keys: [root.pub],
      bootstrap: [],
      sources: ['https://x.test/l'],
      fetchImpl: async () => new Response(JSON.stringify(only), { status: 200 }),
    });
    expect(pick.list).not.toBeNull();
    expect(pick.url).toBe(DEFAULT_URL);
    expect(pick.pinnedOnly).toBe(true);
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
