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
  { id: 'K1', rule: 'bad signature = rejected', find: "if (!signed) throw new EndpointsError('bad_signature');", replace: 'if (false) throw new Error();' },
  { id: 'K2', rule: 'expired list = rejected', find: "if (Date.parse(p.expires_at) <= now) throw new EndpointsError('expired');", replace: 'if (false) throw new Error();' },
  { id: 'K3', rule: 'the shim moves on when an address does not answer as the hub', find: 'if (!pinned && notTheHub(res)) {', replace: 'if (false) {' },
  { id: 'K4', rule: 'a lower version than the cached one is refused (rollback)', find: 'if (list.version < floor) {', replace: 'if (false) {' },
  { id: 'K5', rule: 'one Idempotency-Key across every try of a tools/call', find: 'const h = { ...headers, ', replace: "const h = { ...headers, 'idempotency-key': randomUUID(), " },
  { id: 'K6', rule: 'an address from the list is not pinned into Claude Desktop', find: 'url !== DEFAULT_URL && !ctx.fromList', replace: 'url !== DEFAULT_URL' },
  { id: 'K7', rule: 'the cached list is verified again on every load', find: 'const list = openEndpoints(j?.doc, trust);', replace: 'const list = JSON.parse(j.doc.payload);' },
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
