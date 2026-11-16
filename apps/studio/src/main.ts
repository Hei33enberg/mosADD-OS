import { CONTRAST_PAIRS, TEMPLATE_INFO, contrastRatio, fitMessenger, validateMessenger } from "../../../packages/messenger/src/index";
import community from "../../../packages/messenger/templates/community.json";
import construction from "../../../packages/messenger/templates/construction.json";
import crewPtt from "../../../packages/messenger/templates/crew-ptt.json";
import crisis from "../../../packages/messenger/templates/crisis-offline.json";
import logistics from "../../../packages/messenger/templates/logistics-fleet.json";
import school from "../../../packages/messenger/templates/school-club.json";
import security from "../../../packages/messenger/templates/security-events.json";
import solo from "../../../packages/messenger/templates/solo-agents.json";

const TEMPLATES: Record<string, any> = Object.fromEntries(
  [crewPtt, community, security, logistics, construction, solo, crisis, school].map((t: any) => [t.template, t]),
);

const BLOCK_LABEL: Record<string, [string, string, string?]> = {
  identity: ["Identity", "Keys on the device · sign-in · joining", "CORE · ALWAYS ON"],
  mtalk: ["Push-to-talk", "Queue · recordings · transcripts", "SERVER-RELAYED"],
  mirc: ["Channels", "Rooms for teams and topics", "SERVER-READABLE"],
  mdm: ["Direct messages", "Files · calls · between two people", "END-TO-END 1:1"],
  madd: ["Agents", "Home agents that answer and summarise", "LABELLED AGENT"],
  mkeeper: ["Scheduled jobs", "An agent that acts on a timetable"],
  mrag: ["Team memory", "Indexes team channels only, never 1:1 DMs"],
  mayl: ["Mail", "Inboxes for people and agents"],
  murl: ["Room on your website", "A live room embedded on your domain"],
  offline: ["Works without signal", "Messages wait and send when back", "EXPERIMENTAL"],
};
const TAB_LABEL: Record<string, string> = { mtalk: "Talk", mirc: "Channels", mdm: "Messages", madd: "Agents", mkeeper: "Jobs", mrag: "Memory", mayl: "Mail", murl: "Room" };
const RADIUS: Record<string, string> = { square: "0px", soft: "10px", round: "20px" };

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

let doc: any = null;
let mode: "dark" | "light" = "dark";
let activeTab = "";
let templateKey = "";

function render(): void {
  if (!doc) return;
  const v = validateMessenger(doc);
  const errors = v.issues.filter((i) => i.level === "error");
  $("result").hidden = false;
  $("empty").hidden = true;
  $("phone").hidden = false;
  ($("ship") as HTMLButtonElement).disabled = errors.length > 0;
  renderBlocks();
  renderIssues(v.issues, errors.length === 0);
  renderContrast();
  $("json").textContent = JSON.stringify(doc, null, 2);
  renderPhone();
  $("shipnote").hidden = true;
  document.querySelectorAll<HTMLButtonElement>("#chips button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.key === templateKey)));
}

function renderBlocks(): void {
  $("blocks").innerHTML = doc.blocks
    .map((b: any, i: number) => {
      const [name, sub, tag] = BLOCK_LABEL[b.id] ?? [b.id, ""];
      const core = b.id === "identity";
      return `<div class="block"><div><b>${esc(name)}${tag ? `<span class="tag">${esc(tag)}</span>` : ""}</b><small>${esc(sub)}</small></div>` +
        `<button class="switch" role="switch" aria-label="${esc(name)}" aria-checked="${b.enabled}" data-i="${i}" ${core ? "disabled" : ""}></button></div>`;
    })
    .join("");
  document.querySelectorAll<HTMLButtonElement>("#blocks .switch").forEach((btn) =>
    btn.addEventListener("click", () => {
      const b = doc.blocks[Number(btn.dataset.i)];
      b.enabled = !b.enabled;
      if (b.enabled && !b.settings) b.settings = defaultSettings(b.id);
      // Keep the layout in step with what is switched on, so a toggle never produces a broken tab.
      const on = new Set(doc.blocks.filter((x: any) => x.enabled).map((x: any) => x.id));
      doc.layout.tabs = doc.layout.tabs.filter((t: string) => on.has(t));
      if (b.enabled && TAB_LABEL[b.id] && !doc.layout.tabs.includes(b.id) && doc.layout.tabs.length < 5 && ["mtalk", "mirc", "mdm", "madd"].includes(b.id)) doc.layout.tabs.push(b.id);
      if (!doc.layout.tabs.includes(doc.layout.home)) doc.layout.home = doc.layout.tabs[0] ?? "mdm";
      if (!doc.layout.tabs.includes(activeTab)) activeTab = doc.layout.home;
      render();
    }),
  );
}

function defaultSettings(id: string): any {
  switch (id) {
    case "mtalk": return { button: "large-bottom", queue: true, recordings: true, transcripts: false, maxSeconds: 60, inChannels: true };
    case "mirc": return { startChannels: ["#general"], whoCreatesChannels: "admins" };
    case "mdm": return { calls: true, files: true, disappearingHours: 0 };
    case "madd": return { homeAgents: [{ name: "Helper", role: "Answers questions and summarises the channels", model: "mosadd/flash" }], usersBringOwnAgents: false };
    case "mkeeper": return { jobs: [] };
    case "mrag": return { scope: "team-channels", limitMbPerUser: 100 };
    case "offline": return { storeAndForward: true, localNetwork: false, bluetooth: false, lora: false };
    default: return {};
  }
}

function renderIssues(issues: ReturnType<typeof validateMessenger>["issues"], ok: boolean): void {
  const rows = issues.map((i) => `<div class="issue ${i.level}"><code>${esc(i.code)}</code>${esc(i.message)}${i.hint ? `<br><small>${esc(i.hint)}</small>` : ""}</div>`);
  if (ok && issues.length === 0) rows.push('<div class="issue pass">All checks pass: shape, consistency, contrast, honest copy.</div>');
  $("issues").innerHTML = rows.join("");
}

function renderContrast(): void {
  const tokens = doc.theme.tokens[mode] ?? doc.theme.tokens[doc.theme.modes[0]];
  const rows = CONTRAST_PAIRS.map(([fg, bg, min]) => {
    const r = contrastRatio(tokens[fg], tokens[bg]);
    return `<tr><td>${fg}</td><td><span class="sw" style="background:${esc(tokens[fg])}"></span>${esc(tokens[fg])}</td><td>${bg}</td><td>${r.toFixed(2)}:1</td><td style="color:${r >= min ? "var(--green)" : "#ff6b6b"}">${r >= min ? "✓ pass" : "✗ below " + min}</td></tr>`;
  });
  $("contrast").innerHTML = `<tr><th>Token</th><th>Colour</th><th>Against</th><th>Ratio</th><th>AA</th></tr>` + rows.join("");
}

function renderPhone(): void {
  const t = doc.theme;
  const tk = t.tokens[mode] ?? t.tokens[t.modes[0]];
  const phone = $("phone");
  const set = (k: string, v: string) => phone.style.setProperty(k, v);
  set("--p-bg", tk.background); set("--p-surface", tk.surface); set("--p-text", tk.text); set("--p-muted", tk.textMuted);
  set("--p-accent", tk.accent); set("--p-onaccent", tk.onAccent); set("--p-tx", tk.pttTransmit); set("--p-listen", tk.pttListen);
  set("--p-r", RADIUS[t.radius] ?? "10px"); set("--p-font", `"${t.fonts.text}"`); set("--p-head", `"${t.fonts.headings}"`);
  phone.className = `phone dens-${t.density}`;
  if (!activeTab || !doc.layout.tabs.includes(activeTab)) activeTab = doc.layout.home;

  const block = (id: string) => doc.blocks.find((b: any) => b.id === id && b.enabled);
  let body = "";
  if (activeTab === "mtalk") {
    const ch = block("mirc")?.settings?.startChannels?.[0] ?? "#all";
    const m = block("mtalk")?.settings;
    body = `<div class="p-talk"><div class="p-label">${esc(ch)}</div><button class="ptt" id="ptt" type="button">HOLD TO TALK</button>` +
      `<div class="p-state" id="pstate">Listening · up to ${m?.maxSeconds ?? 60} s${m?.transcripts ? " · transcribed" : ""}</div></div>`;
  } else if (activeTab === "mirc") {
    const chs: string[] = block("mirc")?.settings?.startChannels ?? [];
    body = `<div class="p-label">Channels</div>` + chs.map((c) => `<div class="p-card"><b>${esc(c)}</b><small>Open · tap to join</small></div>`).join("");
  } else if (activeTab === "madd") {
    const ag: any[] = block("madd")?.settings?.homeAgents ?? [];
    body = `<div class="p-label">On duty</div>` + (ag.length ? ag.map((a) => `<div class="p-card"><b>${esc(a.name)}</b> <small>Agent · labelled</small><small>${esc(a.role)}</small></div>`).join("") : `<div class="p-card"><small>Members bring their own agents.</small></div>`);
  } else if (activeTab === "mdm") {
    const s = block("mdm")?.settings;
    body = `<div class="p-label">Direct messages</div><div class="p-card"><b>Between two people</b><small>End-to-end encrypted · ${s?.calls ? "calls" : "no calls"} · ${s?.files ? "files" : "no files"}</small></div>`;
  } else {
    body = `<div class="p-card"><b>${esc(TAB_LABEL[activeTab] ?? activeTab)}</b></div>`;
  }
  const home = doc.layout.home;
  $("screen").innerHTML =
    `<div class="p-bar"><b>${esc(doc.brand.name)}</b><span>${esc(doc.brand.languages[0].toUpperCase())}</span></div>` +
    `<div class="p-body">${body}</div>` +
    `<div class="p-tabs" role="tablist">${doc.layout.tabs.map((tab: string) => `<button role="tab" data-tab="${tab}" class="${tab === activeTab ? "on" : ""}" aria-selected="${tab === activeTab}">${esc(TAB_LABEL[tab] ?? tab)}${tab === home ? " ·" : ""}</button>`).join("")}</div>`;
  $("screen").querySelectorAll<HTMLButtonElement>(".p-tabs button").forEach((b) => b.addEventListener("click", () => { activeTab = b.dataset.tab!; renderPhone(); }));
  const ptt = document.getElementById("ptt");
  if (ptt) wirePtt(ptt, block("mtalk")?.settings?.maxSeconds ?? 60);
}

function wirePtt(btn: HTMLElement, maxSeconds: number): void {
  let timer: number | undefined;
  const stop = () => { window.clearInterval(timer); btn.classList.remove("tx"); btn.textContent = "HOLD TO TALK"; const s = document.getElementById("pstate"); if (s) s.textContent = "Listening"; };
  btn.addEventListener("pointerdown", (e) => {
    btn.setPointerCapture(e.pointerId);
    let n = 0;
    btn.classList.add("tx"); btn.textContent = "TRANSMITTING";
    timer = window.setInterval(() => { n++; const s = document.getElementById("pstate"); if (s) s.textContent = `Transmitting · ${n} s of ${maxSeconds}`; if (n >= maxSeconds) stop(); }, 1000);
    const s = document.getElementById("pstate"); if (s) s.textContent = `Transmitting · 0 s of ${maxSeconds}`;
  });
  btn.addEventListener("pointerup", stop);
  btn.addEventListener("pointercancel", stop);
}

let userBuild = false;
function build(text: string, key?: string): void {
  const r = key
    ? { template: key, reasons: [`${TEMPLATE_INFO.find((t) => t.key === key)?.label} template`], doc: JSON.parse(JSON.stringify(TEMPLATES[key])) }
    : fitMessenger(text, TEMPLATES);
  doc = r.doc;
  delete doc._comment;
  templateKey = r.template;
  activeTab = doc.layout.home;
  $("reasons").innerHTML = r.reasons.map((x) => `<li>${esc(x)}</li>`).join("");
  render();
  // On a phone the preview sits below the form: bring it into view after an explicit build.
  if (key !== undefined || text) { if (window.matchMedia("(max-width: 959px)").matches && userBuild) $("stage").scrollIntoView({ block: "start" }); }
}

function ship(): void {
  if (!doc) return;
  const file = JSON.stringify(doc, null, 2) + "\n";
  const url = URL.createObjectURL(new Blob([file], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "messenger.json" });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  const r = doc.releases;
  const targets = [r.android.enabled && `Android (${r.android.package})`, r.desktop.enabled && `Desktop (${r.desktop.systems.join(", ")})`, r.web.enabled && `Web (${r.web.address}.mosadd.com)`].filter(Boolean);
  $("shipnote").hidden = false;
  $("shipnote").innerHTML =
    `<h3>SAVED messenger.json</h3><dl><dt>App</dt><dd>${esc(doc.brand.name)} · rev ${doc.revision}</dd><dt>Targets</dt><dd>${esc(targets.join(" · "))}</dd>` +
    `<dt>Blocks</dt><dd>${esc(doc.blocks.filter((b: any) => b.enabled).map((b: any) => b.id).join(", "))}</dd><dt>Budget</dt><dd>$${doc.budget.monthlyUsd}/month, then ${esc(doc.budget.overBudget)}</dd></dl>` +
    `<p>Building and publishing the apps is not live yet: this saved the description they will be built from.</p>`;
}

function init(): void {
  $("chips").innerHTML = TEMPLATE_INFO.map((t) => `<button type="button" data-key="${t.key}" aria-pressed="false">${esc(t.label)}</button>`).join("");
  $("chips").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest("button");
    if (b) { userBuild = true; build("", b.dataset.key); }
  });
  $("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = ($("desc") as HTMLTextAreaElement).value.trim();
    if (text) { userBuild = true; build(text); }
  });
  $("ship").addEventListener("click", ship);
  document.querySelectorAll<HTMLButtonElement>(".modes button").forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.mode as "dark" | "light";
      document.querySelectorAll(".modes button").forEach((x) => x.classList.toggle("on", x === b));
      if (doc) { renderContrast(); renderPhone(); }
    }),
  );
  // Deep links, used for screenshots and sharing: ?d=<sentence>&mode=light&tab=mirc
  const params = new URLSearchParams(location.search);
  const q = params.get("d");
  if (params.get("mode") === "light") document.querySelector<HTMLButtonElement>('.modes [data-mode="light"]')!.click();
  if (q) {
    ($("desc") as HTMLTextAreaElement).value = q;
    build(q);
    const tab = params.get("tab");
    if (tab && doc.layout.tabs.includes(tab)) { activeTab = tab; renderPhone(); }
    if (params.get("view") === "preview") $("stage").scrollIntoView({ block: "start" });
  }
}
init();
