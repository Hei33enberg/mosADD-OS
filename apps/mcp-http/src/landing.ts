/**
 * The gateway's face — what a human in a browser sees at https://mcp.mosadd.com/.
 *
 * ⛔ WHY THIS FILE EXISTS (owner's report 2026-09-16, 12:58: „Nie ma nawet brama
 * prawidłowego Ui" — the gateway has no proper UI). Until today GET / answered with a
 * single line of unformatted text: correct, and unreadable. The bare host is the first
 * thing the owner opens when he wants to see whether the gate is standing, and it is
 * also what a stranger sees, so it has to answer three questions in one screen:
 *   1. is the gate alive (and how many tools does it expose)?  → /health
 *   2. how do I plug it in?                                   → connector URL + copy
 *   3. how do I authenticate?                                 → OAuth sign-in / keys page
 *
 * ⛔ NO BUILD STEP, NO ASSETS, NO FRAMEWORK. This HTML is produced by the same serverless
 * function that speaks MCP, so it must not depend on a bundler, a CDN or a network fetch.
 * Everything is inline; the only request it makes is the /health probe for the live badge.
 *
 * ⛔ THE TOOL COUNT COMES FROM THE PACKAGE (`TOOL_COUNT`), NEVER FROM A LITERAL. A number
 * typed here would drift the first time a tool is added and then lie to every reader.
 *
 * ⛔ NO SECRET, NO KEY, NO EXAMPLE OF A REAL KEY. The curl sample uses the published
 * prefix with an ellipsis only.
 */

const CONNECTOR_URL = "https://mcp.mosadd.com/mcp";
const KEYS_URL = "https://mosadd.com/keys";
const APP_URL = "https://mosadd.com";

/** Escapes for HTML text nodes and double-quoted attributes. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CURL_SAMPLE = `curl -s ${CONNECTOR_URL} \\
  -H 'Authorization: Bearer mosadd_sk_live_…' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;

export function landingHtml(toolCount: number): string {
  const tools = Number.isFinite(toolCount) && toolCount > 0 ? String(toolCount) : "—";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>mosADD MCP gateway</title>
<meta name="description" content="Hosted MCP gateway for mosADD — one URL, any agent runtime. Add ${esc(CONNECTOR_URL)} as a connector and sign in.">
<meta name="theme-color" content="#06090f">
<!-- ⛔ FAVICON = CONNECTOR ICON (founder 2026-08-19). Claude derives a custom connector's
     icon from the origin's favicon; this gateway served none and the connector showed a stale
     default glyph. Keep both links. -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>
  :root { color-scheme: dark; --bg:#06090f; --ink:#e8f2ec; --dim:#8ba396; --line:#1b2a24; --sec:#5af082; --card:#0b1210; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
    font:400 15px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,"DejaVu Sans Mono",monospace;
    -webkit-font-smoothing:antialiased; }
  .wrap { max-width:760px; margin:0 auto; padding:28px 18px 56px; }
  header { display:flex; align-items:center; gap:12px; padding-bottom:18px; border-bottom:1px solid var(--line); }
  header svg { width:38px; height:38px; flex:none; }
  h1 { font-size:19px; margin:0; letter-spacing:.06em; text-transform:uppercase; }
  .sub { color:var(--dim); font-size:12px; letter-spacing:.08em; text-transform:uppercase; margin-top:2px; }
  .badge { margin-left:auto; text-align:right; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--dim); }
  .dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--sec); margin-right:6px; vertical-align:middle; }
  .dot.bad { background:#ff5f56; }
  section { margin-top:26px; }
  h2 { font-size:13px; letter-spacing:.14em; text-transform:uppercase; color:var(--dim); margin:0 0 8px; font-weight:600; }
  p.lead { margin:0 0 12px; color:var(--ink); }
  .card { border:1px solid var(--line); background:var(--card); padding:12px 14px; }
  .row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  code, .mono { font-family:inherit; }
  .url { flex:1 1 260px; min-width:0; overflow-wrap:anywhere; color:var(--sec); font-size:14px; }
  button, a.btn { font:inherit; font-size:12px; letter-spacing:.1em; text-transform:uppercase;
    background:transparent; color:var(--ink); border:1px solid var(--line); padding:10px 14px; min-height:44px;
    cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; gap:8px; }
  button:hover, a.btn:hover { border-color:var(--sec); color:var(--sec); }
  pre { margin:10px 0 0; padding:12px; border:1px solid var(--line); background:#04070b;
    overflow-x:auto; font-size:12.5px; color:var(--dim); }
  pre b { color:var(--sec); font-weight:400; }
  ol { margin:0; padding-left:20px; color:var(--dim); }
  ol li { margin:6px 0; }
  ol li b { color:var(--ink); font-weight:400; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  td { padding:7px 0; border-bottom:1px solid var(--line); color:var(--dim); vertical-align:top; }
  td:first-child { color:var(--ink); padding-right:12px; white-space:nowrap; }
  footer { margin-top:34px; padding-top:16px; border-top:1px solid var(--line); color:var(--dim); font-size:12px;
    display:flex; gap:14px; flex-wrap:wrap; }
  footer a, .card a { color:var(--dim); }
  footer a:hover, .card a:hover { color:var(--sec); }
  .flash { color:var(--sec); }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <svg viewBox="0 0 100 100" role="img" aria-label="mosADD">
      <rect width="100" height="100" fill="#06090f"/>
      <defs><radialGradient id="s"><stop offset="0%" stop-color="#20c568"/><stop offset="62%" stop-color="#13763e"/><stop offset="100%" stop-color="#13763e" stop-opacity="0"/></radialGradient></defs>
      <circle cx="50" cy="50" r="34" fill="url(#s)"/>
      <circle cx="50" cy="50" r="26" fill="none" stroke="#5af082" stroke-width="2"/>
      <path d="M50 24v52M24 50h52" stroke="#5af082" stroke-width="2" stroke-opacity=".55"/>
    </svg>
    <div>
      <h1>mosADD MCP gateway</h1>
      <div class="sub">one URL · any agent runtime</div>
    </div>
    <div class="badge" id="status"><span class="dot" id="dot"></span><span id="statusText">gateway live</span><br><span id="toolText">${esc(tools)} tools</span></div>
  </header>

  <section>
    <h2>1 · Add as a connector</h2>
    <div class="card">
      <div class="row">
        <span class="url mono" id="connectorUrl">${esc(CONNECTOR_URL)}</span>
        <button type="button" id="copyUrl" data-copy="${esc(CONNECTOR_URL)}">Copy URL</button>
      </div>
      <p class="lead" style="margin:12px 0 0;color:var(--dim);font-size:13px">
        Claude, ChatGPT, Cursor, Windsurf, Cline, or your own runtime — paste this URL where the client
        asks for an MCP server. The bare host <b class="mono">https://mcp.mosadd.com</b> works too.
      </p>
    </div>
  </section>

  <section>
    <h2>2 · Sign in</h2>
    <div class="card">
      <ol>
        <li>Add the connector URL above in your client.</li>
        <li>Approve the <b>mosADD</b> sign-in screen your client opens (OAuth 2.1, RFC 9728 discovery).</li>
        <li>The connector gets a <b>scoped session</b> — the tools answer as the identity that signed in.</li>
      </ol>
      <div class="row" style="margin-top:12px">
        <a class="btn" href="${esc(KEYS_URL)}">API keys</a>
        <a class="btn" href="${esc(APP_URL)}">Open mosADD</a>
      </div>
    </div>
  </section>

  <section>
    <h2>3 · Or talk JSON-RPC directly</h2>
    <div class="card">
      <p class="lead" style="margin:0;color:var(--dim);font-size:13px">
        No client? Send the same streamable-HTTP protocol by hand. Paste a live key from
        <a href="${esc(KEYS_URL)}">mosadd.com/keys</a> — the ellipsis below is not a key.
      </p>
      <pre id="curlSample">${esc(CURL_SAMPLE)}</pre>
      <div class="row" style="margin-top:12px">
        <button type="button" id="copyCurl">Copy command</button>
      </div>
    </div>
  </section>

  <section>
    <h2>Endpoints</h2>
    <table>
      <tr><td>POST /mcp</td><td>MCP over streamable HTTP (canonical connector URL). No key → 401 + <span class="mono">WWW-Authenticate</span>, which starts OAuth.</td></tr>
      <tr><td>GET /mcp</td><td>Same 401 handshake, for clients that probe before adding.</td></tr>
      <tr><td>GET /health</td><td>Machine-readable status: <span class="mono">{"ok":true,"tools":N,"version":"…"}</span>.</td></tr>
      <tr><td>/.well-known/…</td><td><span class="mono">oauth-protected-resource</span> and <span class="mono">oauth-authorization-server</span> discovery documents.</td></tr>
    </table>
  </section>

  <footer>
    <a href="${esc(APP_URL)}">mosadd.com</a>
    <a href="${esc(KEYS_URL)}">keys</a>
    <span id="versionText"></span>
  </footer>
</div>
<script>
(function () {
  function copy(btn, text) {
    var done = function () { var old = btn.textContent; btn.textContent = 'Copied'; btn.classList.add('flash');
      setTimeout(function () { btn.textContent = old; btn.classList.remove('flash'); }, 1200); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
    } else { fallback(text); done(); }
  }
  function fallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta);
  }
  document.querySelectorAll('button[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () { copy(b, b.getAttribute('data-copy')); });
  });
  var curlBtn = document.getElementById('copyCurl');
  if (curlBtn) curlBtn.addEventListener('click', function () { copy(curlBtn, document.getElementById('curlSample').textContent); });

  // Live badge — the page still reads correctly if this probe never answers.
  fetch('/health', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (h) {
    if (!h) return;
    if (h.tools) document.getElementById('toolText').textContent = h.tools + ' tools';
    if (h.version) document.getElementById('versionText').textContent = 'gateway ' + h.version;
    document.getElementById('statusText').textContent = 'gateway live';
    document.getElementById('dot').classList.remove('bad');
  }).catch(function () {
    document.getElementById('statusText').textContent = 'status unavailable';
    document.getElementById('dot').classList.add('bad');
  });
})();
</script>
</body>
</html>`;
}
