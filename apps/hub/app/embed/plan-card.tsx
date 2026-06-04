"use client";
import { useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Stripe price IDs — mosADD account (acct_1TeaGi), the dedicated mosadd
// account for BOTH mosadd.com and mosadd.dev (one account, one shared DB,
// separate from CYMRU). Checkout flows through create-checkout-session, which
// reads STRIPE_SECRET_KEY_MOSADD. Keep these in sync with
// m0ssad-3/supabase/functions/_shared/dev-products.ts.
const PRICES = {
  pro: { id: "price_1TeagcLmuAqp3A8frR1OFg9M", label: "Pro", monthly: 9 },
  team: { id: "price_1TeagdLmuAqp3A8fRxVVSW7x", label: "Team", monthly: 29 },
  // brand-removal addon — Pro can buy this to drop the "powered by mosadd"
  // badge. Team+ have it included.
  brandRemoval: { id: "price_1TeagfLmuAqp3A8fzc3LbwFF", label: "Remove badge", monthly: 3 },
};

const CAP = { free: 1000, pro: 10_000, team: 100_000, enterprise: Infinity };

interface Props {
  jwt: string;
  tier: "free" | "pro" | "team" | "enterprise";
  matCount: number;
  brandRemovalPaid?: boolean;
}

export default function PlanCard({ jwt, tier, matCount, brandRemovalPaid }: Props) {
  const [busy, setBusy] = useState<"pro" | "team" | "brand" | null>(null);
  const [err, setErr] = useState("");

  const buyAddon = async () => {
    setBusy("brand");
    setErr("");
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({ price_id: PRICES.brandRemoval.id, mode: "subscription" }),
      });
      const data = await r.json();
      if (!r.ok || !data?.url) throw new Error(data?.error ?? "checkout failed");
      window.location.href = data.url;
    } catch (e: any) {
      setErr(e?.message ?? "checkout failed");
      setBusy(null);
    }
  };

  const upgrade = async (target: "pro" | "team") => {
    setBusy(target);
    setErr("");
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({ price_id: PRICES[target].id, mode: "subscription" }),
      });
      const data = await r.json();
      if (!r.ok || !data?.url) throw new Error(data?.error ?? "checkout failed");
      window.location.href = data.url;
    } catch (e: any) {
      setErr(e?.message ?? "checkout failed");
      setBusy(null);
    }
  };

  const cap = CAP[tier];
  const pctUsed = cap === Infinity ? 0 : Math.min(100, Math.round((matCount / cap) * 100));
  const barColor =
    pctUsed >= 100 ? "bg-destructive" : pctUsed >= 80 ? "bg-amber-500" : "bg-primary";

  return (
    <div className="border border-border bg-card/30 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Current plan</div>
          <div className="font-mono text-2xl font-bold uppercase">{tier}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">This month</div>
          <div className="font-mono text-2xl font-bold">
            {matCount.toLocaleString()}
            {cap !== Infinity && (
              <span className="text-sm text-muted-foreground"> / {cap.toLocaleString()} MAT</span>
            )}
          </div>
        </div>
      </div>

      {cap !== Infinity && (
        <div className="h-1.5 bg-background border border-border mb-4">
          <div className={`h-full ${barColor}`} style={{ width: `${pctUsed}%` }} />
        </div>
      )}

      {err && (
        <div className="border-l-2 border-destructive bg-destructive/5 p-2 mb-3 text-xs text-destructive">
          {err}
        </div>
      )}

      {tier === "free" && (
        <div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Upgrade for more MAT, more embeds, and the option to remove the badge. Hard cap = 2× your plan price — no surprise bills.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => upgrade("pro")}
              disabled={busy !== null}
              className="bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs px-4 py-2 disabled:opacity-50"
            >
              {busy === "pro" ? "Loading…" : `→ Upgrade to Pro · $${PRICES.pro.monthly}/mo`}
            </button>
            <button
              onClick={() => upgrade("team")}
              disabled={busy !== null}
              className="border border-border text-xs uppercase tracking-widest font-bold px-4 py-2 hover:border-primary hover:text-primary disabled:opacity-50"
            >
              {busy === "team" ? "Loading…" : `Team · $${PRICES.team.monthly}/mo`}
            </button>
            <a
              href="https://mosadd.dev/embed#pricing"
              target="_blank"
              rel="noreferrer"
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground px-4 py-2"
            >
              All tiers ↗
            </a>
          </div>
        </div>
      )}

      {tier === "pro" && (
        <div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            You&apos;re on <strong>Pro</strong>. Overage is billed at $0.001 per extra MAT, capped at 2× plan price ($18/mo max).
            {brandRemovalPaid ? (
              <span className="block mt-2 text-primary">✓ Badge removal addon active — embeds run white-label.</span>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => upgrade("team")}
              disabled={busy !== null}
              className="border border-border text-xs uppercase tracking-widest font-bold px-4 py-2 hover:border-primary hover:text-primary disabled:opacity-50"
            >
              {busy === "team" ? "Loading…" : `→ Upgrade to Team · $${PRICES.team.monthly}/mo`}
            </button>
            {!brandRemovalPaid && (
              <button
                onClick={buyAddon}
                disabled={busy !== null}
                className="border border-border text-xs uppercase tracking-widest font-bold px-4 py-2 hover:border-primary hover:text-primary disabled:opacity-50"
                title='Removes the "powered by mosadd" badge from your embeds'
              >
                {busy === "brand" ? "Loading…" : `Remove badge +$${PRICES.brandRemoval.monthly}/mo`}
              </button>
            )}
          </div>
        </div>
      )}

      {tier === "team" && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          You&apos;re on <strong>Team</strong>. Need SSO, DPA, NIS2 audit, dedicated infra?{" "}
          <a href="mailto:hello@mosadd.dev?subject=Embed%20Enterprise" className="text-primary hover:underline">
            Enterprise →
          </a>
        </p>
      )}

      {tier === "enterprise" && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Enterprise plan active. Contact your account manager for changes.
        </p>
      )}
    </div>
  );
}
