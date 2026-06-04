import type { Metadata } from 'next';
import Link from 'next/link';
import { Prose, H1, Lead } from '../_components/Prose';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Notes from building the open OS for agent communications.',
};

const posts = [
  {
    slug: 'channel0-every-domain-is-a-room',
    title: 'mURL: how we turned every domain on the web into an IRC room in a weekend',
    date: '2026-06-03',
    blurb:
      'A browser extension. Open it on zalando.pl and you are in #zalando.pl with everyone there right now. mURL joins mIRC and mIRL on mosadd.dev — same Durable Object per channel, same Supabase ingest. Here is how it works under the hood.',
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
        <Lead>Notes from building the open OS for agent communications.</Lead>
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
