"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

interface CreatedKey {
  id: string;
  pk_prefix: string;
  name: string;
  key: string;
  allowed_origins: string[];
  allowed_channels: string[];
}

export default function NewEmbedKeyForm({ jwt }: { jwt: string }) {
  const router = useRouter();
  const [name, setName] = useState("My Site");
  const [channel, setChannel] = useState("default");
  const [originsRaw, setOriginsRaw] = useState("");
  const [mode, setMode] = useState<"live" | "test">("live");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [created, setCreated] = useState<CreatedKey | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const allowed_origins = originsRaw
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      // LINEAR-2740: send `channels: string[]` (1..10). The `channel` field is
      // newline/comma-separated; we split + dedupe + cap at 10.
      const channels = Array.from(new Set(
        channel.split(/[\s,]+/).map((c) => c.trim()).filter(Boolean),
      )).slice(0, 10);
      const r = await fetch(`${SUPABASE_URL}/functions/v1/embed-keys`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name, channels, allowed_origins, mode }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? "create failed");
      setCreated(data as CreatedKey);
    } catch (e: any) {
      setErr(e?.message ?? "create failed");
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    const channel = created.allowed_channels[0] ?? "default";
    const snippet = `<div id="mosadd-mirc"
     data-channel="${channel}"
     data-position="sidebar-right"
     data-locale="en">
</div>
<script src="https://embed.mosadd.com/v1.js"
        data-key="${created.key}">
</script>`;
    return (
      <div className="space-y-6">
        <div className="border border-primary bg-primary/5 p-4">
          <div className="text-xs uppercase tracking-widest text-primary mb-2 font-bold">
            ✓ EMBED CREATED — COPY YOUR KEY NOW
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            This is the only time the full key is shown. Store it where you keep your other secrets (1Password, etc.).
            You can issue a new one later, but you can&apos;t retrieve this one again.
          </p>
          <code className="block font-mono text-sm p-3 bg-background border border-border break-all">
            {created.key}
          </code>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(created.key)}
            className="mt-2 text-xs uppercase tracking-widest border border-border px-3 py-1.5 hover:border-primary hover:text-primary"
          >
            Copy key
          </button>
        </div>

        <div className="border border-border bg-card/30 p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">
            PASTE THIS SNIPPET ON {created.allowed_origins.join(" / ").toUpperCase()}
          </div>
          <pre className="font-mono text-xs p-3 bg-background border border-border overflow-x-auto whitespace-pre">
            {snippet}
          </pre>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(snippet)}
            className="mt-2 text-xs uppercase tracking-widest border border-border px-3 py-1.5 hover:border-primary hover:text-primary"
          >
            Copy snippet
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/embed")}
            className="text-xs uppercase tracking-widest border border-border px-4 py-2.5 hover:border-primary hover:text-primary"
          >
            ← All embeds
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Name (only you see this)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={64}
          className="w-full p-2.5 bg-background border border-border font-mono text-sm focus:outline-none focus:border-primary"
          placeholder="strajkpolski.pl"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Channel ID(s)
        </label>
        <textarea
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          rows={3}
          required
          className="w-full p-2.5 bg-background border border-border font-mono text-sm focus:outline-none focus:border-primary"
          placeholder="default&#10;blog-comments&#10;office-hours"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Letters, numbers, <code>_</code>, <code>-</code>. One per line (or comma-separated). Max 10 channels per key —
          use multiple keys per site if you need more.
        </p>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Allowed domains
        </label>
        <textarea
          value={originsRaw}
          onChange={(e) => setOriginsRaw(e.target.value)}
          rows={3}
          required
          className="w-full p-2.5 bg-background border border-border font-mono text-sm focus:outline-none focus:border-primary"
          placeholder="strajkpolski.pl&#10;www.strajkpolski.pl&#10;*.strajkpolski.pl"
        />
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          One per line (or comma-separated). The embed only works on these domains. Use{" "}
          <code>*.example.com</code> for all subdomains. Max 10 entries.
        </p>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Mode
        </label>
        <div className="flex gap-3 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="mode" checked={mode === "live"} onChange={() => setMode("live")} />
            <span>Live <code className="text-xs text-muted-foreground">m_pk_live_…</code></span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="mode" checked={mode === "test"} onChange={() => setMode("test")} />
            <span>Test <code className="text-xs text-muted-foreground">m_pk_test_…</code></span>
          </label>
        </div>
      </div>

      {err && (
        <div className="border-l-2 border-destructive bg-destructive/5 p-3 text-xs text-destructive">
          {err}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs px-5 py-2.5 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create embed key"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/embed")}
          className="border border-border text-xs uppercase tracking-widest px-4 py-2.5 hover:border-primary hover:text-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
