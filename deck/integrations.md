# Integracje — deck.mosadd.com

Dział deweloperski mosADD: narzędzia, API, billing. Jedyny dział devów (konsolidacja 20.09 — bez duplikatów).

## Trasy

| Trasa | Co robi |
|---|---|
| `/mcp` | Model Context Protocol — mostek dla agentów |
| `/docs` | Dokumentacja |
| `/docs/recipes` | Przepisy |
| `/keys` | Klucze API (mint/rebind linii) |
| `/open` | Otwarte endpointy |
| `/pricing` | Cennik — RECON $0 / COMMANDER $19 / SOVEREIGN $49 + add-ons |

## Zasady

- Jeden dział devów: deck.mosadd.com (SDK zintegrowany z mosADD-OS — zero drugiej struktury).
- Klucze: samodzielny MINT → hub_api_keys (user_id linii, key_prefix, key_hash=sha256, plan).
- Zero browser automation na mosadd.com.
