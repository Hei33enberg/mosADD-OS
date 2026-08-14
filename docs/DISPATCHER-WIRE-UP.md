# mosADD dla dyspozytora prawnego — podpięcie MCP + ładowanie akt do grafu

**Do:** sesja Claude Cowork „tender-eloquent-shannon" (dyspozytor prawny, mr. Bricks)
**Od:** mosADD CTO
**Data:** 2026-08-14

Odpowiedź na Twój handoff, punkt po punkcie — zmierzona na produkcji, nie z pamięci. Najpierw
najważniejsze sprostowanie, potem konfiguracja, na końcu jedna decyzja, która należy do właściciela
i musi zapaść **przed** pierwszym pismem.

---

## 1. Auth — PIN 582222 to NIE jest Twój klucz

`582222` to **PIN konta właściciela (SOVEREIGN, admin@mosadd.com)** — nie klucz API, nie OTP do
niczego innego. Sesja z tym PIN‑em byłaby **nieodróżnialna od właściciela**: pisałaby jako on i
czytała wszystko, co jego. Nie dostajesz go i nie wkleja się go do żadnego pliku.

Właściwy mechanizm, już zbudowany i wdrożony: **własne konto agenta + jeden stały klucz**
`mosadd_sk_live_…`. Klucz przy starcie wymienia się sam na krótkotrwałą sesję (EF
`hub-key-exchange`), więc **żadnych wygasających tokenów z DevTools, żadnego OAuth**. Konto „Dyspozytor"
zakłada właściciel jednym wywołaniem kreatora „dodaj agenta" (EF `agent-create` z jego JWT), które
od razu paruje Was jako **wzajemny, zaakceptowany kontakt** i zwraca klucz JEDEN raz.

## 2. Wejście — dokładny blok konfiguracji

Jesteś na tej samej maszynie co pełna kompilacja mosADD (81+ narzędzi, w tym grafowe), więc jedziesz
na **wariancie lokalnym** — nic nie trzeba budować ani publikować:

```json
{
  "mcpServers": {
    "mosadd": {
      "command": "node",
      "args": ["C:\\mosadd-os\\packages\\mcp\\dist\\bin\\mcp.js"],
      "env": {
        "MOSADD_API_KEY": "mosadd_sk_live_…(klucz z agent-create)"
      }
    }
  }
}
```

- Projekt (endpoint) jest **wbudowany** — `hub-key-exchange` domyślnie celuje w
  `https://rooffhgbxafyjcwmwpsy.supabase.co`. Nic więcej w `env` nie trzeba.
- Wariant z npm (`npx -y @mosadd/mcp@alpha`) też działa, ale paczka publiczna jest **o wersję w tyle**
  (npm: alpha.32, lokalnie: alpha.33 z narzędziami grafowymi). Publikacja to akcja właściciela/CI —
  **nie czekaj na nią, jedź lokalnie.**

## 3. Ładowanie akt do grafu — narzędzie i kolejność

- Wrzucanie: **`mRAG_ingest`**. Przyjmuje `content_text` (do 200 000 znaków), **chunkuje i osadza
  po stronie serwera** — nie dziel plików wcześniej.
- ⭐ **Musisz podać strony i datę, albo graf zostanie pusty.** Graf (`kg_refresh_me`, pod
  `mRAG_graph_refresh`) buduje węzły **wyłącznie** z pól `sender` / `recipient` / `occurred_at`.
  Dokument wrzucony bez nich jest wyszukiwalny, ale **nie wnosi do grafu ani jednej strony** — a
  wywołanie i tak zwraca sukces. (To był realny błąd tego narzędzia do 14.08; naprawiony — teraz
  pola przechodzą. Zweryfikowane na produkcji: pismo z datą 2019‑03‑11 → strona w grafie z tą datą.)
- Mapowanie Twojej matrycy `matrix.csv` → wejście `mRAG_ingest`:

  | kolumna matrycy | pole `mRAG_ingest` |
  |---|---|
  | treść pisma / streszczenie | `content_text` |
  | nadawca / strona składająca | `sender` = `{ kind, ref, label }` |
  | adresat / sąd / strona przeciwna | `recipient` = `{ kind, ref, label }` |
  | data pisma | `occurred_at` (ISO‑8601) |
  | `absolute_path` / `sha256` | `source_id` (dowolny tekst — składany w stabilny id; oryginał zostaje w `metadata.source_ref`) |
  | `case_id`, `jurisdiction`, `sygnatura`, `pii_flag`, `parties`, `notes` | `metadata` (przechowywane dosłownie) |
  | `title` (nazwa) | `title`; `absolute_path`→`name`, rozmiar→`size` |

  **Klucz `ref` tej samej strony musi być identyczny w różnych dokumentach** — to on scala je w jeden
  węzeł. Dla osoby bez maila użyj kanonicznej nazwy jako `ref` z `kind: "unknown"`.
- Kolejność: `mRAG_ingest` (per dokument) → `mRAG_graph_refresh` (przebuduj) → `mRAG_graph_overview`
  → `mRAG_graph_neighbors` / `mRAG_graph_timeline` na `party_id` z przeglądu.
- ⛔ **Nie ma endpointu na gotowe krawędzie.** Twój `graph.jsonl` z krawędziami `filed_by` /
  `references_case` / `supersedes` / `signed_by` **nie ma dziś jak wejść** — graf sam wyprowadza
  strony i powiązania z metadanych, nie przyjmuje typowanych krawędzi prawnych. To osobny epik
  (`mRAG_graph_upsert` + typy z WhiteIntel), po spięciu rozmów.

## 4. Dane wrażliwe — ⛔⛔ DECYZJA WŁAŚCICIELA PRZED PIERWSZYM PISMEM

To jest najważniejszy punkt całego handoffu, nie przypis.

**Zaindeksowana treść leży po stronie serwera JAWNIE** — RAG wymaga jawnego tekstu do osadzenia,
więc **nie obejmuje jej szyfrowanie end‑to‑end**. Dodatkowo ta baza jest **współdzielona z drugą
firmą** i ma **świadomie zostawione wejście dla organów**. Izolacja RLS działa **na poziomie kont**
(`user_id = auth.uid()`), ale **nie na poziomie klucza serwisowego**, który ma więcej niż jedna sesja.
**Bez automatycznej redakcji po stronie mosADD** — kolumna `pii_flag` istnieje, ale niczego nie filtruje.

Wrzucenie tam `Dropbox\LAW` — dokumentów tożsamości, danych finansowych, akt rodzinnych M‑01…M‑38 —
to **decyzja właściciela, nie Twoja i nie moja**, i po ingeście zostaje już tylko sprzątanie.

**Dwie drogi, które przedstawiam właścicielowi do wyboru:**
- **A. Pełna treść** — maksymalna moc wyszukiwania i grafu, ale całe akta leżą jawnie we
  współdzielonej bazie.
- **B. Tylko matryca i metadane** — indeksujemy „kto, kiedy, sygnatura, gdzie leży plik", a **treść
  pism zostaje na dysku**. Graf spraw, strony i osie czasu działają; jawnie nie leży ani jedno zdanie
  akt. Do treści sięgasz lokalnie po `absolute_path`.

**Do decyzji właściciela ładowanie realnych akt stoi.** Rurę można w tym czasie w pełni przetestować
na dokumentach syntetycznych.

## 5. Schemat — mapowanie Twoich typów

- Strony w grafie mają `kind` ∈ `identity | email | phone | url | unknown`, a rodzaj węzła
  wyprowadzany jest jako `person | company | service | unknown`.
- Twoje typy węzłów: `person`/`entity` → mapują się (użyj `kind: "unknown"` + nazwa jako `ref` dla
  stron bez maila/telefonu). `doc`, `case`, `signature`, `location`, `date`, `jurisdiction` **nie
  mają dziś odpowiednika jako węzły** — trzymaj je w `metadata` (np. `case_id`, `sygnatura`), a nie
  jako osobne strony grafu, dopóki nie powstanie zapis typowanych krawędzi.

## 6. Wiele źródeł (Gmail/Drive)

**Jedno konto = jeden graf.** Nie rób osobnych węzłów „konto‑źródło" — oznaczaj pochodzenie w
`metadata.source_account` (i ewentualnie `labels`), żeby móc filtrować po źródle bez zaśmiecania grafu.

## 7. „MDM" — to mDM i ma narzędzie

„MDM" to **mDM**, wewnętrzny komunikator mosADD (1:1, E2EE). Nie mail — masz narzędzie **`mDM_send`**
(oraz `mDM_list` do odczytu, `mDM_list_contacts` do kontaktów). Po założeniu konta „Dyspozytor" i
sparowaniu kontaktu piszesz do właściciela przez `mDM_send`, a nie mailem z gmaila. To jest ten kanał,
o który prosił.

---

## Test rury (bez realnych akt, przed decyzją z pkt 4)

1. `mRAG_ingest` jednego **syntetycznego** pisma z pełnymi `sender`/`recipient`/`occurred_at`/`metadata`.
2. `mRAG_graph_refresh` → `mRAG_graph_overview` — strona MUSI się pojawić (to dowód, że rura żyje i
   że zdarzenia indeksowania do nas docierają). Sam „ingest OK" nie dowodzi niczego.
3. `mDM_send` do właściciela + `mDM_list` na odczyt jego odpowiedzi — linia dwukierunkowa.
