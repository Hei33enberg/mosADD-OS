// Honesty-lint rules: sentences this repository must never publish, one per entry.
// Used by scripts/check-skill-lint.mjs (the gate) and by packages/m0s/test (which proves every rule fires).
//
// Every rule carries `sample`: a sentence the rule MUST flag. The test runs each rule against its own sample,
// so a rule that can never match (the 29.09 case: a stray backspace byte, 0x08, sat inside the
// `@mosadd/mcp@(alpha|latest)` pattern and the rule stayed silent for everything) turns the suite red.
// `skip` (optional) = files the rule does not apply to, e.g. changelogs that record what was true back then.
// `unless` (optional) = a line matching it is not a claim of this rule (it states the narrower, true case).
//
// Allowlist: a line containing "honesty-lint:allow" is skipped (for docs that discuss the banned phrase itself).

export const BANNED = [
  { re: /unbannable/i, why: `"unbannable" - we don't claim that (HYDRA lesson)`, sample: 'mosADD is unbannable.' },
  { re: /everything is (end-to-end )?encrypted/i, why: `blanket encryption claim - only mDM between people is E2EE`, sample: 'In mosADD everything is encrypted.' },
  { re: /all messages are (end-to-end )?encrypted/i, why: `blanket encryption claim - only mDM between people is E2EE`, sample: 'All messages are end-to-end encrypted.' },
  { re: /zero[- ]knowledge everywhere/i, why: `blanket zero-knowledge claim - only the encrypted paths are`, sample: 'Zero-knowledge everywhere.' },
  { re: /sealed sender/i, why: `"sealed sender" - mosadd does not hide who-messaged-whom`, sample: 'Messages use sealed sender.' },
  { re: /military[- ]grade/i, why: `"military-grade" - meaningless marketing crypto claim`, sample: 'Military-grade crypto.' },
  { re: /nsa[- ]proof/i, why: `"NSA-proof" - false absolute`, sample: 'It is NSA-proof.' },
  { re: /zero[- ]trace/i, why: `"zero-trace" - false absolute (the motto "Trust no trace" is fine; "zero-trace" is not)`, sample: 'A zero-trace messenger.' },
  { re: /cannot be monitored/i, why: `"cannot be monitored" - false absolute`, sample: 'Your agents cannot be monitored.' },
  { re: /\bno logs\b/i, why: `"no logs" - we don't claim that`, sample: 'We keep no logs.' },
  { re: /we can never be compelled/i, why: `false legal absolute`, sample: 'We can never be compelled to hand over data.' },

  // mLIDAR / threat-detection over-claims (LINEAR-4838, 2026-07-14 audit): the taxonomy describes 193 event
  // types, collectors emit 20; public indicator lists cannot detect live Pegasus; mLIDAR uploads detections
  // and is a 60-second poll while the desktop app is open.
  { re: /(only|first) (messenger|app|product)[^.]{0,40}detects?/i, why: `superlative detection claim - we are not the only or first anything here`, sample: 'The only messenger that detects spyware.' },
  { re: /detects? (live )?pegasus/i, why: `"detects Pegasus" - public indicator lists cannot detect live Pegasus infrastructure`, sample: 'mLIDAR detects Pegasus.' },
  { re: /zero[- ]click[^.]{0,30}(detect|scan|flag|protect)/i, why: `zero-click detection - in the taxonomy, no detector emits it`, sample: 'Zero-click exploit detection.' },
  { re: /(imsi[- ]catcher|stingray)[^.]{0,30}(detect|scan|flag)/i, why: `IMSI-catcher/Stingray detection - in the taxonomy, no detector emits it`, sample: 'IMSI-catcher detection built in.' },
  { re: /rogue[- ]certificate[s]?[^.]{0,30}(detect|scan|flag)/i, why: `rogue-certificate detection - not implemented`, sample: 'Rogue certificate detection.' },
  { re: /100% on[- ]device/i, why: `"100% on-device" - mLIDAR uploads detections to your account`, sample: 'Detection is 100% on-device.' },
  { re: /zero cloud custody/i, why: `"zero cloud custody" - false for mLIDAR telemetry`, sample: 'Zero cloud custody.' },
  { re: /24\/7[^.]{0,25}(monitor|scan|watch|protect)/i, why: `"24/7 monitoring" - mLIDAR is a 60-second poll, only while the desktop app is open`, sample: '24/7 monitoring of your device.' },
  { re: /iron ?dome for your phone/i, why: `"iron dome for your phone" - there is no phone spyware monitor`, sample: 'An iron dome for your phone.' },

  // m.0S truth pass (2026-09-29, PRZEORANIE 04 section 4): each sentence was published here and was false
  // when measured on 2026-09-28.
  { re: /self[- ]?host/i, why: `self-host claim - there is no self-hosted service; the client is MIT, the service is ours`, sample: 'You can self-host the hub.' },
  { re: /hub\.mosadd\.com/i, why: `hub.mosadd.com - never launched (404); the panel is app.mosadd.dev`, sample: 'Open hub.mosadd.com to get a key.' },
  { re: /commercial hub/i, why: `"commercial hub" - the hosted service is mcp.mosadd.dev`, sample: 'A commercial hub funds the project.' },
  { re: /full[- ]time maintenance/i, why: `"full-time maintenance" - one maintainer plus agents`, sample: 'Usage pays for full-time maintenance.' },
  {
    re: /@mosadd\/mcp@(alpha|latest|next|beta)\b/i,
    why: `dist-tag install - pin an exact version (@mosadd/mcp@3.0.0-alpha.N), never alpha/latest (SPEC-DYSTRYBUCJA section 0 point 3)`,
    sample: 'npx -y @mosadd/mcp@alpha login',
    skip: /(^|\/)CHANGELOG\.md$/,
  },
  { re: /`latest` = `alpha`/i, why: `stale dist-tag claim`, sample: 'Today `latest` = `alpha`.' },
  { re: /roll(s)? out with partners/i, why: `robot deployments with partners - none exist`, sample: 'Robots roll out with partners.' },
  { re: /open authenticity/i, why: `Voice Truthgate is not open (private repository)`, sample: 'Open authenticity layer for voice.' },
  { re: /Plan-les-Ouates|Swiss HQ/i, why: `legal seat not confirmed - the entity question is open`, sample: 'Swiss HQ in Geneva.' },
  { re: /community room/i, why: `community room not verified for outside users (murl-read 404, SPEC-DYSTRYBUCJA section 6)`, sample: 'Join our community room on mosADD.' },
  {
    re: /mDM_send\W[^.]{0,30}end-to-end encrypted by default/i,
    why: `mDM_send is plain text whenever an agent line is on either side (alpha.54/55); only people-to-people mDM in the app is E2EE`,
    sample: '`mDM_send` is end-to-end encrypted by default.',
  },
  {
    // 30.09: "the operator cannot read" stood unqualified in packages/mcp/server.json, docs/threat-monitoring.md and
    // docs/architecture/human-os.md after the 29.09 pass. True only between two people; agent lines are readable.
    re: /\b(operator|server|service)\b[^.]{0,20}\b(cannot|can ?not|can't|never) read/i,
    unless: /\b(two people|between people|people|person|human)\b/i,
    why: `"the operator cannot read" holds only for mDM between two people in the app; every agent line (every m.0S key) is readable by the service`,
    sample: 'mDM direct messages are end-to-end encrypted; the operator cannot read content.',
  },
  {
    // 30.09: the README, the quickstart and ClawHub skills and the roadmap said the panel signs you up "with a passkey".
    // Live (app.mosadd.dev sign-in screen, GET /v1/auth/providers): sign-up is e-mail and password; a passkey is optional
    // (Settings) and only offered at log-in. Google and GitHub appear only when configured, so they are not promised either.
    re: /\b(sign[- ]?up|register|create an? account|account)\b[^.\n]{0,25}\b(by|with|via|using)\s+(a\s+)?passkey/i,
    why: `sign-up on app.mosadd.dev is by e-mail and password; a passkey is optional (Settings), not the way in`,
    sample: 'Create an account with a passkey and name your first line.',
  },
];

/**
 * A negation right before the banned phrase, in the same clause ("no self-host", "never claim X", "we don't say X",
 * a red cross). A negation earlier in the sentence does not count once a comma, semicolon or full stop sits between
 * it and the phrase: "this is not a toy, and you can self-host it" is a claim.
 */
export function isNegated(line, index) {
  const before = line.slice(Math.max(0, index - 40), index);
  return /\b(no|without|never|don'?t|do not|won'?t|isn'?t|is not|are not|no longer|not)\b[^.,;]*$|❌/i.test(before);
}

/** Every rule that fires on `line` of `file` (posix path). Returns [{ rule, index }]. */
export function violations(line, file = '') {
  if (line.includes('honesty-lint:allow')) return [];
  const out = [];
  for (const rule of BANNED) {
    if (rule.skip && rule.skip.test(file)) continue;
    if (rule.unless && rule.unless.test(line)) continue; // e.g. the sentence names people, not agent lines
    const m = rule.re.exec(line);
    if (!m || isNegated(line, m.index)) continue;
    out.push({ rule, index: m.index });
  }
  return out;
}
