/**
 * LICZNIK — licznik tokenów i kosztu hurtowego per żądanie.
 * Wejście: usage zwrócone przez dostawcę + cena z cennika. Wyjście: pieniądze.
 */

import { priceFor, type ModelPrice } from './pricing.js';

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  /** tokeny trafione w cache kontekstu (deepseek context caching) */
  prompt_cache_hit_tokens?: number;
  /** tokeny promptu poza cache (miss) — domyślnie = prompt_tokens - hit */
  prompt_cache_miss_tokens?: number;
}

export interface CostBreakdown {
  input_tokens: number;
  output_tokens: number;
  cache_hit_tokens: number;
  cache_miss_tokens: number;
  input_usd: number;
  output_usd: number;
  cache_hit_usd: number;
  /** koszt hurtowy całego żądania (USD) */
  wholesale_usd: number;
  price: ModelPrice;
  pricing_verified: boolean;
}

/** liczy koszt hurtowy żądania z usage dostawcy */
export function computeWholesale(usage: TokenUsage, provider: string, model: string): CostBreakdown {
  const price = priceFor(provider, model);
  const prompt = Math.max(0, usage.prompt_tokens ?? 0);
  const completion = Math.max(0, usage.completion_tokens ?? 0);
  const hit = Math.max(
    0,
    usage.prompt_cache_hit_tokens ?? 0,
  );
  const miss = Math.max(0, usage.prompt_cache_miss_tokens ?? prompt - hit);

  const cacheRate = price.cache_hit_usd_per_1m ?? price.input_usd_per_1m;
  const inputUsd = (miss / 1_000_000) * price.input_usd_per_1m;
  const hitUsd = (hit / 1_000_000) * cacheRate;
  const outputUsd = (completion / 1_000_000) * price.output_usd_per_1m;

  return {
    input_tokens: prompt,
    output_tokens: completion,
    cache_hit_tokens: hit,
    cache_miss_tokens: miss,
    input_usd: inputUsd,
    output_usd: outputUsd,
    cache_hit_usd: hitUsd,
    wholesale_usd: inputUsd + hitUsd + outputUsd,
    price,
    pricing_verified: price.verified,
  };
}

export interface ReceiptTotals {
  /** cena detaliczna = hurt × (1 + marża) */
  retail_usd: number;
  /** zysk netto na żądaniu */
  profit_usd: number;
  margin_pct: number;
}

export function applyMargin(cost: CostBreakdown, marginPct: number): ReceiptTotals {
  const margin = Math.max(0, marginPct) / 100;
  const retail = cost.wholesale_usd * (1 + margin);
  return {
    retail_usd: retail,
    profit_usd: retail - cost.wholesale_usd,
    margin_pct: marginPct,
  };
}
