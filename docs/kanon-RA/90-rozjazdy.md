# Rozjazdy — do decyzji

Rzeczy, w których kod, dokumenty i decyzje się rozchodzą. Każda ma dowód. Do decyzji nic z tego nie jest „naprawiane” po cichu. Stan: 19.09.2026, ~03:30.

| # | Rozjazd | Dowód | Kto decyduje |
|---|---|---|---|
| R1 | Słońce sygnetów mosADD: `REGULA-PALET-NIE-MIESZAC.md` §5 (18.09) mówi „fiolet wewnątrz apki celowo”, a `brandSun.ts` cytuje rozkaz Króla 17.09 „ZIELONE w mosADD” | `apps/web/src/components/icons/brandSun.ts` | nowsza data — zieleń; §5 do poprawki |
| R2 | Rozmiar słońca: 3T3R r = 8,5 % pola, mosADD r = 16 % (`SUN_BOX_FRACTION` 0,32) | `SolidGlyph.tsx`, `brandSun.ts` | Król — zasada 2 kanonu ikon |
| R3 | Eter i Engineering mają praktycznie tę samą czerwień (#ef4f43 i #f04a41) | `cymru-main/src/index.css:88-90`, `RAYDIO-LP-main/src/styles.css` | Król |
| R4 | Space Grotesk w dwóch markach: H2 LP mosADD i cały UI Eter | `tailwind.config.ts:26-27`, `index.css:195` | Król (mosADD R4 i tak go wycofuje) |
| R5 | „Bez cienia” kontra: dropdown, krawędź panelu i karty LP mosADD; menu, gałka i 3 × `shadow-2xl` w Engineering | `TopNavBar.tsx:218,230`, `styles.css:295-296` | Król (dropdown mosADD ma decyzję 18.09) |
| R6 | Pigułka CTA wspólna Eter i Engineering | `Przedsionek.tsx:336`, skill `Button.jsx` | Król |
| R7 | mosADD: token narożnika 4 px, praktyka 0 px | `index.css:393`, `tailwind.config.js:126-128` | kanon = kwadrat (1267 użyć) |
| R8 | Jasne skórki Eter i Engineering (ARRIVAL) nie mają kolumny w tym systemie | `cymru-main/src/index.css:1278-1320`, `styles.css:436-493` | Król: trzeci motyw czy nie |
| R9 | `--cosmic-black` 222 43% 5% obok `--background` 4 % | `cymru-main/src/index.css:46,124` | 3T3R ADMIRAŁ |
| R10 | BRANDBOOK 3T3R v3.2.0: tabela iridescent 70–75 sprzed 14.08 | `cymru-main/docs/BRANDBOOK.md`, `Desktop\BRANDBOOK-3T3R-NIEAKTUALNY-18-09.md` | Król: droga A albo B |
| R11 | mURL: DECYZJE 18.09 „wkrótce”, rozkaz Króla 19.09 02:17–02:25 „mURL istnieje” | #command 01:23Z | wpisać do DECYZJE-KROLA |
| R12 | Cennik w apce i na /pricing: $0 / $29 / $199 / Custom; mRAG w apce „FREE · 100 MB” kontra RECON 2 GB | DECYZJE-KROLA §1, zrzut `po-01-mrag` | ADMIRAŁ mosADD (w toku) |
| R13 | Pole szukania na stronie mRAG ma lupę — anty-kanon „lupa zamiast heksagramu” | zrzut `po-01-mrag`, DECYZJE „Baza UI apki” | ADMIRAŁ mosADD |
| R14 | Ikony wierszy mVAULT to cienkie linie; umowa 17.09: „zero cienkich linii”, kanon: bryły ze słońcem | zrzut `po-04-mvault` | Król: bryły z zestawu (po eterowemu) |
| R15 | mOPS: przyciski CONNECT zamiast „ładnych toggle’i” wg rysunku 15.09 → SPEC gotowy: komponent MosaddToggle + `KANON-RA\toggles.html` (19.09, wg nagrania 33) | zrzut `po-03-mops`, #command 01:23Z | ADMIRAŁ (wykonanie) |
| R18 | Trzy wyglądy przełącznika w kodzie: `ui/switch.tsx:42/50` (44×24, kula 20), `ArmyPanel.tsx:105-120` (44×24, kula 16, luz 2 vs 6 px), `MlidarSwitch.tsx:45-70` (obrys + tint + omiatanie) — kanon: jeden, MosaddToggle | kod | ADMIRAŁ |
| R19 | `ui/switch.tsx:42` maluje ON przez `bg-primary`; każdy moduł, który przemapowuje `--primary` (ChannelView.tsx:2507 → czerwień mIRC), przemaluje przełącznik — kanon każe `--state-on` (index.css:254-269) | kod | ADMIRAŁ |
| R16 | LP-B: roczna cena „dziesięć miesięcy” bez źródła w DECYZJE; plakietka COMMANDER „RECOMMENDED” zamiast „MOST PICK”; FAQ i sekcja mADD dodane regułą nowszej daty | `Desktop\ZMIANY-LP-B-19-09.md` | Król |
| R17 | Nagłówek mosADD `px-3` (12 px), kolumna panelu `px-4` (16 px) — dwa marginesy przy regule „jeden margines” | `TopNavBar.tsx`, `SidePanelHeader.tsx` | ADMIRAŁ mosADD |

## Przegląd 20.09 — stan po uzupełnieniu kanonu

Zamknięte: **R11** (mURL) — rozkaz Króla 19.09 02:17 jest już wpisany do `DECYZJE-KROLA.md` §1 i do 10-mosadd; wiersz zostaje w tabeli jako ślad, ale nie czeka na nikogo.

Nowe, otwarte:

| # | Rozjazd | Dowód | Kto decyduje |
|---|---|---|---|
| R20 | Cennik: decyzja Króla 18.09 23:20 mówi $0/$19/$49, a `DECYZJE-KROLA` §1 notuje prod na $0/$29/$199/Custom. Pomiaru prod po 19.09 nikt nie wpisał — kanon nie wie, czy rozjazd nadal jest | `plan-limits.ts:423,517,728-729,750-751` kontra §1 „Cennik”; brak daty pomiaru | ADMIRAŁ mosADD — zmierzyć build-id i wpisać do 80-cennik |
| R21 | Kontrast bieli `eng-text` na `eng-background` #000 nigdy nie zmierzony; Engineering jest jedyną marką bez liczby w 85-dostepnosc | 85-dostepnosc, wiersz Engineering | GOD OF RA DESIGN |
| R22 | Brak decyzji o języku: kanon nie ma wiersza „język bazowy UI / LP / lista locale per marka”, a kod mosADD ma warstwę `i18n/locales` | `apps/web/src/i18n/`, brak wiersza w DECYZJE-KROLA | Król — jedna linijka |
| R24 | Kolumna Engineering w 40-ikony („Przydział”, słońce `eng-signal`) jest ⏳ propozycją z 19.09 i nikt jej od tego czasu nie ruszył | 40-ikony §Słońce per marka, §Przydział | Król (TAK/NIE) albo dowód w kodzie RAYDIO-LP |
| R23 | WhiteIntel wchodzi do kanonu jako czwarty produkt (55-whiteintel, 20.09, z `C:\whiteintel-main\DESIGN.md`). Trzy sprzeczności wewnątrz samego kontraktu marki: W1 `--brand` ma dwie wartości (#3ecf8e i #ffb020) · W2 dwie różne zielenie na jednym ekranie (`--brand` i `--risk-low`) · W3 Space Grotesk i IBM Plex Mono wzięte po raz czwarty w grupie | `whiteintel-main/DESIGN.md` §1–3; 55-whiteintel §Rozjazdy | Król (W1) · linia WhiteIntel (W2) · GOD OF RA DESIGN (W3, razem z R4) |
