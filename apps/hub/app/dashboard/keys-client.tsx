"use client";
import { useCallback, useEffect, useState } from "react";

// API keys manager — talks to hub-keys (Supabase edge fn) with the user's JWT.
// New keys: plaintext shown ONCE. Stripe checkout is a separate button (Pro/Team).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

interface KeyRow {
  id: string;
  name: string;
  key_prefix: string;
  plan: string | null;
  created_at: string;
  last_used_at: string | null;
}

export default function KeysClient({ jwt, email }: { jwt: string; email: string }) {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newKey, setNewKey] = useState<{ id: string; name: string; key: string } | null>(null);
  const [error, setError] = useState<string>("");

  const headers = { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/hub-keys`, { headers });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? "failed");
      setKeys(data.keys ?? []);
    } catch (e: any) {
      setError(e?.message ?? "load failed");
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => { void load(); }, [load]);

  const createKey = async () => {
    setBusy(true);
    setError("");
    try {
      const name = window.prompt("Name this key (e.g. 'claude-code', 'production-bot'):", "default") ?? "default";
      if (!name.trim()) { setBusy(false); return; }
      const r = await fetch(`${SUPABASE_URL}/functions/v1/hub-keys`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? "issue failed");
      setNewKey({ id: data.id, name: data.name, key: data.key });
      void load();
    } catch (e: any) {
      setError(e?.message ?? "issue failed");
    } finally {
      setBusy(false);
    }
  };

  const revokeKey = async (id: string, name: string) => {
    if (!window.confirm(`Revoke "${name}"? This breaks any agent currently using it.`)) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/hub-keys?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers,
      });
      if (!r.ok) throw new Error("revoke failed");
      void load();
    } catch (e: any) {
      setError(e?.message ?? "revoke failed");
    } finally {
      setBusy(false);
    }
  };

  const upgrade = async (tier: "pro" | "team") => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          plan: tier,
          success_url: `${window.location.origin}/dashboard?upgraded=${tier}`,
          cancel_url: `${window.location.origin}/dashboard`,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data?.url) throw new Error(data?.error ?? "checkout failed");
      window.location.href = data.url;
    } catch (e: any) {
      setError(e?.message ?? "checkout failed");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Show plaintext key ONCE after issue */}
      {newKey && (
        <div className="border border-primary p-4 bg-primary/10">
          <div className="text-xs uppercase tracking-widest text-primary font-bold mb-2">
            ⚠ Save this key NOW — it's shown only once
          </div>
          <div className="text-xs text-muted-foreground mb-2">Name: <code>{newKey.name}</code></div>
          <pre>{newKey.key}</pre>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(newKey.key).then(() => window.alert("Copied"))}
              className="px-3 py-2 text-xs uppercase tracking-widest border border-primary text-primary hover:bg-primary/10 transition"
            >
              Copy
            </button>
            <button
              onClick={() => setNewKey(null)}
              className="px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition"
            >
              I saved it
            </button>
          </div>

          <div className="mt-6 border-t border-border" style={{ paddingTop: "1rem" }}>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Install snippet</div>
            <pre>{`# Claude Code / Cursor / any MCP host
export MOSADD_API_KEY="${newKey.key}"
npx -y @mosadd/mcp@alpha`}</pre>
          </div>
        </div>
      )}

      {/* Keys list */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground">API keys</h2>
          <button
            onClick={createKey}
            disabled={busy}
            className="bg-primary text-primary-foreground px-3 py-2 text-xs font-bold uppercase tracking-widest hover:opacity-70 transition"
            style={busy ? { opacity: 0.5, cursor: "not-allowed" } : {}}
          >
            + New key
          </button>
        </div>

        {loading ? (
          <div className="text-xs text-muted-foreground">Loading…</div>
        ) : keys.length === 0 ? (
          <div className="border border-border p-6 bg-card text-xs text-muted-foreground">
            No keys yet. Click <strong className="text-primary">+ New key</strong> to issue your first one. You'll see the plaintext key once — copy it then.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {keys.map((k) => (
              <div key={k.id} className="border border-border p-3 bg-card flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-bold">{k.name}</div>
                  <div className="text-xs text-muted-foreground">
                    <code>{k.key_prefix}…</code> · plan: <strong className="text-primary">{k.plan ?? "free"}</strong>
                    {k.last_used_at && (
                      <> · last used {new Date(k.last_used_at).toLocaleString()}</>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => revokeKey(k.id, k.name)}
                  disabled={busy}
                  className="text-xs uppercase tracking-widest text-destructive border border-destructive px-3 py-2 hover:bg-destructive/10 transition"
                  style={busy ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Plan / billing */}
      <section>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Plan</h2>
        <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div className="border border-border p-4 bg-card">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Pro</div>
            <div className="text-lg font-bold mb-1">$9/mo</div>
            <div className="text-xs text-muted-foreground mb-4">50k messages · mRAG (rag-search) · 10h PTT</div>
            <button onClick={() => upgrade("pro")} disabled={busy} className="w-full bg-primary text-primary-foreground px-3 py-2 text-xs font-bold uppercase tracking-widest hover:opacity-70 transition" style={busy ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
              Upgrade
            </button>
          </div>
          <div className="border border-border p-4 bg-card">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Team</div>
            <div className="text-lg font-bold mb-1">$49/mo</div>
            <div className="text-xs text-muted-foreground mb-4">500k messages · 10 seats · 100h PTT</div>
            <button onClick={() => upgrade("team")} disabled={busy} className="w-full bg-primary text-primary-foreground px-3 py-2 text-xs font-bold uppercase tracking-widest hover:opacity-70 transition" style={busy ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
              Upgrade
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Stripe TEST mode. Use a test card like <code>4242 4242 4242 4242</code> · any future date · any CVC.
        </p>
      </section>

      {error && (
        <div className="border border-destructive bg-card p-3 text-xs text-destructive">
          Error: {error}
        </div>
      )}
    </div>
  );
}
