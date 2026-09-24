/**
 * LICZNIK — cennik hurtowy dostawców LLM.
 *
 * Rola produktu (LINEAR-6045): RAMKA+SKLEP. Silnik = Nous (hurt).
 * My: brama + licznik + marża. Ten plik to JEDYNE źródło prawdy cen hurtowych.
 *
 * Ceny w USD za 1 000 000 tokenów.
 * `verified: true`  = cena potwierdzona w cenniku dostawcy (data w `source`).
 * `verified: false` = estymacja — przed włączeniem bilingów wymaga potwierdzenia.
 * Zasada: nigdy nie liczymy marży na niepotwierdzonej cenie w produkcji.
 */

export interface ModelPrice {
  /** nazwa dostawcy w księdze: deepseek | openrouter | gemini */
  provider: 'deepseek' | 'openrouter' | 'gemini';
  /** nazwa modelu w API dostawcy */
  model: string;
  input_usd_per_1m: number;
  output_usd_per_1m: number;
  /** cena tokenów trafionych w cache kontekstu (deepseek context caching); brak = brak cennika cache */
  cache_hit_usd_per_1m?: number;
  verified: boolean;
  /** skąd cena; np. "https://api-docs.deepseek.com/quick_start/pricing" */
  source?: string;
}

/**
 * Wzorzec łańcucha dostawców (config HP, sekcja fallback_providers):
 *   primary  = deepseek direct (api.deepseek.com)
 *   fallback = openrouter/deepseek-v4-pro → openrouter/deepseek-v4-flash
 *              → openrouter/z-ai/glm-5.2 → gemini-flash-latest
 */
export const PRICING: ModelPrice[] = [
  // ——— deepseek direct (platform.deepseek.com) ———
  {
    provider: 'deepseek',
    model: 'deepseek-chat',
    input_usd_per_1m: 0.27,
    output_usd_per_1m: 1.1,
    cache_hit_usd_per_1m: 0.07,
    verified: true,
    source: 'https://api-docs.deepseek.com/quick_start/pricing',
  },
  {
    provider: 'deepseek',
    model: 'deepseek-flash',
    input_usd_per_1m: 0.14,
    output_usd_per_1m: 0.55,
    verified: false,
    source: 'estymacja — potwierdzić przed bilingami',
  },
  {
    provider: 'deepseek',
    model: 'deepseek-v4-pro',
    input_usd_per_1m: 2.0,
    output_usd_per_1m: 8.0,
    verified: false,
    source: 'estymacja — potwierdzić przed bilingami',
  },
  // ——— openrouter (fallback) ———
  {
    provider: 'openrouter',
    model: 'deepseek/deepseek-v4-pro',
    input_usd_per_1m: 2.0,
    output_usd_per_1m: 8.0,
    verified: false,
    source: 'estymacja — potwierdzić przed bilingami',
  },
  {
    provider: 'openrouter',
    model: 'deepseek/deepseek-v4-flash',
    input_usd_per_1m: 0.14,
    output_usd_per_1m: 0.55,
    verified: false,
    source: 'estymacja — potwierdzić przed bilingami',
  },
  {
    provider: 'openrouter',
    model: 'z-ai/glm-5.2',
    input_usd_per_1m: 1.2,
    output_usd_per_1m: 4.8,
    verified: false,
    source: 'estymacja — potwierdzić przed bilingami',
  },
  {
    provider: 'gemini',
    model: 'gemini-flash-latest',
    input_usd_per_1m: 0.15,
    output_usd_per_1m: 0.6,
    verified: false,
    source: 'estymacja — potwierdzić przed bilingami',
  },
];

/** cena awaryjna, gdy modelu nie ma w cenniku — NIGDY nie używana w produkcji bez `verified` */
export const DEFAULT_PRICE: ModelPrice = {
  provider: 'openrouter',
  model: '(unknown)',
  input_usd_per_1m: 1.0,
  output_usd_per_1m: 4.0,
  verified: false,
  source: 'fallback awaryjny — model spoza cennika',
};

/** Domyślna marża produktu (%). Hurt × (1 + marża) = cena detaliczna. */
export const DEFAULT_MARGIN_PCT = 30;

export function priceFor(provider: string, model: string): ModelPrice {
  const hit = PRICING.find((p) => p.provider === provider && p.model === model);
  return hit ?? { ...DEFAULT_PRICE, provider: provider as ModelPrice['provider'], model };
}
