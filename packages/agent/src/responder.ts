/**
 * The mosadd agent responder.
 *
 * Drives the @mosadd/mcp tool HANDLERS directly (deterministic, no MCP-protocol
 * tool-use → impossible to hallucinate a tool result). The LLM (OpenRouter) is
 * used only to write the reply TEXT — never to "decide" whether to call a tool.
 *
 * This is the proven loop shipped on the mosadd-general production box.
 */

import { allTools, defaultProviders } from "@mosadd/mcp";

export interface ResponderOptions {
  /** Supabase project URL. Default: env MOSADD_SUPABASE_URL. */
  supabaseUrl?: string;
  /** Supabase anon key. Default: env MOSADD_SUPABASE_ANON_KEY. */
  supabaseAnonKey?: string;
  /** mosadd hub key (mosadd_sk_live_…) — exchanged for a session JWT each cycle. Default: env MOSADD_API_KEY. */
  hubKey?: string;
  /** OpenRouter API key — used ONLY to generate the reply text. Default: env OPENROUTER_API_KEY. */
  openRouterKey?: string;
  /** Model id passed to OpenRouter. Default: env MOSADD_AGENT_MODEL or 'anthropic/claude-sonnet-4'. */
  model?: string;
  /** Poll interval (ms). Default: env RESPONDER_POLL_MS or 30000. */
  pollMs?: number;
  /** System prompt for the LLM. Override the default voice. */
  systemPrompt?: string;
  /** Path to a JSON file persisting the set of already-answered message ids. Default: env RESPONDER_STATE or '/tmp/responder-state.json'. */
  statePath?: string;
}

const DEFAULT_SYSTEM =
  "Jestes mosadd-agent — operacyjny agent mosADD. Odpowiadasz po polsku, krotko i konkretnie. " +
  "Nie jestes chatbotem-asystentem, jestes operatorem komunikacji dzialajacym w imieniu czlowieka. " +
  "Odpowiadaj rzeczowo na to, co czlowiek napisal. Bez korpo-waty, bez 'Jako model jezykowy'.";

interface Ctx {
  options: { mode: string; hubUrl: string };
  providers: ReturnType<typeof defaultProviders>;
  log: (level: "debug" | "info" | "warn" | "error", msg: string, extra?: unknown) => void;
}

async function exchangeKey(supabaseUrl: string, anonKey: string, hubKey: string): Promise<string> {
  const r = await fetch(`${supabaseUrl}/functions/v1/hub-key-exchange`, {
    method: "POST",
    headers: { Authorization: `Bearer ${hubKey}`, apikey: anonKey, "Content-Type": "application/json" },
    body: "{}",
  });
  const j = (await r.json().catch(() => ({}))) as { access_token?: string };
  if (!j.access_token) throw new Error("hub-key-exchange failed: " + JSON.stringify(j).slice(0, 200));
  return j.access_token;
}

function buildCtx(): Ctx {
  return {
    options: { mode: "local", hubUrl: "https://mcp.mosadd.com" },
    providers: defaultProviders(),
    log: (lvl, msg, extra) => {
      if (lvl !== "debug")
        process.stderr.write(JSON.stringify({ lvl, msg, extra }) + "\n");
    },
  };
}

async function invoke(name: string, input: unknown, ctx: Ctx): Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (allTools as any[]).find((x) => x.name === name);
  if (!t) throw new Error("unknown tool " + name);
  return t.handler(t.inputSchema.parse(input), ctx);
}

async function llmReply(
  contactName: string | null,
  convo: string,
  openRouterKey: string,
  model: string,
  systemPrompt: string,
): Promise<string> {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openRouterKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            `Rozmowa z ${contactName || "kontaktem"} (chronologicznie, ostatnia na koncu):\n${convo}\n\n` +
            "Napisz KROTKA odpowiedz (1-3 zdania) na OSTATNIA wiadomosc kontaktu. Tylko sama tresc odpowiedzi.",
        },
      ],
    }),
  });
  const j = (await r.json().catch(() => ({}))) as { choices?: Array<{ message?: { content?: string } }> };
  const txt = j.choices?.[0]?.message?.content?.trim();
  if (!txt) throw new Error("LLM no content: " + JSON.stringify(j).slice(0, 200));
  return txt;
}

async function loadState(path: string): Promise<Set<string>> {
  try {
    const fs = await import("node:fs/promises");
    const raw = await fs.readFile(path, "utf8");
    const j = JSON.parse(raw) as { replied?: string[] };
    return new Set(j.replied || []);
  } catch {
    return new Set();
  }
}
async function saveState(path: string, s: Set<string>): Promise<void> {
  try {
    const fs = await import("node:fs/promises");
    await fs.writeFile(path, JSON.stringify({ replied: [...s].slice(-2000) }));
  } catch {
    /* best-effort */
  }
}

/**
 * Run the responder forever. Returns a stop() function that breaks the loop
 * after the current cycle. Each cycle:
 *   1. exchange hub key → fresh session JWT (sets MOSADD_USER_JWT in env)
 *   2. list contacts
 *   3. for each accepted contact, read last messages
 *   4. for each unanswered last-message from the contact, ask the LLM for a
 *      reply, and SEND it via mDM_send_unencrypted (real handler call)
 *   5. mark message-id answered + persist
 */
export async function startResponder(opts: ResponderOptions = {}): Promise<() => void> {
  const supabaseUrl = opts.supabaseUrl ?? process.env.MOSADD_SUPABASE_URL!;
  const anonKey = opts.supabaseAnonKey ?? process.env.MOSADD_SUPABASE_ANON_KEY!;
  const hubKey = opts.hubKey ?? process.env.MOSADD_API_KEY!;
  const openRouterKey = opts.openRouterKey ?? process.env.OPENROUTER_API_KEY!;
  const model = opts.model ?? process.env.MOSADD_AGENT_MODEL ?? "anthropic/claude-sonnet-4";
  const pollMs = opts.pollMs ?? Number(process.env.RESPONDER_POLL_MS ?? 30000);
  const statePath = opts.statePath ?? process.env.RESPONDER_STATE ?? "/tmp/responder-state.json";
  const systemPrompt = opts.systemPrompt ?? DEFAULT_SYSTEM;

  if (!supabaseUrl || !anonKey || !hubKey || !openRouterKey) {
    throw new Error(
      "[mosadd/agent] missing required env: MOSADD_SUPABASE_URL, MOSADD_SUPABASE_ANON_KEY, MOSADD_API_KEY, OPENROUTER_API_KEY",
    );
  }

  const replied = await loadState(statePath);
  process.stderr.write(
    `[mosadd/agent] started (model=${model}, poll=${pollMs}ms, known=${replied.size})\n`,
  );

  let stopped = false;
  (async () => {
    while (!stopped) {
      try {
        process.env.MOSADD_USER_JWT = await exchangeKey(supabaseUrl, anonKey, hubKey);
        const ctx = buildCtx();
        const selfId = await ctx.providers.dm.selfId();
        const { contacts } = (await invoke("mDM_list_contacts", { limit: 200 }, ctx)) as {
          contacts: Array<{ identity_id: string; display_name: string | null; state?: string }>;
        };
        for (const c of contacts || []) {
          if (c.state && c.state !== "accepted") continue;
          let res;
          try {
            res = (await invoke("mDM_list", { contact_id: c.identity_id, limit: 15 }, ctx)) as {
              messages: Array<{ id: string; sender_identity_id: string; text: string; timestamp: string }>;
            };
          } catch {
            continue;
          }
          const msgs = (res.messages || [])
            .slice()
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          if (!msgs.length) continue;
          const last = msgs[msgs.length - 1];
          if (last.sender_identity_id === selfId) continue;
          if (replied.has(last.id)) continue;
          if (last.text === "<undecryptable>" || last.text === "<encrypted · sent by you>") {
            replied.add(last.id);
            continue;
          }
          const convo = msgs
            .slice(-8)
            .map(
              (m) =>
                (m.sender_identity_id === selfId ? "JA" : c.display_name || "KONTAKT") + ": " + m.text,
            )
            .join("\n");
          let reply: string;
          try {
            reply = await llmReply(c.display_name, convo, openRouterKey, model, systemPrompt);
          } catch (e) {
            process.stderr.write(`[mosadd/agent] LLM err: ${(e as Error).message}\n`);
            continue;
          }
          try {
            await invoke("mDM_send_unencrypted", { to: c.identity_id, text: reply }, ctx);
            replied.add(last.id);
            process.stderr.write(
              `[mosadd/agent] replied to ${c.display_name || c.identity_id}: ${reply.slice(0, 80)}\n`,
            );
          } catch (e) {
            process.stderr.write(`[mosadd/agent] send err: ${(e as Error).message}\n`);
          }
        }
      } catch (e) {
        process.stderr.write(`[mosadd/agent] cycle err: ${(e as Error)?.message || e}\n`);
      }
      await saveState(statePath, replied);
      await new Promise((r) => setTimeout(r, pollMs));
    }
  })();

  return () => {
    stopped = true;
  };
}
