# HANDOFF (STAGED) do generała — rozdzielenie „Stwórz agenta" od „Połącz się z agentem"

**Od:** mosADD CTO · **Do:** generał (repo m0ssad-3) · **Data:** 2026-08-14
**Status:** STAGED — czeka na werdykt mosADD CEO (pytania A/B/C poniżej). Nie wgrywać, dopóki CEO nie
potwierdzi kierunku. Fakty z kodu są pewne; sam układ UI to decyzja CEO.

## Po co (zmierzone u foundera, dosłownie)
Founder: „dając nowy kontakt dodaję kontakt z zewnątrz, a mój Team to za co płacę — jak na free mam
2 agentów, to mogę zaprosić tylko 2 do kontaktów i to wypełnia limit? Czy w USB mam ich wpiąć?"
Nawet on nie wie, gdzie dodaje i którędy zarządza.

## Fakty z kodu (pewne)
- `apps/web/src/lib/plan-limits.ts`: free `activeAgents: 2`; „humans are free, you pay per ACTIVE AI agent".
- `supabase/functions/agent-create/index.ts`: limit liczy WYŁĄCZNIE `identities WHERE owner_user_id
  = user AND kind IN (agent,robot) AND retired_at IS NULL`. Czyli slot zjadają TYLKO agenci, których
  user TWORZY. Cudzy agent dodany jako kontakt — NIE liczy się do limitu.
- Ścieżka „cudzy agent" JUŻ istnieje w copy (`app.addflow.extNote`), ale jako przypis pod kafelkiem
  „Agent", nie jako równorzędna akcja. `UsbFleetRoster.tsx` = zarządzanie własną flotą, nie osobne
  miejsce omijające limit.

## Defekt do naprawy
Tri-tile person/agent/robot w `components/overlays/sphere/NewChatPanel.tsx` (`KindInfoBlock` +
`setupKind`): wybór „agent" prowadzi do CREATE (`agent-create`, zjada slot). „Połącz z cudzym" jest
tylko notką. To miesza „stwórz pracownika (płatny slot)" z „dodaj znajomego (darmowy kontakt)".

## Proponowana zmiana (do zatwierdzenia przez CEO — pkt A)
Rozdzielić na DWIE równorzędne akcje w panelu:
1. **„Stwórz agenta"** → dzisiejsza ścieżka CREATE (`setupKind='agent'` → `agent-create`).
   Dodać jedno zdanie u góry: *„To Twój pracownik-AI — liczy się do planu (na darmowym masz 2).
   Zwolnisz miejsce, wycofując agenta."* — źródło liczby: `PLAN_LIMITS[tier].activeAgents` (już w
   zasięgu tego ekranu przez `useAuth`/plan hook; jeśli nie, dołożyć selektor planu).
2. **„Połącz się z agentem/osobą"** → ścieżka kontaktu (dzisiejsze wyszukanie @mosadd / link
   zaproszenia — TA SAMA co dla „person"). Kopia: *„Cudzy agent lub osoba — za darmo, bez limitu.
   Płaci właściciel. Poproś o adres @mosadd albo wyślij swój link."* (rozwinięcie istniejącego
   `app.addflow.extNote`).

Zmiany dotyczą tylko `NewChatPanel.tsx` (układ tri-tile → dwie akcje) + kilku kluczy i18n w
`i18n/locales/en.ts` i `pl.ts` (nowe: `app.addflow.createSlotNote`, `app.addflow.connectFreeNote`;
istniejące `agentS1..S3` zostają na ścieżce CREATE). Backend BEZ zmian — `agent-create` i limity
już liczą poprawnie.

## Trzy pytania do CEO (blokują wgranie)
- **A.** Rozdzielić na dwie osobne akcje (jak wyżej), czy inne rozwiązanie?
- **B.** „2 na free" zostaje, czy zmieniamy liczbę przy okazji?
- **C.** USB znika z domyślnej ścieżki zwykłego usera (zostaje jako zaawansowany widok floty), czy zostaje widoczne?

Po odpowiedzi CEO domknę dokładny diff (stringi + JSX) i prześlę do wgrania. Weryfikacja: render
@341 px na `/dev-panels`, oba przyciski widoczne, kopia limitu zgodna z `PLAN_LIMITS`.
