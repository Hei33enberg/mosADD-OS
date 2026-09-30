#!/usr/bin/env node
// The official MCP Registry (registry.modelcontextprotocol.io), spoken to directly: no mcp-publisher binary,
// no GitHub Actions, no browser. Domain proof by DNS (TXT at the apex) or HTTP (/.well-known/mcp-registry-auth).
//
//   node scripts/mcp-registry.mjs keygen --out <key.pem>
//        new Ed25519 private key (PKCS#8 PEM, written 0600, never printed); prints ONLY the proof record
//   node scripts/mcp-registry.mjs proof --key <key.pem>
//        the proof record for an existing key:  v=MCPv1; k=ed25519; p=<base64 of the raw 32-byte public key>
//   node scripts/mcp-registry.mjs check <server.json>
//        offline: required fields, 100-character description/title, honesty rules on description and title
//   node scripts/mcp-registry.mjs validate <server.json>
//        POST /v0/validate (no login)
//   node scripts/mcp-registry.mjs publish <server.json> --key <key.pem> --domain mosadd.com [--method dns|http]
//        login (POST /v0/auth/<method>) + POST /v0/publish; the registry token is held in memory only
//   node scripts/mcp-registry.mjs status <name> <version> <active|deprecated|deleted> --key <key.pem> --domain mosadd.com
//        [--method dns|http] [--message "..."]   PATCH /v0/servers/<name>/versions/<version>/status
//
// Protocol (read from modelcontextprotocol/registry v1.8.1: cmd/publisher/auth/common.go,
// internal/api/handlers/v0/auth/{common,dns}.go):
//   - message = the RFC3339 timestamp string (UTC, whole seconds), signed with Ed25519, signature sent as hex;
//   - the registry refuses a timestamp more than 15 s away from its own clock. This script never trusts the local
//     clock blindly: it reads the registry's Date header and signs the registry's time when the two differ by > 2 s
//     (the HP machine drifted 21 s on 2026-09-04 and the login was refused);
//   - DNS proof: TXT "v=MCPv1; k=ed25519; p=<base64>" at the APEX (not _mcp-auth.<domain>); a login for mosadd.com
//     may publish com.mosadd/* and com.mosadd.*/*.
import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const REGISTRY = process.env.MCP_REGISTRY_URL || 'https://registry.modelcontextprotocol.io';

/** RFC3339 in UTC with whole seconds, the exact shape mcp-publisher signs (time.RFC3339). */
export function rfc3339(ms) {
  return new Date(Math.floor(ms / 1000) * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Raw 32-byte Ed25519 public key (the registry base64-decodes p= and requires exactly 32 bytes). */
export function rawPublicKey(keyObject) {
  const jwk = createPublicKey(keyObject).export({ format: 'jwk' });
  if (jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519') throw new Error('not an Ed25519 key');
  return Buffer.from(jwk.x, 'base64url');
}

export function proofRecord(keyObject) {
  return `v=MCPv1; k=ed25519; p=${rawPublicKey(keyObject).toString('base64')}`;
}

/** Parses a proof record the way the registry does (MCPProofRecordPattern) into a public KeyObject. */
export function publicKeyFromProof(record) {
  const m = /v=MCPv1;\s*k=([^;]+);\s*p=([A-Za-z0-9+/=]+)/.exec(record);
  if (!m) throw new Error('not an MCPv1 proof record');
  if (m[1] !== 'ed25519') throw new Error(`unsupported algorithm ${m[1]}`);
  const raw = Buffer.from(m[2], 'base64');
  if (raw.length !== 32) throw new Error(`invalid Ed25519 public key size (${raw.length} bytes, expected 32)`);
  return createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: raw.toString('base64url') }, format: 'jwk' });
}

/** Hex Ed25519 signature of the timestamp string: the `signed_timestamp` field of /v0/auth/{dns,http}. */
export function signTimestamp(privateKey, timestamp) {
  return sign(null, Buffer.from(timestamp, 'utf8'), privateKey).toString('hex');
}

export function verifyTimestamp(publicKey, timestamp, signedHex) {
  return verify(null, Buffer.from(timestamp, 'utf8'), publicKey, Buffer.from(signedHex, 'hex'));
}

/** Offline manifest check. Returns a list of problems (empty = fine). */
export async function checkManifest(manifest) {
  const problems = [];
  for (const f of ['name', 'description', 'version']) if (!manifest[f]) problems.push(`missing ${f}`);
  if (manifest.description && manifest.description.length > 100)
    problems.push(`description is ${manifest.description.length} characters (registry maximum 100)`);
  if (manifest.title && manifest.title.length > 100) problems.push(`title is ${manifest.title.length} characters (registry maximum 100)`);
  if (manifest.version && /^(latest|alpha|beta|next)$/i.test(manifest.version)) problems.push(`version '${manifest.version}' is a tag, not a version`);
  const { violations } = await import('./honesty-rules.mjs');
  for (const field of ['title', 'description'])
    for (const { rule } of violations(String(manifest[field] ?? ''), 'server.json')) problems.push(`${field}: ${rule.why}`);
  return problems;
}

// ── network ─────────────────────────────────────────────────────────────────────────────────────────────────
async function registryTime() {
  const before = Date.now();
  const res = await fetch(`${REGISTRY}/v0/health`, { method: 'GET' });
  const after = Date.now();
  const date = res.headers.get('date');
  const server = date ? Date.parse(date) : NaN;
  const local = Math.round((before + after) / 2);
  if (!Number.isFinite(server)) return { ms: local, skewS: null };
  const skewS = (server - local) / 1000;
  // Date has 1-second resolution: within 2 s the local clock is trusted, beyond it the registry's clock is signed.
  return { ms: Math.abs(skewS) > 2 ? server + (Date.now() - after) : Date.now(), skewS };
}

async function login(keyPath, domain, method) {
  const key = createPrivateKey(readFileSync(keyPath));
  const { ms, skewS } = await registryTime();
  const timestamp = rfc3339(ms);
  console.log(`login ${method} ${domain} at ${timestamp} (local clock vs registry: ${skewS === null ? 'unmeasured' : skewS.toFixed(1) + ' s'})`);
  const res = await fetch(`${REGISTRY}/v0/auth/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ domain, timestamp, signed_timestamp: signTimestamp(key, timestamp) }),
  });
  const text = await res.text();
  if (res.status !== 200) throw new Error(`login refused: HTTP ${res.status} ${text.slice(0, 600)}`);
  const body = JSON.parse(text);
  if (!body.registry_token) throw new Error('login answered 200 without registry_token');
  console.log(`login ok (token expires ${body.expires_at ? new Date(body.expires_at * 1000).toISOString() : 'unknown'})`);
  return body.registry_token; // never printed
}

async function send(method, path, token, body) {
  const res = await fetch(`${REGISTRY}${path}`, {
    method,
    headers: { 'content-type': 'application/json', accept: 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, json, text };
}

// ── CLI ─────────────────────────────────────────────────────────────────────────────────────────────────────
function flag(args, name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
}

async function main(argv) {
  const [cmd, ...args] = argv;
  const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
  if (cmd === 'keygen') {
    const out = flag(args, 'out');
    if (!out) throw new Error('--out <key.pem> is required');
    if (existsSync(out)) throw new Error(`${out} exists; refusing to overwrite a key`);
    const { privateKey } = generateKeyPairSync('ed25519');
    writeFileSync(out, privateKey.export({ format: 'pem', type: 'pkcs8' }), { mode: 0o600, flag: 'wx' });
    console.log(proofRecord(privateKey));
    return 0;
  }
  if (cmd === 'proof') {
    console.log(proofRecord(createPrivateKey(readFileSync(flag(args, 'key')))));
    return 0;
  }
  if (cmd === 'check' || cmd === 'validate' || cmd === 'publish') {
    const file = positional[0];
    if (!file) throw new Error(`${cmd} <server.json>`);
    const manifest = JSON.parse(readFileSync(file, 'utf8'));
    const problems = await checkManifest(manifest);
    if (problems.length) {
      for (const p of problems) console.error(`✗ ${file}: ${p}`);
      return 1;
    }
    console.log(`✓ ${file}: ${manifest.name} ${manifest.version} (${manifest.description.length}/100) "${manifest.description}"`);
    if (cmd === 'check') return 0;
    const v = await send('POST', '/v0/validate', null, manifest);
    const valid = v.json?.valid ?? v.json?.Valid;
    console.log(`validate: HTTP ${v.status}${valid === undefined ? '' : ` valid=${valid}`}`);
    if (v.status !== 200 || valid === false) {
      console.error(v.text.slice(0, 1500));
      return 1;
    }
    if (cmd === 'validate') return 0;
    const token = await login(flag(args, 'key'), flag(args, 'domain'), flag(args, 'method', 'dns'));
    const p = await send('POST', '/v0/publish', token, manifest);
    if (p.status !== 200 && p.status !== 201) {
      console.error(`publish refused: HTTP ${p.status} ${p.text.slice(0, 1500)}`);
      return 1;
    }
    const meta = p.json?._meta?.['io.modelcontextprotocol.registry/official'] ?? {};
    console.log(`✓ published ${p.json?.server?.name} ${p.json?.server?.version} status=${meta.status} isLatest=${meta.isLatest} publishedAt=${meta.publishedAt}`);
    return 0;
  }
  if (cmd === 'status') {
    const [name, version, status] = positional;
    if (!name || !version || !['active', 'deprecated', 'deleted'].includes(status))
      throw new Error('status <name> <version> <active|deprecated|deleted> --key <pem> --domain <domain>');
    const token = await login(flag(args, 'key'), flag(args, 'domain'), flag(args, 'method', 'dns'));
    const message = flag(args, 'message');
    const r = await send('PATCH', `/v0/servers/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}/status`, token, {
      status,
      ...(message ? { statusMessage: message } : {}),
    });
    if (r.status !== 200) {
      console.error(`status refused: HTTP ${r.status} ${r.text.slice(0, 1000)}`);
      return 1;
    }
    const meta = r.json?._meta?.['io.modelcontextprotocol.registry/official'] ?? {};
    console.log(`✓ ${name} ${version}: status=${meta.status ?? status} statusChangedAt=${meta.statusChangedAt ?? '?'}`);
    return 0;
  }
  console.error('usage: node scripts/mcp-registry.mjs keygen|proof|check|validate|publish|status … (see the header of this file)');
  return 2;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      console.error(`✗ ${e.message}`);
      process.exit(1);
    },
  );
}
