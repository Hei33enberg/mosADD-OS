"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

interface EmbedKeyRow {
  id: string;
  pk_prefix: string;
  name: string;
  product: string;
  allowed_origins: string[];
  allowed_channels: string[];
  created_at: string;
  last_used_at: string | null;
}

export default function EmbedKeysClient({ jwt }: { jwt: string }) {
  const [keys, setKeys] = useState<EmbedKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/embed-keys`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? "load failed");
      setKeys(data.keys ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "load failed");
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => { void load(); }, [load]);

  const revoke = async (id: string, name: string) => {
    if (!window.confirm(`Revoke "${name}"? Any site using this key will stop working immediately.`)) return;
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/embed-keys?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!r.ok) throw new Error("revoke failed");
      void load();
    } catch (e: any) {
      setErr(e?.message ?? "revoke failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">
          {loading ? "Loading…" : `${keys.length} active embed${keys.length === 1 ? "" : "s"}`}
        </p>
        <Link
          href="/embed/new"
          className="bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs px-4 py-2"
        >
          + New embed
        </Link>
      </div>

      {err && (
        <div className="border-l-2 border-destructive bg-destructive/5 p-3 text-xs text-destructive mb-4">
          {err}
        </div>
      )}

      {!loading && keys.length === 0 && (
        <div className="border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">No embed keys yet. Create your first one — it&apos;s free.</p>
          <Link
            href="/embed/new"
            className="inline-block bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs px-4 py-2"
          >
            Create your first embed
          </Link>
        </div>
      )}

      {keys.length > 0 && (
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="border border-border bg-card/30 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="font-mono font-bold text-foreground">{k.name}</div>
                  <code className="text-xs text-muted-foreground">{k.pk_prefix}…</code>
                </div>
                <button
                  type="button"
                  onClick={() => revoke(k.id, k.name)}
                  className="text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive border border-border px-3 py-1.5 hover:border-destructive shrink-0"
                >
                  Revoke
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="uppercase tracking-widest text-muted-foreground mb-1">Channel</div>
                  <code className="font-mono">{k.allowed_channels[0] ?? "—"}</code>
                </div>
                <div>
                  <div className="uppercase tracking-widest text-muted-foreground mb-1">Allowed on</div>
                  <ul className="space-y-0.5">
                    {k.allowed_origins.map((o) => (
                      <li key={o}><code className="font-mono">{o}</code></li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                <span>Created {new Date(k.created_at).toLocaleDateString()}</span>
                <span>{k.last_used_at ? `Last used ${new Date(k.last_used_at).toLocaleString()}` : "Never used"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
