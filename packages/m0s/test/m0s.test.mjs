import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, mkdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PassThrough } from 'node:stream';
import { spawnSync } from 'node:child_process';
import {
  HOSTS,
  DEFAULT_URL,
  mergeJson,
  upsertToml,
  upsertYaml,
  renderHost,
  install,
  runShim,
  parseSse,
  resolveUrl,
  doctor,
  parseArgs,
  mergeVscode,
  deepLink,
  redact,
  main,
  KEY_HIDDEN,
  VSCODE_INPUT,
} from '../m0s.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, '..');
const repo = join(pkg, '..', '..');
const tmp = () => mkdtempSync(join(tmpdir(), 'm0s-'));

// ---------------------------------------------------------------------------------------------
describe('host catalogue', () => {
  it('covers the hosts of the plan (SPEC-DYSTRYBUCJA section 1, VS Code included)', () => {
    expect(Object.keys(HOSTS).sort()).toEqual(
      ['claude-code', 'claude-desktop', 'codex', 'cursor', 'hermes', 'lovable', 'manus', 'openclaw', 'vscode', 'windsurf'].sort(),
    );
  });

  it('every host renders, points at the hub, and never carries a literal key', () => {
    for (const id of Object.keys(HOSTS)) {
      const text = renderHost(id);
      if (id !== 'claude-desktop') expect(text, id).toContain(DEFAULT_URL); // Claude Desktop reaches it through the shim
      expect(text, id).not.toMatch(/m0s_(lk|tk)_[0-9a-f]{8}/);
    }
  });

  it('uses each host documented variable syntax', () => {
    expect(renderHost('cursor')).toContain('"Authorization": "Bearer ${env:MOSADD_KEY}"');
    expect(renderHost('windsurf')).toContain('"serverUrl": "https://mcp.mosadd.dev/mcp"');
    expect(renderHost('windsurf')).toContain('Bearer ${env:MOSADD_KEY}');
    expect(renderHost('codex')).toBe('[mcp_servers.mosadd]\nurl = "https://mcp.mosadd.dev/mcp"\nbearer_token_env_var = "MOSADD_KEY"');
    expect(renderHost('hermes')).toContain('Authorization: "Bearer ${MOSADD_KEY}"');
    expect(JSON.parse(renderHost('openclaw')).mcp.servers.mosadd).toEqual({
      url: DEFAULT_URL,
      transport: 'streamable-http',
      headers: { Authorization: 'Bearer ${MOSADD_KEY}' },
    });
    expect(renderHost('claude-code')).toBe(
      "claude mcp add --transport http --scope user mosadd https://mcp.mosadd.dev/mcp --header 'Authorization: Bearer ${MOSADD_KEY}'",
    );
    const desk = JSON.parse(renderHost('claude-desktop')).mcpServers.mosadd;
    expect(desk.args[1]).toBe('mcp');
    expect(desk.env.MOSADD_KEY).toBe('<your m.0S key>');
    const vs = JSON.parse(renderHost('vscode'));
    expect(vs.servers.mosadd).toEqual({ type: 'http', url: DEFAULT_URL, headers: { Authorization: 'Bearer ${input:mosadd-key}' } });
    expect(vs.inputs).toEqual([VSCODE_INPUT]);
    expect(VSCODE_INPUT.password).toBe(true);
  });

  it('refuses plain http outside loopback', () => {
    expect(() => resolveUrl('http://mcp.mosadd.dev/mcp')).toThrow(/https/);
    expect(resolveUrl('http://127.0.0.1:9/mcp')).toBe('http://127.0.0.1:9/mcp');
    expect(resolveUrl()).toBe(DEFAULT_URL);
  });

  it('parses flags the installers pass through', () => {
    expect(parseArgs(['install', '--host', 'cursor,codex', '--dry-run'])).toMatchObject({ _: ['install'], hosts: ['cursor', 'codex'], dryRun: true });
    expect(parseArgs(['install', '--host=hermes']).hosts).toEqual(['hermes']);
  });
});

// ---------------------------------------------------------------------------------------------
describe('mergeJson', () => {
  const entry = { url: 'u' };
  it('creates the document when the file is empty', () => {
    expect(JSON.parse(mergeJson('', ['mcpServers', 'mosadd'], entry))).toEqual({ mcpServers: { mosadd: entry } });
  });
  it('keeps every other key and server, replaces only ours', () => {
    const before = JSON.stringify({ theme: 'dark', mcpServers: { a: { command: 'x' }, mosadd: { url: 'old' } } });
    expect(JSON.parse(mergeJson(before, ['mcpServers', 'mosadd'], entry))).toEqual({ theme: 'dark', mcpServers: { a: { command: 'x' }, mosadd: entry } });
  });
  it('tolerates a UTF-8 BOM', () => {
    expect(JSON.parse(mergeJson(String.fromCharCode(0xfeff) + '{}', ['a'], 1))).toEqual({ a: 1 });
  });
  it('refuses JSON it cannot read instead of overwriting it', () => {
    expect(() => mergeJson('{ // comment\n}', ['a'], 1)).toThrow(/left untouched/);
    expect(() => mergeJson('[]', ['a'], 1)).toThrow(/left untouched/);
    expect(() => mergeJson('{"mcpServers": []}', ['mcpServers', 'mosadd'], 1)).toThrow(/left untouched/);
  });
});

describe('upsertToml (Codex)', () => {
  const entry = { url: DEFAULT_URL, bearer_token_env_var: 'MOSADD_KEY' };
  it('appends to a config that has no entry', () => {
    const out = upsertToml('model = "gpt-5"\n', 'mosadd', entry);
    expect(out).toBe('model = "gpt-5"\n\n[mcp_servers.mosadd]\nurl = "https://mcp.mosadd.dev/mcp"\nbearer_token_env_var = "MOSADD_KEY"\n');
  });
  it('replaces an old entry and its sub-tables, keeps the neighbours', () => {
    const before = [
      '[mcp_servers.other]',
      'command = "x"',
      '',
      '[mcp_servers.mosadd]',
      'command = "npx"',
      '',
      '[mcp_servers.mosadd.env]',
      'MOSADD_API_KEY = "old"',
      '',
      '[profiles.fast]',
      'model = "o4"',
    ].join('\n');
    const out = upsertToml(before, 'mosadd', entry);
    expect(out).not.toContain('npx');
    expect(out).not.toContain('MOSADD_API_KEY');
    expect(out).toContain('[mcp_servers.other]\ncommand = "x"');
    expect(out).toContain('[profiles.fast]\nmodel = "o4"');
    expect(out.match(/\[mcp_servers\.mosadd\]/g)).toHaveLength(1);
  });
  it('refuses an inline definition it would duplicate', () => {
    expect(() => upsertToml('[mcp_servers]\nmosadd = { url = "x" }\n', 'mosadd', entry)).toThrow(/by hand/);
    expect(() => upsertToml('mcp_servers.mosadd = { url = "x" }\n', 'mosadd', entry)).toThrow(/by hand/);
  });
});

describe('upsertYaml (Hermes)', () => {
  const entry = { url: DEFAULT_URL, headers: { Authorization: 'Bearer ${MOSADD_KEY}' } };
  const block = '  mosadd:\n    url: "https://mcp.mosadd.dev/mcp"\n    headers:\n      Authorization: "Bearer ${MOSADD_KEY}"';
  it('adds mcp_servers when missing', () => {
    expect(upsertYaml('model:\n  default: x\n', 'mosadd', entry)).toBe(`model:\n  default: x\n\nmcp_servers:\n${block}\n`);
  });
  it('fills an empty flow map', () => {
    expect(upsertYaml('mcp_servers: {}\nagent:\n  max_turns: 5\n', 'mosadd', entry)).toBe(`mcp_servers:\n${block}\nagent:\n  max_turns: 5\n`);
  });
  it('replaces an old entry, keeps other servers, comments and the blank line before the next key', () => {
    const before = 'mcp_servers:\n  # fleet\n  other:\n    command: "echo"\n  mosadd:\n    url: "https://old.example/mcp"\n\nagent:\n  max_turns: 5\n';
    const out = upsertYaml(before, 'mosadd', entry);
    expect(out).toBe(`mcp_servers:\n${block}\n  # fleet\n  other:\n    command: "echo"\n\nagent:\n  max_turns: 5\n`);
  });
  it('follows a four-space indent', () => {
    const out = upsertYaml('mcp_servers:\n    other:\n        command: "x"\n', 'mosadd', entry);
    expect(out).toContain('\n    mosadd:\n      url: "https://mcp.mosadd.dev/mcp"');
  });
  it('refuses flow style it cannot edit safely', () => {
    expect(() => upsertYaml('mcp_servers: {other: {command: x}}\n', 'mosadd', entry)).toThrow(/by hand/);
  });
});

// ---------------------------------------------------------------------------------------------
describe('install (files)', () => {
  it('writes every file-based host into a fake home, keeps what was there, backs it up', () => {
    const home = tmp();
    const env = {
      M0S_USER_HOME: home,
      APPDATA: join(home, 'AppData', 'Roaming'),
      LOCALAPPDATA: join(home, 'AppData', 'Local'),
      XDG_CONFIG_HOME: join(home, '.config'),
      CODEX_HOME: join(home, '.codex'),
      HERMES_HOME: join(home, 'hermes'),
      OPENCLAW_STATE_DIR: join(home, '.openclaw'),
      MOSADD_KEY: 'm0s_tk_test_' + 'ab'.repeat(32),
      PATH: '',
    };
    mkdirSync(join(home, '.cursor'), { recursive: true });
    writeFileSync(join(home, '.cursor', 'mcp.json'), JSON.stringify({ mcpServers: { keep: { url: 'https://x' } } }));
    const rows = install({ hosts: ['claude-desktop', 'codex', 'cursor', 'windsurf', 'hermes', 'openclaw', 'lovable', 'manus'], env });
    const byHost = Object.fromEntries(rows.map((r) => [r.host, r]));
    for (const id of ['claude-desktop', 'codex', 'cursor', 'windsurf', 'hermes', 'openclaw']) expect(byHost[id]?.status, id).toBe('written');
    expect(byHost.lovable.status).toBe('manual');
    expect(byHost.manus.status).toBe('manual');

    const cursor = JSON.parse(readFileSync(join(home, '.cursor', 'mcp.json'), 'utf8'));
    expect(cursor.mcpServers.keep).toEqual({ url: 'https://x' });
    expect(cursor.mcpServers.mosadd.headers.Authorization).toBe('Bearer ${env:MOSADD_KEY}');
    expect(byHost.cursor.backup && existsSync(byHost.cursor.backup)).toBe(true);

    // Only Claude Desktop stores the key (its env block); every other file references the variable.
    const desk = JSON.parse(readFileSync(byHost['claude-desktop'].file, 'utf8')).mcpServers.mosadd;
    expect(desk.env.MOSADD_KEY).toBe(env.MOSADD_KEY);
    expect(existsSync(desk.args[0])).toBe(true); // shim copied to ~/.m0s
    for (const id of ['codex', 'cursor', 'windsurf', 'hermes', 'openclaw']) {
      expect(readFileSync(byHost[id].file, 'utf8'), id).not.toContain(env.MOSADD_KEY);
    }
    expect(readFileSync(join(home, '.codex', 'config.toml'), 'utf8')).toContain('bearer_token_env_var = "MOSADD_KEY"');
    expect(readFileSync(join(home, 'hermes', 'config.yaml'), 'utf8')).toContain('Authorization: "Bearer ${MOSADD_KEY}"');
    expect(JSON.parse(readFileSync(join(home, '.openclaw', 'openclaw.json'), 'utf8')).mcp.servers.mosadd.transport).toBe('streamable-http');
  });

  it('leaves a config it cannot parse byte-for-byte untouched and says so', () => {
    const home = tmp();
    const file = join(home, '.cursor', 'mcp.json');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, '{ // my notes\n "mcpServers": {} }');
    const [row] = install({ hosts: ['cursor'], env: { M0S_USER_HOME: home, PATH: '' } });
    expect(row.status).toBe('error');
    expect(row.detail).toMatch(/Paste by hand/);
    expect(readFileSync(file, 'utf8')).toBe('{ // my notes\n "mcpServers": {} }');
  });

  it('reports a replaced entry and what it pointed at (no silent takeover of an older mosadd entry)', () => {
    const home = tmp();
    const file = join(home, '.cursor', 'mcp.json');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify({ mcpServers: { mosadd: { command: 'npx', args: ['-y', '@mosadd/mcp@3.0.0-alpha.47'] } } }));
    const [row] = install({ hosts: ['cursor'], env: { M0S_USER_HOME: home, PATH: '' } });
    expect(row.status).toBe('written');
    expect(row.detail).toContain('Replaced the existing "mosadd" entry (local command npx -y @mosadd/mcp@3.0.0-alpha.47)');
    expect(readFileSync(row.backup, 'utf8')).toContain('@mosadd/mcp@3.0.0-alpha.47');
  });

  it('VS Code: writes servers.mosadd and the password input, keeps the rest, stores no key', () => {
    const home = tmp();
    const env = { M0S_USER_HOME: home, APPDATA: join(home, 'AppData', 'Roaming'), XDG_CONFIG_HOME: join(home, '.config'), MOSADD_KEY: 'm0s_tk_test_' + 'cd'.repeat(32), PATH: '' };
    const file = HOSTS.vscode.files({ home, appData: env.APPDATA, xdg: env.XDG_CONFIG_HOME, plat: process.platform })[0];
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify({ servers: { other: { type: 'stdio', command: 'x' } }, inputs: [{ id: 'other-token', type: 'promptString' }, { id: 'mosadd-key', type: 'promptString', description: 'old' }] }));
    const [row] = install({ hosts: ['vscode'], env });
    expect(row.status).toBe('written');
    const doc = JSON.parse(readFileSync(file, 'utf8'));
    expect(doc.servers.other).toEqual({ type: 'stdio', command: 'x' });
    expect(doc.servers.mosadd.headers.Authorization).toBe('Bearer ${input:mosadd-key}');
    expect(doc.inputs.map((i) => i.id)).toEqual(['other-token', 'mosadd-key']); // replaced by id, not duplicated
    expect(doc.inputs[1]).toEqual(VSCODE_INPUT);
    expect(readFileSync(file, 'utf8')).not.toContain(env.MOSADD_KEY);
    expect(() => mergeVscode('{"inputs": {}}', 'mosadd', {})).toThrow(/inputs/);
  });

  it('dry run writes nothing', () => {
    const home = tmp();
    const rows = install({ hosts: ['cursor', 'codex'], env: { M0S_USER_HOME: home, CODEX_HOME: join(home, '.codex'), PATH: '' }, dryRun: true });
    expect(rows.every((r) => r.status === 'dry-run')).toBe(true);
    expect(readdirSync(home)).toEqual([]);
  });

  it('Claude Code goes through its own CLI (remove, then add with the variable reference)', () => {
    const home = tmp();
    const bin = join(home, 'bin');
    mkdirSync(bin);
    const exe = process.platform === 'win32' ? 'claude.exe' : 'claude';
    writeFileSync(join(bin, exe), '');
    const calls = [];
    const rows = install({
      hosts: ['claude-code'],
      env: { M0S_USER_HOME: home, PATH: bin, PATHEXT: '.EXE' },
      run: (b, args) => (calls.push(args), { ok: true, out: '' }),
    });
    expect(rows[0].status).toBe('written');
    expect(calls[0]).toEqual(['mcp', 'get', 'mosadd']);
    expect(calls[1]).toEqual(['mcp', 'remove', '--scope', 'user', 'mosadd']);
    expect(calls[2]).toEqual(['mcp', 'add', '--transport', 'http', '--scope', 'user', 'mosadd', DEFAULT_URL, '--header', 'Authorization: Bearer ${MOSADD_KEY}']);
    expect(rows[0].backup).toBeFalsy(); // nothing to save: `claude mcp get` printed nothing
  });

  it('Claude Code: an existing "mosadd" entry is saved before it is removed, and the report says so', () => {
    const home = tmp();
    const bin = join(home, 'bin');
    mkdirSync(bin);
    writeFileSync(join(bin, process.platform === 'win32' ? 'claude.exe' : 'claude'), '');
    const old = 'mosadd:\n  Type: stdio\n  Command: npx\n  Args: -y @mosadd/mcp@3.0.0-alpha.47';
    const calls = [];
    const [row] = install({
      hosts: ['claude-code'],
      env: { M0S_USER_HOME: home, M0S_HOME: join(home, '.m0s'), PATH: bin, PATHEXT: '.EXE' },
      run: (b, args) => (calls.push(args[1]), args[1] === 'get' ? { ok: true, out: old } : { ok: true, out: '' }),
    });
    expect(calls).toEqual(['get', 'remove', 'add']);
    expect(row.status).toBe('written');
    expect(row.backup).toMatch(/[\\/]\.m0s[\\/]backups[\\/]claude-code-mosadd-.*\.txt$/);
    expect(readFileSync(row.backup, 'utf8')).toContain('@mosadd/mcp@3.0.0-alpha.47');
    expect(row.detail).toMatch(/Replaced the existing "mosadd" entry/);
  });

  it('without the Claude Code CLI it prints the one command instead', () => {
    const [row] = install({ hosts: ['claude-code'], env: { M0S_USER_HOME: tmp(), PATH: '' } });
    expect(row.status).toBe('manual');
    expect(row.detail).toContain('claude mcp add --transport http');
  });
});

// ---------------------------------------------------------------------------------------------
describe('the key never reaches the terminal', () => {
  const secret = 'm0s_tk_test_' + 'SECRETSECRET'.repeat(4);
  const envFor = (home) => ({
    M0S_USER_HOME: home,
    APPDATA: join(home, 'AppData', 'Roaming'),
    LOCALAPPDATA: join(home, 'AppData', 'Local'),
    XDG_CONFIG_HOME: join(home, '.config'),
    CODEX_HOME: join(home, '.codex'),
    HERMES_HOME: join(home, 'hermes'),
    MOSADD_KEY: secret,
    PATH: '',
  });

  it('install --dry-run shows a placeholder where Claude Desktop would store the key', () => {
    const home = tmp();
    const rows = install({ hosts: ['claude-desktop', 'cursor', 'vscode', 'codex', 'hermes', 'claude-code'], env: envFor(home), dryRun: true });
    expect(JSON.stringify(rows)).not.toContain(secret);
    const desk = rows.find((r) => r.host === 'claude-desktop');
    expect(JSON.parse(desk.detail.split('\nReplaced')[0]).mcpServers.mosadd.env.MOSADD_KEY).toBe(KEY_HIDDEN);
    expect(readdirSync(home)).toEqual([]);
  });

  it('`m0s install --dry-run` (the CLI) prints no key, even with every host selected', async () => {
    const home = tmp();
    const saved = { ...process.env };
    const out = [];
    const orig = console.log;
    Object.assign(process.env, envFor(home));
    console.log = (...a) => out.push(a.join(' '));
    try {
      await main(['install', '--dry-run', '--host', Object.keys(HOSTS).join(',')]);
    } finally {
      console.log = orig;
      for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
      Object.assign(process.env, saved);
      process.exitCode = 0;
    }
    const text = out.join('\n');
    expect(text).toContain('[dry-run] Claude Desktop');
    expect(text).toContain(KEY_HIDDEN);
    expect(text).not.toContain(secret);
  });

  it('a real install stores the key only in the Claude Desktop file, and its report lines are redacted', () => {
    const home = tmp();
    const rows = install({ hosts: ['claude-desktop'], env: envFor(home) });
    expect(readFileSync(rows[0].file, 'utf8')).toContain(secret);
    expect(JSON.stringify(rows)).not.toContain(secret);
    expect(redact(`x ${secret} y`, secret)).toBe(`x ${KEY_HIDDEN} y`);
  });
});

// ---------------------------------------------------------------------------------------------
describe('one-click links (Cursor, VS Code) point at the remote endpoint', () => {
  it('Cursor: base64 config is the mcp.json entry, key by reference', () => {
    const link = deepLink('cursor');
    expect(link.startsWith('cursor://anysphere.cursor-deeplink/mcp/install?name=mosadd&config=')).toBe(true);
    const config = JSON.parse(Buffer.from(new URL(link).searchParams.get('config'), 'base64').toString('utf8'));
    expect(config).toEqual({ url: DEFAULT_URL, headers: { Authorization: 'Bearer ${env:MOSADD_KEY}' } });
  });

  it('VS Code: install redirect with the http config and the password input', () => {
    const q = new URL(deepLink('vscode')).searchParams;
    expect(q.get('name')).toBe('mosadd');
    expect(JSON.parse(q.get('config'))).toEqual({ type: 'http', url: DEFAULT_URL, headers: { Authorization: 'Bearer ${input:mosadd-key}' } });
    expect(JSON.parse(q.get('inputs'))).toEqual([VSCODE_INPUT]);
    expect(() => deepLink('codex')).toThrow(/cursor, vscode/);
  });

  it('README and docs/hosts.md carry exactly the generated links (no local npx link anywhere)', () => {
    for (const f of ['README.md', 'docs/hosts.md']) {
      const md = readFileSync(join(repo, f), 'utf8');
      expect(md, f).toContain(`](${deepLink('cursor')})`);
      expect(md, f).toContain(`](${deepLink('vscode')})`);
      for (const l of md.match(/cursor:\/\/[^)\s]+|vscode\.dev\/redirect\/mcp\/install[^)\s]+/g) || []) expect(l, f).not.toMatch(/npx/);
    }
  });
});

// ---------------------------------------------------------------------------------------------
describe('stdio shim', () => {
  let server;
  let url;
  const seen = [];
  beforeAll(async () => {
    server = createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        seen.push({ method: req.method, auth: req.headers.authorization, session: req.headers['mcp-session-id'], proto: req.headers['mcp-protocol-version'], body });
        if (req.method === 'DELETE') return res.writeHead(204).end();
        const msg = JSON.parse(body);
        if (!('id' in msg)) return res.writeHead(202).end();
        if (msg.method === 'initialize') {
          res.writeHead(200, { 'content-type': 'application/json', 'mcp-session-id': 'sess-1' });
          return res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: '2025-06-18', capabilities: {}, serverInfo: { name: 'hub', version: 't' } } }));
        }
        if (msg.method === 'tools/list') {
          res.writeHead(200, { 'content-type': 'text/event-stream' });
          return res.end(`event: message\ndata: ${JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { tools: [{ name: 'a' }, { name: 'b' }] } })}\n\n`);
        }
        if (msg.method === 'tools/call' && !req.headers.authorization) {
          res.writeHead(401, { 'content-type': 'application/json' });
          return res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, error: { code: -32001, message: 'Unauthorized' } }));
        }
        res.writeHead(502, { 'content-type': 'text/html' });
        res.end('<html>bad gateway</html>');
      });
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    url = `http://127.0.0.1:${server.address().port}/mcp`;
  });
  afterAll(() => server.close());

  async function drive(lines, opts) {
    const input = new PassThrough();
    const output = new PassThrough();
    const errors = new PassThrough();
    let out = '';
    let err = '';
    output.on('data', (c) => (out += c));
    errors.on('data', (c) => (err += c));
    const done = runShim({ url, input, output, errors, ...opts });
    for (const l of lines) input.write(JSON.stringify(l) + '\n');
    input.end();
    await done;
    return { msgs: out.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)), err };
  }

  it('forwards initialize, carries the session and the key, unwraps SSE, stays quiet on notifications', async () => {
    seen.length = 0;
    const { msgs } = await drive(
      [
        { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '0' } } },
        { jsonrpc: '2.0', method: 'notifications/initialized' },
        { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      ],
      { key: 'm0s_tk_test_k' },
    );
    expect(msgs.map((m) => m.id)).toEqual([1, 2]);
    expect(msgs[1].result.tools).toHaveLength(2);
    const posts = seen.filter((s) => s.method === 'POST');
    expect(posts.every((s) => s.auth === 'Bearer m0s_tk_test_k')).toBe(true);
    expect(posts.slice(1).every((s) => s.session === 'sess-1' && s.proto === '2025-06-18')).toBe(true);
    expect(seen.at(-1)).toMatchObject({ method: 'DELETE', session: 'sess-1' });
  });

  it('passes the hub JSON-RPC 401 through and warns once on stderr when no key is set', async () => {
    const { msgs, err } = await drive([{ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'x', arguments: {} } }], { key: '' });
    expect(msgs).toEqual([{ jsonrpc: '2.0', id: 7, error: { code: -32001, message: 'Unauthorized' } }]);
    expect(err).toMatch(/MOSADD_KEY is not set/);
  });

  it('turns a non-JSON-RPC HTTP error into a JSON-RPC error with the same id', async () => {
    const { msgs } = await drive([{ jsonrpc: '2.0', id: 'x', method: 'tools/call', params: { name: 'x' } }], { key: 'k' });
    expect(msgs[0]).toMatchObject({ id: 'x', error: { code: -32000, data: { status: 502 } } });
  });

  it('answers with a JSON-RPC error when the hub is unreachable', async () => {
    const { msgs } = await drive([{ jsonrpc: '2.0', id: 3, method: 'tools/list' }], { key: 'k', url: 'http://127.0.0.1:9/mcp' });
    expect(msgs[0]).toMatchObject({ id: 3, error: { code: -32000 } });
    expect(msgs[0].error.message).toMatch(/unreachable/);
  });

  it('answers a malformed stdin line with a parse error', async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    let out = '';
    output.on('data', (c) => (out += c));
    const done = runShim({ url, input, output, errors: new PassThrough(), key: 'k' });
    input.end('not json\n');
    await done;
    expect(JSON.parse(out)).toMatchObject({ id: null, error: { code: -32700 } });
  });

  it('parseSse joins multi-line data and ignores comments', () => {
    expect(parseSse(': ping\n\nevent: message\ndata: {"a":\ndata: 1}\n\n')).toEqual(['{"a":\n1}']);
  });

  it('doctor reports the hub and never prints the key', async () => {
    const lines = [];
    // M0S_ENDPOINTS=off: no live address list here (test/endpoints.test.mjs covers the list row with local servers)
    const rows = await doctor({ url, env: { MOSADD_KEY: 'm0s_tk_test_' + 'cd'.repeat(32), M0S_ENDPOINTS: 'off' }, log: (l) => lines.push(l) });
    expect(rows.map((r) => r[1])).toEqual(['ok', 'ok', 'ok']);
    expect(lines.join('\n')).not.toContain('cdcd');
  });
});

// ---------------------------------------------------------------------------------------------
describe('one-line installers', () => {
  it('install.sh and install.ps1 carry exactly the current m0s.mjs', async () => {
    const { buildInstallers, extractEmbedded } = await import('../../../scripts/build-installers.mjs');
    const { sh, ps1, js } = buildInstallers();
    const onDiskSh = readFileSync(join(repo, 'install', 'install.sh'), 'utf8').replace(/\r\n/g, '\n');
    const onDiskPs1 = readFileSync(join(repo, 'install', 'install.ps1'), 'utf8').replace(/\r\n/g, '\n');
    expect(onDiskSh, 'run: node scripts/build-installers.mjs').toBe(sh);
    expect(onDiskPs1, 'run: node scripts/build-installers.mjs').toBe(ps1);
    expect(extractEmbedded(onDiskSh, 'sh')).toBe(js);
    expect(extractEmbedded(onDiskPs1, 'ps1')).toBe(js);
  });

  it('one version: m0s.mjs VERSION, package.json and the README npx line agree', async () => {
    const { VERSION } = await import('../m0s.mjs');
    expect(JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')).version).toBe(VERSION);
    const pins = readFileSync(join(pkg, 'README.md'), 'utf8').match(/@mosadd\/m0s@(\d+\.\d+\.\d+)/g) || [];
    for (const p of pins) expect(p).toBe(`@mosadd/m0s@${VERSION}`);
  });

  it('m0s.mjs stays ASCII-only (it is embedded in sh and PowerShell)', () => {
    expect(readFileSync(join(pkg, 'm0s.mjs'), 'utf8')).not.toMatch(/[^\x00-\x7f]/);
  });

  const sh = spawnSync('sh', ['-c', 'echo ok'], { encoding: 'utf8' });
  it.skipIf(sh.status !== 0)('install.sh runs end to end under sh (dry run, fake home)', () => {
    const home = tmp();
    const r = spawnSync('sh', [join(repo, 'install', 'install.sh').replace(/\\/g, '/'), '--host', 'cursor,codex', '--dry-run'], {
      encoding: 'utf8',
      env: { ...process.env, HOME: home, M0S_HOME: join(home, '.m0s'), M0S_USER_HOME: home, CODEX_HOME: join(home, '.codex') },
    });
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain('[dry-run] Cursor');
    expect(r.stdout).toContain('[dry-run] Codex');
    expect(readFileSync(join(home, '.m0s', 'm0s.mjs'), 'utf8')).toBe(readFileSync(join(pkg, 'm0s.mjs'), 'utf8').replace(/\r\n/g, '\n'));
  });

  const ps = process.platform === 'win32' ? spawnSync('powershell', ['-NoProfile', '-Command', 'echo ok'], { encoding: 'utf8' }) : { status: 1 };
  it.skipIf(ps.status !== 0)('install.ps1 runs end to end under Windows PowerShell (dry run, fake home)', () => {
    const home = tmp();
    const script = join(repo, 'install', 'install.ps1');
    const r = spawnSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `& ([scriptblock]::Create((Get-Content -Raw '${script}'))) --host cursor --dry-run`],
      { encoding: 'utf8', env: { ...process.env, M0S_HOME: join(home, '.m0s'), M0S_USER_HOME: home } },
    );
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain('[dry-run] Cursor');
    expect(existsSync(join(home, '.m0s', 'm0s.mjs'))).toBe(true);
  });

  it.skipIf(ps.status !== 0)('install.ps1 keeps an unquoted --host a,b as one list (PowerShell makes it an array)', () => {
    const home = tmp();
    const script = join(repo, 'install', 'install.ps1');
    const r = spawnSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `& ([scriptblock]::Create((Get-Content -Raw '${script}'))) --host cursor,codex,vscode --dry-run`],
      { encoding: 'utf8', env: { ...process.env, M0S_HOME: join(home, '.m0s'), M0S_USER_HOME: home, CODEX_HOME: join(home, '.codex'), APPDATA: join(home, 'AppData', 'Roaming') } },
    );
    expect(r.status, r.stderr).toBe(0);
    for (const t of ['[dry-run] Cursor', '[dry-run] Codex', '[dry-run] VS Code']) expect(r.stdout, t).toContain(t);
  });

  it.skipIf(ps.status !== 0)('install.ps1 stops on Node.js older than 18 (like install.sh) and writes nothing', () => {
    const home = tmp();
    const fake = join(home, 'oldnode');
    mkdirSync(fake);
    writeFileSync(join(fake, 'node.cmd'), '@echo 16\r\n');
    const script = join(repo, 'install', 'install.ps1');
    const r = spawnSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `& ([scriptblock]::Create((Get-Content -Raw '${script}'))) --host cursor --dry-run`],
      { encoding: 'utf8', env: { ...process.env, PATH: `${fake};${process.env.PATH}`, M0S_HOME: join(home, '.m0s'), M0S_USER_HOME: home } },
    );
    expect(r.stdout + r.stderr).toContain('Node.js >= 18 is required');
    expect(existsSync(join(home, '.m0s'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------
describe('repository truth gates', () => {
  it('check-skill-lint passes (skills in agentskills format, one version, honesty lint)', () => {
    const r = spawnSync(process.execPath, [join(repo, 'scripts', 'check-skill-lint.mjs')], { encoding: 'utf8' });
    expect(r.status, r.stderr || r.stdout).toBe(0);
  });

  it('install links are pinned to a commit, never to a branch', () => {
    const texts = ['README.md', 'docs/hosts.md'].map((f) => readFileSync(join(repo, f), 'utf8')).join('\n');
    const links = texts.match(/raw\.githubusercontent\.com\/Hei33enberg\/mosADD-OS\/[^/\s]+\/install\//g) || [];
    for (const l of links) expect(l, l).toMatch(/\/([0-9a-f]{40}|<commit>)\/install\/$/);
  });

  it('PRICING.md is generated from GET /v1/pricing, never hand-typed', async () => {
    const { renderPricing, usd, PRICES_URL } = await import('../../../scripts/render-pricing.mjs');
    expect(PRICES_URL).toBe('https://api.mosadd.dev/v1/pricing'); // /v1/prices answers 404 (measured 2026-09-29)
    const fixture = JSON.parse(readFileSync(join(here, 'fixtures', 'pricing-2026-09-29.json'), 'utf8')); // the live answer that day
    const md = renderPricing({ ok: true, status: 200, body: fixture }, '2026-09-29');
    expect(md).toContain('| MCP tool call | 0.0001 USD per call | Every tools/call, reads included | `mcp.tool_call` |');
    expect(md).toContain('| Push-to-talk with transcription | 0.012 USD per minute |');
    expect(md).toContain('| Memory: query | 0.00005 USD per query |');
    // "soon" meters are listed apart from what is billed today
    const [billed, later] = md.split('## Priced, not billed yet');
    expect(billed).not.toContain('`madd.turn_pro`');
    expect(later).toContain('| mADD turn (pro model) | 0.03 USD per turn |');
    expect(md).toContain('at least 10 USD unlocks'); // from min_topup_usd, not typed in
    expect(usd(12000)).toBe('0.012 USD');
    expect(usd(1000000)).toBe('1 USD');
    expect(() => usd(1.5)).toThrow();
    expect(() => renderPricing({ ok: true, status: 200, body: { prices: [] } })).toThrow(/items/);
    expect(renderPricing({ ok: false, status: 404 }, '2026-09-29')).toContain('answered HTTP 404 on 2026-09-29');
    // PRICING.md on disk is the generator's output for the 29.09 list (only the Source/date line may differ)
    const onDisk = readFileSync(join(repo, 'PRICING.md'), 'utf8').replace(/\r\n/g, '\n');
    expect(onDisk).toContain('GENERATED by scripts/render-pricing.mjs from https://api.mosadd.dev/v1/pricing');
    const undated = (t) => t.replace(/^Source: .*$/m, '');
    expect(undated(onDisk), 'PRICING.md is not the generator output - run: node scripts/render-pricing.mjs').toBe(undated(md));
  });
});

describe('honesty rules (scripts/honesty-rules.mjs)', () => {
  it('every rule fires on its own sample sentence (a rule that can never match is a dead guard)', async () => {
    const { BANNED, violations } = await import('../../../scripts/honesty-rules.mjs');
    expect(BANNED.length).toBeGreaterThan(30);
    for (const rule of BANNED) {
      expect(rule.sample, String(rule.re)).toBeTruthy();
      expect(violations(rule.sample, 'README.md').map((v) => v.rule), `${rule.re} did not flag its sample`).toContain(rule);
    }
  });

  it('flags the unpinned installs the 29.09 verifier found, passes the pinned ones', async () => {
    const { violations } = await import('../../../scripts/honesty-rules.mjs');
    for (const bad of ['npx -y @mosadd/mcp@alpha login', 'claude mcp add mosadd -- npx -y @mosadd/mcp@alpha', '"args": ["-y", "@mosadd/mcp@latest"]', '`npx @mosadd/mcp@alpha whoami`'])
      expect(violations(bad, 'packages/mcp/README.md'), bad).toHaveLength(1);
    expect(violations('npx -y @mosadd/mcp@3.0.0-alpha.55 login', 'packages/mcp/README.md')).toEqual([]);
    expect(violations('a clean `npm i @mosadd/mcp@alpha` resolved', 'packages/mcp/CHANGELOG.md')).toEqual([]); // history, not advice
  });

  it('a negation right before the phrase is not a claim; a negation elsewhere in the line does not excuse it', async () => {
    const { violations } = await import('../../../scripts/honesty-rules.mjs');
    expect(violations('No self-host. The client is MIT.')).toEqual([]);
    expect(violations('This is not a toy, and you can self-host it.')).toHaveLength(1);
    expect(violations('There is no community room yet.')).toEqual([]);
  });

  it('"the operator cannot read" passes only when the sentence is about people, never for agent traffic', async () => {
    const { violations } = await import('../../../scripts/honesty-rules.mjs');
    expect(violations('mDM 1:1 direct messages are end-to-end encrypted by default (operator cannot read content).')).toHaveLength(1);
    expect(violations('Messages are encrypted, so the service can never read them.')).toHaveLength(1);
    expect(violations('Between two people the operator cannot read the content.')).toEqual([]);
  });

  it('the older registry card packages/mcp/server.json makes no false claim and fits the 100-character rule', async () => {
    const { violations } = await import('../../../scripts/honesty-rules.mjs');
    const card = JSON.parse(readFileSync(join(repo, 'packages', 'mcp', 'server.json'), 'utf8'));
    expect(card.description.length).toBeLessThanOrEqual(100);
    expect(violations(card.description, 'packages/mcp/server.json'), card.description).toEqual([]);
    expect(card.description).not.toMatch(/end-to-end|E2EE/i);
  });

  it('gate scripts and public text carry no control characters (the byte that killed the dist-tag rule)', () => {
    const roots = ['scripts', 'install', 'distribution', 'skills', 'docs', 'packages/m0s', 'README.md', 'PRICING.md', 'packages/mcp/README.md'];
    const bad = [];
    const walk = (rel) => {
      const full = join(repo, rel);
      if (!existsSync(full)) return;
      if (statSync(full).isDirectory()) {
        for (const e of readdirSync(full)) if (e !== 'node_modules') walk(`${rel}/${e}`);
      } else if (/\.(mjs|js|ts|md|json|ya?ml|sh|ps1|txt)$/.test(rel) && /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(readFileSync(full, 'utf8'))) bad.push(rel);
    };
    roots.forEach(walk);
    expect(bad).toEqual([]);
  });

  it('.gitattributes checks every text file out with LF (a core.autocrlf=true clone made 3 tests red)', () => {
    const attrs = readFileSync(join(repo, '.gitattributes'), 'utf8');
    expect(attrs).toMatch(/^\* text=auto eol=lf$/m);
    expect(attrs).toMatch(/^skills\/mosadd-coordinate\/SKILL\.md -text$/m); // byte-identical contract with mosadd-agent
  });
});

describe('distribution entries (prepared, not submitted)', () => {
  const dist = (f) => readFileSync(join(repo, 'distribution', f), 'utf8');
  const mcpVersion = JSON.parse(readFileSync(join(repo, 'packages', 'mcp', 'package.json'), 'utf8')).version;

  it('server.json fits the official registry rules we can check offline', () => {
    const s = JSON.parse(dist('server.json'));
    expect(s.$schema).toBe('https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json');
    expect(s.name).toMatch(/^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/);
    expect(s.description.length).toBeLessThanOrEqual(100);
    expect(s.title.length).toBeLessThanOrEqual(100);
    expect(s.version).toBe(mcpVersion);
    expect(s.remotes).toEqual([
      expect.objectContaining({ type: 'streamable-http', url: DEFAULT_URL, headers: [expect.objectContaining({ name: 'Authorization', isRequired: true, isSecret: true })] }),
    ]);
    expect(JSON.stringify(s)).not.toMatch(/self-host|end-to-end/i);
  });

  it('smithery.yaml starts the shim that exists in this repo', () => {
    const y = dist('smithery/smithery.yaml');
    expect(y).toMatch(/type: stdio/);
    expect(y).toContain("args: ['packages/m0s/m0s.mjs', 'mcp']");
    expect(y).toContain('MOSADD_KEY: config.mosaddKey');
    expect(existsSync(join(repo, 'packages', 'm0s', 'm0s.mjs'))).toBe(true);
  });

  it('glama.json names the maintainer', () => {
    expect(JSON.parse(dist('glama/glama.json'))).toEqual({ $schema: 'https://glama.ai/mcp/schemas/server.json', maintainers: ['Hei33enberg'] });
  });

  it('the awesome-mcp-servers line has the list format', () => {
    expect(dist('awesome-mcp-servers.md')).toMatch(/^- \[Hei33enberg\/mosADD-OS\]\(https:\/\/github\.com\/Hei33enberg\/mosADD-OS\) 📇 ☁️ - m\.0S: .+$/m);
  });

  it('the ClawHub skill follows agentskills.io and gates on MOSADD_KEY', () => {
    const md = dist('clawhub/m0s/SKILL.md');
    const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1];
    const name = fm.match(/^name:\s*(\S+)\s*$/m)[1];
    expect(name).toBe('m0s');
    expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(fm.match(/^description:\s*(.+)$/m)[1].length).toBeLessThanOrEqual(1024);
    expect(fm).toMatch(/"requires": \{ "env": \["MOSADD_KEY"\] \}/);
    expect(md).toContain(DEFAULT_URL);
  });

  it('every skill directory satisfies the agentskills.io name rules', () => {
    const skills = join(repo, 'skills');
    for (const dir of readdirSync(skills).filter((d) => !d.startsWith('.') && existsSync(join(skills, d, 'SKILL.md')))) {
      const fm = readFileSync(join(skills, dir, 'SKILL.md'), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)[1];
      expect(fm.match(/^name:\s*(\S+)\s*$/m)[1], dir).toBe(dir);
    }
  });
});
