# Cennik i plany — kanon mosADD

Decyzja Króla 18.09 23:20: „ustaliliśmy od dawna dwa plany i dodatkowe funkcje płatne, bo focus na 1-man-army, a nie enterprise”. DWA plany płatne + darmowy + dodatki. Zero enterprise, zero planów zespołowych, zero „Custom”.

## Plany

| Nazwa sprzedażowa | id w bazie | Cena | Rola |
|---|---|---|---|
| RECON | `free` | $0 | wejście |
| COMMANDER | `operator` | $19/mo · $190/rok | ⛔ plan podświetlony |
| SOVEREIGN | `command` | $49/mo · $490/rok | górna półka |

Dowód: `m0ssad-3/apps/web/src/lib/plan-limits.ts:423` (COMMANDER $19, „King 2026-09-18 23:20”), `:517` (SOVEREIGN $49), `:728-729` (cały zestaw + rok = ×10 miesiąca), `:750-751` (etykiety `$19/mo`, `$49/mo`), `:713` (mapa id → nazwa). Mapowanie nazw powtórzone w `components/landing/PricingLadder.tsx:194`.

⛔ **Nazwy**: RECON · COMMANDER · SOVEREIGN. Nie FREE/PRO/TEAM/ENTERPRISE, nie OPERATOR, nie COMMAND — `operator` i `command` to identyfikatory bazy, nie nazwy na ekranie. Pomylenie ich degraduje flotę albo sprzedaje nieskończoność za $49 (`plan-limits.ts:598-599`).

## Dodatki (à la carte)

- agent ponad plan — $9/mo
- mRAG +100 GB — $5/mo
- numer agenta (prawdziwy telefon) — $2/mo
- mCALL — $0,02/min (produkt „soon”)
- Blackbox — $19 za odzysk (produkt „soon”)
- klucze modeli od nas — po koszcie +25%

Źródło: DECYZJE-KROLA §1 „Cennik”; w kodzie blok „DODATKI Z CENNIKA KRÓLA (M17, 19.09)” — `PricingLadder.tsx:283`.

## Czego w cenniku nie ma

- ⛔ Model miejsc nie istnieje. Wiersz „HUMAN TEAMMATES” i funkcja `humanSeats` zdjęte (M21, 19.09) — ludzie bez limitu, zero miejsc (`PricingLadder.tsx:449`, `:469`).
- ⛔ Graf mRAG to NIE jest SKU. To zdolność planu od COMMANDER w górę (`plan-limits.knowledgeGraph`) — `PricingLadder.tsx:108`.
- Rejestr agentów i graf ma już COMMANDER (PLAN_LIMITS, decyzja 18.09). Karta SOVEREIGN nie może ich sprzedawać jako swojej nowości (przegląd F2, 19.09 — `:456-458`).

## Stan kodu

⛔ ROZJAZD (DECYZJE-KROLA §1, 18.09 23:30): prod pokazywał $0 / $29 / $199 / Custom, a baza tłumaczeń miała COMMAND/OPERATOR. Stare kasy $29/$199 mają być zamknięte dla nowych zakupów. ⚠ Pomiar prod po tej dacie należy do ADMIRAŁA mosADD — do wpisania tutaj z datą pomiaru i build-id. PUSH ≠ DEPLOY.

## Jak to wygląda

Układ arkusza PRO i tabeli „Plans” jest jeden dla wszystkich marek RA — 50-konto-pro. Forma CTA, barwy i narożniki z rozdziału marki: mosADD `[ GET COMMANDER → ]` mono wersalikami w nawiasach, zieleń `--go`; Eter i Engineering swoje, bez zieleni mosADD.
