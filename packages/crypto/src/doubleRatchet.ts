import { deriveHkdfKey } from "./hkdf";

export interface RatchetState {
  rootKey: Uint8Array;
  sendChainKey: Uint8Array;
  recvChainKey: Uint8Array;
  sendMessageIndex: number;
  recvMessageIndex: number;
}

export interface RatchetStepResult {
  chainKey: Uint8Array;
  messageKey: Uint8Array;
  messageIndex: number;
}

export type SessionRole = "initiator" | "responder";

let _textEncoder: TextEncoder | null = null;
function getEncoder() {
  if (!_textEncoder) _textEncoder = new TextEncoder();
  return _textEncoder;
}

export async function initializeRatchet(rootKey: Uint8Array, role: SessionRole): Promise<RatchetState> {
  const initiatorSend = await deriveHkdfKey(rootKey, {
    info: getEncoder().encode("m0ssad-ratchet-send"),
    length: 32
  });
  const initiatorRecv = await deriveHkdfKey(rootKey, {
    info: getEncoder().encode("m0ssad-ratchet-recv"),
    length: 32
  });
  const sendChainKey = role === "initiator" ? initiatorSend : initiatorRecv;
  const recvChainKey = role === "initiator" ? initiatorRecv : initiatorSend;

  return {
    rootKey,
    sendChainKey,
    recvChainKey,
    sendMessageIndex: 0,
    recvMessageIndex: 0
  };
}

async function nextChainAndMessageKey(chainKey: Uint8Array): Promise<{ nextChain: Uint8Array; messageKey: Uint8Array }> {
  const baseInfo = "m0ssad-ratchet-next";
  const msgInfo = "m0ssad-ratchet-msg";
  const nextChain = await deriveHkdfKey(chainKey, { info: getEncoder().encode(baseInfo), length: 32 });
  const messageKey = await deriveHkdfKey(chainKey, { info: getEncoder().encode(msgInfo), length: 32 });
  return { nextChain, messageKey };
}

export async function ratchetSend(state: RatchetState): Promise<RatchetStepResult> {
  const { nextChain, messageKey } = await nextChainAndMessageKey(state.sendChainKey);
  const messageIndex = state.sendMessageIndex;
  state.sendChainKey = nextChain;
  state.sendMessageIndex += 1;
  return { chainKey: nextChain, messageKey, messageIndex };
}

export async function ratchetReceive(state: RatchetState): Promise<RatchetStepResult> {
  const { nextChain, messageKey } = await nextChainAndMessageKey(state.recvChainKey);
  const messageIndex = state.recvMessageIndex;
  state.recvChainKey = nextChain;
  state.recvMessageIndex += 1;
  return { chainKey: nextChain, messageKey, messageIndex };
}
