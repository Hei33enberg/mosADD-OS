/**
 * Comparison table — the reason-to-believe artifact.
 * Honest side-by-side vs the closest alternatives. No strawman: where a
 * competitor genuinely does something, it's marked.
 */
import { Logo } from './Logo';

type Cell = { v: 'yes' | 'no' | 'partial'; note?: string } | { text: string };

const COLS = ['mosadd', 'Twilio Agent Connect', 'Composio', 'LiveKit'] as const;

const ROWS: Array<{ label: string; cells: Cell[] }> = [
  {
    label: 'Open source (Apache-2.0)',
    cells: [
      { v: 'yes', note: 'whole stack' },
      { v: 'partial', note: 'SDK only' },
      { v: 'partial', note: 'SDK only' },
      { v: 'yes', note: 'server' },
    ],
  },
  {
    label: 'Vendor-agnostic / BYOK',
    cells: [
      { v: 'yes', note: 'your keys or self-host' },
      { v: 'no', note: 'Twilio network' },
      { v: 'partial' },
      { v: 'partial', note: 'voice infra' },
    ],
  },
  {
    label: 'Channels: DM · chan · rooms · mail · voice',
    cells: [
      { v: 'yes', note: '6 live channels' },
      { v: 'partial', note: 'voice · SMS · WA' },
      { v: 'no', note: 'tools, not comms' },
      { v: 'partial', note: 'voice/video' },
    ],
  },
  {
    label: 'MCP-native (one server, any agent)',
    cells: [{ v: 'yes' }, { v: 'no', note: 'SDK' }, { v: 'yes' }, { v: 'no' }],
  },
  {
    label: 'E2E encryption in the kernel',
    cells: [
      { v: 'yes', note: 'X3DH + Ratchet' },
      { v: 'no' },
      { v: 'no' },
      { v: 'no', note: 'transport TLS' },
    ],
  },
  {
    label: 'Self-host',
    cells: [{ v: 'yes' }, { v: 'no' }, { v: 'partial' }, { v: 'yes' }],
  },
  {
    label: 'Price model',
    cells: [
      { text: 'Usage · BYOK=$0 · self-host $0' },
      { text: 'Usage (per Twilio rates)' },
      { text: 'Usage / seat' },
      { text: 'Usage (compute+bw)' },
    ],
  },
];

function Mark({ cell }: { cell: Cell }) {
  if ('text' in cell) return <span className="text-xs text-muted-foreground">{cell.text}</span>;
  const sym = cell.v === 'yes' ? '✓' : cell.v === 'no' ? '✗' : '~';
  const color =
    cell.v === 'yes' ? 'text-primary' : cell.v === 'no' ? 'text-destructive/70' : 'text-warning';
  return (
    <span className="inline-flex flex-col items-center">
      <span className={`text-base font-bold ${color}`}>{sym}</span>
      {cell.note ? <span className="text-[10px] leading-tight text-muted-foreground">{cell.note}</span> : null}
    </span>
  );
}

export function ComparisonTable() {
  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Capability
            </th>
            {COLS.map((c, i) => (
              <th
                key={c}
                className={`px-4 py-3 text-center font-display text-sm ${
                  i === 0 ? 'bg-primary/[0.06] text-primary' : 'text-foreground'
                }`}
              >
                {i === 0 ? <Logo size="sm" /> : c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-3 text-muted-foreground">{row.label}</td>
              {row.cells.map((cell, i) => (
                <td
                  key={i}
                  className={`px-4 py-3 text-center align-top ${i === 0 ? 'bg-primary/[0.04]' : ''}`}
                >
                  <Mark cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
