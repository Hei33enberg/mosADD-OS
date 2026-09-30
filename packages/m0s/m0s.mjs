// m0s - one key, every AI host. MIT License, zero dependencies, Node.js >= 18.
// Run it as `node m0s.mjs <command>` or through the npm bin (bin/m0s.mjs).
//
//   m0s install [--host a,b] [--url URL] [--dry-run]   write the m.0S MCP entry into your AI hosts
//   m0s print <host>                                   print one host's config, write nothing
//   m0s link <cursor|vscode>                           print the one-click install link for that editor
//   m0s mcp                                            stdio <-> Streamable HTTP shim (hosts that only run local servers)
//   m0s endpoints                                      fetch and verify the hub's signed address list
//   m0s doctor                                         check the hub and your MOSADD_KEY (the key is never printed)
//   m0s hosts                                          list supported hosts
//
// The key lives in the MOSADD_KEY environment variable. Hosts that can read a variable get a reference
// to it, never the key itself; the only exception is Claude Desktop, whose config file is the documented
// place for a local server's environment (the installer says so when it writes it). Nothing this file
// prints to the terminal carries the key: dry runs show a placeholder, every report line is redacted.
// This file is copied verbatim into install/install.sh and install/install.ps1 (scripts/build-installers.mjs).

import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, statSync, readdirSync } from 'node:fs';
import { homedir, platform as osPlatform } from 'node:os';
import { join, dirname, delimiter, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { createHash, createPublicKey, randomUUID, verify as verifySignature } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';

export const VERSION = '0.3.1';
export const DEFAULT_URL = 'https://mcp.mosadd.dev/mcp';
export const KEY_ENV = 'MOSADD_KEY';
export const SERVER_NAME = 'mosadd';
export const KEY_PAGE = 'https://app.mosadd.dev';
/** What a dry run and every report line show in place of the key. */
export const KEY_HIDDEN = '<value of MOSADD_KEY, hidden>';
/** VS Code keeps secrets out of mcp.json through an input: it asks once and stores the answer itself. */
export const VSCODE_INPUT = { type: 'promptString', id: 'mosadd-key', description: 'm.0S key: m0s_lk_live_... or m0s_tk_test_...', password: true };
const BOM = new RegExp('^' + String.fromCharCode(0xfeff));

// --- environment --------------------------------------------------------------------------------

/** Paths a host config lives under. Tests and unusual setups override them through env. */
export function envPaths(env = process.env, plat = osPlatform()) {
  const home = env.M0S_USER_HOME || homedir();
  const appData = env.APPDATA || join(home, 'AppData', 'Roaming');
  const localAppData = env.LOCALAPPDATA || join(home, 'AppData', 'Local');
  const xdg = env.XDG_CONFIG_HOME || join(home, '.config');
  return { home, appData, localAppData, xdg, plat, m0sHome: env.M0S_HOME || join(home, '.m0s') };
}

/** The MCP endpoint. Only https, except http on a loopback address (tests, local mirrors). */
export function resolveUrl(raw) {
  const url = new URL(raw || DEFAULT_URL);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) {
    throw new Error(`refusing ${url.protocol}// endpoint ${url.href}: m.0S keys travel only over https`);
  }
  return url.href;
}

// --- host catalogue -----------------------------------------------------------------------------

const bearer = (ref) => ({ Authorization: `Bearer ${ref}` });

/** The server entry each host expects. `shim` = the local stdio bridge this file provides. */
export const HOSTS = {
  'claude-code': {
    title: 'Claude Code',
    kind: 'cli',
    entry: (url) => ({ type: 'http', url, headers: bearer('${MOSADD_KEY}') }),
    command: (url) => ['claude', 'mcp', 'add', '--transport', 'http', '--scope', 'user', SERVER_NAME, url, '--header', 'Authorization: Bearer ${MOSADD_KEY}'],
    note: 'Claude Code expands ${MOSADD_KEY} from the environment when it starts; the key is not stored in ~/.claude.json.',
  },
  'claude-desktop': {
    title: 'Claude Desktop',
    kind: 'json',
    path: ['mcpServers', SERVER_NAME],
    files: (p) =>
      p.plat === 'win32'
        ? [join(p.appData, 'Claude', 'claude_desktop_config.json'), ...msixClaude(p)]
        : p.plat === 'darwin'
          ? [join(p.home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')]
          : [join(p.xdg, 'Claude', 'claude_desktop_config.json')],
    entry: (url, ctx) => ({
      command: ctx.node,
      args: [ctx.shim, 'mcp'],
      // an address taken from the signed list is not pinned: the shim keeps following the list (and failing over)
      env: { ...(ctx.key ? { [KEY_ENV]: ctx.key } : {}), ...(url !== DEFAULT_URL && !ctx.fromList ? { M0S_MCP_URL: url } : {}) },
    }),
    note: 'Claude Desktop runs local (stdio) servers from its config file, so m.0S goes through the m0s shim. Remote connectors in Settings need OAuth, which the hub does not offer yet.',
  },
  codex: {
    title: 'Codex',
    kind: 'toml',
    files: (p, env) => [join(env.CODEX_HOME || join(p.home, '.codex'), 'config.toml')],
    entry: (url) => ({ url, bearer_token_env_var: KEY_ENV }),
    note: 'Codex reads MOSADD_KEY from the environment on start (bearer_token_env_var).',
  },
  cursor: {
    title: 'Cursor',
    kind: 'json',
    path: ['mcpServers', SERVER_NAME],
    files: (p) => [join(p.home, '.cursor', 'mcp.json')],
    entry: (url) => ({ url, headers: bearer('${env:MOSADD_KEY}') }),
    note: 'Cursor fills ${env:MOSADD_KEY} itself when it reads mcp.json.',
  },
  vscode: {
    title: 'VS Code',
    kind: 'vscode',
    // The user-profile mcp.json ("MCP: Open User Configuration"), next to settings.json.
    files: (p) => [
      p.plat === 'win32'
        ? join(p.appData, 'Code', 'User', 'mcp.json')
        : p.plat === 'darwin'
          ? join(p.home, 'Library', 'Application Support', 'Code', 'User', 'mcp.json')
          : join(p.xdg, 'Code', 'User', 'mcp.json'),
    ],
    entry: (url) => ({ type: 'http', url, headers: bearer('${input:' + VSCODE_INPUT.id + '}') }),
    note: 'VS Code asks for the key once (password prompt) and keeps it in its own secret storage; mcp.json holds only ${input:mosadd-key}.',
  },
  windsurf: {
    title: 'Windsurf',
    kind: 'json',
    path: ['mcpServers', SERVER_NAME],
    files: (p) => {
      const classic = join(p.home, '.codeium', 'windsurf', 'mcp_config.json');
      const devin = p.plat === 'win32' ? join(p.appData, 'devin', 'mcp_config.json') : join(p.xdg, 'devin', 'mcp_config.json');
      const found = [classic, devin].filter((f) => existsSync(dirname(f)));
      return found.length ? found : [classic];
    },
    entry: (url) => ({ serverUrl: url, headers: bearer('${env:MOSADD_KEY}') }),
    note: 'Windsurf (and its successor, the Devin desktop app) fills ${env:MOSADD_KEY} in serverUrl/headers.',
  },
  hermes: {
    title: 'Hermes Agent',
    kind: 'yaml',
    files: (p, env) => [
      join(env.HERMES_HOME || (p.plat === 'win32' ? join(p.localAppData, 'hermes') : join(p.home, '.hermes')), 'config.yaml'),
    ],
    entry: (url) => ({ url, headers: bearer('${MOSADD_KEY}') }),
    note: 'Hermes resolves ${MOSADD_KEY} from its environment/secret scope; run `hermes mcp test mosadd` after.',
  },
  openclaw: {
    title: 'OpenClaw',
    kind: 'json',
    path: ['mcp', 'servers', SERVER_NAME],
    files: (p, env) => [env.OPENCLAW_CONFIG_PATH || join(env.OPENCLAW_STATE_DIR || join(p.home, '.openclaw'), 'openclaw.json')],
    entry: (url) => ({ url, transport: 'streamable-http', headers: bearer('${MOSADD_KEY}') }),
    note: 'OpenClaw substitutes ${MOSADD_KEY} in config strings; verify with `openclaw mcp doctor mosadd --probe`.',
  },
  lovable: {
    title: 'Lovable',
    kind: 'manual',
    steps: (url) => [
      'Open https://lovable.dev/dashboard?connectors -> "+" -> "MCP server".',
      'Server name: m.0S',
      `Server URL: ${url}`,
      'Authentication: "Bearer token or API key" -> paste your m.0S key (m0s_lk_live_... or m0s_tk_test_...).',
      'Click "Add server".',
    ],
  },
  manus: {
    title: 'Manus',
    kind: 'manual',
    steps: (url) => [
      'Settings -> Connectors -> "Add connectors" -> "Custom MCP" -> "Add custom MCP server" -> "Direct configuration".',
      'Transport type: HTTP',
      `Server URL: ${url}`,
      'Custom header: Authorization = Bearer <your m.0S key>',
      'Save, then ask Manus to call comms_capabilities.',
    ],
  },
};

function msixClaude(p) {
  // Claude Desktop from the Microsoft Store keeps its config inside the package's virtualised AppData.
  const pkgs = join(p.localAppData, 'Packages');
  if (!existsSync(pkgs)) return [];
  let names = [];
  try {
    names = readdirSync(pkgs).filter((n) => /^Claude_/.test(n));
  } catch {
    return [];
  }
  return names.map((n) => join(pkgs, n, 'LocalCache', 'Roaming', 'Claude', 'claude_desktop_config.json'));
}

// --- config writers (pure: text in -> text out) -------------------------------------------------

/** Merge `value` at `path` into a JSON document. Throws on anything that is not a JSON object. */
export function mergeJson(text, path, value) {
  const src = (text ?? '').replace(BOM, '');
  let doc = {};
  if (src.trim()) {
    try {
      doc = JSON.parse(src);
    } catch (e) {
      throw new Error(`not plain JSON (${e.message}); left untouched`);
    }
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) throw new Error('top level is not a JSON object; left untouched');
  }
  let node = doc;
  for (const k of path.slice(0, -1)) {
    if (node[k] === undefined) node[k] = {};
    if (!node[k] || typeof node[k] !== 'object' || Array.isArray(node[k])) throw new Error(`"${k}" is not an object; left untouched`);
    node = node[k];
  }
  node[path[path.length - 1]] = value;
  return JSON.stringify(doc, null, 2) + '\n';
}

/** VS Code mcp.json: servers.<name> plus the input that holds the key (replaced by id, never duplicated). */
export function mergeVscode(text, name, entry, input = VSCODE_INPUT) {
  const doc = JSON.parse(mergeJson(text, ['servers', name], entry));
  if (doc.inputs !== undefined && !Array.isArray(doc.inputs)) throw new Error('"inputs" is not an array; left untouched');
  doc.inputs = [...(doc.inputs || []).filter((i) => !(i && i.id === input.id)), input];
  return JSON.stringify(doc, null, 2) + '\n';
}

/** The server entry already stored under our name, if any (JSON-based hosts only). */
function previousEntry(text, path) {
  try {
    let node = JSON.parse((text || '').replace(BOM, ''));
    for (const k of path) node = node && typeof node === 'object' ? node[k] : undefined;
    return node;
  } catch {
    return undefined;
  }
}

const b64 = (s) => (typeof Buffer !== 'undefined' ? Buffer.from(s, 'utf8').toString('base64') : btoa(s));

/**
 * One-click install links for the remote endpoint (never a local npx): Cursor's deeplink carries the
 * base64 server entry, VS Code's install redirect carries the entry and the password input for the key.
 */
export function deepLink(host, url = DEFAULT_URL) {
  url = resolveUrl(url);
  if (host === 'cursor') return `cursor://anysphere.cursor-deeplink/mcp/install?name=${SERVER_NAME}&config=${b64(JSON.stringify(HOSTS.cursor.entry(url)))}`;
  if (host === 'vscode')
    return (
      `https://vscode.dev/redirect/mcp/install?name=${SERVER_NAME}` +
      `&inputs=${encodeURIComponent(JSON.stringify([VSCODE_INPUT]))}` +
      `&config=${encodeURIComponent(JSON.stringify(HOSTS.vscode.entry(url)))}`
    );
  throw new Error(`no install link for "${host}" - links exist for: cursor, vscode`);
}

/** Replace every occurrence of the key in a report string. */
export function redact(text, key) {
  return key && typeof text === 'string' ? text.split(key).join(KEY_HIDDEN) : text;
}

const tomlStr = (s) => JSON.stringify(String(s)); // TOML basic strings share JSON escaping for our values

/** Replace (or append) the [mcp_servers.<name>] table in a Codex config.toml. */
export function upsertToml(text, name, entry) {
  const lines = (text ?? '').replace(BOM, '').split(/\r?\n/);
  const header = new RegExp(`^\\s*\\[\\s*mcp_servers\\s*\\.\\s*(?:${name}|"${name}")\\s*(\\]|\\.)`);
  const anyTable = /^\s*\[/;
  const inTable = new RegExp(`^\\s*(?:${name}|"${name}")\\s*=`);
  const dotted = new RegExp(`^\\s*mcp_servers\\s*(?:\\.\\s*(?:${name}|"${name}")\\s*)?=`);
  const out = [];
  let skipping = false;
  let section = '';
  for (const line of lines) {
    if (anyTable.test(line)) {
      skipping = header.test(line);
      section = line.trim().replace(/\s+/g, '');
      if (skipping) continue;
    }
    if (skipping) continue;
    if ((section === '[mcp_servers]' && inTable.test(line)) || (section === '' && dotted.test(line))) {
      throw new Error(`inline mcp_servers definition found; edit it by hand`);
    }
    out.push(line);
  }
  while (out.length && out[out.length - 1].trim() === '') out.pop();
  const block = [`[mcp_servers.${name}]`, ...Object.entries(entry).map(([k, v]) => `${k} = ${tomlStr(v)}`)];
  return (out.length ? out.join('\n') + '\n\n' : '') + block.join('\n') + '\n';
}

const yamlStr = (s) => JSON.stringify(String(s)); // a JSON string is a valid YAML double-quoted scalar

function yamlBlock(name, entry, indent) {
  const pad = ' '.repeat(indent);
  const rows = [`${pad}${name}:`];
  for (const [k, v] of Object.entries(entry)) {
    if (v && typeof v === 'object') {
      rows.push(`${pad}  ${k}:`);
      for (const [k2, v2] of Object.entries(v)) rows.push(`${pad}    ${k2}: ${yamlStr(v2)}`);
    } else rows.push(`${pad}  ${k}: ${yamlStr(v)}`);
  }
  return rows;
}

/** Replace (or add) mcp_servers.<name> in a block-style YAML document (Hermes config.yaml). */
export function upsertYaml(text, name, entry) {
  const lines = (text ?? '').replace(BOM, '').split(/\r?\n/);
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  const top = lines.findIndex((l) => /^mcp_servers\s*:/.test(l));
  if (top === -1) return [...lines, ...(lines.length ? [''] : []), 'mcp_servers:', ...yamlBlock(name, entry, 2)].join('\n') + '\n';
  const rest = lines[top].replace(/^mcp_servers\s*:/, '').replace(/\s+#.*$/, '').trim();
  if (rest === '{}' || rest === '~' || rest === 'null') {
    lines[top] = 'mcp_servers:';
  } else if (rest !== '') {
    throw new Error('mcp_servers is written in flow style; edit it by hand');
  }
  const isContent = (l) => l.trim() !== '' && !/^\s*#/.test(l);
  const indentOf = (l) => l.match(/^ */)[0].length;
  let end = top + 1;
  while (end < lines.length && (!isContent(lines[end]) || indentOf(lines[end]) > 0)) end++;
  const firstChild = lines.slice(top + 1, end).find(isContent);
  const child = firstChild ? indentOf(firstChild) : 2;
  const body = [];
  for (let i = top + 1; i < end; i++) {
    const l = lines[i];
    if (isContent(l) && indentOf(l) === child && new RegExp(`^\\s*(?:${name}|"${name}"|'${name}')\\s*:`).test(l)) {
      let last = i;
      for (let j = i + 1; j < end && (!isContent(lines[j]) || indentOf(lines[j]) > child); j++) if (isContent(lines[j])) last = j;
      i = last; // blank lines after the old entry stay where they were
      continue;
    }
    body.push(l);
  }
  let gap = 0;
  while (body.length && body[body.length - 1].trim() === '') body.pop(), gap++;
  const spacer = end < lines.length && gap ? [''] : [];
  return [...lines.slice(0, top + 1), ...yamlBlock(name, entry, child), ...body, ...spacer, ...lines.slice(end)].join('\n') + '\n';
}

// --- install ------------------------------------------------------------------------------------

/** Find an executable on PATH (Windows: honours PATHEXT). */
export function which(cmd, env = process.env) {
  const exts = osPlatform() === 'win32' ? (env.PATHEXT || '.EXE;.CMD;.BAT').split(';').map((e) => e.toLowerCase()) : [''];
  for (const dir of (env.PATH || env.Path || '').split(delimiter)) {
    if (!dir) continue;
    for (const ext of osPlatform() === 'win32' ? ['', ...exts] : exts) {
      const f = join(dir, cmd + ext);
      try {
        if (statSync(f).isFile()) return f;
      } catch {}
    }
  }
  return null;
}

/** Hosts that look installed on this machine. Lovable and Manus live in the browser and are always shown. */
export function detectHosts(env = process.env) {
  const p = envPaths(env);
  const found = [];
  if (which('claude', env) || existsSync(join(p.home, '.claude.json'))) found.push('claude-code');
  if (HOSTS['claude-desktop'].files(p).some((f) => existsSync(dirname(f)))) found.push('claude-desktop');
  if (which('codex', env) || existsSync(env.CODEX_HOME || join(p.home, '.codex'))) found.push('codex');
  if (existsSync(join(p.home, '.cursor'))) found.push('cursor');
  if (which('code', env) || existsSync(dirname(HOSTS.vscode.files(p)[0]))) found.push('vscode');
  if (HOSTS.windsurf.files(p).some((f) => existsSync(dirname(f)))) found.push('windsurf');
  if (which('hermes', env) || existsSync(dirname(HOSTS.hermes.files(p, env)[0]))) found.push('hermes');
  if (which('openclaw', env) || existsSync(dirname(HOSTS.openclaw.files(p, env)[0]))) found.push('openclaw');
  return found;
}

/** Render a host's config as text (what `m0s print` shows and what install writes). */
export function renderHost(id, { url = DEFAULT_URL, ctx = {} } = {}) {
  const h = HOSTS[id];
  if (!h) throw new Error(`unknown host "${id}" - try: ${Object.keys(HOSTS).join(', ')}`);
  if (h.kind === 'manual') return h.steps(url).map((s, i) => `${i + 1}. ${s}`).join('\n');
  if (h.kind === 'cli') return h.command(url).map(shellQuote).join(' ');
  const entry = h.entry(url, { node: 'node', shim: join(envPaths().m0sHome, 'm0s.mjs'), key: '<your m.0S key>', ...ctx });
  if (h.kind === 'toml') return upsertToml('', SERVER_NAME, entry).trim();
  if (h.kind === 'yaml') return upsertYaml('', SERVER_NAME, entry).trim();
  if (h.kind === 'vscode') return mergeVscode('', SERVER_NAME, entry).trim();
  return mergeJson('', h.path, entry).trim();
}

function shellQuote(a) {
  return /^[\w@%+=:,./-]+$/.test(a) ? a : `'${a.replace(/'/g, `'\\''`)}'`;
}

function backup(file) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const to = `${file}.m0s-backup-${stamp}`;
  copyFileSync(file, to);
  return to;
}

/** Copy this file to ~/.m0s/m0s.mjs so local-only hosts can start the shim without npm. */
export function installShim(p, self = fileURLToPath(import.meta.url)) {
  const target = join(p.m0sHome, 'm0s.mjs');
  mkdirSync(p.m0sHome, { recursive: true });
  if (resolve(self) !== resolve(target)) writeFileSync(target, readFileSync(self));
  return target;
}

/**
 * Write the m.0S entry for each host. Returns one report row per host; never throws for a single
 * host (a broken config is reported and left untouched).
 */
export function install({ hosts, url = DEFAULT_URL, env = process.env, dryRun = false, log = () => {}, run = runCli, fromList = false } = {}) {
  url = resolveUrl(url);
  const p = envPaths(env);
  const list = hosts?.length ? hosts : [...detectHosts(env), 'lovable', 'manus'];
  const key = env[KEY_ENV] || '';
  // A dry run prints the would-be file; the key is never part of what reaches the terminal.
  const ctx = { node: process.execPath, shim: join(p.m0sHome, 'm0s.mjs'), key: dryRun && key ? KEY_HIDDEN : key, fromList };
  const rows = [];
  let shimReady = false;
  for (const id of list) {
    const h = HOSTS[id];
    if (!h) {
      rows.push({ host: id, status: 'error', detail: `unknown host - try: ${Object.keys(HOSTS).join(', ')}` });
      continue;
    }
    try {
      if (h.kind === 'manual') {
        rows.push({ host: id, status: 'manual', detail: renderHost(id, { url }) });
        continue;
      }
      if (h.kind === 'cli') {
        const argv = h.command(url);
        const bin = which(argv[0], env);
        if (!bin || dryRun) {
          rows.push({ host: id, status: dryRun ? 'dry-run' : 'manual', detail: `run: ${argv.map(shellQuote).join(' ')}` });
          continue;
        }
        // An existing "mosadd" entry (for example the older mosadd.com one) is saved before it is replaced.
        const prev = run(bin, ['mcp', 'get', SERVER_NAME], { quiet: true });
        let saved = null;
        if (prev.ok && prev.out) {
          saved = join(p.m0sHome, 'backups', `claude-code-${SERVER_NAME}-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);
          mkdirSync(dirname(saved), { recursive: true });
          writeFileSync(saved, prev.out + '\n');
        }
        run(bin, ['mcp', 'remove', '--scope', 'user', SERVER_NAME], { quiet: true });
        const r = run(bin, argv.slice(1));
        const replaced = saved ? ` Replaced the existing "${SERVER_NAME}" entry; its previous definition (claude mcp get) is in ${saved}.` : '';
        rows.push({ host: id, status: r.ok ? 'written' : 'error', backup: saved, detail: r.ok ? h.note + replaced : `claude mcp add failed: ${r.out}` });
        continue;
      }
      if (h.kind === 'json' && id === 'claude-desktop' && !dryRun && !shimReady) {
        installShim(p);
        shimReady = true;
      }
      const entry = h.entry(url, ctx);
      const files = h.files(p, env);
      for (const file of files) {
        if (h.kind === 'json' && id === 'claude-desktop' && !existsSync(dirname(file)) && file !== files[0]) continue;
        const before = existsSync(file) ? readFileSync(file, 'utf8') : '';
        const after =
          h.kind === 'json'
            ? mergeJson(before, h.path, entry)
            : h.kind === 'vscode'
              ? mergeVscode(before, SERVER_NAME, entry)
              : h.kind === 'toml'
                ? upsertToml(before, SERVER_NAME, entry)
                : upsertYaml(before, SERVER_NAME, entry);
        const old = h.kind === 'json' || h.kind === 'vscode' ? previousEntry(before, h.kind === 'vscode' ? ['servers', SERVER_NAME] : h.path) : undefined;
        const oldUrl = old && typeof old === 'object' ? old.url || old.serverUrl || (Array.isArray(old.args) ? `local command ${old.command} ${old.args.join(' ')}` : null) : null;
        const replaced = old !== undefined && JSON.stringify(old) !== JSON.stringify(entry) ? ` Replaced the existing "${SERVER_NAME}" entry${oldUrl ? ` (${oldUrl})` : ''}.` : '';
        if (dryRun) {
          rows.push({ host: id, status: 'dry-run', file, detail: after + (replaced ? `\n${replaced.trim()}` : '') });
          continue;
        }
        const saved = before ? backup(file) : null;
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, after);
        const warn = id === 'claude-desktop' ? (key ? ' The key is stored in this file (env block).' : ` ${KEY_ENV} was not set: add it to the env block, then restart Claude Desktop.`) : '';
        rows.push({ host: id, status: 'written', file, backup: saved, detail: h.note + warn + replaced });
      }
    } catch (e) {
      rows.push({ host: id, status: 'error', detail: `${e.message}. Paste by hand:\n${renderHost(id, { url })}` });
    }
  }
  for (const r of rows) for (const f of ['detail', 'file', 'backup']) r[f] = redact(r[f], key);
  for (const r of rows) log(r);
  return rows;
}

function runCli(bin, args, { quiet = false } = {}) {
  const shell = /\.(cmd|bat)$/i.test(bin);
  const r = spawnSync(shell ? `"${bin}"` : bin, shell ? args.map((a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)) : args, {
    encoding: 'utf8',
    shell,
    timeout: 60_000,
  });
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
  if (!quiet && r.status !== 0) return { ok: false, out: out || String(r.error || r.status) };
  return { ok: r.status === 0, out };
}

// --- signed address list ------------------------------------------------------------------------
//
// The hub publishes GET /.well-known/m0s-endpoints.json on every name it answers on:
//   { "m0s_endpoints": 1, "payload": "<JSON text>", "signatures": [{ "keyid", "alg": "ed25519", "sig": "<base64>" }] }
// Every Ed25519 signature covers the exact UTF-8 bytes of the signed text (no JSON canonicalisation, so any language checks
// the same bytes). keyid = first 16 hex chars of sha256(raw 32-byte public key). Two keys sign, for two different things:
//   * the ROOT key (pinned below, kept offline by the hub's operator) signs the CONTENT: which addresses exist and which
//     online keys may vouch for freshness. The payload carries it verbatim in `content`:
//       { "m0s_endpoints_content": 1, "content": "<JSON text>", "signatures": [...] }, content = { type:
//       "m0s-endpoints-content", format: 1, version, issued_at, expires_at, online_keys: [...], next_root_pubkey,
//       endpoints: [{ url, service, family, region, role, weight, ip? }] }
//   * an ONLINE key on the hub's nodes signs the envelope every minute (freshness): { type: "m0s-endpoints", format: 1,
//     version, issued_at, expires_at, endpoints, content }. It must be listed in content.online_keys.
// Addresses are taken from the root-signed content ONLY. Whoever takes over a hub node gets the online key at most, which
// cannot add an address; the worst it can do is keep serving our own current list until the content expires.
// A list counts when both signatures hold, neither part has expired or comes from the future, each version is bound to
// its issued_at, and neither version is lower than what we already hold. The newest valid list from all places we ask
// wins, so one seized name replaying an old list does not hold the client back.
// Addresses on a name that encodes an IP (1-2-3-4.sslip.io, nip.io) or that carry an `ip` field are reached at THAT IP:
// the TLS name is still checked, but a hijacked third-party DNS cannot send us (and our key) somewhere else.

/**
 * ROOT public keys (raw 32 bytes, base64) the hub's address content is signed with. Pinned: nothing else is trusted.
 * root1-20260930, keyid 7324bf836b133f80: generated offline on 2026-09-30, held by the hub's operator (never on a server).
 * The hub's online key (ep1-20260930, keyid 2d44f0bda62da714) is trusted only because this root lists it in online_keys.
 */
export const ENDPOINTS_KEYS = Object.freeze(['c/5Gg1IBB8wDjnRyEOrPGfU8s3C6s5zz99Yfk7aVam8=']);
export const ENDPOINTS_PATH = '/.well-known/m0s-endpoints.json';
/** Where to ask for the list before one is cached: the hub's names and its nodes' direct names (Tel Aviv, Mumbai). */
export const ENDPOINTS_BOOTSTRAP = Object.freeze([
  'https://api.mosadd.dev',
  'https://mcp.mosadd.dev',
  'https://64-177-66-61.sslip.io',
  'https://65-20-86-3.sslip.io',
]);
export const ENDPOINTS_REFRESH_MS = 5 * 60_000;
const LIST_SERVICES = new Set(['api', 'mcp', 'hub']);
const BUCKET_S = 60;
const FUTURE_SKEW_MS = 10 * 60_000;

export class EndpointsError extends Error {
  constructor(reason) {
    super(`address list rejected: ${reason}`);
    this.reason = reason;
  }
}

/** Address-list lookups are on unless M0S_ENDPOINTS=off (then only the default or a given --url is used). */
export const listEnabled = (env = process.env) => String(env.M0S_ENDPOINTS || '').toLowerCase() !== 'off';

export function endpointsKeyId(pub) {
  return createHash('sha256').update(Buffer.from(pub, 'base64')).digest('hex').slice(0, 16);
}

function edKey(pub) {
  const raw = Buffer.from(String(pub), 'base64');
  if (raw.length !== 32) throw new EndpointsError('bad_key');
  return createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: raw.toString('base64url') }, format: 'jwk' });
}

const validKey = (k) => {
  try {
    edKey(k);
    return true;
  } catch {
    return false;
  }
};

const safeUrl = (u) => {
  try {
    resolveUrl(u); // https only (http on loopback): a key is never sent in clear
    return true;
  } catch {
    return false;
  }
};

/** True when one of `sigs` is a valid Ed25519 signature over `text` by a key in `keys`. */
function signedBy(text, sigs, keys) {
  if (!Array.isArray(sigs)) return false;
  const bytes = Buffer.from(text, 'utf8');
  const trusted = [];
  for (const k of keys) {
    try {
      trusted.push({ id: endpointsKeyId(k), key: edKey(k) });
    } catch {}
  }
  return sigs.some((s) => {
    const t = trusted.find((x) => x.id === s?.keyid);
    if (!t || s.alg !== 'ed25519' || typeof s.sig !== 'string') return false;
    try {
      return verifySignature(null, bytes, t.key, Buffer.from(s.sig, 'base64'));
    } catch {
      return false;
    }
  });
}

/** Dates parse, and the version is not ahead of issued_at (+ one 60 s bucket): one bad list cannot lift our floor forever. */
function checkVersion(version, issuedAt, expiresAt, prefix, bad) {
  const iss = Date.parse(issuedAt);
  if (!Number.isSafeInteger(version) || !Number.isFinite(iss) || !Number.isFinite(Date.parse(expiresAt))) throw new EndpointsError(bad);
  if (version > Math.floor(iss / 1000) + BUCKET_S) throw new EndpointsError(`${prefix}version_ahead`);
}

/** The IP written into a sslip.io / nip.io name (64-177-66-61.sslip.io -> 64.177.66.61), else null. */
export function ipFromName(hostname) {
  const m = /^(\d{1,3})-(\d{1,3})-(\d{1,3})-(\d{1,3})\.(?:sslip|nip)\.io$/i.exec(String(hostname));
  if (!m) return null;
  const ip = m.slice(1, 5).map(Number);
  return ip.every((o) => o <= 255) ? ip.join('.') : null;
}

/**
 * The IP an address must be reached at: its `ip` field, or the IP its sslip.io / nip.io name encodes. null = an ordinary
 * name (DNS). undefined = the name and the ip field disagree, or the ip is not an IP: the entry is dropped.
 */
export function endpointIp(url, ip) {
  const fromName = ipFromName(new URL(url).hostname);
  if (ip === undefined || ip === null || ip === '') return fromName;
  if (typeof ip !== 'string' || !isIP(ip)) return undefined;
  if (fromName && fromName !== ip) return undefined;
  return ip;
}

function cleanEntry(e) {
  if (!e || typeof e.url !== 'string' || typeof e.service !== 'string' || !safeUrl(e.url)) return null;
  const ip = endpointIp(e.url, e.ip);
  if (ip === undefined) return null;
  const { ip: _drop, ...rest } = e;
  return ip ? { ...rest, ip } : rest;
}

/** The root-signed content inside a payload. Throws EndpointsError. */
function openContent(c, roots) {
  if (!c) throw new EndpointsError('no_content');
  if (c.m0s_endpoints_content !== 1 || typeof c.content !== 'string' || !Array.isArray(c.signatures)) throw new EndpointsError('bad_content');
  if (!signedBy(c.content, c.signatures, roots)) throw new EndpointsError('content_bad_signature');
  let x;
  try {
    x = JSON.parse(c.content);
  } catch {
    throw new EndpointsError('bad_content');
  }
  if (x?.type !== 'm0s-endpoints-content' || x.format !== 1 || !Array.isArray(x.endpoints) || !Array.isArray(x.online_keys)) throw new EndpointsError('bad_content');
  checkVersion(x.version, x.issued_at, x.expires_at, 'content_', 'bad_content');
  const online = x.online_keys.filter(validKey);
  if (!online.length) throw new EndpointsError('bad_content');
  return {
    version: x.version,
    issued_at: x.issued_at,
    expires_at: x.expires_at,
    online_keys: online,
    next_root_pubkey: validKey(x.next_root_pubkey) ? x.next_root_pubkey : null,
    endpoints: x.endpoints.map(cleanEntry).filter(Boolean),
  };
}

/**
 * Check both signatures (and nothing time-related) and return the list: envelope fields plus the addresses of the
 * root-signed content. `keys` = trusted ROOT keys. Throws EndpointsError.
 */
export function openEndpoints(doc, keys = ENDPOINTS_KEYS) {
  if (!doc || doc.m0s_endpoints !== 1 || typeof doc.payload !== 'string' || !Array.isArray(doc.signatures)) throw new EndpointsError('bad_document');
  let p;
  try {
    p = JSON.parse(doc.payload);
  } catch {
    throw new EndpointsError('bad_payload');
  }
  const c = openContent(p?.content, keys);
  // the envelope: an online key the root vouched for (or the root itself, for an emergency re-sign)
  if (!signedBy(doc.payload, doc.signatures, [...c.online_keys, ...keys])) throw new EndpointsError('bad_signature');
  if (p?.type !== 'm0s-endpoints' || p.format !== 1) throw new EndpointsError('bad_payload');
  checkVersion(p.version, p.issued_at, p.expires_at, '', 'bad_payload');
  return {
    type: p.type,
    format: p.format,
    version: p.version,
    issued_at: p.issued_at,
    expires_at: p.expires_at,
    content_version: c.version,
    content_issued_at: c.issued_at,
    content_expires_at: c.expires_at,
    next_root_pubkey: c.next_root_pubkey,
    endpoints: c.endpoints, // addresses come from the root-signed content only, never from the envelope
  };
}

/** Full check: both signatures, neither part expired, neither issued in the future. Returns the list. */
export function verifyEndpoints(doc, { keys = ENDPOINTS_KEYS, now = Date.now() } = {}) {
  const p = openEndpoints(doc, keys);
  if (Date.parse(p.expires_at) <= now) throw new EndpointsError('expired');
  if (Date.parse(p.issued_at) > now + FUTURE_SKEW_MS) throw new EndpointsError('not_yet_valid');
  if (Date.parse(p.content_expires_at) <= now) throw new EndpointsError('content_expired');
  if (Date.parse(p.content_issued_at) > now + FUTURE_SKEW_MS) throw new EndpointsError('content_not_yet_valid');
  return p;
}

const byPreference = (a, b) => (a.role === b.role ? 0 : a.role === 'primary' ? -1 : 1) || (b.weight || 0) - (a.weight || 0);

/** MCP addresses of a verified list, preferred first. No list = the default endpoint. */
export function mcpCandidates(list, fallback = DEFAULT_URL) {
  const urls = list ? [...list.endpoints].filter((e) => e.service === 'mcp').sort(byPreference).map((e) => e.url) : [];
  return urls.length ? [...new Set(urls)] : [fallback];
}

/**
 * The IP to reach `url` at, or null for plain DNS: the `ip` of a list entry on the same host, else the IP a sslip.io /
 * nip.io name encodes (bootstrap names, --url).
 */
export function pinFor(url, list) {
  const u = new URL(url);
  const hit = list?.endpoints?.find((e) => e.ip && new URL(e.url).host === u.host);
  return hit ? hit.ip : ipFromName(u.hostname);
}

/**
 * MCP addresses a host that only stores a URL may get: addresses reached through ordinary DNS. A pinned address
 * (sslip.io, ip field) is safe only through the m0s shim, which dials the pinned IP; a host would trust whatever
 * third-party DNS says and send the key there.
 */
export function hostCandidates(list) {
  return mcpCandidates(list, null).filter((u) => u && !pinFor(u, list));
}

/** Where the list itself can be fetched: every api/mcp/hub name of the list, preferred first. */
export function listSources(list) {
  const out = [];
  for (const e of list ? [...list.endpoints].sort(byPreference) : []) {
    if (!LIST_SERVICES.has(e.service)) continue;
    const u = new URL(ENDPOINTS_PATH, e.url).href;
    if (!out.includes(u)) out.push(u);
  }
  return out;
}

/**
 * fetch() to a fixed IP: the TCP connection goes to `ip`, while the TLS name check (SNI) and the Host header stay those
 * of the URL. Resolves to a standard Response. `requestImpl` replaces node:http(s).request (tests).
 */
export function pinnedFetch(url, init = {}, ip, { requestImpl } = {}) {
  const u = new URL(url);
  const family = isIP(ip);
  if (!family) return Promise.reject(new Error(`not an IP: ${ip}`));
  const request = requestImpl || (u.protocol === 'https:' ? httpsRequest : httpRequest);
  const headers = { ...(init.headers || {}) };
  if (init.body != null && !Object.keys(headers).some((h) => h.toLowerCase() === 'content-length')) headers['content-length'] = Buffer.byteLength(init.body);
  return new Promise((resolvePromise, reject) => {
    const req = request(
      u,
      {
        method: init.method || 'GET',
        headers,
        signal: init.signal,
        lookup: (_host, opts, cb) => {
          if (typeof opts === 'function') [cb, opts] = [opts, {}];
          if (opts && opts.all) cb(null, [{ address: ip, family }]);
          else cb(null, ip, family);
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('error', reject);
        res.on('end', () => {
          const status = res.statusCode || 502;
          const h = new Headers();
          for (const [k, v] of Object.entries(res.headers)) if (v !== undefined) h.set(k, Array.isArray(v) ? v.join(', ') : String(v));
          const empty = [204, 205, 304].includes(status);
          resolvePromise(new Response(empty ? null : Buffer.concat(chunks), { status: status >= 200 && status <= 599 ? status : 502, headers: h }));
        });
      },
    );
    req.on('error', reject);
    if (init.body != null) req.write(init.body);
    req.end();
  });
}

/** A fetch that dials the pinned IP for pinned addresses (see pinFor) and uses `fetchImpl` for everything else. */
export function routedFetch(fetchImpl = globalThis.fetch, listOf = () => null, { requestImpl } = {}) {
  return (url, init) => {
    const ip = pinFor(url, listOf());
    return ip ? pinnedFetch(url, init, ip, { requestImpl }) : fetchImpl(url, init);
  };
}

export function endpointsCacheFile(env = process.env) {
  return join(envPaths(env).m0sHome, 'endpoints.json');
}

/**
 * The last good list on disk ({ doc, trusted_next }). Its signatures are checked again on every load; an expired list
 * is still returned (expired: true) as a version floor and as places to ask, never as addresses to send a key to.
 */
export function loadEndpointsCache(file, { keys = ENDPOINTS_KEYS, now = Date.now() } = {}) {
  let j;
  try {
    j = JSON.parse(readFileSync(file, 'utf8').replace(BOM, ''));
  } catch {
    return null;
  }
  const trust = [...new Set([...keys, ...(Array.isArray(j?.trusted_next) ? j.trusted_next.filter((k) => typeof k === 'string') : [])])];
  try {
    const list = openEndpoints(j?.doc, trust);
    return { doc: j.doc, list, trust, expired: Date.parse(list.expires_at) <= now || Date.parse(list.content_expires_at) <= now };
  } catch {
    return null;
  }
}

function saveEndpointsCache(file, doc, list, trust, keys) {
  const next = [];
  if (list.next_root_pubkey && validKey(list.next_root_pubkey)) next.push(list.next_root_pubkey); // announced by a root we trust
  const trusted_next = [...new Set([...trust.filter((k) => !keys.includes(k)), ...next])];
  try {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify({ doc, trusted_next }, null, 2) + '\n');
  } catch {}
}

const newer = (a, b) => a.version - b.version || a.content_version - b.content_version;

/**
 * Ask every place at once (`sources`, then the cached list's own names, then `bootstrap`) and keep the NEWEST valid list
 * (ties: the earlier place). A list older than the cached one is a rollback and is refused. Keeps the cache when nothing
 * better turns up. Never throws. Returns { list, source, updated, tried: [{ source, reason }] }; list = null when no
 * valid list is known. Pinned names (sslip.io, ip field) are dialled at their IP.
 */
export async function refreshEndpoints({
  keys = ENDPOINTS_KEYS,
  file = endpointsCacheFile(),
  sources = [],
  bootstrap = ENDPOINTS_BOOTSTRAP,
  fetchImpl = globalThis.fetch,
  requestImpl,
  now = () => Date.now(),
  timeoutMs = 5000,
} = {}) {
  const cache = file ? loadEndpointsCache(file, { keys, now: now() }) : null;
  const trust = cache ? cache.trust : [...keys];
  const floor = cache ? cache.list : null;
  const where = [...new Set([...sources, ...listSources(cache?.list), ...bootstrap.map((b) => new URL(ENDPOINTS_PATH, b).href)])];
  const get = routedFetch(fetchImpl, () => cache?.list, { requestImpl });
  const results = await Promise.all(
    where.map(async (source) => {
      let doc;
      try {
        const r = await get(source, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) });
        const text = await r.text();
        if (r.status !== 200) return { source, reason: `http_${r.status}` };
        doc = JSON.parse(text);
      } catch (e) {
        return { source, reason: e instanceof SyntaxError ? 'not_json' : 'unreachable' };
      }
      try {
        const list = verifyEndpoints(doc, { keys: trust, now: now() });
        if (floor && (list.version < floor.version || list.content_version < floor.content_version)) return { source, reason: 'rollback' };
        return { source, list, doc };
      } catch (e) {
        return { source, reason: e.reason || 'bad_document' };
      }
    }),
  );
  const tried = results.filter((r) => !r.list).map(({ source, reason }) => ({ source, reason }));
  let best = null;
  for (const r of results) if (r.list && (!best || newer(r.list, best.list) > 0)) best = r;
  if (best) {
    const updated = !floor || newer(best.list, floor) > 0;
    if (updated && file) saveEndpointsCache(file, best.doc, best.list, trust, keys);
    return { list: best.list, source: best.source, updated, tried };
  }
  const live = cache && !cache.expired;
  return { list: live ? cache.list : null, source: live ? 'cache' : null, updated: false, tried };
}

/**
 * The MCP address to write into a host config: the first address of a fresh verified list that the host can reach
 * through ordinary DNS (hostCandidates), else the default. pinnedOnly = the list had only pinned addresses left (the
 * hub's names are gone): such a host should run the m0s shim instead.
 */
export async function chooseEndpoint({ env = process.env, ...opts } = {}) {
  if (!listEnabled(env)) return { url: DEFAULT_URL, list: null, source: null, tried: [], pinnedOnly: false };
  const r = await refreshEndpoints({ file: endpointsCacheFile(env), ...opts });
  const plain = hostCandidates(r.list);
  const pinnedOnly = !!r.list && !plain.length && mcpCandidates(r.list, null).some(Boolean);
  return { url: plain[0] || DEFAULT_URL, list: r.list, source: r.source, tried: r.tried, pinnedOnly };
}

// --- stdio shim ---------------------------------------------------------------------------------

/** Parse a text/event-stream body into the JSON messages carried in its `data:` fields. */
export function parseSse(body) {
  const msgs = [];
  let data = [];
  for (const line of body.split(/\r?\n/)) {
    if (line === '') {
      if (data.length) msgs.push(data.join('\n'));
      data = [];
    } else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
  }
  if (data.length) msgs.push(data.join('\n'));
  return msgs;
}

const rpcError = (id, code, message, data) => JSON.stringify({ jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data ? { data } : {}) } });

/** An answer that is not the hub speaking: a proxy that lost its upstream, or a parked or seized domain's page. */
function notTheHub(res) {
  if (res.status === 502 || res.status === 504) return true;
  if (res.status === 202 || res.status === 204) return false;
  const type = res.headers.get('content-type') || '';
  return !type.includes('application/json') && !type.includes('text/event-stream');
}

/**
 * Bridge newline-delimited JSON-RPC on stdin to the hub's Streamable HTTP endpoint and write every
 * response line to stdout. Resolves when stdin closes and in-flight requests are answered.
 *
 * With an address given (`url`, --url or M0S_MCP_URL) it talks to that address only. Without one it follows the
 * hub's signed address list (cached in ~/.m0s/endpoints.json, refreshed in the background every 5 minutes): the
 * preferred address first; when an address is unreachable or answers with something that is not the hub, the same
 * message goes to the next address of the list. A tools/call carries one Idempotency-Key across those tries, so
 * the hub never runs it twice. M0S_ENDPOINTS=off turns the list off (default address only).
 */
export async function runShim({
  url,
  key = process.env[KEY_ENV],
  input = process.stdin,
  output = process.stdout,
  errors = process.stderr,
  fetchImpl = globalThis.fetch,
  requestImpl,
  list = {},
  env = process.env,
} = {}) {
  const explicit = url || env.M0S_MCP_URL;
  const pinned = explicit ? resolveUrl(explicit) : listEnabled(env) ? null : DEFAULT_URL;
  const route = { urls: [pinned || DEFAULT_URL], at: 0, list: null };
  // addresses with a pinned IP (sslip.io names, ip field of the list) are dialled at that IP, never at what DNS says
  const send = routedFetch(fetchImpl, () => route.list, { requestImpl: list.requestImpl || requestImpl });
  const state = { session: null, sessionUrl: null, protocol: null };
  const write = (s) => output.write(s.endsWith('\n') ? s : s + '\n');
  if (!key) errors.write(`m0s: ${KEY_ENV} is not set - the hub lists tools without a key, but every tools/call returns 401. Get a key at ${KEY_PAGE}.\n`);
  const pending = new Set();

  let refreshing = null;
  let timer = null;
  if (!pinned) {
    const opts = { file: endpointsCacheFile(env), fetchImpl, requestImpl, ...list };
    const take = (l) => {
      if (!l) return;
      route.list = l;
      route.urls = mcpCandidates(l);
      route.at = 0; // back to the preferred address after every refresh
    };
    const cached = opts.file ? loadEndpointsCache(opts.file, { keys: opts.keys }) : null;
    if (cached && !cached.expired) take(cached.list);
    const refresh = () =>
      (refreshing = refreshEndpoints(opts)
        .then((r) => (take(r.list), r))
        .catch(() => null));
    refresh();
    timer = setInterval(refresh, opts.refreshMs ?? ENDPOINTS_REFRESH_MS);
    timer.unref?.();
  }

  /** POST one message; on a dead address move along the list. Returns { res, body, target } or { error }. */
  async function post(line, headers) {
    const tried = new Set();
    let dead = null;
    let error = null;
    for (let round = 0; round < (pinned ? 1 : 2); round++) {
      if (round === 1) {
        await refreshing; // everything known failed: wait for the fresh list, then try the addresses it adds
      }
      const order = [...route.urls.slice(route.at), ...route.urls.slice(0, route.at)].filter((u) => !tried.has(u));
      for (const target of order) {
        tried.add(target);
        const h = { ...headers, ...(state.session && state.sessionUrl === target ? { 'mcp-session-id': state.session } : {}) };
        let res;
        try {
          res = await send(target, { method: 'POST', headers: h, body: line });
        } catch (e) {
          error = `${target}: ${e.message}`;
          continue;
        }
        if (!pinned && notTheHub(res)) {
          dead = { res, body: await res.text().catch(() => ''), target };
          error = `${target}: HTTP ${res.status}`;
          continue;
        }
        const now = route.urls[route.at];
        if (target !== now && route.urls.includes(target)) {
          errors.write(`m0s: ${now} did not answer as the hub; now using ${target} (signed address list)\n`);
          route.at = route.urls.indexOf(target);
        }
        return { res, body: null, target };
      }
    }
    return dead || { error: error || 'no address to try' };
  }

  async function forward(line) {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      write(rpcError(null, -32700, 'Parse error: stdin line is not JSON'));
      return;
    }
    const first = Array.isArray(msg) ? msg[0] : msg;
    const id = first && 'id' in first && first.method ? first.id : undefined;
    const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
    if (key) headers.authorization = `Bearer ${key}`;
    if (state.protocol) headers['mcp-protocol-version'] = state.protocol;
    // one id for every try of the same tools/call: a retry on another address is answered 409, never run twice
    if (!pinned && first?.method === 'tools/call' && !first?.params?._meta?.request_id) headers['idempotency-key'] = randomUUID();
    const got = await post(line, headers);
    if (got.error) {
      if (id !== undefined) write(rpcError(id, -32000, `m.0S hub unreachable: ${got.error}`));
      return;
    }
    const { res, target } = got;
    const sid = res.headers.get('mcp-session-id');
    if (sid) {
      state.session = sid;
      state.sessionUrl = target;
    }
    if (res.status === 202 || res.status === 204) return;
    const type = res.headers.get('content-type') || '';
    const body = got.body ?? (await res.text());
    const bodies = type.includes('text/event-stream') ? parseSse(body) : [body];
    let forwarded = false;
    for (const b of bodies) {
      if (!b.trim()) continue;
      try {
        const parsed = JSON.parse(b);
        for (const m of Array.isArray(parsed) ? parsed : [parsed]) {
          if (first?.method === 'initialize' && m?.id === id && m?.result?.protocolVersion) state.protocol = m.result.protocolVersion;
        }
        write(JSON.stringify(parsed));
        forwarded = true;
      } catch {}
    }
    if (!forwarded && id !== undefined) write(rpcError(id, -32000, `m.0S hub answered HTTP ${res.status}`, { status: res.status, body: body.slice(0, 300) }));
  }

  // Everything after an `initialize` waits for its answer, so the session id is known before the next POST.
  let initialized = Promise.resolve();
  const rl = createInterface({ input, crlfDelay: Infinity });
  for await (const raw of rl) {
    const line = raw.trim();
    if (!line) continue;
    const isInit = /"method"\s*:\s*"initialize"/.test(line);
    const gate = initialized;
    const p = (isInit ? forward(line) : gate.then(() => forward(line))).catch((e) => errors.write(`m0s: ${e.message}\n`));
    if (isInit) initialized = p;
    pending.add(p);
    p.finally(() => pending.delete(p));
  }
  await Promise.all([...pending]);
  if (timer) clearInterval(timer);
  if (state.session) {
    try {
      await send(state.sessionUrl, {
        method: 'DELETE',
        headers: { 'mcp-session-id': state.session, ...(key ? { authorization: `Bearer ${key}` } : {}) },
        signal: AbortSignal.timeout(2000),
      });
    } catch {}
  }
}

// --- doctor -------------------------------------------------------------------------------------

/** Check that the hub answers initialize + tools/list, the signed address list, and whether a key is set. Never prints the key. */
export async function doctor({ url = DEFAULT_URL, env = process.env, fetchImpl = globalThis.fetch, log = console.log, list = {} } = {}) {
  url = resolveUrl(url);
  const rows = [];
  const get = routedFetch(fetchImpl, () => null, { requestImpl: list.requestImpl });
  const call = async (body) => {
    const r = await get(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify(body),
    });
    const t = await r.text();
    const json = (r.headers.get('content-type') || '').includes('event-stream') ? JSON.parse(parseSse(t)[0]) : JSON.parse(t);
    return json;
  };
  try {
    const init = await call({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'm0s-doctor', version: VERSION } } });
    rows.push(['hub', 'ok', `${url} -> ${init.result?.serverInfo?.name} ${init.result?.serverInfo?.version}`]);
    const list = await call({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    rows.push(['tools', 'ok', `${list.result?.tools?.length ?? 0} tools listed`]);
  } catch (e) {
    rows.push(['hub', 'error', `${url}: ${e.message}`]);
  }
  if (listEnabled(env)) {
    const r = await refreshEndpoints({ file: endpointsCacheFile(env), fetchImpl, ...list });
    if (r.list) {
      const n = r.list.endpoints.filter((e) => e.service === 'mcp').length;
      rows.push(['list', 'ok', `signed address list v${r.list.version}, content v${r.list.content_version} (expires ${r.list.expires_at}, content ${r.list.content_expires_at}) from ${r.source}: ${n} MCP addresses, first ${mcpCandidates(r.list)[0]}`]);
    } else {
      rows.push(['list', 'warn', `no valid signed address list (${r.tried.map((t) => `${t.source}: ${t.reason}`).join('; ') || 'nowhere to ask'})`]);
    }
  }
  const key = env[KEY_ENV] || '';
  const kind = /^m0s_lk_live_/.test(key) ? 'line key' : /^m0s_tk_test_/.test(key) ? 'test key' : key ? 'unrecognised format' : 'not set';
  rows.push(['key', key && kind !== 'unrecognised format' ? 'ok' : 'warn', `${KEY_ENV}: ${kind}${key ? '' : ` - get one at ${KEY_PAGE}`}`]);
  for (const r of rows) log(`${r[1].padEnd(5)} ${r[0].padEnd(6)} ${r[2]}`);
  return rows;
}

// --- CLI ----------------------------------------------------------------------------------------

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--host' || a === '--hosts' || a === '-Host') out.hosts = (argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (a.startsWith('--host=')) out.hosts = a.slice(7).split(',').filter(Boolean);
    else if (a === '--url') out.url = argv[++i];
    else if (a.startsWith('--url=')) out.url = a.slice(6);
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a === '-v' || a === '--version') out.version = true;
    else out._.push(a);
  }
  return out;
}

const HELP = `m0s ${VERSION} - m.0S: one key for your agents' messages, memory and identity, in every AI host.

  m0s install [--host ${Object.keys(HOSTS).join(',')}] [--url URL] [--dry-run]
  m0s print <host>      show one host's config, write nothing
  m0s link <cursor|vscode>  one-click install link for that editor (remote endpoint, key by reference)
  m0s mcp               stdio shim (reads ${KEY_ENV}); follows the hub's signed address list, fails over on a dead address
  m0s endpoints         fetch and verify the hub's signed address list (Ed25519, pinned offline root key), print it
  m0s doctor            check the hub, the address list and your key (never prints the key)
  m0s hosts             list supported hosts

Key: ${KEY_PAGE} -> put it in ${KEY_ENV}. Default endpoint: ${DEFAULT_URL}. Fixed endpoint (no list, no failover):
--url or M0S_MCP_URL. M0S_ENDPOINTS=off: never fetch the address list. MIT License.`;

export async function main(argv = process.argv.slice(2)) {
  const a = parseArgs(argv);
  const cmd = a._[0];
  if (a.version) return console.log(VERSION);
  if (a.help || !cmd) return console.log(HELP);
  if (cmd === 'mcp') return runShim({ url: a.url });
  if (cmd === 'endpoints') {
    const r = await refreshEndpoints();
    for (const t of r.tried) console.log(`skip  ${t.source}: ${t.reason}`);
    if (!r.list) {
      console.log('no valid signed address list');
      process.exitCode = 1;
      return;
    }
    console.log(`list  v${r.list.version} issued ${r.list.issued_at}, expires ${r.list.expires_at}, from ${r.source}${r.updated ? ' (saved)' : ''}`);
    console.log(`root  content v${r.list.content_version} signed offline, expires ${r.list.content_expires_at}`);
    for (const e of [...r.list.endpoints].sort(byPreference)) console.log(`${e.role.padEnd(8)}${e.service.padEnd(5)}${String(e.weight).padStart(4)}  ${e.url}  (${e.family}/${e.region}${e.ip ? `, dialled at ${e.ip}` : ''})`);
    return;
  }
  if (cmd === 'hosts') return console.log(Object.entries(HOSTS).map(([id, h]) => `${id.padEnd(15)} ${h.title} (${h.kind})`).join('\n'));
  if (cmd === 'print') return console.log(renderHost(a._[1], { url: resolveUrl(a.url) }));
  if (cmd === 'link') return console.log(deepLink(a._[1], a.url));
  if (cmd === 'doctor') {
    const rows = await doctor({ url: a.url || (await chooseEndpoint()).url });
    if (rows.some((r) => r[1] === 'error')) process.exitCode = 1;
    return;
  }
  if (cmd === 'install') {
    if (!process.env[KEY_ENV]) console.log(`note: ${KEY_ENV} is not set. Hosts will reference it; set it before you start them (key: ${KEY_PAGE}).`);
    let url = a.url;
    if (!url && listEnabled()) {
      // hosts that only keep a URL get the first address of the hub's current signed list (a seized domain is not on it)
      const pick = await chooseEndpoint();
      url = pick.url;
      console.log(pick.list ? `address: ${url} (signed address list v${pick.list.version}, from ${pick.source})` : `address: ${url} (no valid signed address list reachable; default)`);
      if (pick.pinnedOnly) console.log(`note: the list has only backup addresses on a pinned IP, which a host that stores a URL cannot dial safely. Hosts that keep only a URL stay on ${url}; if that name is seized, use the m0s shim (Claude Desktop does already) or run this installer again later.`);
    }
    const rows = install({ hosts: a.hosts, url, dryRun: a.dryRun, fromList: !a.url });
    for (const r of rows) {
      console.log(`\n[${r.status}] ${HOSTS[r.host]?.title || r.host}${r.file ? ` - ${r.file}` : ''}${r.backup ? ` (backup: ${r.backup})` : ''}`);
      if (r.detail) console.log(r.detail.replace(/^/gm, '  '));
    }
    if (rows.some((r) => r.status === 'error')) process.exitCode = 1;
    console.log(`\nNext: restart the host, then ask it to call comms_capabilities. Check anytime: m0s doctor`);
    return;
  }
  console.error(`unknown command "${cmd}"\n\n${HELP}`);
  process.exitCode = 2;
}

const invokedDirectly = (() => {
  try {
    return process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
  } catch {
    return false;
  }
})();
if (invokedDirectly || process.env.M0S_RUN_MAIN === '1') {
  main().catch((e) => {
    console.error(`m0s: ${e.message}`);
    process.exitCode = 1;
  });
}
