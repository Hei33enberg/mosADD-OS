# mosADD Deck — portal dla developerów (deck.mosadd.com)

> ⛔ STAN NA 20.09.2026 (fala F8, M57). Te pliki przyszły z gałęzi `lab/platform-integra`
> repozytorium m0ssad-3 (commit `d6ad84f6`), gdzie wylądowały przez pomyłkę — decyzja Króla
> mówi, że mieszkają TUTAJ. `deck.mosadd.com` odpowiadał wtedy `404`
> (`X-Vercel-Error: DEPLOYMENT_NOT_FOUND`, zmierzone curlem). Strona działu JEST już zbudowana
> po stronie aplikacji (m0ssad-3: `apps/web/src/pages/Developers.tsx` + `IS_DECK_HOST`
> w `App.tsx`); brakuje WYŁĄCZNIE kroków, których agent nie wykonuje: domeny w Vercelu i
> wpisu DNS. Lista tych kroków: m0ssad-3 → `docs/DECK-MOSADD-COM.md`.
>
> ⛔ Liczba narzędzi w tabeli niżej jest PINOWANA testem
> `packages/mcp/src/__tests__/tool-count-consistency.test.ts` — nie przepisuj jej ręcznie.
> Zmierzone 20.09: `mcp.mosadd.com/health` → `tools: 85`.

JEDEN dział developerski mosADD: narzędzia, API, integracje, billing. To jest **jedyne**
miejsce tej dokumentacji — repo SDK `mosadd-mcp-sdk` zostaje zarchiwizowane (decyzja
Króla 19.09.2026, patrz `docs/DECYZJE-KROLA.md`). Wszystko żyje w mosADD-OS.

**Serwer hostowany:** `https://mcp.mosadd.com/mcp` (streamable HTTP, OAuth 2.1 + PKCE, dynamiczna rejestracja klientów).
Serwer jest hostowany — rdzeń NIE jest w tym repo (monorepo mosADD-OS zawiera kod, ale
nie wymaga klonowania do integracji).

## Co jest w Decku

| Sekcja | Plik | Co |
| --- | --- | --- |
| Integracje | `deck/integrations.md` | Konfiguracje hostów: Hermes, Cursor, Codex, OpenCode, n8n, LangChain + 5-krokowy smoke test |
| API / mapa narzędzi | `README.md` (root mosADD-OS) | 85 narzędzi, 4 moduły + capabilities, kontrakt błędów |
| Rejestr MCP | `server.json` (root) | Schemat Oficjalnego Rejestru MCP 2025-12-11 (remote server) |
| Billing | https://mosadd.com/pricing | Cennik + kasa Polar (COMMANDER $19 / SOVEREIGN $49; beta = darmowe) |
| Status | https://mosadd.com/faq | FAQ publiczne |

## Dla integratora

1. Przeczytaj `deck/integrations.md` — wybierz hosta, wklej config.
2. Przejdź 5-krokowy smoke test (każdy host musi go przejść).
3. OAuth: `https://mcp.mosadd.com/.well-known/oauth-protected-resource` (401 + `WWW-Authenticate`).
4. Problemy → https://mosadd.com/faq albo kanały w produkcie.

Status: **aktywna alpha** · **darmowe w becie** · hostowane (self-host na roadmapie) · brak zewnętrznego audytu bezpieczeństwa.
