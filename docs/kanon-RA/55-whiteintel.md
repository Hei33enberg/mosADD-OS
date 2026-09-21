# WhiteIntel — czwarty produkt w kanonie

OSINT i wywiad korporacyjny: własność spółek, sieci offshore, sankcje (OFAC/EU/UN/UK), cytowane dossier dla AML/KYC. Kod i kontrakt designu: `C:\whiteintel-main\DESIGN.md` (repo podpięte do tej stacji 20.09; wcześniej kanon miał tu tylko ⏳).

Obraz marki własnymi słowami kontraktu: **„Bloomberg terminal printed as an editorial intelligence dossier”** — atrament na papierze, włosowe kreski 1 px, zero zaokrągleń.

## Kolor

- Dwa motywy nazwane po materiale, nie po jasności: **papier** (`--paper`, `--paper-2`, `--paper-3`) i **atrament** (`--ink`, `--ink-soft`, `--ink-faint`). Tryb ciemny to „deep terminal matte”: `--paper` oklch(0.12 0 0), atrament oklch(0.96 0 0).
- Obwódka standardowa TO atrament: `--border: var(--ink)` w motywie jasnym, oklch(0.95 0 0 / 0.14) w ciemnym. Miękki dzielnik `--frame-color`.
- **Jeden akcent marki**: `--brand` oklch(0.68 0.16 155) — sygnałowa zieleń #3ecf8e / bursztyn #ffb020. ⚠ Kontrakt wymienia dwie wartości pod jednym tokenem — do rozstrzygnięcia, która jest znakiem marki (patrz Rozjazdy).
- ⛔ **Barwy ryzyka są domeną, nie dekoracją**: `--risk-high` (czerwień, sankcje/PEP), `--risk-med` (bursztyn, jurysdykcja tajności), `--risk-low` (zieleń, czysty rejestr), `--info` (błękit, osoba fizyczna). Nigdy jako ozdoba, nigdy jako stan UI.
- Krata `.wi-grid` / `.wi-grid-lit` — rysunek inżynierski 5 % krycia, ZAWSZE ograniczony ramką sekcji maską promienistą. ⛔ Nigdy `position: fixed` na całe okno.

## Typografia

- Nagłówki i display: Space Grotesk 600–700, tracking −0,025em. Display `clamp(34px, 7vw, 96px)`, H1 `clamp(28px, 5vw, 64px)`.
- Akcent szeryfowy: Fraunces / Georgia, kursywa — wyłącznie hak sygnaturowy („Expose the network.”).
- Dane i technika: IBM Plex Mono / JetBrains Mono, `tnum`, `ss01`. Każda metryka, kod rejestrowy, jurysdykcja, znacznik czasu i identyfikator podmiotu idzie w mono z cyframi tabelarycznymi.
- Brew 12 px MONO WERSALIKI tracking 0,18em; podpis 11 px MONO tracking 0,10em — to ten sam rejestr co `//NN` w pozostałych markach.

## Kształt i układ

- ⛔ **Zero zaokrągleń** (`rounded-none` wszędzie): karta, przycisk, plakietka, pole, modal. To jest ta sama dyscyplina co kwadrat mosADD, ale wynikająca z innego obrazu — druku, nie terminala wojskowego.
- Aplikacja siedzi w ramce `1px solid var(--border)` (`.min-h-app`).
- Nagłówek przyklejony, **56 px**, włosowa kreska pod spodem, logo + trasy (Search, Directory, Pulse, Pricing, Developers) + przełącznik motywu + CTA.
- Stopka: cztery kolumny, plakietki zgodności (GDPR, SOC 2, ISO 27001, Stripe), karty szybkich akcji, formularz kontaktu, źródła danych, metadane wersji (`v1.0.0 · 27 sources`).
- CTA główne: tło `--brand`, atrament jako tekst, wysokość 44–48 px, kwadrat, waga 600, opcjonalna strzałka `→`.

## Konto PRO i cennik

Obowiązuje wzór z 50-konto-pro — Król 19.09 06:33: „Tak się robi PDP i konto pro w whiteintel i wszędzie u nas”. Barwy i forma CTA z tego rozdziału (`--brand`, kwadrat), nie z mosADD. ⏳ Plany i ceny WhiteIntel czekają na decyzję Króla — do tego czasu w kanonie nie ma cennika tej marki.

## Granice

⛔ Nie bierz tokenu `mosadd-*`, `eter-*` ani `eng-*` do WhiteIntela i odwrotnie. Wspólne są: odstępy, `touch-min` 44 px, szkielet ikon (40-ikony pkt 6 — nowa funkcja dostaje bryłę z istniejącego zestawu, nie rysuje się od zera), rejestr głosu i słownik uczciwości (60-glos).

⏳ Do dostarczenia przez linię WhiteIntel i GOD OF RA DESIGN: prefiks tokenów marki w kanonie RA (propozycja `wi-*`), przydział brył ikon, zmierzone kontrasty atramentu na papierze w obu motywach (85-dostepnosc).

## Rozjazdy tej marki (do 90-rozjazdy)

| # | Rzecz | Dowód |
|---|---|---|
| W1 | `--brand` ma w kontrakcie DWIE wartości naraz: #3ecf8e i #ffb020. Znak marki nie może mieć dwóch barw „albo albo” | `DESIGN.md` §1 i §2 |
| W2 | Zieleń `--risk-low` i zieleń `--brand` to dwie różne zielenie w jednym ekranie; kanon RA każe pilnować, żeby kolor nie znaczył dwóch rzeczy | `DESIGN.md` §2, tabela ryzyka |
| W3 | Space Grotesk jest już w Eterze (cały UI) i w H2 LP mosADD (R4), a IBM Plex Mono w całym mosADD. WhiteIntel bierze oba — to czwarta marka na tych samych krojach | `DESIGN.md` §3 kontra 10-mosadd, 20-3t3r, R4 |
