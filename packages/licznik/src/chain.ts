/**
 * LICZNIK — brama proxy do dostawców LLM.
 *
 * Łańcuch (wzorzec: config HP → fallback_providers):
 *   1. deepseek direct  (primary)  — https://api.deepseek.com/v1
 *   2. openrouter deepseek/deepseek-v4-pro
 *   3. openrouter deepseek/deepseek-v4-flash
 *   4. openrouter z-ai/glm-5.2
 *   5. gemini direct gemini-flash-latest
 *
 * Kroki próbowane po kolei; pierwszy, który odpowie, wygrywa.
 * Klucze pobierane Z ENV w runtime — nigdy z commita.
 */

import type { TokenUsage } from './meter.js';

export interface ChainMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChainRequest {
  messages: ChainMessage[];
  /** opcjonalny wybór modelu — ustawia model kroku primary */
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

export type ChainStepKind = 'openai-compat' | 'gemini';

export interface ChainStep {
  name: string;
  provider: string;
  model: string;
  kind: ChainStepKind;
  url: string;
  /** nazwa zmiennej env z kluczem tego kroku */
  authEnv: string;
}

export interface ChainResult {
  ok: boolean;
  content: string;
  provider: string;
  model: string;
  usage: TokenUsage;
  /** ile kroków łańcucha wykonano zanim dostawca odpowiedział */
  attempts: number;
  /** true, gdy primary (krok 1) zawiódł i odpowiedział fallback */
  fallback_used: boolean;
  /** powody niepowodzeń poprzednich kroków (audyt łańcucha) */
  failures: string[];
  error?: string;
}

/** domyślny łańcuch — jedyne miejsce definicji toru dostawców */
export function defaultChain(request?: ChainRequest): ChainStep[] {
  const deepseekModel = request?.model && request.model.startsWith('deepseek')
    ? request.model
    : 'deepseek-chat';
  return [
    {
      name: 'deepseek-direct',
      provider: 'deepseek',
      model: deepseekModel,
      kind: 'openai-compat',
      url: 'https://api.deepseek.com/v1/chat/completions',
      authEnv: 'DEEPSEEK_API_KEY',
    },
    {
      name: 'openrouter-v4-pro',
      provider: 'openrouter',
      model: 'deepseek/deepseek-v4-pro',
      kind: 'openai-compat',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      authEnv: 'OPENROUTER_API_KEY',
    },
    {
      name: 'openrouter-v4-flash',
      provider: 'openrouter',
      model: 'deepseek/deepseek-v4-flash',
      kind: 'openai-compat',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      authEnv: 'OPENROUTER_API_KEY',
    },
    {
      name: 'openrouter-glm',
      provider: 'openrouter',
      model: 'z-ai/glm-5.2',
      kind: 'openai-compat',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      authEnv: 'OPENROUTER_API_KEY',
    },
    {
      name: 'gemini-direct',
      provider: 'gemini',
      model: 'gemini-flash-latest',
      kind: 'gemini',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
      authEnv: 'GOOGLE_API_KEY',
    },
  ];
}

interface OpenAICompatResponse {
  choices?: Array<{
    finish_reason?: string;
    message?: { content?: string | null; reasoning?: string | null };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
  };
  error?: { message?: string };
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  error?: { message?: string };
}

async function runOpenAICompatStep(
  step: ChainStep,
  request: ChainRequest,
  apiKey: string,
  fetchImpl: typeof fetch,
): Promise<{ content: string; usage: TokenUsage }> {
  const r = await fetchImpl(step.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: step.model,
      messages: request.messages,
      max_tokens: request.max_tokens ?? 512,
      temperature: request.temperature ?? 0.7,
    }),
  });
  const j = (await r.json().catch(() => ({}))) as OpenAICompatResponse;
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${j.error?.message ?? 'no body'}`);
  const choice = j.choices?.[0];
  const content = choice?.message?.content?.trim();
  if (!content) {
    // Modele reasoningowe (deepseek-v4-*, glm-5.2) przy zbyt małym max_tokens
    // oddają tylko myślenie, a treść zostaje null — to porażka kroku, nie odpowiedź.
    if (typeof choice?.message?.reasoning === 'string' && choice.message.reasoning.length > 0) {
      throw new Error(
        `model oddał tylko reasoning (finish_reason=${choice.finish_reason ?? '?'}) — max_tokens za mały`,
      );
    }
    throw new Error('no content in response');
  }
  const u = j.usage ?? {};
  return {
    content,
    usage: {
      prompt_tokens: u.prompt_tokens ?? 0,
      completion_tokens: u.completion_tokens ?? 0,
      prompt_cache_hit_tokens: u.prompt_tokens_details?.cached_tokens ?? 0,
    },
  };
}

async function runGeminiStep(
  step: ChainStep,
  request: ChainRequest,
  apiKey: string,
  fetchImpl: typeof fetch,
): Promise<{ content: string; usage: TokenUsage }> {
  const url = step.url.replace('{model}', step.model);
  const r = await fetchImpl(`${url}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: request.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        maxOutputTokens: request.max_tokens ?? 512,
        temperature: request.temperature ?? 0.7,
      },
    }),
  });
  const j = (await r.json().catch(() => ({}))) as GeminiResponse;
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${j.error?.message ?? 'no body'}`);
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
  if (!text) throw new Error('no content in response');
  const u = j.usageMetadata ?? {};
  return {
    content: text,
    usage: {
      prompt_tokens: u.promptTokenCount ?? 0,
      completion_tokens: u.candidatesTokenCount ?? 0,
    },
  };
}

/**
 * Przepuszcza żądanie przez łańcuch dostawców.
 * `env` = mapa zmiennych środowiskowych (klucze), `fetchImpl` = fetch (injectable w testach).
 */
export async function runChain(
  request: ChainRequest,
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch = fetch,
  steps: ChainStep[] = defaultChain(request),
): Promise<ChainResult> {
  const failures: string[] = [];
  let attempts = 0;
  for (const step of steps) {
    attempts += 1;
    const apiKey = env[step.authEnv];
    if (!apiKey) {
      failures.push(`${step.name}: brak klucza ${step.authEnv}`);
      continue;
    }
    try {
      const { content, usage } =
        step.kind === 'gemini'
          ? await runGeminiStep(step, request, apiKey, fetchImpl)
          : await runOpenAICompatStep(step, request, apiKey, fetchImpl);
      return {
        ok: true,
        content,
        provider: step.provider,
        model: step.model,
        usage,
        attempts,
        fallback_used: attempts > 1,
        failures,
      };
    } catch (e) {
      failures.push(`${step.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return {
    ok: false,
    content: '',
    provider: '',
    model: '',
    usage: { prompt_tokens: 0, completion_tokens: 0 },
    attempts,
    fallback_used: false,
    failures,
    error: `wszystkie kroki łańcucha zawiodły: ${failures.join(' | ')}`,
  };
}
