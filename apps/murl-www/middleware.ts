import { NextResponse, type NextRequest } from 'next/server';

// murl.mosadd.com — permanently redirected to the mosADD SPA public viewer at
// mosadd.com/m/<slug>. The old Next.js viewer here is superseded by /m/:slug
// (see m0ssad-3 commit d32cb2c8). Path + query are preserved: e.g.
// murl.mosadd.com/allegro-pl?x=1 → mosadd.com/m/allegro-pl?x=1.
// Vercel serves this middleware AND the vercel.json `redirects` fallback below
// (belt & suspenders — even if a deploy is misconfigured, the Vercel redirect wins).
export const config = {
  matcher: ['/((?!_next/static|_next/image|_vercel).*)'],
};

export default function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname === '/' ? '' : url.pathname; // "/allegro-pl" or ""
  const dest = new URL(`/m${path}${url.search}`, 'https://mosadd.com');
  return NextResponse.redirect(dest, 308); // permanent, method-preserving
}
