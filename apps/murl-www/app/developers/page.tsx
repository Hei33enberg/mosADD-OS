import type { Metadata } from 'next';
import Link from 'next/link';
import { CodeBlock } from '../_components/CodeBlock';
import { GITHUB_URL, TRENDING_URL } from '../../lib/site';

const REPO = `${GITHUB_URL}/tree/main/apps/channel0-ext`;
const DOCS = `${GITHUB_URL}/blob/main/apps/channel0-ext/docs`;

export const metadata: Metadata = {
  title: 'Developers',
  description:
    'mURL is open source (Apache-2.0). Architecture, public API, self-hosting and how to contribute. Built on Cloudflare Workers + Durable Objects + Supabase.',
  openGraph: {
    title: 'mURL for developers — open source, self-hostable',
    description: 'Architecture, API, self-hosting and contribution guide for mURL. Apache-2.0.',
    type: 'website',
  },
};

const stack = [
  ['Real-time', 'Cloudflare Workers + Durable Objects — one DO per domain, hibernatable WebSocket fan-out, ring-buffered history'],
  ['Token auth', 'Anonymous 5-min HS256 channel-scoped JWT, passed via Sec-WebSocket-Protocol — never a key in the browser'],
  ['Anti-abuse', 'Proof-of-work join gate + per-device/IP/WS rate limits + report→auto-hide'],
  ['Persistence', 'Supabase messages_meta as the durable system-of-record (thread_id = chat:<slug>)'],
  ['Identity', 'Deterministic nick + salted-hashed per-install device token — no fingerprint'],
];

export default function DevelopersPage() {
  return (
    <div className="relative mx-auto max-w-5xl px-6">
      {/* Hero */}
      <section className="relative overflow-hidden border-x border-border px-6 py-16 md:py-20">
        <span className="hud-bracket hud-tl" />
        <span className="hud-bracket hud-tr" />
        <span className="hud-bracket hud-bl" />
        <span className="hud-bracket hud-br" />
        <div className="mb-4 text-xs uppercase tracking-[0.3em] text-primary/80">mURL · developers</div>
        <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-5xl">
          mURL is <span className="text-primary text-glow">open source</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          A Chrome extension plus a small, stateless backend that turns any domain into a live room.
          Apache-2.0, built on the same real-time backbone as the{' '}
          <a className="text-primary underline" href="https://mosadd.dev">mosADD</a> toolkit. Read the code, call the
          API, or run the whole stack yourself.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={REPO} target="_blank" rel="noreferrer" className="rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            View source on GitHub →
          </a>
          <a href={`${DOCS}/ARCHITECTURE.md`} target="_blank" rel="noreferrer" className="rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50">
            Architecture ↗
          </a>
          <a href={`${DOCS}/API.md`} target="_blank" rel="noreferrer" className="rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50">
            API reference ↗
          </a>
        </div>
      </section>

      {/* Stack */}
      <section className="border-x border-b border-border px-6 py-14">
        <div className="mb-6 text-xs uppercase tracking-[0.25em] text-muted-foreground">The stack</div>
        <div className="grid gap-px bg-border">
          {stack.map(([k, v]) => (
            <div key={k} className="grid grid-cols-1 gap-1 bg-background px-5 py-3 md:grid-cols-[160px_1fr] md:gap-6">
              <div className="font-display text-sm text-primary">{k}</div>
              <div className="text-sm text-muted-foreground">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* API quickstart */}
      <section className="border-x border-b border-border px-6 py-14">
        <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary/80">API</div>
        <h2 className="font-display text-3xl font-semibold">Talk to the backbone directly</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every endpoint is public and CORS-open. Full reference in{' '}
          <a className="text-primary underline" href={`${DOCS}/API.md`}>API.md</a>. Be a good citizen — respect the
          rate limits and the kill switch.
        </p>

        <div className="mt-8 space-y-8">
          <div>
            <div className="mb-2 font-mono text-sm text-foreground">Live rooms right now</div>
            <CodeBlock label="trending">{`curl "${TRENDING_URL}?minutes=120"
# → { items: [ { slug, domain, messages, last_ts, status } ] }`}</CodeBlock>
          </div>

          <div>
            <div className="mb-2 font-mono text-sm text-foreground">Join a room (proof-of-work gated)</div>
            <CodeBlock label="channel0-join">{`# 1) ask to join → first answer is a PoW challenge
curl -X POST .../functions/v1/channel0-join \\
  -H 'content-type: application/json' \\
  -d '{"domain":"nike.com","device_token":"<uuid>","nick":"lucky-otter-77"}'
# ← 428 { "pow_bits": 12, "server_ts": 1780459620 }

# 2) solve sha256(domain:token:ts:nonce) with N leading zero bits, retry with
#    pow_ts + pow_nonce → 200 { token, channel_id, expires_in: 300, ... }`}</CodeBlock>
          </div>

          <div>
            <div className="mb-2 font-mono text-sm text-foreground">Open the live socket</div>
            <CodeBlock label="websocket">{`wss://<edge>/c/nike-com/ws
Sec-WebSocket-Protocol: mosadd.v1, bearer.<token>

← { "type":"presence", "count":12, "roster":[...] }
← { "id":"<uuid>", "ts":..., "from":"anon:lucky-otter-77", "text":"hi" }
→ { "text":"hello", "from":"anon:lucky-otter-77" }`}</CodeBlock>
          </div>

          <div>
            <div className="mb-2 font-mono text-sm text-foreground">Own a domain? Control its room (DNS-verified)</div>
            <CodeBlock label="domain-verify">{`# prove ownership with a TXT record at _mosadd-channel0.<domain>,
# then open / disable / claim+brand the room. See API.md.
curl -X POST .../functions/v1/domain-verify \\
  -d '{"domain":"yoursite.com","action":"challenge"}'`}</CodeBlock>
          </div>
        </div>
      </section>

      {/* Self-host + contribute */}
      <section className="grid gap-px border-x border-b border-border bg-border md:grid-cols-2">
        <div className="bg-background p-8">
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary/80">Self-host</div>
          <h3 className="font-display text-xl font-semibold">Run your own mURL</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            One Cloudflare Worker (with a Durable Object) + a handful of Deno edge functions on Supabase. Point a custom
            build of the extension at your own stack.
          </p>
          <a href={`${DOCS}/SELF-HOSTING.md`} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-primary underline">
            Self-hosting guide ↗
          </a>
        </div>
        <div className="bg-background p-8">
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary/80">Contribute</div>
          <h3 className="font-display text-xl font-semibold">PRs welcome</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Issues, fixes, new locales, new browsers. Privacy-first invariants apply (no fingerprinting, no reading the
            host page). Security issues: email <span className="font-mono">security@mosadd.dev</span>.
          </p>
          <a href={`${DOCS.replace('/docs', '')}/CONTRIBUTING.md`} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-primary underline">
            Contributing guide ↗
          </a>
        </div>
      </section>

      {/* footer line */}
      <section className="border-x border-b border-border px-6 py-10 text-sm text-muted-foreground">
        Looking for the human version? <Link className="text-primary underline" href="/">murl.mosadd.com</Link>. Building
        with AI agents and want encrypted comms, channels, voice and a knowledge base? That’s{' '}
        <a className="text-primary underline" href="https://mosadd.dev">mosadd.dev</a>.
      </section>
    </div>
  );
}
