'use client';

import { useMemo, useState } from 'react';
import {
  PLANS,
  OVERAGE_RATE_USD,
  SPEND_CAP_MULTIPLIER,
  type Plan,
} from '../_lib/plans';

/**
 * Interactive cost calculator. Pure client-side math — no backend.
 *
 * CANON: `app/_lib/plans.ts` is the single source of truth for prices, MAT
 * caps and the overage/spend-cap constants. This calculator AND
 * `app/pricing/page.tsx` both read from it — never re-introduce a local rate
 * table here. (A third hand-typed copy is exactly how this component drifted
 * to $9/$29 while billing charged $19/$49 — audit LINEAR-5066 B-10.)
 *
 * Voice (mTALK) is not a plan quota: carrier/media fees are pass-through
 * at-cost, and $0 with BYOK (your own LiveKit keys) — so it is modeled as a
 * separate line, not as per-plan included minutes.
 */
const SELF_SERVE: Plan[] = [PLANS.free, PLANS.pro, PLANS.team];
/** Hosted PTT pass-through $/min shown to the user (at-cost, ≤10% markup). */
const PTT_PASSTHROUGH_USD_MIN = 0.005;
/** Public list rates for the hand-wired equivalent stack. */
const RAW = { msg: 0.0083, ptt: 0.0075 }; // Twilio SMS / LiveKit list

function money(n: number) {
  return n < 10 && n > 0 ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString()}`;
}

/**
 * Cheapest self-serve plan for the entered MAT volume. Free is only
 * recommended within its hard cap (it never bills — beyond the cap the answer
 * is an upgrade, not an invoice). Paid plans absorb overage at
 * OVERAGE_RATE_USD/MAT until the default spend cap (SPEND_CAP_MULTIPLIER ×
 * plan price), where billing stops — `capped` marks that state.
 */
function mosaddCost(mat: number, ptt: number, byok: boolean) {
  let best: { plan: Plan; total: number; capped: boolean } | null = null;
  for (const p of SELF_SERVE) {
    const cap = p.mat ?? Infinity;
    const overMat = Math.max(0, mat - cap);
    let total: number;
    let capped = false;
    if (!p.priceUsd) {
      if (overMat > 0) continue; // Free never bills; over-cap = upgrade, not a charge.
      total = 0;
    } else {
      const spendCap = p.priceUsd * SPEND_CAP_MULTIPLIER;
      const withOverage = p.priceUsd + overMat * OVERAGE_RATE_USD;
      total = Math.min(withOverage, spendCap);
      capped = withOverage > spendCap;
    }
    if (!best || total < best.total) best = { plan: p, total, capped };
  }
  const chosen = best ?? { plan: PLANS.team, total: PLANS.team.priceUsd ?? 0, capped: true };
  const voice = byok ? 0 : ptt * PTT_PASSTHROUGH_USD_MIN;
  return { ...chosen, voice, totalWithVoice: chosen.total + voice };
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
  const [mat, setMat] = useState(10_000);
  const [ptt, setPtt] = useState(300);
  const [byok, setByok] = useState(false);

  const { plan, capped, voice, totalWithVoice } = useMemo(
    () => mosaddCost(mat, ptt, byok),
    [mat, ptt, byok],
  );
  const raw = useMemo(() => mat * RAW.msg + ptt * RAW.ptt, [mat, ptt]);
  const savings = raw - totalWithVoice;

  return (
    <div className="grid gap-6 border border-border p-5 md:grid-cols-2">
      <div className="space-y-5">
        <Field
          label="Thread-actions (MAT) / mo"
          value={mat}
          onChange={setMat}
          max={200_000}
          step={1_000}
          hint="delivered, threat-scored messages/actions — mDM · mIRC · mAYL"
        />
        <Field
          label="Push-to-talk min / mo"
          value={ptt}
          onChange={setPtt}
          max={12_000}
          step={100}
          hint="mTALK voice minutes — pass-through at-cost, $0 with BYOK"
        />
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={byok} onChange={(e) => setByok(e.target.checked)} className="accent-primary" />
          Bring my own keys (LiveKit) — voice orchestration $0
        </label>
      </div>

      <div className="flex flex-col justify-between gap-4 border-t border-border pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Recommended plan</div>
          <div className="font-display text-2xl text-primary">{plan.label}</div>
          <div className="mt-1 font-display text-4xl text-foreground">
            {money(totalWithVoice)}
            <span className="text-sm text-muted-foreground">/mo</span>
          </div>
          {capped ? (
            <div className="mt-2 text-[11px] uppercase tracking-[0.15em] text-warning">
              {plan.priceUsd
                ? `MAT billing capped at ${SPEND_CAP_MULTIPLIER}× plan price (${money((plan.priceUsd ?? 0) * SPEND_CAP_MULTIPLIER)}/mo default) — talk to us about Enterprise`
                : 'over the Free cap — upgrade required (no surprise bill)'}
            </div>
          ) : null}
          {voice > 0 ? (
            <div className="mt-2 text-[11px] text-muted-foreground">
              incl. {money(voice)}/mo voice pass-through (at-cost)
            </div>
          ) : null}
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Same stack hand-wired (Twilio + LiveKit)</span>
            <span>{money(raw)}/mo</span>
          </div>
          {savings > 0 ? (
            <div className="flex justify-between font-medium text-primary">
              <span>You save</span>
              <span>
                {money(savings)}/mo ({Math.round((savings / raw) * 100)}%)
              </span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Self-host is always $0 — Apache-2.0.</div>
          )}
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Plan prices and MAT caps read live from the canonical plan table (the same one billing
          uses). Raw-stack estimate uses public list rates (Twilio SMS $0.0083/msg · LiveKit
          ~$0.0075/min) and excludes the integration + maintenance you&apos;d write yourself.
        </p>
      </div>
    </div>
  );
}
