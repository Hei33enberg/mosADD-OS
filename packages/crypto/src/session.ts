import { decryptBytes, encryptBytes, importAesKey, type EncryptedPayload } from "./aes";
import { initializeRatchet, ratchetReceive, ratchetSend, type RatchetState, type SessionRole } from "./doubleRatchet";

export interface SessionEnvelope {
  ciphertext: EncryptedPayload;
  messageIndex: number;
}

export class SecureSession {
  private readonly ratchet: RatchetState;

  private constructor(ratchet: RatchetState) {
    this.ratchet = ratchet;
  }

  static async fromRootKey(rootKey: Uint8Array, role: SessionRole): Promise<SecureSession> {
    const ratchet = await initializeRatchet(rootKey, role);
    return new SecureSession(ratchet);
  }

  async encrypt(plaintext: Uint8Array): Promise<SessionEnvelope> {
    const step = await ratchetSend(this.ratchet);
    const key = await importAesKey(step.messageKey);
    const ciphertext = await encryptBytes(key, plaintext);
    return { ciphertext, messageIndex: step.messageIndex };
  }

  async decrypt(envelope: SessionEnvelope): Promise<Uint8Array> {
    const step = await ratchetReceive(this.ratchet);
    if (step.messageIndex !== envelope.messageIndex) {
      // Current scaffold keeps strict in-order processing to simplify initial integration.
      throw new Error("Out-of-order message index");
    }
    const key = await importAesKey(step.messageKey);
    return decryptBytes(key, envelope.ciphertext);
  }
}
