# @mosadd/licznik

Tor produktu **RAMKA+SKLEP** (LINEAR-6045, fala 0). Silnik = Nous (hurt).
My: **brama + licznik + marża**.

## Co robi

1. **Brama proxy** (`chain.ts`) — przepuszcza żądania chat przez łańcuch dostawców:
   `deepseek direct (primary)` → `openrouter/deepseek-v4-pro` → `openrouter/deepseek-v4-flash`
   → `openrouter/z-ai/glm-5.2` → `gemini-flash-latest`.
   Wzorzec łańcucha = `fallback_providers` z configu HP (Hermes). Klucze pobierane
   z env w runtime (`DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`) — nigdy z commita.
2. **Licznik** (`meter.ts`) — liczy tokeny i koszt hurtowy per żądanie z `usage` dostawcy,
   z obsługą deepseek context caching (cache hit po niższej stawce).
3. **Księga paragonów** (`receipts.ts`) — każdy request zostawia paragon:
   użytkownik, model, tokeny, koszt hurtowy, marża %, cena detaliczna, zysk.
   Magazyn NDJSON (append-only) + interfejs pod przyszłą bazę (Supabase).
4. **Cennik** (`pricing.ts`) — jedyne źródło prawdy cen hurtowych. `verified: false`
   = estymacja — **nie rozliczać** dopóki cena nie zostanie potwierdzona u dostawcy.

## API

```ts
import { runChain, computeWholesale, applyMargin, makeReceipt, JsonFileReceiptsStore } from '@mosadd/licznik';

const r = await runChain({ messages: [{ role: 'user', content: 'cześć' }] }, process.env);
if (r.ok) {
  const cost = computeWholesale(r.usage, r.provider, r.model);
  const totals = applyMargin(cost, 30); // 30% marży
  const receipt = makeReceipt({
    user_id: 'u1', provider: r.provider, model: r.model,
    prompt_tokens: cost.input_tokens, completion_tokens: cost.output_tokens,
    cache_hit_tokens: cost.cache_hit_tokens,
    wholesale_usd: cost.wholesale_usd, margin_pct: totals.margin_pct,
    retail_usd: totals.retail_usd, profit_usd: totals.profit_usd,
    pricing_verified: cost.pricing_verified,
    attempts: r.attempts, fallback_used: r.fallback_used, ok: true,
  });
  await new JsonFileReceiptsStore('./data/paragony.jsonl').append(receipt);
}
```

## Stan fali 0

- gotowe: łańcuch, licznik, cennik, księga plikowa, testy jednostkowe.
- zostaje: adapter księgi do Supabase + wdrożenie (po FINALE apki),
  potwierdzenie cen estymowanych u dostawców, limit/metryki per użytkownik.
