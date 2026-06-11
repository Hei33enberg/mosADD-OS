import { NextResponse } from 'next/server';

// mosadd.dev — OFFLINE. Every request, every path, every method gets the
// same static "we're cooking" page. No password, no unlock. To bring the
// site back: delete this file and push.
export const config = {
  matcher: [
    // Block everything except Vercel internals + the static health endpoint
    // (so monitoring can still tell the deploy is alive). Including the
    // embed CDN /v1.js so third-party sites also stop trying to render
    // mIRC widgets while we're parked.
    '/((?!_next/static|_next/image|_vercel).*)',
  ],
};

export default function middleware() {
  return new NextResponse(offlinePage(), {
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': '604800', // 7 days, advisory
      'x-mosadd-status': 'offline',
    },
  });
}

function offlinePage(): string {
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="no-referrer">
<title>mosadd — offline</title>
<style>
  :root { color-scheme: dark; }
  html,body { margin:0; padding:0; height:100%; background:#0a0a0a; color:#e8e8e8;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  body { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; text-align:center; }
  .mark { font-size:14px; letter-spacing:0.35em; text-transform:uppercase; color:#00ff7a; font-weight:700; margin-bottom:32px; }
  h1 { font-size:24px; font-weight:700; letter-spacing:0.02em; margin:0 0 18px; max-width:520px; line-height:1.3; }
  p { font-size:13px; color:#888; margin:0 0 8px; max-width:480px; line-height:1.6; }
  .foot { margin-top:48px; font-size:10px; color:#444; letter-spacing:0.25em; text-transform:uppercase; }
</style></head><body>
  <div class="mark">mosADD&trade;</div>
  <h1>Down for the moment.</h1>
  <p>We&rsquo;re reworking the whole thing. No timeline.</p>
  <p>Come back later.</p>
  <div class="foot">trust no trace.</div>
</body></html>`;
}
