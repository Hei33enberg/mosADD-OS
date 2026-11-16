import { AA_INTERFACE, CONTRAST_PAIRS, contrastRatio } from "./contrast";
import { copyViolations, usesMosaddName } from "./honesty";
import { migrateMessenger } from "./migrate";
import { Messenger, type BlockId, type Theme } from "./schema";

export interface Issue {
  /** An error blocks a release; a warning does not. */
  level: "error" | "warning";
  /** JSON Pointer into the document, e.g. "/theme/tokens/light/textMuted". */
  path: string;
  code: string;
  message: string;
  hint?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: Issue[];
  messenger?: Messenger;
}

/** Removes keys that start with "_" (comments) at any depth. */
export function stripComments(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripComments);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) if (!k.startsWith("_")) out[k] = stripComments(v);
    return out;
  }
  return value;
}

const pointer = (path: readonly PropertyKey[]): string =>
  path.length === 0 ? "" : "/" + path.map((p) => String(p).replace(/~/g, "~0").replace(/\//g, "~1")).join("/");

/**
 * Validates a messenger description in four layers (RFC 0006): shape, consistency, accessibility,
 * honesty and trademark. Layers 2-4 run only when the shape is valid.
 */
export function validateMessenger(input: unknown): ValidationResult {
  const migrated = migrateMessenger(stripComments(input));
  if (!migrated.ok) {
    return { ok: false, issues: [{ level: "error", path: "/formatVersion", code: migrated.code, message: migrated.message }] };
  }

  const parsed = Messenger.safeParse(migrated.doc);
  if (!parsed.success) {
    const issues: Issue[] = parsed.error.issues.map((i) => ({
      level: "error",
      path: pointer(i.path),
      code: "SHAPE",
      message: i.message,
    }));
    return { ok: false, issues };
  }

  const m = parsed.data;
  const issues = [...consistency(m), ...accessibility(m), ...honesty(m)];
  return { ok: !issues.some((i) => i.level === "error"), issues, messenger: m };
}

function consistency(m: Messenger): Issue[] {
  const issues: Issue[] = [];
  const err = (path: string, code: string, message: string, hint?: string) =>
    issues.push({ level: "error", path, code, message, hint });
  const warn = (path: string, code: string, message: string, hint?: string) =>
    issues.push({ level: "warning", path, code, message, hint });

  const seen = new Map<BlockId, number>();
  m.blocks.forEach((b, i) => {
    if (seen.has(b.id)) err(`/blocks/${i}/id`, "BLOCK_DUPLICATE", `block "${b.id}" appears twice`);
    else seen.set(b.id, i);
  });
  const block = <T extends BlockId>(id: T) => {
    const i = seen.get(id);
    return i === undefined ? undefined : { index: i, value: m.blocks[i] as Extract<Messenger["blocks"][number], { id: T }> };
  };
  const on = (id: BlockId) => block(id)?.value.enabled === true;

  const identity = block("identity");
  if (!identity) err("/blocks", "IDENTITY_MISSING", 'the "identity" block is required');
  else if (!identity.value.enabled)
    err(`/blocks/${identity.index}/enabled`, "IDENTITY_OFF", "identity is part of the core and cannot be switched off");

  m.layout.tabs.forEach((t, i) => {
    if (!on(t)) err(`/layout/tabs/${i}`, "TAB_NOT_ENABLED", `tab "${t}" names a block that is not enabled`);
  });
  if (new Set(m.layout.tabs).size !== m.layout.tabs.length) err("/layout/tabs", "TAB_DUPLICATE", "a block appears twice in the tabs");
  if (!m.layout.tabs.includes(m.layout.home)) err("/layout/home", "HOME_NOT_IN_TABS", `home "${m.layout.home}" is not one of the tabs`);
  if (m.layout.tabs.includes("identity")) err("/layout/tabs", "TAB_IDENTITY", "identity is not a screen; remove it from the tabs");

  const mtalk = block("mtalk");
  if (mtalk?.value.enabled && mtalk.value.settings.inChannels && !on("mirc"))
    err(`/blocks/${mtalk.index}/settings/inChannels`, "NEEDS_MIRC", "push-to-talk in channels needs the mirc block enabled");

  const madd = block("madd");
  if (madd?.value.enabled && madd.value.settings.homeAgents.length === 0 && !madd.value.settings.usersBringOwnAgents)
    warn(`/blocks/${madd.index}/settings`, "MADD_EMPTY", "the agent block is on but has no agent and users cannot bring their own");

  const mkeeper = block("mkeeper");
  if (mkeeper?.value.enabled && !on("madd"))
    warn(`/blocks/${mkeeper.index}`, "MKEEPER_WITHOUT_AGENT", "scheduled jobs usually speak through an agent; the madd block is off");

  const offline = block("offline");
  if (offline?.value.enabled) {
    if (m.releases.android.enabled && m.releases.android.shell === "remote")
      err("/releases/android/shell", "OFFLINE_NEEDS_BUNDLED", 'working without signal needs the client bundled in the app (shell: "bundled")');
    const s = offline.value.settings;
    if (s.bluetooth || s.lora || s.localNetwork)
      warn(`/blocks/${offline.index}/settings`, "OFFLINE_EXPERIMENTAL", "local network, Bluetooth and LoRa arrive with the core; until then only store-and-forward works", "Bluetooth and LoRa also add Android permissions, which means a new install.");
  }

  const r = m.releases;
  if (!r.android.enabled && !r.desktop.enabled && !r.web.enabled) err("/releases", "NO_TARGET", "turn on at least one of android, desktop or web");
  if (r.android.enabled && /^(com|app|dev)\.m[o0]sadd\./.test(r.android.package))
    err("/releases/android/package", "PACKAGE_RESERVED", "package names under the mosadd namespace are reserved");
  if (r.android.enabled && r.android.push === "fcm")
    warn("/releases/android/push", "PUSH_FCM", "Firebase Cloud Messaging ties delivery to Google services", 'Use "unifiedpush" to stay independent.');
  if (r.desktop.enabled && r.desktop.systems.includes("macos"))
    warn("/releases/desktop/systems", "MACOS_LATER", "macOS builds need Apple signing and notarization; they are not available yet");

  if (m.instance.network.listedInMosaddDirectory)
    warn("/instance/network/listedInMosaddDirectory", "DIRECTORY_PLANNED", "the mosADD directory is planned; until it ships the messenger keeps its own network");
  if (m.instance.hosting !== "mosadd")
    warn("/instance/hosting", "HOSTING_PLANNED", `hosting "${m.instance.hosting}" is a planned mode; releases run on mosADD until it ships`);

  if (m.budget.monthlyUsd === 0) warn("/budget/monthlyUsd", "BUDGET_ZERO", "a zero budget stops paid cloud blocks (agent, transcripts) on day one");
  return issues;
}

function accessibility(m: Messenger): Issue[] {
  return themeIssues(m.theme);
}

/** Accessibility checks of one theme (mode listed, WCAG contrast pairs, PTT state gap). Paths start at `base`. */
export function themeIssues(t: Theme, base = "/theme"): Issue[] {
  const issues: Issue[] = [];
  if (!t.modes.includes(t.defaultMode))
    issues.push({ level: "error", path: `${base}/defaultMode`, code: "MODE_NOT_LISTED", message: `defaultMode "${t.defaultMode}" is not in modes` });
  for (const mode of t.modes) {
    const tokens = t.tokens[mode];
    if (!tokens) {
      issues.push({ level: "error", path: `${base}/tokens/${mode}`, code: "TOKENS_MISSING", message: `mode "${mode}" is listed but has no tokens` });
      continue;
    }
    for (const [fg, bg, min] of CONTRAST_PAIRS) {
      const ratio = contrastRatio(tokens[fg], tokens[bg]);
      if (ratio < min) {
        issues.push({
          level: "error",
          path: `${base}/tokens/${mode}/${fg}`,
          code: "CONTRAST",
          message: `${fg} on ${bg} is ${ratio.toFixed(2)}:1, below the WCAG AA minimum of ${min}:1`,
          hint: `Darken or lighten ${fg} until the ratio reaches ${min}:1.`,
        });
      }
    }
    const ch = t.channels?.[mode];
    if (ch) {
      for (const [name, colour] of Object.entries(ch)) {
        const ratio = contrastRatio(colour, tokens.background);
        if (ratio < AA_INTERFACE)
          issues.push({
            level: "error",
            path: `${base}/channels/${mode}/${name}`,
            code: "CHANNEL_CONTRAST",
            message: `channel colour ${name} on background is ${ratio.toFixed(2)}:1, below the WCAG AA minimum of ${AA_INTERFACE}:1`,
            hint: `Darken or lighten ${name} until the ratio reaches ${AA_INTERFACE}:1.`,
          });
      }
    }
    if (t.backdrop.kind === "image")
      issues.push({
        level: "warning",
        path: `${base}/backdrop`,
        code: "IMAGE_CONTRAST_UNMEASURED",
        message: "text contrast over an image cannot be measured; the dim value and the plain background colour are what keep text readable",
        hint: "Raise dim, or choose an image with little detail behind text.",
      });
    const pttGap = contrastRatio(tokens.pttTransmit, tokens.pttListen);
    if (pttGap < 1.3)
      issues.push({
        level: "warning",
        path: `${base}/tokens/${mode}/pttTransmit`,
        code: "PTT_STATES_CLOSE",
        message: `transmitting and listening colours differ by only ${pttGap.toFixed(2)}:1 in lightness`,
        hint: "The client also shows the state as an icon and text, but distinct lightness helps colour-blind users.",
      });
  }
  return issues;
}

function honesty(m: Messenger): Issue[] {
  const issues: Issue[] = [];
  const texts: Array<[string, string]> = [
    ["/brand/name", m.brand.name],
    ["/brand/shortName", m.brand.shortName],
    ["/brand/description", m.brand.description],
  ];
  m.blocks.forEach((b, i) => {
    if (b.id === "madd") b.settings.homeAgents.forEach((a, j) => texts.push([`/blocks/${i}/settings/homeAgents/${j}/role`, a.role], [`/blocks/${i}/settings/homeAgents/${j}/name`, a.name]));
    if (b.id === "mirc") b.settings.startChannels.forEach((c, j) => texts.push([`/blocks/${i}/settings/startChannels/${j}`, c]));
    if (b.id === "mkeeper") b.settings.jobs.forEach((job, j) => texts.push([`/blocks/${i}/settings/jobs/${j}/does`, job.does]));
  });

  for (const path of ["/brand/name", "/brand/shortName"]) {
    const text = texts.find(([p]) => p === path)![1];
    if (usesMosaddName(text))
      issues.push({
        level: "error",
        path,
        code: "TRADEMARK",
        message: "your messenger needs its own name; the mosADD name is not available for products built on it",
        hint: 'Credit the engine with "Runs on mosADD" (brand.poweredBy) instead.',
      });
  }
  for (const [path, text] of texts) {
    for (const rule of copyViolations(text)) {
      issues.push({ level: "error", path, code: "HONESTY", message: rule.why, hint: "Describe what is true: only 1:1 direct messages between people are end-to-end encrypted." });
    }
  }
  return issues;
}
