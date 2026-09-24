import { describe, expect, it } from 'vitest';
import { computeWholesale, applyMargin } from '../meter.js';
import { priceFor, PRICING, DEFAULT_MARGIN_PCT } from '../pricing.js';

describe('cennik (pricing)', () => {
  it('ma deepseek direct jako potwierdzonego dostawcę primary', () => {
    const p = priceFor('deepseek', 'deepseek-chat');
    expect(p.verified).toBe(true);
    expect(p.input_usd_per_1m).toBe(0.27);
    expect(p.output_usd_per_1m).toBe(1.1);
    expect(p.cache_hit_usd_per_1m).toBe(0.07);
  });

  it('ma wszystkie kroki łańcucha fallback w cenniku', () => {
    const steps = [
      ['deepseek', 'deepseek-chat'],
      ['openrouter', 'deepseek/deepseek-v4-pro'],
      ['openrouter', 'deepseek/deepseek-v4-flash'],
      ['openrouter', 'z-ai/glm-5.2'],
      ['gemini', 'gemini-flash-latest'],
    ];
    for (const [provider, model] of steps) {
      const found = PRICING.some((p) => p.provider === provider && p.model === model);
      expect(found, `${provider}/${model} brak w cenniku`).toBe(true);
    }
  });

  it('nieznany model dostaje cenę awaryjną z verified=false', () => {
    const p = priceFor('openrouter', 'jakis/model-xyz');
    expect(p.verified).toBe(false);
    expect(p.model).toBe('jakis/model-xyz');
  });
});

describe('licznik kosztów (meter)', () => {
  it('liczy hurt 1M in / 1M out dla deepseek-chat = 0.27 + 1.10', () => {
    const c = computeWholesale(
      { prompt_tokens: 1_000_000, completion_tokens: 1_000_000 },
      'deepseek',
      'deepseek-chat',
    );
    expect(c.input_usd).toBeCloseTo(0.27, 6);
    expect(c.output_usd).toBeCloseTo(1.1, 6);
    expect(c.wholesale_usd).toBeCloseTo(1.37, 6);
    expect(c.pricing_verified).toBe(true);
  });

  it('liczy cache hit po tańszej stawce (deepseek context caching)', () => {
    const c = computeWholesale(
      { prompt_tokens: 1000, completion_tokens: 100, prompt_cache_hit_tokens: 1000 },
      'deepseek',
      'deepseek-chat',
    );
    // 1000 hitów × 0.07/1M + 100 out × 1.1/1M
    const expected = (1000 / 1e6) * 0.07 + (100 / 1e6) * 1.1;
    expect(c.cache_hit_usd).toBeCloseTo((1000 / 1e6) * 0.07, 9);
    expect(c.wholesale_usd).toBeCloseTo(expected, 9);
    expect(c.cache_miss_tokens).toBe(0);
  });

  it('nalicza marżę: retail = hurt × (1 + marża%)', () => {
    const cost = computeWholesale(
      { prompt_tokens: 1_000_000, completion_tokens: 1_000_000 },
      'deepseek',
      'deepseek-chat',
    );
    const t = applyMargin(cost, DEFAULT_MARGIN_PCT);
    expect(t.margin_pct).toBe(30);
    expect(t.retail_usd).toBeCloseTo(cost.wholesale_usd * 1.3, 6);
    expect(t.profit_usd).toBeCloseTo(cost.wholesale_usd * 0.3, 6);
  });

  it('używa miss = prompt - hit, gdy dostawca nie poda miss', () => {
    const c = computeWholesale(
      { prompt_tokens: 1000, completion_tokens: 0, prompt_cache_hit_tokens: 300 },
      'deepseek',
      'deepseek-chat',
    );
    expect(c.cache_hit_tokens).toBe(300);
    expect(c.cache_miss_tokens).toBe(700);
  });
});
