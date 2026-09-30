// Sabotage of the address-list guards (a guard that never turns red guards nothing): break one rule in m0s.mjs,
// test/endpoints.test.mjs MUST fail, restore, and at the end the file must pass again.
//   node packages/m0s/test/sabotage-endpoints.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(PKG, 'm0s.mjs');
const BAK = SRC + '.sabotage-bak';

const SABOTAGES = [
  { id: 'K1', rule: 'bad envelope signature = rejected', find: "if (!signedBy(doc.payload, doc.signatures, [...c.online_keys, ...keys])) throw new EndpointsError('bad_signature');", replace: 'if (false) throw new Error();' },
  { id: 'K2', rule: 'expired list = rejected', find: "if (Date.parse(p.expires_at) <= now) throw new EndpointsError('expired');", replace: 'if (false) throw new Error();' },
  { id: 'K3', rule: 'the shim moves on when an address does not answer as the hub', find: 'if (!pinned && notTheHub(res)) {', replace: 'if (false) {' },
  { id: 'K4', rule: 'a lower version than the cached one is refused (rollback)', find: "if (floor && (list.version < floor.version || list.content_version < floor.content_version)) return { source, reason: 'rollback' };", replace: "if (false) return { source, reason: 'rollback' };" },
  { id: 'K5', rule: 'one Idempotency-Key across every try of a tools/call', find: 'const h = { ...headers, ', replace: "const h = { ...headers, 'idempotency-key': randomUUID(), " },
  { id: 'K6', rule: 'an address from the list is not pinned into Claude Desktop', find: 'url !== DEFAULT_URL && !ctx.fromList', replace: 'url !== DEFAULT_URL' },
  { id: 'K7', rule: 'the cached list is verified again on every load', find: 'const list = openEndpoints(j?.doc, trust);', replace: 'const list = JSON.parse(j.doc.payload);' },
  { id: 'K8', rule: 'content only with the ROOT signature (a node key cannot sign addresses)', find: "if (!signedBy(c.content, c.signatures, roots)) throw new EndpointsError('content_bad_signature');", replace: 'if (false) throw new Error();' },
  { id: 'K9', rule: 'addresses come from the root-signed content only, never from the envelope', find: 'endpoints: c.endpoints, // addresses come', replace: 'endpoints: (p.endpoints || []).map(cleanEntry).filter(Boolean), // addresses come' },
  { id: 'K10', rule: 'the envelope key must be one the root listed (online_keys)', find: "if (!signedBy(doc.payload, doc.signatures, [...c.online_keys, ...keys])) throw new EndpointsError('bad_signature');", replace: "if (!doc.signatures.some((s) => s && s.alg === 'ed25519')) throw new EndpointsError('bad_signature');" },
  { id: 'K11', rule: 'a version far ahead of issued_at is refused', find: 'if (version > Math.floor(iss / 1000) + BUCKET_S) throw new EndpointsError(`${prefix}version_ahead`);', replace: 'if (false) throw new Error();' },
  { id: 'K12', rule: 'pinned addresses are dialled at their IP (shim, refresh)', find: 'const ip = pinFor(url, listOf());', replace: 'const ip = null;' },
  { id: 'K13', rule: 'pinnedFetch really connects to the pinned IP (custom lookup)', find: 'lookup: (_host, opts, cb) => {', replace: 'lookupOff: (_host, opts, cb) => {' },
  { id: 'K14', rule: 'a URL-only host never gets a pinned (sslip.io) address', find: 'return mcpCandidates(list, null).filter((u) => u && !pinFor(u, list));', replace: 'return mcpCandidates(list, null).filter((u) => u);' },
  { id: 'K15', rule: 'the newest valid list across all places wins, not the first', find: 'for (const r of results) if (r.list && (!best || newer(r.list, best.list) > 0)) best = r;', replace: 'for (const r of results) if (r.list && !best) best = r;' },
  { id: 'K16', rule: 'older root content under a fresh envelope is a rollback', find: '(list.version < floor.version || list.content_version < floor.content_version)', replace: '(list.version < floor.version)' },
  { id: 'K17', rule: 'expired root content = rejected', find: "if (Date.parse(p.content_expires_at) <= now) throw new EndpointsError('content_expired');", replace: 'if (false) throw new Error();' },
  { id: 'K18', rule: 'a sslip.io name and an ip field that disagree = entry dropped', find: 'if (fromName && fromName !== ip) return undefined;', replace: 'if (false) return undefined;' },
];

const run = () =>
  spawnSync(process.execPath, [join(PKG, 'node_modules', 'vitest', 'vitest.mjs'), 'run', 'test/endpoints.test.mjs'], { cwd: PKG, encoding: 'utf8', timeout: 180_000 }).status ?? -1;

if (existsSync(BAK)) renameSync(BAK, SRC);
process.on('exit', () => existsSync(BAK) && renameSync(BAK, SRC));
const rows = [];
let blind = 0;
for (const s of SABOTAGES) {
  const src = readFileSync(SRC, 'utf8');
  const n = src.split(s.find).length - 1;
  if (n !== 1) {
    rows.push(`| ${s.id} | ${s.rule} | ERROR: pattern found ${n} times |`);
    blind++;
    continue;
  }
  writeFileSync(BAK, src);
  writeFileSync(SRC, src.replace(s.find, s.replace));
  let code;
  try {
    code = run();
  } finally {
    renameSync(BAK, SRC);
  }
  const red = code > 0;
  if (!red) blind++;
  rows.push(`| ${s.id} | ${s.rule} | ${red ? 'RED (good)' : code < 0 ? 'TIMEOUT' : 'GREEN - BLIND GUARD'} |`);
  process.stdout.write(`${s.id} ${red ? 'RED' : 'GREEN!'} ${s.rule}\n`);
}
const after = run();
rows.push(`| - | restored: test/endpoints.test.mjs | ${after === 0 ? 'GREEN (good)' : 'RED'} |`);
process.stdout.write(`\n| sabotage | rule | result |\n|---|---|---|\n${rows.join('\n')}\n`);
process.exit(blind === 0 && after === 0 ? 0 : 1);
