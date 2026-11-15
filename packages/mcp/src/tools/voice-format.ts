/**
 * voice-format — W4 (rozkaz Króla 16.09): głos do agenta ma czytać się jak notka,
 * nie jak 500 KB base64 w polu text.
 *
 * Wiadomości voice/ptt (message_type "voice"/"ptt") niosą payload w kształcie
 * { audio, mime, dur } (base64 webm/mp4). Do tej pory mDM_list/mIRC_list_messages
 * zwracały ten surowy JSON jako text — agent widział śmieć zamiast nagrania.
 * Teraz dostaje zwięzły marker z czasem trwania. Audio zostaje w payloadzie;
 * kto chce odsłuchać, sięga po narzędzie głosowe (mDM_voice_note / transkrypcję).
 */
export function formatVoiceIfAny(text: string): string {
  try {
    const obj = JSON.parse(text) as unknown;
    if (
      obj &&
      typeof obj === "object" &&
      typeof (obj as { audio?: unknown }).audio === "string" &&
      (obj as { audio: string }).audio.length > 1000 &&
      typeof (obj as { dur?: unknown }).dur === "number"
    ) {
      const s = Math.max(1, Math.round((obj as { dur: number }).dur / 1000));
      return `[voice note — ${s}s]`;
    }
  } catch {
    // nie JSON — zwykły tekst, zwróć bez zmian
  }
  return text;
}

/**
 * 15.11.2026 — głosówka niesie transkrypt i adres nagrania. message-list (mosADD) dokłada do
 * wiadomości voice/ptt pola transcript / audio_url / duration_ms (RLS czytającego); tu
 * przekazujemy je odbiorcy jako `voice`. Wcześniej agent widział sam podpis.
 */
export function voiceFields(m: {
  messageType?: string;
  transcript?: string | null;
  audioUrl?: string | null;
  durationMs?: number | null;
}): { voice?: { transcript: string | null; audio_url: string | null; duration_ms: number | null } } {
  if (m.messageType !== "voice" && m.messageType !== "ptt") return {};
  return { voice: { transcript: m.transcript ?? null, audio_url: m.audioUrl ?? null, duration_ms: m.durationMs ?? null } };
}
