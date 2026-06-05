'use client';

import { useMemo, useState } from 'react';

/**
 * Interactive cost calculator. Pure client-side math from a rate table — no
 * backend. Shows the cheapest mosadd plan for the entered usage and the
 * estimated cost of wiring the equivalent raw stack (Twilio SMS + LiveKit voice
 * + Telnyx PSTN) yourself.
 *
 * Rates are list/preview rates for the Phase-2 hosted hub; BYOK sets voice/PSTN
 * orchestration to $0 (you pay your own provider at cost).
 */
type Plan = { id: string; name: string; base: number; msg: number; ptt: number; pstn: number };
const PLANS: Plan[] = [
  { id: 'free', name: 'Free', base: 0, msg: 100, ptt: 30, pstn: 0 },
  { id: 'pro', name: 'Pro', base: 9, msg: 10_000, ptt: 600, pstn: 60 },
  { id: 'team', name: 'Team', base: 49, msg: 100_000, ptt: 6_000, pstn: 600 },
];
const OVER = { msg: 0.0006, ptt: 0.005, pstn: 0.015 }; // mosadd overage per unit
const RAW = { msg: 0.0083, ptt: 0.0075, pstn: 0.014 }; // Twilio SMS / LiveKit / Telnyx list

function money(n: number) {
  return n < 10 && n > 0 ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString()}`;
}

function mosaddCost(msg: number, ptt: number, pstn: number, byok: boolean) {
  let best: { plan: Plan; total: number } | null = null;
  for (const p of PLANS) {
    const over =
      Math.max(0, msg - p.msg) * OVER.msg +
      (byok ? 0 : Math.max(0, ptt - p.ptt) * OVER.ptt) +
      (byok ? 0 : Math.max(0, pstn - p.pstn) * OVER.pstn);
    const total = p.base + over;
    if (!best || total < best.total) best = { plan: p, total };
  }
  return best!;
}

function Field({
  label,
  value,
  onChange,
  max,
  step,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max: number;
  step: number;
  hint: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</label>
        <span className="font-display text-sm text-foreground">{value.toLocaleString()}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="text-[10px] text-muted-foreground">{hint}</div>
    </div>
  );
}

export function Calculator() {
  const [msg, setMsg] = useState(10_000);
  const [ptt, setPtt] = useState(300);
  const [pstn, setPstn] = useState(60);
  const [byok, setByok] = useState(false);

  const { plan, total } = useMemo(() => mosaddCost(msg, ptt, pstn, byok), [msg, ptt, pstn, byok]);
  const raw = useMemo(
    () => msg * RAW.msg + ptt * RAW.ptt + pstn * RAW.pstn,
    [msg, ptt, pstn],
  );
  const savings = raw - total;

  return (
    <div className="grid gap-6 border border-border p-5 md:grid-cols-2">
      <div className="space-y-5">
        <Field label="Messages / mo" value={msg} onChange={setMsg} max={200_000} step={1_000} hint="mDM · mIRC · mROOM · mAIL outbound" />
        <Field label="Push-to-talk min / mo" value={ptt} onChange={setPtt} max={12_000} step={100} hint="mTALK voice minutes" />
        <Field label="PSTN min / mo" value={pstn} onChange={setPstn} max={2_000} step={20} hint="PSTN phone minutes (carrier-pending)" />
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={byok} onChange={(e) => setByok(e.target.checked)} className="accent-primary" />
          Bring my own keys (LiveKit / Telnyx) — voice &amp; PSTN orchestration $0
        </label>
      </div>

      <div className="flex flex-col justify-between gap-4 border-t border-border pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Recommended plan</div>
          <div className="font-display text-2xl text-primary">{plan.name}</div>
          <div className="mt-1 font-display text-4xl text-foreground">
            {money(total)}
            <span className="text-sm text-muted-foreground">/mo</span>
          </div>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Same stack hand-wired (Twilio + LiveKit + Telnyx)</span>
            <span>{money(raw)}/mo</span>
          </div>
          {savings > 0 ? (
            <div className="flex justify-between font-medium text-primary">
              <span>You save</span>
              <span>{money(savings)}/mo ({Math.round((savings / raw) * 100)}%)</span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Self-host is always $0 — Apache-2.0.</div>
          )}
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Preview rates for the Phase-2 hosted hub. Raw-stack estimate uses public list rates
          (Twilio SMS $0.0083/msg · LiveKit ~$0.0075/min · Telnyx ~$0.014/min) and excludes the
          integration + maintenance you&apos;d write yourself.
        </p>
      </div>
    </div>
  );
}
