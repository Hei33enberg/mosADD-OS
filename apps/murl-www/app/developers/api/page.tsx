import type { Metadata } from 'next';
import Link from 'next/link';
import { CodeBlock } from '../../_components/CodeBlock';
import { GITHUB_URL, TRENDING_URL } from '../../../lib/site';

const DOCS = `${GITHUB_URL}/blob/main/apps/channel0-ext/docs`;
const EDGE = 'https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1';
const WORKER = 'https://mosadd-edge.mr-brics-33.workers.dev';

export const metadata: Metadata = {
  title: 'API reference',
  description:
    'mURL public API — anonymous join (proof-of-work), live WebSocket chat protocol, presence, trending rooms, message reports, and DNS-verified domain control. Open source, CORS-open.',
  openGraph: {
    title: 'mURL API reference',
    description: 'Public HTTP + WebSocket API for mURL anonymous per-domain chat. Open source.',
    type: 'website',
  },
};

function Endpoint({ method, path, children }: { method: string; path: string; children: React.ReactNode }) {
  return (
    <section className="scroll-mt-20 border-t border-border py-8" id={path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}>
      <div className="mb-3 flex items-center gap-3">
        <span className="bg-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary-foreground">{method}</span>
        <code className="font-mono text-sm text-foreground">{path}</code>
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function ApiReferencePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <div className="text-xs uppercase tracking-[0.3em] text-primary/80">mURL · developers</div>
      <h1 className="font-display mt-2 text-4xl font-bold text-foreground md:text-5xl">API reference</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Every endpoint is public and CORS-open. The extension is the supported client — these are documented for
        transparency, self-hosting, and tooling, not as a stability guarantee. Respect the rate limits and the kill
        switch. Canonical source:{' '}
        <a className="text-primary underline" href={`${DOCS}/API.md`}>API.md</a> ·{' '}
        <Link className="text-primary underline" href="/developers">developer hub</Link>.
      </p>

      {/* base URLs */}
      <div className="mt-8">
        <CodeBlock label="base urls">{`# Supabase edge functions
${EDGE}

# Cloudflare Worker (WSS + HTTP)
${WORKER}`}</CodeBlock>
      </div>

      <Endpoint method="POST" path="/channel0-join">
        <p>Anonymous, proof-of-work–gated mint of a 5-minute channel-scoped JWT.</p>
        <CodeBlock label="request → 428 challenge → 200">{`curl -X POST ${EDGE}/channel0-join \\
  -H 'content-type: application/json' \\
  -d '{"domain":"nike.com","device_token":"<uuid>","nick":"lucky-otter-77"}'
# ← 428  { "pow_bits": 12, "server_ts": 1780459620 }

# solve hashcash: find nonce so that
#   sha256("nike.com:<token>:1780459620:<nonce>") has 12 leading zero bits
curl -X POST ${EDGE}/channel0-join -H 'content-type: application/json' \\
  -d '{"domain":"nike.com","device_token":"<uuid>","nick":"lucky-otter-77",
       "pow_ts":1780459620,"pow_nonce":"<solution>"}'
# ← 200  { "token":"<jwt>", "expires_in":300, "channel_id":"nike-com",
#          "status":"open", "branding":{}, "scope":"chat:rw" }`}</CodeBlock>
        <p><strong className="text-foreground">Errors:</strong> <code>451</code> disabled by owner · <code>429</code> rate-limited (<code>Retry-After</code>) · <code>503</code> <code>{'{reason:"killswitch"}'}</code> · <code>428</code> PoW required.</p>
      </Endpoint>

      <Endpoint method="WSS" path="/c/:slug/ws">
        <p>Live chat. Pass the token via the WebSocket sub-protocol header — never the URL.</p>
        <CodeBlock label="websocket">{`wss://<edge>/c/nike-com/ws
Sec-WebSocket-Protocol: mosadd.v1, bearer.<token>

# inbound (server → client)
← { "type":"presence", "count":12, "roster":["lucky-otter-77","calm-fox-12"] }
← { "id":"<uuid>", "ts":1780459620575, "from":"anon:lucky-otter-77", "text":"hi" }
← { "error":"rate_limited", "retry_after":3 }

# outbound (client → server)
→ { "text":"hello", "from":"anon:lucky-otter-77" }`}</CodeBlock>
        <p>Strip the <code>anon:</code> prefix from <code>from</code> for display. Reconnect with backoff and re-mint a fresh token on close (tokens live 5 min).</p>
      </Endpoint>

      <Endpoint method="GET" path="/c/:slug/presence">
        <CodeBlock label="presence">{`curl ${WORKER}/c/nike-com/presence
# → { "count":12, "roster":[...], "branding":{}, "status":"open" }

curl ${WORKER}/health
# → { "ok":true, "service":"mosadd-edge", "phase":"..." }`}</CodeBlock>
      </Endpoint>

      <Endpoint method="GET" path="/channel0-trending">
        <p>Active rooms in a time window (5–1440 min, default 60). Pure read; hides blocked rooms.</p>
        <CodeBlock label="trending">{`curl "${TRENDING_URL}?minutes=120"
# → { "minutes":120, "since":"<iso>",
#     "items":[ { "slug":"nike-com", "domain":"nike.com",
#                 "messages":42, "last_ts":"<iso>",
#                 "status":"open", "branding":{} } ] }`}</CodeBlock>
        <p>Filter internal/test rooms client-side (non-domain slugs, <code>.test</code>, etc.).</p>
      </Endpoint>

      <Endpoint method="POST" path="/channel0-report">
        <p>Flag a message. Idempotent per <code>(message_id, reporter_hash)</code> — one device can’t ratchet the count. A DB trigger soft-deletes the message at <strong className="text-foreground">3 distinct reporters</strong>. Throttle 20/min/device.</p>
        <CodeBlock label="report">{`curl -X POST ${EDGE}/channel0-report -H 'content-type: application/json' \\
  -d '{"message_id":"<uuid>","channel_slug":"nike-com",
       "device_token":"<uuid>","reason":"spam"}'   # spam|abuse|illegal|other
# → { "ok":true, "reported":true, "reporter_count":2 }`}</CodeBlock>
      </Endpoint>

      <Endpoint method="POST" path="/domain-verify">
        <p>Domain owners: prove control via a DNS TXT record at <code>_mosadd-channel0.&lt;domain&gt;</code>, then control the room. Verification is always DNS — never inferred.</p>
        <CodeBlock label="domain-verify">{`curl -X POST ${EDGE}/domain-verify -d '{"domain":"yoursite.com","action":"challenge"}'
# actions: challenge → verify → (open | disable | brand)
#   disable  → room returns 451 to all joiners (free for verified owners)
#   brand    → { accent_color, pinned_message, official_badge, owner_name }`}</CodeBlock>
        <p>Exact field names + claim/brand schema: see <a className="text-primary underline" href={`${DOCS}/API.md`}>API.md</a> and the <code>domain-verify</code> source.</p>
      </Endpoint>

      <section className="border-t border-border py-8">
        <h2 className="font-display text-xl font-semibold text-foreground">Identifiers</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li>· <strong className="text-foreground">slug</strong> = registrable domain, dots → dashes, <code>[a-z0-9-]{'{1,128}'}</code> (<code>nike.com</code> → <code>nike-com</code>)</li>
          <li>· <strong className="text-foreground">thread_id</strong> = <code>chat:&lt;slug&gt;</code> in <code>messages_meta</code></li>
          <li>· <strong className="text-foreground">sender_sub</strong> = <code>anon:&lt;nick&gt;</code> (GDPR erase key)</li>
          <li>· <strong className="text-foreground">DNS verify record</strong> = <code>_mosadd-channel0.&lt;domain&gt;</code> TXT</li>
        </ul>
      </section>

      <div className="border-t border-border pt-8 text-sm text-muted-foreground">
        More: <a className="text-primary underline" href={`${DOCS}/ARCHITECTURE.md`}>Architecture</a> ·{' '}
        <a className="text-primary underline" href={`${DOCS}/SELF-HOSTING.md`}>Self-hosting</a> ·{' '}
        <a className="text-primary underline" href={GITHUB_URL}>GitHub</a>
      </div>
    </div>
  );
}
