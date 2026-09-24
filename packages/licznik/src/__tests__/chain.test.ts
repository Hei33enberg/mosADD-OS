import { describe, expect, it, vi } from 'vitest';
import { runChain, defaultChain } from '../chain.js';

function fakeFetch(handler: (url: string, init: RequestInit) => Response) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    return handler(url, init ?? {});
  }) as unknown as typeof fetch;
}

const REQ = { messages: [{ role: 'user' as const, content: 'cześć' }] };

describe('łańcuch dostawców (chain)', () => {
  it('primary deepseek direct wygrywa, gdy odpowiada', async () => {
    const f = fakeFetch((url, init) => {
      expect(url).toContain('api.deepseek.com');
      const body = JSON.parse(String(init.body));
      expect(body.model).toBe('deepseek-chat');
      expect(init.headers).toMatchObject({ Authorization: 'Bearer sk-deepseek-test' });
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'ok od deepseek' } }],
          usage: { prompt_tokens: 10, completion_tokens: 4, prompt_tokens_details: { cached_tokens: 2 } },
        }),
        { status: 200 },
      );
    });
    const r = await runChain(REQ, { DEEPSEEK_API_KEY: 'sk-deepseek-test' }, f);
    expect(r.ok).toBe(true);
    expect(r.content).toBe('ok od deepseek');
    expect(r.provider).toBe('deepseek');
    expect(r.attempts).toBe(1);
    expect(r.fallback_used).toBe(false);
    expect(r.usage).toEqual({ prompt_tokens: 10, completion_tokens: 4, prompt_cache_hit_tokens: 2 });
  });

  it('przechodzi na openrouter, gdy primary zawiedzie (fallback_used=true)', async () => {
    const f = fakeFetch((url) => {
      if (url.includes('api.deepseek.com')) return new Response('boom', { status: 500 });
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'ok od openrouter' } }],
          usage: { prompt_tokens: 5, completion_tokens: 3 },
        }),
        { status: 200 },
      );
    });
    const r = await runChain(REQ, { DEEPSEEK_API_KEY: 'sk-x', OPENROUTER_API_KEY: 'sk-or-y' }, f);
    expect(r.ok).toBe(true);
    expect(r.provider).toBe('openrouter');
    expect(r.model).toBe('deepseek/deepseek-v4-pro');
    expect(r.attempts).toBe(2);
    expect(r.fallback_used).toBe(true);
    expect(r.failures[0]).toContain('deepseek-direct');
  });

  it('pomija kroki bez klucza w env', async () => {
    const f = fakeFetch((url) => {
      expect(url).toContain('openrouter.ai');
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'or' } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
        { status: 200 },
      );
    });
    const r = await runChain(REQ, { OPENROUTER_API_KEY: 'sk-or-y' }, f);
    expect(r.ok).toBe(true);
    expect(r.attempts).toBe(2); // krok 1 pominięty (brak klucza), krok 2 wygrał
    expect(r.failures[0]).toContain('brak klucza DEEPSEEK_API_KEY');
  });

  it('gemini direct działa z protokołem generateContent (ostatni krok)', async () => {
    const f = fakeFetch((url, init) => {
      if (url.includes('deepseek.com') || url.includes('openrouter.ai')) {
        return new Response('nope', { status: 503 });
      }
      expect(url).toContain('generativelanguage.googleapis.com');
      expect(url).toContain('key=sk-gemini-test');
      const body = JSON.parse(String(init.body));
      expect(body.contents[0].parts[0].text).toBe('cześć');
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'ok od gemini' }] } }],
          usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 2 },
        }),
        { status: 200 },
      );
    });
    const r = await runChain(
      REQ,
      { DEEPSEEK_API_KEY: 'sk-x', OPENROUTER_API_KEY: 'sk-or-y', GOOGLE_API_KEY: 'sk-gemini-test' },
      f,
    );
    expect(r.ok).toBe(true);
    expect(r.provider).toBe('gemini');
    expect(r.model).toBe('gemini-flash-latest');
    expect(r.attempts).toBe(5);
    expect(r.fallback_used).toBe(true);
    expect(r.usage.prompt_tokens).toBe(7);
    expect(r.usage.completion_tokens).toBe(2);
  });

  it('zwraca ok=false z listą powodów, gdy cały łańcuch padnie', async () => {
    const f = fakeFetch(() => new Response('down', { status: 502 }));
    const r = await runChain(REQ, { DEEPSEEK_API_KEY: 'sk-x', OPENROUTER_API_KEY: 'sk-or-y', GOOGLE_API_KEY: 'sk-g' }, f);
    expect(r.ok).toBe(false);
    expect(r.failures).toHaveLength(5);
    expect(r.error).toContain('wszystkie kroki');
  });

  it('defaultChain ma kolejność: deepseek → v4-pro → v4-flash → glm → gemini', () => {
    const steps = defaultChain();
    expect(steps.map((s) => s.name)).toEqual([
      'deepseek-direct',
      'openrouter-v4-pro',
      'openrouter-v4-flash',
      'openrouter-glm',
      'gemini-direct',
    ]);
    expect(steps[0].kind).toBe('openai-compat');
    expect(steps[4].kind).toBe('gemini');
  });

  it('wybór modelu deepseek-* ustawia model kroku primary', () => {
    const steps = defaultChain({ messages: [], model: 'deepseek-v4-pro' });
    expect(steps[0].model).toBe('deepseek-v4-pro');
  });
});
