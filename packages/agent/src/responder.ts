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
import {
  DECISION_TYPE,
  parseDecision,
  parseDecisionResponse,
  buildDecisionPayload,
  encodeB64Json,
  extractDecisionDirective,
  summarizeDecision,
  summarizeResponse,
  type Decision,
} from "./decisionProtocol.js";

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
  "Jestes mosadd general — operacyjny agent mosADD. Odpowiadasz po polsku, krotko i konkretnie. " +
  "Nie jestes chatbotem-asystentem, jestes operatorem komunikacji dzialajacym w imieniu czlowieka. " +
  "Odpowiadaj rzeczowo na to, co czlowiek napisal. Bez korpo-waty, bez 'Jako model jezykowy'.";

// T11/T12 — the agent can ASK the human to DECIDE (Claude-Code-style: one or more steps, several
// options each). Only when a real choice is needed, the LLM emits a fenced ```decision block; the
// responder turns it into a message_type:"decision" the app renders as clickable options, and reads
// the answer back on the next cycle (the sequential loop: ask -> answer -> continue).
const DECISION_GUIDE =
  "\n\nDECYZJE: jesli potrzebujesz, zeby rozmowca WYBRAL sposrod opcji (zatwierdz/odrzuc, wariant, " +
  "kolejny krok) - NIE pisz zwyklego pytania, tylko odpowiedz WYLACZNIE blokiem ```decision z JSON:\n" +
  '```decision\n{"title":"...","steps":[{"prompt":"...","options":[{"label":"...","tone":"approve|reject|neutral|danger|info","irreversible":false}]}]}\n```\n' +
  "Mozesz dac kilka krokow (kazdy = jedno pytanie). Nieodwracalne opcje ustaw irreversible:true. " +
  "Gdy rozmowca odpowie (zobaczysz w rozmowie linie o odpowiedzi na decyzje), kontynuuj na podstawie jego wyboru.";

/** Send a structured DECISION as message_type:"decision" (the app renders clickable options).
 *  mDM_send_unencrypted is text-only, so POST message-send directly on the plaintext agent lane. */
async function sendDecision(
  supabaseUrl: string,
  anonKey: string,
  peerId: string,
  selfId: string,
  decision: Decision,
): Promise<void> {
  const threadId = "dm:" + [selfId, peerId].sort().join(":");
  const r = await fetch(`${supabaseUrl}/functions/v1/message-send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MOSADD_USER_JWT}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      space_id: "dm",
      thread_id: threadId,
      encrypted_payload: encodeB64Json(buildDecisionPayload(decision)),
      message_type: DECISION_TYPE,
      protocol_version: "mosadd.chat.v1",
    }),
  });
  if (r.status !== 200) {
    throw new Error(`decision send ${r.status}: ${(await r.text().catch(() => "")).slice(0, 140)}`);
  }
}

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

/**
 * MOZG PLATFORMY — PIERWSZA SCIEZKA ODPOWIEDZI.
 *
 * ⛔ CO TO KONCZY. Do dzis ta paczka umiala WYLACZNIE OpenRouter i twardo odmawiala startu bez
 * `OPENROUTER_API_KEY`. Dla klienta znaczylo to: zeby uruchomic wlasnego agenta, zaloz najpierw
 * konto u obcego dostawcy AI i wklej jego klucz do terminala. Wlasciciel produktu, 2026-09-01:
 * „klient ma nic nie ogarniac, tylko odpalic elektrona i moc zarzadzac komputerem z telefonu —
 * to byla podstawa tego projektu". Tamten warunek byl dokladnie tym ogarnianiem.
 *
 * `mosadd-agent-brain` potrzebuje WYLACZNIE klucza huba, ktory agent i tak juz ma (bez niego nie
 * zalogowalby sie do niczego). Mozg ma kaskade dostawcow, bezpiecznik wydatku liczony z konta
 * wlasciciela i zapytania nazwane — czyli WIECEJ, niz dawal goly OpenRouter.
 *
 * OpenRouter ZOSTAJE jako zapas: gdy klient poda swoj klucz, agent ma druga noge na wypadek
 * niedostepnosci mozgu. Jego BRAK to teraz zapas mniej, a nie martwy agent.
 */
async function brainReply(
  supabaseUrl: string,
  anonKey: string,
  hubKey: string,
  contactName: string | null,
  convo: string,
): Promise<string> {
  const naglowek = `Rozmowa z ${contactName || "kontaktem"} (chronologicznie, ostatnia na koncu):`;
  const r = await fetch(`${supabaseUrl}/functions/v1/mosadd-agent-brain`, {
    method: "POST",
    headers: { Authorization: `Bearer ${hubKey}`, apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ convo: naglowek + String.fromCharCode(10) + convo }),
  });
  const j = (await r.json().catch(() => ({}))) as { ok?: boolean; text?: string; error?: string };
  const txt = j?.text?.trim();
  if (!txt) throw new Error("brain no content: " + (j?.error ?? JSON.stringify(j).slice(0, 200)));
  return txt;
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
  const openRouterKey = opts.openRouterKey ?? process.env.OPENROUTER_API_KEY ?? "";
  const model = opts.model ?? process.env.MOSADD_AGENT_MODEL ?? "anthropic/claude-sonnet-4";
  const pollMs = opts.pollMs ?? Number(process.env.RESPONDER_POLL_MS ?? 30000);
  const statePath = opts.statePath ?? process.env.RESPONDER_STATE ?? "/tmp/responder-state.json";
  const systemPrompt = opts.systemPrompt ?? DEFAULT_SYSTEM;

  // ⛔ `OPENROUTER_API_KEY` NIE JEST JUZ WARUNKIEM STARTU — patrz nota przy `brainReply`.
  // Agent startuje na tym, co dostaje z samego wpiecia do mosADD.
  if (!supabaseUrl || !anonKey || !hubKey) {
    throw new Error(
      "[mosadd/agent] missing required env: MOSADD_SUPABASE_URL, MOSADD_SUPABASE_ANON_KEY, MOSADD_API_KEY",
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
          // T11/T12 decision loop: content-sniff each message so the agent SEES decision requests/
          // answers in context and continues from a choice.
          const recent = msgs.slice(-8);
          const decisionsById = new Map<string, Decision>();
          for (const m of recent) {
            const d = parseDecision(m.text);
            if (d?.id) decisionsById.set(d.id, d);
          }
          const convo = recent
            .map((m) => {
              const who = m.sender_identity_id === selfId ? "JA" : c.display_name || "KONTAKT";
              const resp = parseDecisionResponse(m.text);
              if (resp) return `${who}: ${summarizeResponse(resp, decisionsById.get(resp.decision_id))}`;
              const dec = parseDecision(m.text);
              if (dec) return `${who}: ${summarizeDecision(dec)}`;
              return `${who}: ${m.text}`;
            })
            .join("\n");
          let reply: string;
          try {
            // ⛔ KOLEJNOSC JEST DECYZJA: najpierw MOZG PLATFORMY (jedzie na samym kluczu huba),
            // dopiero potem wlasny OpenRouter klienta, jesli go w ogole podal. Odwrotna kolejnosc
            // znaczylaby, ze klient placi obcemu dostawcy za cos, co ma w abonamencie.
            try {
              reply = await brainReply(supabaseUrl, anonKey, hubKey, c.display_name, convo);
            } catch (be) {
              process.stderr.write("[mosadd/agent] brain err: " + (be as Error).message + String.fromCharCode(10));
              // Bez wlasnego klucza nie ma czym probowac dalej — niech zewnetrzny catch uciszy ten
              // obieg. Agent MILCZY Z POWODU zamiast zgadywac; odpowiedz bez mozgu byla juz raz
              // przyczyna nocy, w ktorej linie potwierdzaly sobie nawzajem zmyslone meldunki.
              if (!openRouterKey) throw be;
              reply = await llmReply(c.display_name, convo, openRouterKey, model, systemPrompt + DECISION_GUIDE);
            }
          } catch (e) {
            process.stderr.write(`[mosadd/agent] LLM err: ${(e as Error).message}\n`);
            continue;
          }
          try {
            // If the LLM asked for a DECISION (fenced ```decision block) → send it as a structured
            // message_type:"decision" the app renders as clickable options; else a plain text reply.
            const directive = extractDecisionDirective(reply);
            if (directive) {
              const decision: Decision = {
                ...directive,
                id: crypto.randomUUID(),
                requester_identity_id: selfId,
                requester_kind: "agent",
                allowed_responder_ids: [c.identity_id],
              };
              await sendDecision(supabaseUrl, anonKey, c.identity_id, selfId, decision);
              replied.add(last.id);
              process.stderr.write(
                `[mosadd/agent] asked a DECISION of ${c.display_name || c.identity_id}: ${decision.title}\n`,
              );
            } else {
              await invoke("mDM_send_unencrypted", { to: c.identity_id, text: reply }, ctx);
              replied.add(last.id);
              process.stderr.write(
                `[mosadd/agent] replied to ${c.display_name || c.identity_id}: ${reply.slice(0, 80)}\n`,
              );
            }
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
