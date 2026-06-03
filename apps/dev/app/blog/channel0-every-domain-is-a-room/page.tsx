import type { Metadata } from 'next';
import Link from 'next/link';
import { Prose, H1, Lead, H2, P, Ul, Anchor, Callout } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'channel 0: every domain is a chat room | mosadd',
  description:
    'A browser extension turning every domain on the web into a live anonymous chat room. Same Cloudflare Worker + Durable Object backbone that powers the mosadd kernel. Built in a weekend. Here is how.',
  openGraph: {
    title: 'channel 0: every domain is a chat room',
    description: 'Browser extension. Same kernel as the toolkit. Internet-scale demo of the mosadd backbone, one domain at a time.',
    type: 'article',
  },
};

export default function Post() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <Prose>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">2026-06-03 · launch</div>
        <H1>channel 0: how we turned every domain on the web into a chat room in a weekend</H1>
        <Lead>
          A browser extension. Open it on zalando.pl and you are in <span className="font-mono">#zalando.pl</span>{' '}
          with every other shopper there right now. Open it on bbc.co.uk and you are in{' '}
          <span className="font-mono">#bbc.co.uk</span>. The channel auto-creates the moment the first user joins.
          Anonymous. No accounts. Try it on any website on earth.
        </Lead>

        <P>
          That is the product. <Anchor href="/channel0">Install it</Anchor>. The rest of this post is about why a
          consumer extension is the right way to prove a developer toolkit at internet scale — and how the kernel
          underneath made the whole thing a weekend build.
        </P>

        <H2>The viral mechanic</H2>
        <P>
          Most chat products start with the hardest problem: empty rooms. Slack, Discord, Twitter Spaces — all of
          them spend years bribing people to invite their friends. channel 0 inverts that. The room already exists.
          You did not create it. You did not invite anyone. You opened a tab and the room opened with you.
        </P>
        <P>
          The mechanic is older than the web. It is just IRC, scoped to the URL bar. Walk into{' '}
          <span className="font-mono">#hacker-news</span> on EFnet in 1998 and there were people. You did not
          recruit them. They were already there because everyone who cared about that topic was already there.
          What changed is that the modern web has billions of domains, every one of them a viable channel name,
          and exactly zero of them are currently chatting with each other in real-time.
        </P>
        <Callout type="success">
          <strong>The 0-to-1 of any chat app is &ldquo;will there be anyone in the room when I open it.&rdquo;</strong>{' '}
          channel 0 answers this trivially: whoever else is on zalando.pl right now.
        </Callout>

        <H2>Why an extension proves the kernel</H2>
        <P>
          The mosadd toolkit ships a Cloudflare Worker plus a Durable Object per channel as the real-time
          backbone for mIRC, mROOM, and friends. We had load tests, we had a prototype client, we had paying dev
          accounts. What we did not have was internet-scale read traffic. Servers and synthetic load tests do not
          fight the same fights as 50k real users on a strike day.
        </P>
        <P>
          channel 0 forces that fight. Every install opens a WebSocket. Every domain a user visits spins up a new
          Durable Object on the edge. By Tuesday the kernel will have been beaten up across more channels and more
          concurrent connections than the entire toolkit user base will ever produce. The cost is bounded — DOs
          hibernate to free memory, messages persist as a ring buffer in DO storage with async flush to Supabase,
          rate-limit counters cap each device. The reward is brand impressions: every chat panel renders{' '}
          <span className="font-mono">Powered by mosadd</span> on the bottom, every Chrome Web Store search hit
          surfaces the mosadd developer toolkit.
        </P>

        <H2>How it works under the hood</H2>
        <P>The whole stack:</P>
        <Ul>
          <li>
            <strong>Extension</strong>: MV3, side-panel-first. Content script reads only{' '}
            <span className="font-mono">document.location.hostname</span>, never the DOM. Domain normalizer
            collapses <span className="font-mono">www.zalando.pl/men</span>, <span className="font-mono">m.zalando.pl</span>
            , and <span className="font-mono">zalando.pl/x?q=1</span> to the same eTLD+1{' '}
            <span className="font-mono">zalando.pl</span> → one room.
          </li>
          <li>
            <strong>Anon mint</strong>: <span className="font-mono">channel0-join</span> Supabase edge function. Takes a
            random device token, returns a 5-min HS256 channel-scoped JWT. Stateless proof-of-work hashcash gates the
            mint (12-bit difficulty, ~100ms in a browser, brutal at bot scale).
          </li>
          <li>
            <strong>Transport</strong>: WebSocket to Cloudflare Worker + Durable Object{' '}
            <span className="font-mono">/c/&lt;slug&gt;/ws</span>. JWT carried in{' '}
            <span className="font-mono">Sec-WebSocket-Protocol: mosadd.v1, bearer.&lt;jwt&gt;</span> — never in the URL,
            never logged.
          </li>
          <li>
            <strong>Channel</strong>: one Durable Object per slug, hibernatable WebSocket fan-out, 100-msg ring,
            presence roster, async flush to <span className="font-mono">messages_meta</span> as durable
            system-of-record (<span className="font-mono">thread_id=chat:&lt;slug&gt;</span>).
          </li>
          <li>
            <strong>Identity</strong>: deterministic adjective-noun-NN nick generated from{' '}
            <span className="font-mono">FNV-1a(deviceToken | domain)</span>. Same install, same nick across visits,
            different nick per domain. No fingerprinting library.
          </li>
        </Ul>
        <P>
          The whole &ldquo;new&rdquo; code in this product is roughly: the extension itself, the anonymous
          token-mint endpoint, presence in the Worker, the domain normalizer, and the proof-of-work. Everything
          else — auth, rate-limit, durable persistence, the channel-scoped JWT format — already shipped with the
          mosadd toolkit.
        </P>

        <H2>Privacy posture</H2>
        <P>
          We only see the registrable domain, never the full URL or page content. No browsing history.
          No fingerprinting library. The device token is a per-install random UUID, hashed server-side before it
          touches the DB. Full posture at{' '}
          <Anchor href="/channel0/privacy">/channel0/privacy</Anchor>.
        </P>

        <H2>What domain owners get</H2>
        <P>Every chat panel renders a non-affiliation banner:</P>
        <Callout>
          <em>Independent chat — DOMAIN is not affiliated. Powered by mosadd.</em>
        </Callout>
        <P>
          If you own the domain and want to disable the chat on it, you can do that for free by verifying
          ownership via DNS TXT at <Anchor href="/channel0#own-a-domain">mosadd.dev/channel0</Anchor>.
          Branded &ldquo;official&rdquo; channels are a paid tier — that is the revenue model. Most domains will
          stay open. That is the point.
        </P>

        <H2>Why we shipped it</H2>
        <P>
          channel 0 is the energizer for the mosadd developer toolkit. Every domain that gets traffic is a free
          billboard for the kernel. Every Chrome install pulls a new developer to{' '}
          <Anchor href="https://mosadd.dev">mosadd.dev</Anchor>. Every brand-owned channel is a paying customer
          who self-served through DNS verification. The product subsidizes its own distribution.
        </P>
        <P>
          More importantly: it is fun. The web has been a one-way medium since 1995 — pages that you read and that
          do not know you exist. channel 0 makes every domain a place where the rest of us are also currently
          standing. Try it on a domain you visit a lot. There is probably someone there.
        </P>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/channel0"
            className="rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Install →
          </Link>
          <a
            href="https://github.com/Hei33enberg/mosADD-OS/tree/main/apps/channel0-ext"
            target="_blank"
            rel="noreferrer"
            className="rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50"
          >
            Source code ↗
          </a>
          <Link
            href="/channel0#own-a-domain"
            className="rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50"
          >
            I own a domain →
          </Link>
        </div>
      </Prose>
    </div>
  );
}
