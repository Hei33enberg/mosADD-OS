# HANDOFF do generała (repo m0ssad-3) — Tor 1: każdy kontakt agentowy ma kogoś w domu

**Od:** mosADD CTO (sesja Claude Code, repo mosadd-os)
**Do:** generał (jedyny, który pisze w `C:\m0ssad-3`)
**Data:** 2026-08-14
**Powiązane:** Tor 2 dowieziony i wypchnięty w mosadd-os (`07bc33f`) — narzędzie MCP `comms_session_attach`.
**Dowód Tor 2 na produkcji:** attach z sesji CTO (admin4) → świeży wiersz w `agent_bridge_heartbeat`
(`mode: mcp-session`); release → wiersza nie ma.

Nie piszę w Twoim repo (jeden agent już raz skasował tu cudzy commit). Poniżej gotowa treść —
wprowadź i wypchnij w tej samej godzinie. Wszystko zmierzone na produkcji przed napisaniem.

---

## Kontekst zmiany premisy (WAŻNE — to nie jest to samo co przed Torem 2)

Do Toru 2 wiersz w `agent_bridge_heartbeat` potrafił zapisać **wyłącznie** skrypt na komputerze
właściciela. Dlatego flaga `bridged` znaczyła „ten agent ma most na PC". Po Torze 2 **dowolna sesja
Claude, na dowolnej maszynie**, jednym wywołaniem `comms_session_attach` wpisuje ten wiersz dla
konta, którego klucz trzyma. Więc „żywa sesja przejmuje linię" przestało być właściwością admin2 —
stało się dostępne dla każdego konta.

To zmienia sens `bridged`. Rozdzielam ją na dwie niezależne własności:

1. **Ustąp żywej sesji** — czy świeży puls w `agent_bridge_heartbeat` ma uciszyć chmurę?
   Po Torze 2 odpowiedź brzmi **TAK dla wszystkich** (każde konto może dostać przypiętą sesję).
2. **Ujawnij zastępstwo** — gdy odpowiada chmura, czy ma powiedzieć „jestem zastępstwem żywej
   sesji CTO"? To ma sens **tylko dla tożsamości typu CTO** (admin2, admin4), za którymi stoi realna
   sesja robocza. Dla person czysto chmurowych (RAK, WhiteIntel, mosadd general) chmura JEST agentem,
   więc żadnego „zastępstwa" nie ogłasza.

Dlatego zmiana w `runAgent` to **jedna linia** (własność 1 uniwersalna), a flaga `bridged`
zostaje TYLKO dla własności 2. Proponuję przy okazji przemianować ją na `discloseStandby`, żeby
nazwa nie kłamała — ale jeśli wolisz nie ruszać, zostaw `bridged` i tylko popraw komentarz.

---

## ZMIANA 1 — `runAgent`: ustąp KAŻDEJ żywej sesji, nie tylko „mostowanej"

Plik `supabase/functions/agent-dm-responder/index.ts`, ~linia 871.

**BYŁO:**
```js
  if (agent.bridged && await bridgeIsLive(admin, agent.id)) { out.bridgeLive++; return; }
```

**MA BYĆ:**
```js
  // Po Torze 2 (comms_session_attach) KAŻDE konto może mieć przypiętą żywą sesję Claude, nie tylko
  // dawny most na PC. Świeży puls = ktoś realny trzyma tę linię → chmura milczy, dla każdej
  // tożsamości. `discloseStandby` niżej decyduje już tylko o TONIE chmurowej odpowiedzi, nie o tym,
  // czy w ogóle ustąpić.
  if (await bridgeIsLive(admin, agent.id)) { out.bridgeLive++; return; }
```

`bridgeIsLive` i `BRIDGE_FRESH_MS` (5 min) zostają bez zmian — okno musi przekraczać najgorszy
czas odpowiedzi żywej sesji, tak jak dziś.

## ZMIANA 2 — rejestr `AGENTS`: dopisz trzy brakujące kontakty

Ta sama tożsamość, ta sama linia 871, ~linia 125. **E-maile potwierdzone z `auth.users`** (zły
e-mail = `generateLink` założyłby NOWEGO usera zamiast zalogować agenta):

| identity_id | auth email | display w kontaktach właściciela |
|---|---|---|
| `b228b6ae-dda6-4823-9882-40ea91ed1530` | `admin4@mosadd.com` | mosADD CTO |
| `493ce649-24e6-4be9-85f7-941d2d7823ec` | `admin3@mosadd.com` | WhiteIntel CEO |
| `6cfdd9ad-33d2-40fe-9b75-bfae8eb23ac9` | `agent@mosadd.com` | mosadd general |

**Zamień pole `bridged` na `discloseStandby`** (patrz Zmiana 3) i użyj tego rejestru:

```js
const AGENTS = [
  {
    id: "68f326ac-3e8b-468e-9bac-328a930de541",
    email: "admin2@mosadd.com",
    name: "mosADD CTO2",
    discloseStandby: true,   // linia CTO właściciela — chmura ujawnia, że to zastępstwo żywej sesji
    prompt: CTO_PROMPT("mosADD CTO2", "admin2@mosadd.com"),
  },
  {
    // mosADD CTO — druga linia CTO w kontaktach właściciela (admin4). Realna sesja Claude Code
    // (ta, która pisze ten handoff) potrafi się do niej przypiąć przez comms_session_attach.
    id: "b228b6ae-dda6-4823-9882-40ea91ed1530",
    email: "admin4@mosadd.com",
    name: "mosADD CTO",
    discloseStandby: true,
    prompt: CTO_PROMPT("mosADD CTO", "admin4@mosadd.com"),
  },
  {
    // WhiteIntel CEO — persona OSINT/breach-intel. Domyślnie odpowiada z chmury (kontakt nigdy
    // „nieobecny"); jeśli ktoś przypnie żywą sesję na admin3, ustąpi jej (Zmiana 1).
    id: "493ce649-24e6-4be9-85f7-941d2d7823ec",
    email: "admin3@mosadd.com",
    name: "WhiteIntel CEO",
    discloseStandby: false,
    prompt: WHITEINTEL_PROMPT("WhiteIntel CEO", "admin3@mosadd.com"),
  },
  {
    // mosadd general — agent ogólny. Był świadomie WYPISANY 12.07 (stara persona „kanał
    // zablokowany"). Wraca z personą operatora uzbrojoną w named_query — to celowa zmiana decyzji.
    id: "6cfdd9ad-33d2-40fe-9b75-bfae8eb23ac9",
    email: "agent@mosadd.com",
    name: "mosadd general",
    discloseStandby: false,
    prompt: OPERATOR_PROMPT_HARD("mosadd general", "agent@mosadd.com"),
  },
  {
    // RAK CEO (dotąd w rejestrze jako „mosADD CTO3"). To ta sama tożsamość, którą właściciel widzi
    // jako „RAK CEO" — zrównuję NAZWĘ z kontaktem, żeby persona nie przedstawiała się inaczej niż
    // etykieta w telefonie. Jeśli wolisz nie ruszać nazwy, zostaw „mosADD CTO3".
    id: "af4da528-f21a-4eda-82cc-e5313fb78df6",
    email: "admin5@mosadd.com",
    name: "RAK CEO",
    discloseStandby: false,
    prompt: RAK_PROMPT("RAK CEO", "admin5@mosadd.com"),
  },
];
```

## ZMIANA 3 — rozdziel flagę (`bridged` → `discloseStandby`)

Trzy miejsca użycia (`grep -n "\.bridged\|bridgeOffline" index.ts`):

- **~871** — już nie używa flagi (Zmiana 1). Usuwasz stamtąd `agent.bridged &&`.
- **~887:** `const bridgeOffline = !!agent.bridged;` → `const discloseStandby = !!agent.discloseStandby;`
  i niżej `if (discloseStandby) out.bridgeOffline = (out.bridgeOffline ?? 0) + 1;`
- **~1088:** `const standby = !reply && bridgeOffline;` → `const standby = !reply && discloseStandby;`

Zachowanie po zmianie, dla każdego przypadku:
- **Świeży puls (ktoś przypięty sesją)** → chmura milczy. Dla WSZYSTKICH. (Zmiana 1)
- **Brak sesji, `discloseStandby: true`** (CTO/CTO2) → chmura odpowiada z **preambułą zastępstwa**
  (ujawnia, że nie jest żywą sesją) i z `named_query`. To już istnieje jako `STANDBY_PREAMBLE`.
- **Brak sesji, `discloseStandby: false`** (RAK/WhiteIntel/general) → chmura odpowiada **jako sama
  persona**, bez „trybu zastępczego", z `named_query`.

`BRIDGE_OFFLINE_NOTICE` / `STANDBY_PREAMBLE` / `NO_BRAIN_NOTICE` — bez zmian.

## ZMIANA 4 — persony (twardy wymóg CEO: najpierw fakt, potem odpowiedź)

`CTO_PROMPT` i `OPERATOR_PROMPT` już to robią (`DB_TOOL_ENABLED = true`, `named_query`, zakaz samego
„przyjąłem"). Potrzebne trzy nowe warianty w tym samym stylu — najkrócej trzymać się `CTO_PROMPT`
jako wzorca i podmienić tylko rolę:

```js
// „Twardy" operator = OPERATOR_PROMPT z tym samym rygorem named_query co CTO_PROMPT.
const OPERATOR_PROMPT_HARD = (name, email) =>
  `Jesteś "${name}" — operacyjny agent mosADD działający w imieniu właściciela (konto ${email}). ` +
  "Piszesz z nim przez komunikator mosADD; on nie jest programistą.\n\n" +
  "MASZ PRAWDZIWE NARZĘDZIE named_query — gotowe zapytania do bazy produkcyjnej. UŻYWAJ GO.\n\n" +
  "ZASADY:\n" +
  "- Zanim postawisz JAKĄKOLWIEK tezę o stanie produktu, danych czy liczbach — sprawdź to zapytaniem. Odpowiadaj liczbą i faktem.\n" +
  '- ABSOLUTNY ZAKAZ pisania "przyjąłem"/"sprawdzam"/"zajmę się tym" i kończenia na tym. Sprawdź TERAZ i podaj WYNIK w tej samej wiadomości.\n' +
  "- Po polsku, ludzkim językiem, bez nazw plików i identyfikatorów. Maks. ~6 zdań.\n" +
  "- Jeśli zapytanie zostanie odrzucone albo nic nie znajdziesz — powiedz to wprost. Nigdy nie zmyślaj liczb.\n" +
  '- Żadnego teatru bezpieczeństwa, żadnego "jako model językowy".';

const WHITEINTEL_PROMPT = (name, email) =>
  `Jesteś "${name}" — CEO WhiteIntel, agent od wywiadu o zagrożeniach i wyciekach, działający ` +
  `w imieniu właściciela (konto ${email}).\n\n` +
  "MASZ named_query — produkcyjna baza, tylko odczyt. Zanim coś stwierdzisz o danych, kontach, " +
  "wyciekach czy zdarzeniach — sprawdź zapytaniem.\n\n" +
  "ZASADY:\n" +
  '- ABSOLUTNY ZAKAZ "przyjąłem"/"sprawdzam" jako całej odpowiedzi. Sprawdź TERAZ, podaj WYNIK.\n' +
  "- Czego NIE masz: podglądu kodu, wdrożeń, systemów spoza mosADD. Jeśli pytanie tego wymaga — powiedz to jednym zdaniem.\n" +
  "- Po polsku, rzeczowo, maks. ~6 zdań. Żadnego teatru bezpieczeństwa.";

const RAK_PROMPT = (name, email) =>
  `Jesteś "${name}" — CEO RAK, agent operacyjny biznesu RAK, działający w imieniu właściciela ` +
  `(konto ${email}).\n\n` +
  "MASZ named_query — produkcyjna baza, tylko odczyt. UŻYWAJ GO, zanim postawisz tezę o liczbach.\n\n" +
  "ZASADY:\n" +
  '- ABSOLUTNY ZAKAZ "przyjąłem"/"sprawdzam" jako całej odpowiedzi. Sprawdź TERAZ, podaj WYNIK.\n' +
  "- Po polsku, rzeczowo, maks. ~6 zdań. Nigdy nie zmyślaj liczb. Żadnego teatru bezpieczeństwa.";
```

Jeśli `named_query` nie zna jeszcze zapytań potrzebnych WhiteIntel/RAK — to nie blokuje Toru 1:
persona każe „sprawdź albo powiedz wprost, że nie masz jak", więc w najgorszym razie agent uczciwie
mówi, że nie ma zapytania, zamiast zmyślać. Rozszerzenie katalogu `agent_named_query` to osobny,
mniejszy krok.

---

## Powierzchnie licznika narzędzi w TWOIM repo (81 → 82)

Tor 2 dodał 82. narzędzie. Trzy miejsca w m0ssad-3 pinują liczbę i **bramka je sprawdza**:

1. `scripts/check-mcp-server-card.mjs` — `const EXPECTED_TOOL_COUNT = 81;` → **82**.
2. `apps/web/public/.well-known/mcp/server-card.json`:
   - `"toolCount": 81` → **82**
   - opis kończy się `… 81 tools.` → `… 82 tools.`
3. `apps/web/src/components/McpToolReference.tsx` — bramka liczy wpisy `name: "…"` i wymaga 82.
   Dopisz `comms_session_attach` do grupy „Action links" (albo „Capability discovery"), np. po
   `comms_action_frame_get`:
   ```jsx
   { name: "comms_session_attach", desc: "Claim this account's reply lane for the current live agent session, so the 24/7 cloud stand-in defers to it; auto-renews while the session runs, release:true hands it back.", params: "label?, release?", net: true },
   ```

Po tych trzech: `node scripts/check-mcp-server-card.mjs` musi wypisać `OK … 82 tools`.

---

## Weryfikacja (robię JA po Twoim wypchnięciu — z konta CZŁOWIEKA)

Blokada agent↔agent odrzuca wiadomość agenta do agenta, więc test z konta agenta dałby pięć cisz i
fałszywy wniosek „zepsute". Konta `Test 1/2/3` mają rodzaj **human** (zweryfikowane) → z nich
uderzam do pięciu kontaktów i mierzę odpowiedź w `messages_meta` (nadawca + czas). Odpowiedź musi
zawierać **fakt z zapytania**, nie samo potwierdzenie. Zadanie cyklu nr 71 jest aktywne (co minutę),
więc gdy któryś milczy — patrzę w rejestr i personę, nie w harmonogram.

Zamelduj hasz wypchnięcia — wtedy odpalam weryfikację i raportuję CEO.
