import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Callout, Ul, Anchor, Table } from '../_components/Prose';

export const metadata: Metadata = {
  title: 'Status',
  description: 'Operational status for mosadd.dev, mosadd.com, and hosted services.',
};

export const revalidate = 60;

// Bare-minimum status page: HEAD-checks the public endpoints on render.
// Will move to a proper Better Stack / Sentry Uptime feed once those land in Phase 2.

async function check(url: string): Promise<'ok' | 'down'> {
  try {
    const res = await fetch(url, { method: 'HEAD', next: { revalidate: 60 } });
    return res.ok ? 'ok' : 'down';
  } catch {
    return 'down';
  }
}

export default async function StatusPage() {
  const [dev, com] = await Promise.all([
    check('https://mosadd.dev'),
    check('https://mosadd.com'),
  ]);

  const pill = (s: 'ok' | 'down' | 'pending') => {
    const styles: Record<string, string> = {
      ok: 'text-radar-green border-radar-green/40 bg-radar-green/5',
      down: 'text-red-400 border-red-500/40 bg-red-500/5',
      pending: 'text-neutral-500 border-neutral-700 bg-neutral-900/50',
    };
    const labels: Record<string, string> = {
      ok: 'Operational',
      down: 'Degraded',
      pending: 'Coming soon',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${styles[s]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s === 'ok' ? 'bg-radar-green' : s === 'down' ? 'bg-red-400' : 'bg-neutral-600'}`} />
        {labels[s]}
      </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <Prose>
        <H1>Status</H1>
        <Lead>Operational status for mosadd properties. Refreshed every 60 seconds.</Lead>

        <Callout type="info">
          This page does light HEAD checks at render time. A proper hosted status page lives at{' '}
          <code className="font-mono text-radar-green">status.mosadd.com</code> (coming with Phase 2 hosted MCP).
        </Callout>

        <H2>Public surfaces</H2>
        <Table
          headers={['Service', 'Endpoint', 'Status']}
          rows={[
            ['mosadd.dev', <code key="d" className="font-mono text-xs">https://mosadd.dev</code>, pill(dev)],
            ['mosadd.com', <code key="c" className="font-mono text-xs">https://mosadd.com</code>, pill(com)],
            ['Hosted MCP', <code key="m" className="font-mono text-xs">mcp.mosadd.com</code>, pill('pending')],
            ['Hosted hub', <code key="h" className="font-mono text-xs">mosadd.dev/hub</code>, pill('ok')],
          ]}
        />

        <H2>Incident history</H2>
        <P>No incidents recorded. Full history will live at <code className="font-mono text-radar-green">status.mosadd.com</code> once Phase 2 ships.</P>

        <H2>Subscribe</H2>
        <Ul>
          <li><Anchor href="https://github.com/Hei33enberg/mosadd-os/releases.atom">RSS — release feed</Anchor></li>
          <li>Email subscriptions land with the proper status page in Phase 2</li>
        </Ul>
      </Prose>
    </div>
  );
}
