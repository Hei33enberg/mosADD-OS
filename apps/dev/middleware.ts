import { NextRequest, NextResponse } from 'next/server';

// Full-site password gateway for mosadd.dev.
// Founder hit pause on the panels work — site is parked behind a password
// until they're back with energy. Set `GATE_PASSWORD` on Vercel to override
// the default. Cookie is HttpOnly + 30 days; survives normal navigation.
const PASSWORD = process.env.GATE_PASSWORD ?? 'mosadd2026';
const COOKIE = 'mosadd_dev_gate';
const UNLOCKED = 'ok';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const config = {
  matcher: [
    // Gate everything except Next internals + a couple of public assets the
    // gate page itself references (favicon/manifest). The embed CDN (/v1.js)
    // is also exempt so third-party sites that already embed mIRC don't break
    // while the site is parked.
    '/((?!_next/static|_next/image|_next/data|favicon\\.ico|robots\\.txt|sitemap\\.xml|v1\\.js|v1\\.js\\.map|opengraph-image|twitter-image|apple-icon|icon|manifest\\.webmanifest).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  // Already unlocked → pass through.
  if (req.cookies.get(COOKIE)?.value === UNLOCKED) return NextResponse.next();

  const url = req.nextUrl;

  // Unlock GET. Next 15 dev mode bypasses middleware on POST in some cases,
  // so we use GET — the password lives in the URL only for the one unlock
  // request, then the cookie does the work forever. Same security in practice
  // for a parking gate.
  if (url.searchParams.get('_gate') === '1') {
    const pwd = url.searchParams.get('p');
    const next = url.searchParams.get('next') || '/';
    if (pwd && pwd === PASSWORD) {
      const res = NextResponse.redirect(new URL(next, req.url), 303);
      res.cookies.set(COOKIE, UNLOCKED, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: MAX_AGE,
      });
      return res;
    }
    return new NextResponse(gatePage(next, true), {
      status: 401,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  // Locked → render gate.
  return new NextResponse(gatePage(url.pathname + url.search, false), {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function gatePage(nextPath: string, wrong: boolean): string {
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="no-referrer">
<title>mosadd.dev — locked</title>
<style>
  :root { color-scheme: dark; }
  html,body { margin:0; padding:0; height:100%; background:#0a0a0a; color:#e8e8e8;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  body { display:flex; align-items:center; justify-content:center; padding:24px; }
  .card { width:100%; max-width:380px; border:1px solid #222; padding:28px; }
  h1 { font-size:14px; letter-spacing:0.3em; text-transform:uppercase; margin:0 0 4px; color:#00ff7a; }
  p { font-size:12px; color:#888; margin:0 0 20px; line-height:1.5; }
  form { display:flex; flex-direction:column; gap:10px; }
  input { background:#000; border:1px solid #333; color:#e8e8e8; padding:10px 12px;
    font: inherit; font-size:13px; outline:none; }
  input:focus { border-color:#00ff7a; }
  button { background:#00ff7a; color:#000; border:0; padding:10px 12px; font: inherit;
    font-weight:700; text-transform:uppercase; letter-spacing:0.2em; font-size:11px; cursor:pointer; }
  .err { color:#ff5577; font-size:11px; margin-top:8px; }
  .foot { margin-top:20px; font-size:10px; color:#555; letter-spacing:0.15em; text-transform:uppercase; }
</style></head><body>
<div class="card">
  <h1>mosADD · dev</h1>
  <p>Parked — back when we&rsquo;ve got the spark.</p>
  <form method="GET" action="/" autocomplete="off">
    <input type="hidden" name="_gate" value="1">
    <input type="hidden" name="next" value="${nextPath.replace(/"/g, '&quot;')}">
    <input type="password" name="p" autofocus autocomplete="off" placeholder="password" required>
    <button type="submit">unlock</button>
    ${wrong ? '<div class="err">wrong password</div>' : ''}
  </form>
  <div class="foot">trust no trace.</div>
</div>
</body></html>`;
}
