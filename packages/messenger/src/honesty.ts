/**
 * Claims a messenger built on mosADD must never make in the creator's own copy (app description,
 * channel names, agent roles). Source of truth for what is and is not encrypted:
 * docs/security/e2ee-posture.md in this repository. Only 1:1 direct messages between people are
 * end-to-end encrypted; channels, voice, push-to-talk, mail and anything an agent touches are not.
 *
 * These rules guard creator copy inside the studio, the build and the app. The repository's own prose
 * is guarded separately by scripts/honesty-rules.mjs. Every rule carries a `sample` it must flag;
 * the test suite proves each one fires.
 */
export interface CopyRule {
  re: RegExp;
  why: string;
  sample: string;
}

export const COPY_RULES: readonly CopyRule[] = [
  {
    re: /\b(everything|all (messages|chats|data|calls))\b[^.]{0,30}\b(is|are)\b[^.]{0,20}encrypted/i,
    why: "blanket encryption claim: only 1:1 direct messages between people are end-to-end encrypted",
    sample: "All messages are encrypted.",
  },
  {
    re: /\b(channels?|groups?|rooms?)\b[^.]{0,30}\b(end-to-end|e2ee|fully encrypted)/i,
    why: "channels and rooms are readable by the service",
    sample: "Group channels are end-to-end encrypted.",
  },
  {
    re: /\b(voice|calls?|push-to-talk|ptt|walkie[- ]talkie)\b[^.]{0,30}\b(end-to-end|e2ee)/i,
    why: "voice and push-to-talk are relayed by the server, never end-to-end encrypted",
    sample: "Push-to-talk is end-to-end encrypted.",
  },
  {
    re: /\b(agents?|bots?|assistants?)\b[^.]{0,30}\b(end-to-end|e2ee)/i,
    why: "everything an agent reads is readable by the service",
    sample: "Your agent is end-to-end encrypted.",
  },
  {
    re: /\b(mail|e-?mail)\b[^.]{0,30}\b(end-to-end|e2ee)/i,
    why: "mail is sealed on the server, not end-to-end encrypted",
    sample: "Mail is end-to-end encrypted.",
  },
  {
    re: /zero[- ]knowledge/i,
    why: "blanket zero-knowledge claim",
    sample: "A zero-knowledge messenger.",
  },
  {
    re: /sealed[- ]sender/i,
    why: "the service sees who messaged whom",
    sample: "Built with sealed sender.",
  },
  {
    re: /\b(military[- ]grade|nsa[- ]proof|unbannable|unhackable|cannot be monitored|zero[- ]trace)\b/i,
    why: "marketing absolute that no messenger can promise",
    sample: "Military-grade security.",
  },
  {
    re: /\bno logs\b/i,
    why: "the service keeps operational logs",
    sample: "We keep no logs.",
  },
];

/** Returns the rules a piece of creator copy breaks. */
export function copyViolations(text: string): CopyRule[] {
  return COPY_RULES.filter((r) => r.re.test(text));
}

/** True when a creator's brand text uses the mosADD name (TRADEMARK.md). */
export function usesMosaddName(text: string): boolean {
  return /m[o0]s\s*-?\s*add/i.test(text);
}
