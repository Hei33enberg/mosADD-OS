import { validateMessenger, type ValidationResult } from "./validate";

/**
 * Rule-based fit: a one-sentence description of a messenger becomes a messenger.json, by choosing the
 * closest template and then applying the few adjustments the sentence asks for. No model, no network:
 * the studio runs it in the browser and a model can refine the result later (see `FitOptions.refine`).
 *
 * The result is always run through `validateMessenger`, so a fit can never hand out a document the
 * format would refuse.
 */

export interface TemplateInfo {
  /** "name@major", the value of `template` in the document. */
  key: string;
  /** Words (lower case) that make the template a better match. Longer phrases weigh more. */
  keywords: readonly string[];
  /** A one-line label for the studio. */
  label: string;
}

export const TEMPLATE_INFO: readonly TemplateInfo[] = [
  { key: "crew-ptt@1", label: "Crew PTT", keywords: ["walkie", "talkie", "push-to-talk", "push to talk", "ptt", "crew", "shift", "port", "dock", "harbour", "harbor", "radio", "dispatch", "fishing", "ship", "ferry", "marina"] },
  { key: "community@1", label: "Community", keywords: ["community", "club", "members", "fans", "neighbours", "neighbors", "group", "forum", "hobby", "meetup", "running", "congregation", "association"] },
  { key: "security-events@1", label: "Security & events", keywords: ["security", "guard", "bouncer", "festival", "event", "concert", "stadium", "venue", "steward", "incident", "gate", "patrol", "club door"] },
  { key: "logistics-fleet@1", label: "Logistics & fleet", keywords: ["logistics", "fleet", "driver", "drivers", "truck", "trucks", "delivery", "deliveries", "courier", "warehouse", "depot", "route", "routes", "freight", "taxi"] },
  { key: "construction@1", label: "Construction", keywords: ["construction", "builder", "builders", "site", "foreman", "crane", "scaffold", "gloves", "contractor", "contractors", "roofing", "carpenter", "electrician", "plumber"] },
  { key: "solo-agents@1", label: "One person + agents", keywords: ["my agents", "my ai", "ai agents", "agent team", "team of agents", "solo", "one-person", "one person", "founder", "freelancer", "personal assistant", "second brain", "my own agents"] },
  { key: "crisis-offline@1", label: "Crisis, no internet", keywords: ["crisis", "disaster", "emergency", "offline", "no internet", "without internet", "no signal", "without signal", "blackout", "flood", "earthquake", "off-grid", "off grid", "mesh", "lora", "bluetooth", "rescue", "volunteers"] },
  { key: "school-club@1", label: "School / club", keywords: ["school", "class", "classroom", "teacher", "teachers", "students", "student", "parents", "pupils", "scouts", "choir", "university", "course", "homework", "kids"] },
];

export interface FitOptions {
  /** Override the app name (otherwise taken from "called X" / quotes, else the template's own). */
  name?: string;
  /** Hook for a language model: receives the fitted document and may return a refined one. Never required. */
  refine?: (doc: any, description: string) => Promise<any> | any;
}

export interface FitResult {
  /** The chosen template key, e.g. "crew-ptt@1". */
  template: string;
  /** What the sentence made us pick, in plain words, for the studio's checklist. */
  reasons: string[];
  /** The fitted document (an unvalidated plain object). */
  doc: any;
  validation: ValidationResult;
}

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim();

/** Scores every template against the description; the best score wins, ties go to the earlier template. */
export function scoreTemplates(description: string): Array<{ key: string; score: number; hits: string[] }> {
  const text = ` ${norm(description)} `;
  return TEMPLATE_INFO.map((t) => {
    const hits = t.keywords.filter((k) => text.includes(` ${k} `) || text.includes(` ${k}s `) || (k.includes(" ") && text.includes(k)));
    const score = hits.reduce((n, k) => n + (k.includes(" ") || k.includes("-") ? 2 : 1), 0);
    return { key: t.key, score, hits };
  }).sort((a, b) => b.score - a.score);
}

const slugOf = (name: string) =>
  name.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 38) || "my-messenger";

/** "called Port Radio", "named 'Port Radio'", or a "Quoted Name". */
export function nameFromDescription(description: string): string | undefined {
  const m =
    /\b(?:called|named|name it|name:)\s+["“']?([A-Z][\w&]*(?:\s+[A-Z][\w&]*){0,3})/.exec(description) ??
    /["“]([^"”]{2,30})["”]/.exec(description);
  const name = m?.[1]?.trim();
  return name && name.length <= 30 ? name : undefined;
}

const has = (text: string, ...words: string[]) => words.some((w) => text.includes(w));

/**
 * @param templates the template documents, keyed by `template` key ("crew-ptt@1" → parsed JSON).
 */
export function fitMessenger(description: string, templates: Record<string, unknown>, opts: FitOptions = {}): FitResult {
  const text = ` ${norm(description)} `;
  const ranked = scoreTemplates(description);
  const best = ranked[0]!.score > 0 ? ranked[0]! : { key: "community@1", score: 0, hits: [] as string[] };
  const source = templates[best.key] ?? templates["community@1"];
  if (!source) throw new Error(`template ${best.key} is not available`);
  const doc: any = JSON.parse(JSON.stringify(source));
  delete doc._comment;
  const reasons: string[] = [];
  const label = TEMPLATE_INFO.find((t) => t.key === best.key)?.label ?? best.key;
  reasons.push(best.hits.length ? `${label} template (matched: ${best.hits.slice(0, 3).join(", ")})` : `${label} template (default: nothing in the sentence pointed elsewhere)`);

  // Name, and everything derived from it.
  const name = (opts.name ?? nameFromDescription(description))?.trim();
  if (name) {
    const slug = slugOf(name);
    const compact = slug.replace(/-/g, "");
    doc.id = slug;
    doc.brand.name = name.slice(0, 30);
    doc.brand.shortName = name.replace(/\s+/g, "").slice(0, 12);
    const identity = doc.blocks.find((b: any) => b.id === "identity");
    if (identity?.settings) identity.settings.namespace = compact.slice(0, 30);
    if (doc.releases?.android) doc.releases.android.package = `org.example.${compact.replace(/^[0-9]+/, "") || "messenger"}`;
    if (doc.releases?.web) doc.releases.web.address = compact.slice(0, 30) || null;
    reasons.push(`Name "${doc.brand.name}"`);
  }
  doc.brand.description = description.trim().replace(/\s+/g, " ").slice(0, 160) || doc.brand.description;

  const block = (id: string) => doc.blocks.find((b: any) => b.id === id);

  // Agent: asked for, or explicitly refused.
  const madd = block("madd");
  if (madd) {
    if (has(text, " no agent ", " without an agent ", " without agents ", " no ai ", " no bots ")) {
      madd.enabled = false;
      reasons.push("No agent (you asked for none)");
    } else if (has(text, " agent ", " agents ", " assistant ", " ai ", " bot ", " summarise", " summarize")) {
      if (!madd.enabled) {
        madd.enabled = true;
        madd.settings = { homeAgents: [{ name: "Helper", role: "Answers questions and summarises the channels", model: "mosadd/flash" }], usersBringOwnAgents: false };
        reasons.push('Agent "Helper" added');
      } else reasons.push(`Agent "${madd.settings?.homeAgents?.[0]?.name ?? "on duty"}" on duty`);
    }
  }

  // Working without signal.
  const offline = block("offline");
  if (offline?.settings && has(text, " offline ", " no internet ", " without internet ", " no signal ", " without signal ", " blackout ", " off-grid ", " off grid ", " mesh ")) {
    offline.enabled = true;
    offline.settings.storeAndForward = true;
    if (has(text, " mesh ", " local network ", " wifi ", " wi-fi ")) offline.settings.localNetwork = true;
    if (has(text, " bluetooth ")) offline.settings.bluetooth = true;
    if (has(text, " lora ", " radio ")) offline.settings.lora = true;
    reasons.push("Works without signal (store-and-forward first)");
  }

  // Who can join.
  const identity = block("identity");
  if (identity?.settings) {
    if (has(text, " invite only ", " invite-only ", " private ", " members only ")) identity.settings.joining = "invite-only";
    else if (has(text, " open to everyone ", " anyone can join ", " public ")) identity.settings.joining = "open";
    else if (has(text, " link ", " by link ", " with a link ")) identity.settings.joining = "link";
  }

  // Talk button.
  const mtalk = block("mtalk");
  if (mtalk?.enabled && mtalk.settings && has(text, " big talk button ", " bigger talk button ", " large talk button ", " gloves ")) {
    mtalk.settings.button = "large-bottom";
    reasons.push("Large talk button");
  }

  // Language.
  const pl = has(text, " polish ", " po polsku ", " w polsce ", " poland ");
  if (pl) {
    doc.brand.languages = ["pl", "en"];
    doc.brand.defaultLanguage = "pl";
    reasons.push("Polish first, English second");
  }

  // Theme mode.
  if (doc.theme?.modes?.includes("light") && doc.theme.modes.includes("dark")) {
    if (has(text, " light theme ", " light mode ", " bright ", " daylight ")) doc.theme.defaultMode = "light";
    else if (has(text, " dark theme ", " dark mode ", " night ")) doc.theme.defaultMode = "dark";
  }
  reasons.push(`Theme "${doc.theme.id}" · ${doc.theme.defaultMode} first`);

  // Keep layout consistent with what is enabled (an agent refused can take its tab away).
  const enabled = new Set<string>(doc.blocks.filter((b: any) => b.enabled).map((b: any) => b.id));
  doc.layout.tabs = doc.layout.tabs.filter((t: string) => enabled.has(t));
  if (madd?.enabled && !doc.layout.tabs.includes("madd") && doc.layout.tabs.length < 5) doc.layout.tabs.push("madd");
  if (!doc.layout.tabs.includes(doc.layout.home)) doc.layout.home = doc.layout.tabs[0];
  const mkeeper = block("mkeeper");
  if (mkeeper && !enabled.has("madd")) mkeeper.enabled = false;
  const mrag = block("mrag");
  if (mrag && !enabled.has("madd")) mrag.enabled = false;
  if (doc.instance?.cloudServices && !enabled.has("madd")) doc.instance.cloudServices = doc.instance.cloudServices.filter((s: string) => s !== "madd");

  doc.revision = 1;
  return { template: best.key, reasons, doc, validation: validateMessenger(doc) };
}
