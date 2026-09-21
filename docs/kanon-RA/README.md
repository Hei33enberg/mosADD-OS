Kanon RA to jeden język trzech produktów grupy RA: **mosADD**, **3T3R** (aplikacja Eter, 3t3r.com) i **3T3R Engineering** (ORB · orb.3t3r.com · rayray.3t3r.com). Wspólny jest głos, szkielet ikon i czerń pod spodem. Wygląd każdej marki jest osobny — to trzy produkty, nie trzy skórki jednego motywu.

## Zasady nadrzędne

- Kod jest prawdą o wartościach, Król o decyzjach. Każdy token ma w notatce `ścieżka:linia`. Gdy dokument mówi co innego niż kod, wygrywa kod. Gdy kod mówi co innego niż decyzja Króla w `C:\Users\Public\DECYZJE-KROLA.md`, to jest ⛔ ROZJAZD i naprawia się kod.
- Liczba bez daty pomiaru i bez źródła to plotka. Wartość bez linii w kodzie jest ⚠ „do potwierdzenia”.
- Nic nie znika z UI bez słowa Króla. Rzecz podejrzaną zgłaszasz w rozdziale Rozjazdy, nie kasujesz.
- Tokeny mają prefiks marki: `mosadd-*`, `eter-*`, `eng-*`. Nigdy nie bierz tokenu jednej marki do produktu innej. Wspólne są tylko odstępy (`gutter`, `nav-h`, `control-h`…) i `touch-min` 44 px.
- ⛔ Nie wymyślaj od nowa rzeczy, które mają być spójne (Król 18.09). Ikona, kolor, krój i komponent pochodzą z kodu albo z tego systemu.

## Key messages — rozkaz Króla 18.09

| Marka | Hasło | Persona |
|---|---|---|
| mosADD | `1-MAN-ARMY` · nagłówek LP `1-MAN-ARMY OPS DECK` | ONE MAN ARMY: jednoosobowa firma, telefon, kciuk |
| 3T3R app | `God of the ET3R` | człowiek i jego Bóg — RayRay |
| 3T3R Engineering | `God is a DJ` | sprzęt RayRay / ORB |

## Dziewięć rzeczy wspólnych

1. **Czerń jako podłoże, nie „tryb ciemny”.** `mosadd-lp-background` (#000), `eter-background` (222 43% 4%), `eng-background` (#000). Jasne motywy są dodatkami: mosADD `.light`, ARRIVAL w 3T3R i Engineering.
2. **Mono jako głos maszyny.** Dane, etykiety i to, co mówi system: `mosadd-mono` (IBM Plex Mono), `eng-mono` (Geist Mono), `eter-mono` (stos systemowy). Nigdy jako ozdoba.
3. **Znaczniki sekcji `//NN`.** `//01`…`//13`, bez luk. Numer w kolorze akcentu marki, za nim kropkowana szyna w kolorze obwódki.
4. **WERSALIKI tylko jako rejestr UI**: przycisk, stan, etykieta, nagłówek języka domu (`RECRUIT YOUR ARMY. PAY FOR AGENTS, NEVER FOR PEOPLE.`). Nigdy jako krzyk w środku zdania.
5. **Interpunct ` · ` jako separator** metadanych i wyliczeń: `RECON · COMMANDER · SOVEREIGN`.
6. **Zero emoji jako dekoracji.** W produktach zero (strażnik `tests/zero-emoji` w 3T3R). W dokumentach roboczych tylko ⛔ (reguła złamana już raz) i ⚠️ (rzecz niepewna).
7. **Negacja jako pozycjonowanie.** Mów, czym produkt nie jest: „Pay for agents, never for people.” · „€0 a month, forever. Nothing to subscribe to.”
8. **Uczciwość jako część głosu.** Czego nie ma, dostaje „soon” albo nie pada wcale; żadnych zmyślonych wersji, liczb i cech. Poczta = TLS, nie E2EE. mRAG = indeks po stronie serwera, per konto. „Couldn't read this — that is not the same as it being empty.”
9. **Liczby konkretne i małe.** „78 px”, „4 kroki”, „5,4:1”, „$19/mo” — nigdy „szybko”, „nowocześnie”.

## Czego nie mieszać

Reguła paczki-16 (07.09), rozszerzona 18.09 na trzy marki: palet, krojów, osoby gramatycznej, formy CTA, narożników, głębi.

| | mosADD | 3T3R app (Eter) | 3T3R Engineering |
|---|---|---|---|
| Podłoże | apka `mosadd-background` · LP `mosadd-lp-background` #000 | `eter-background` 222 43% 4% | `eng-background` #000 |
| Akcent | zieleń `mosadd-primary` 146 72% 45% | opalizacja `eter-iridescent-blue` → `eter-iridescent-purple` → `eter-iridescent-pink`; czerwień `eter-accent-sygnal` tylko jako 2-px żyłka wiersza, na którym stoisz | sygnał `eng-signal` #f04a41 i biel `eng-text` |
| Kroje | IBM Plex Mono `mosadd-mono` wszędzie · Space Grotesk `mosadd-brand` tylko H2 LP · Doto `mosadd-wordmark` tylko znak ≥16 px | Space Grotesk `eter-sans` · znak Black Ops One `eter-mark` | Inter Tight `eng-sans` · Geist Mono `eng-mono` · DotGothic16 `eng-dot` (znak, numery) |
| CTA | `[ WERSALIKI W NAWIASIE ]`, kwadrat | pigułka z gradientem fioletu | pełna czerwona pigułka |
| Narożniki | kwadrat `mosadd-radius-sm` 0; `mosadd-radius` 4 px to wyjątek | miękkie: wiersz `eter-radius-row` 12, karta `eter-radius-card` 16, arkusz `eter-radius-sheet` 24 | gramatyka rysunku: karta `eng-radius-card` 14, plansza `eng-radius-plate` 18 |
| Głębia | stopień powierzchni + obwódka `mosadd-border`; cień tylko w dropdownie nagłówka `mosadd-dropdown-shadow` (decyzja 18.09 22:50) | poświata `eter-glow-*`, nigdy cień rzucany | włos `eng-line`, wymiar, przekrój, port w prawdziwym rozstawie |
| Osoba | UI bezosobowo, komunikat maszyny · LP krótko, do właściciela firmy, ton wojskowy | druga osoba, zwrot do człowieka | opisowo, technicznie — podpis pod rysunkiem |

⚠ Tam, gdzie kod już dziś łamie tę tabelę (wspólny Space Grotesk, wspólna czerwień Eter/Engineering, `shadow-2xl` w dwóch markach), rozdział Rozjazdy podaje dowód i czeka na decyzję. Nie „naprawiaj” tego po cichu.

## Ruch

- **mosADD LP:** wizual marki gra zawsze, także przy systemowym Reduce Motion — decyzja Króla 11.08 (`apps/web/src/components/landing/lpMotion.ts`). Paralaksa i przewijanie honorują reduce-motion. W aplikacji mosADD reduce-motion honoruje wszystko.
- **Ikony trzech marek:** ruch tylko w stanie aktywnym (otwarty panel, naciśnięty sygnet, wiersz pod palcem). ⛔ Znak mRAG (dwudziestościan `pamiec` = 3T3R MÓZG; rozkaz Króla 19.09 „To jest ikona mRAG”) nie obraca się nigdy — w stanie aktywnym płonie słońce 0,55 → 0,95 w 0,3 s i oddycha (Król 19.09 01:37; `MragIcon.tsx`, wcześniej merkaba `HexagramIcon.tsx`, usunięta 19.09).
- **3T3R:** znak ma dwa stany — spoczynek i życie; żyje tylko wiersz pod palcem i wiersz, na którym stoisz. Zakaz `backdrop-filter` nad żywą sferą.

## Fokus i dotyk

- Cel dotykowy min `touch-min` 44 px w każdej marce, bez wyjątków; w mosADD przez `::after`, nie przez margines.
- Fokus: mosADD `mosadd-ring` (zieleń), Eter `eter-fiolet-zylka` na polu szukania, Engineering `eng-focus-ring`. Każdy ≥3:1 na swoim podłożu.

## Rozdziały

| Plik | Co zawiera |
|---|---|
| `00-START.md` | Wejście dla każdej nowej sesji — co czytać, prawo kanonu, gdzie co leży, flota, dostępność |
| `10-mosadd.md` | mosADD — kolor, typografia, kształt, nagłówek i panele aplikacji, CTA |
| `20-3t3r.md` | 3T3R / Eter — kolor, typografia, wiersz kanonu, CTA, słownik własny |
| `30-engineering.md` | 3T3R Engineering (ORB) — kolor, typografia, rysunek zamiast ekranu, CTA |
| `40-ikony.md` | Wspólny szkielet brył, słońce per marka, przydział, ruch ikon |
| `45-lp.md` | LP mosADD — nagłówek, hero, stopka, wersje `/`, `/b`, `/c`, LP LAB |
| `50-konto-pro.md` | Konto PRO i PDP — wzór dla wszystkich marek RA |
| `55-whiteintel.md` | ⏳ WhiteIntel — rozdział otwarty, czeka na dowody z repo marki |
| `60-glos.md` | Głos i słowo — key messages, rejestr, słownik uczciwości, języki ⏳ |
| `70-ruch.md` | Ruch — reduce-motion, ikony, klimat scen LP, trzy marki |
| `80-cennik.md` | Cennik mosADD — plany, dodatki, czego w cenniku nie ma |
| `85-dostepnosc.md` | Dostępność — dotyk, fokus, zmierzone kontrasty, tekst |
| `90-rozjazdy.md` | Rozjazdy — gdzie kod, dokumenty i decyzje się rozchodzą |

Pliki źródłowe obok rozdziałów: `design-system.json`, `tokens.json`, `toggles.html`, `components/`, `assets/`, `fonts/`, `_raporty/`.

Gdzie czego szukać, gdy nie wiesz: wartość koloru, kroju albo miary → rozdział marki. Kształt ikony → 40-ikony. Co i jak pada w zdaniu → 60-glos. Czy to się rusza → 70-ruch. Ile to kosztuje → 80-cennik. Czy to widać i da się w to trafić palcem → 85-dostepnosc. Sprzeczność → 90-rozjazdy, i nie naprawiaj po cichu.
