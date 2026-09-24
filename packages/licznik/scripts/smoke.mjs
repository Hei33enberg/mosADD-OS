/**
 * SMOKE TEST LICZNIKA NA ŻYWO — prawdziwe żądania do dostawców.
 *
 * Użycie:
 *   node packages/licznik/scripts/smoke.mjs [--fallback]
 *
 * Klucze z env (DEEPSEEK_API_KEY / OPENROUTER_API_KEY / GOOGLE_API_KEY)
 * albo z pliku LOCAL_KEYS_FILE (format: "nazwa\nwartość\nnazwa\nwartość").
 * Skrypt wypisuje WYŁĄCZNIE prefiksy kluczy (dowód), nigdy pełne wartości.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runChain, computeWholesale, applyMargin, makeReceipt, JsonFileReceiptsStore } from '../dist/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadKeysFromFile(path) {
  const text = readFileSync(path, 'utf8');
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const env = {};
  for (let i = 0; i < lines.length - 1; i += 2) {
    const name = lines[i].toLowerCase();
    const value = lines[i + 1];
    if (name.includes('deepseek')) env.DEEPSEEK_API_KEY = value;
    else if (name.includes('openrouter')) env.OPENROUTER_API_KEY = value;
    else if (name.includes('ai studio') || name.includes('google')) env.GOOGLE_API_KEY = value;
  }
  return env;
}

function prefix(key) {
  return key ? `${key.slice(0, 8)}…${key.slice(-4)}` : '(brak)';
}

function loadEnv() {
  const env = { ...process.env };
  if (!env.DEEPSEEK_API_KEY && process.env.LOCAL_KEYS_FILE) {
    Object.assign(env, loadKeysFromFile(process.env.LOCAL_KEYS_FILE));
  }
  return env;
}

async function main() {
  const forceFallback = process.argv.includes('--fallback');
  const env = loadEnv();

  // jeśli wymuszamy fallback — podajemy celowo zły klucz deepseek
  const runEnv = forceFallback ? { ...env, DEEPSEEK_API_KEY: 'sk-broken-for-smoke' } : env;

  console.log('[smoke] klucze:', {
    deepseek: prefix(runEnv.DEEPSEEK_API_KEY),
    openrouter: prefix(runEnv.OPENROUTER_API_KEY),
    google: prefix(runEnv.GOOGLE_API_KEY),
  });

  const t0 = Date.now();
  const result = await runChain(
    {
      messages: [
        { role: 'system', content: 'Odpowiadaj jednym zdaniem, po polsku.' },
        { role: 'user', content: 'Ile to 2+2?' },
      ],
      max_tokens: 96,
    },
    runEnv,
  );
  const ms = Date.now() - t0;

  if (!result.ok) {
    console.error('[smoke] ŁAŃCUCH PADŁ:', result.error);
    process.exit(1);
  }

  console.log('[smoke] odpowiedź:', JSON.stringify(result.content));
  console.log('[smoke] dostawca:', result.provider, '/', result.model);
  console.log('[smoke] usage:', JSON.stringify(result.usage));
  console.log('[smoke] próby:', result.attempts, '| fallback_used:', result.fallback_used, '| czas:', ms, 'ms');
  if (result.failures.length) console.log('[smoke] failures:', JSON.stringify(result.failures));

  const cost = computeWholesale(result.usage, result.provider, result.model);
  const totals = applyMargin(cost, 30);
  console.log('[smoke] hurt:', cost.wholesale_usd.toFixed(6), 'USD | verified:', cost.pricing_verified);
  console.log('[smoke] detal:', totals.retail_usd.toFixed(6), 'USD | marża 30% | zysk:', totals.profit_usd.toFixed(6), 'USD');

  const store = new JsonFileReceiptsStore(resolve(__dirname, '../data/smoke-paragony.jsonl'));
  mkdirSync(resolve(__dirname, '../data'), { recursive: true });
  const receipt = makeReceipt({
    user_id: 'smoke-test',
    provider: result.provider,
    model: result.model,
    prompt_tokens: cost.input_tokens,
    completion_tokens: cost.output_tokens,
    cache_hit_tokens: cost.cache_hit_tokens,
    wholesale_usd: cost.wholesale_usd,
    margin_pct: totals.margin_pct,
    retail_usd: totals.retail_usd,
    profit_usd: totals.profit_usd,
    pricing_verified: cost.pricing_verified,
    attempts: result.attempts,
    fallback_used: result.fallback_used,
    ok: true,
  });
  await store.append(receipt);
  const summary = await store.summary();
  console.log('[smoke] księga:', JSON.stringify(summary));
  console.log('[smoke] paragon:', receipt.id);

  const asserts = [];
  asserts.push(['tokeny > 0', result.usage.prompt_tokens > 0 && result.usage.completion_tokens > 0]);
  asserts.push(['hurt > 0', cost.wholesale_usd > 0]);
  asserts.push(['zysk > 0', totals.profit_usd > 0]);
  asserts.push(['detal > hurt', totals.retail_usd > cost.wholesale_usd]);
  asserts.push(['paragon w księdze', summary.count >= 1]);
  if (forceFallback) asserts.push(['fallback_used', result.fallback_used === true]);
  else asserts.push(['primary deepseek', result.provider === 'deepseek']);

  const failed = asserts.filter(([, ok]) => !ok);
  if (failed.length) {
    console.error('[smoke] NIE ZDANE:', failed.map(([n]) => n).join(', '));
    process.exit(1);
  }
  console.log('[smoke] ZDANE:', asserts.map(([n]) => n).join(' | '));
}

main().catch((e) => {
  console.error('[smoke] błąd:', e);
  process.exit(1);
});
