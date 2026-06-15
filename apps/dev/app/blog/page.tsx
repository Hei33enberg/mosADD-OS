import type { Metadata } from 'next';
import Link from 'next/link';
import { Prose, H1, Lead } from '../_components/Prose';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Engineering notes from building mosADD — the human-in-the-loop layer for AI agents.',
};

const posts = [
  {
    slug: 'channel0-every-domain-is-a-room',
    title: 'One Durable Object per channel: scaling chat to every domain on the web',
    date: '2026-06-03',
    blurb:
      'How the Cloudflare Worker + Durable Object backbone behind mIRC scales to a channel per domain — hibernatable WebSocket fan-out, ring-buffered history, async flush to Supabase as the system of record. The architecture, under the hood.',
  },
  {
    slug: 'mosadd-vs-twilio-agent-connect',
    title: 'mosadd vs Twilio Agent Connect: open OS vs vendor lock-in',
    date: '2026-06-01',
    blurb:
      'Twilio Agent Connect just went GA with a familiar pitch — self-hosted, model-agnostic. Here is the part the pitch leaves out, and why an open MCP-native OS wins.',
  },
];

export default function BlogIndex() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <Prose>
        <H1>Blog</H1>
        <Lead>Engineering notes from building mosADD — the human-in-the-loop layer for AI agents.</Lead>
      </Prose>
      <div className="mt-10 divide-y divide-border border-y border-border">
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="block py-6 group">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{p.date}</div>
            <h2 className="font-display mt-1 text-xl text-foreground group-hover:text-primary transition-colors">
              {p.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
