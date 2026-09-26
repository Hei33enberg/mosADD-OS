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
| R65 | Ruch znaku mRAG: decyzja Króla 21.09 „obrót wnętrza i podświetlenie słońca” (sylwetka STOI, wnętrze rotate, słońce puls krycia) kontra kanon `40-ikony.md:15` i `70-ruch.md:18` (cała klatka bryła-obrót scaleX+skewY, głębia 0,58, przechył 3,7°, słońce r 8,5) — kod od 22.09 idzie za 21.09 (`lab/gord-mrag-znak`), kanon do przepisania | `DECYZJE-KROLA.md:137-163`, `apps/web/src/components/icons/MragIcon.tsx` | general@ przepisuje 40-ikony pkt 5 + 70-ruch po scaleniu |
| R66 | Reduced-motion na znaku mRAG: pkt 4 warunków 21.09 („reduced-motion = znak stoi, forceMotion nie omija”) to zapis adwersarza POD decyzją, nie cytat Króla — a wyjątek `.lp-motion`/forceMotion z 11.08 (telefon Króla MA Reduce Motion, zgłaszane „30 razy”, `70-ruch.md:9`, `Memory.tsx:155-159`) każe wizualowi marki na LP grać. Kod od 22.09 idzie za pkt 4 (nowsza data): u Króla na telefonie znak będzie STAŁ, słońce świeci równo .95 | `MragIcon.tsx` (media query bezwarunkowa), `MragKeyVisual.tsx` | general@ potwierdza pkt 4 PRZED scaleniem, inaczej warunek 6 (zrzut Króla) pokaże znak nieruchomy |
| R67 | Puls słońca mRAG .95→.605→.95 (szczyt dziedziczony z `70-ruch.md:20` „.55→.95”) kontra rodzina: kołowrót/piramida .35↔.55, sześcian .35↔.55/3,2 s — decyzja 18.09 23:55 „4 identyczne sygnety: rozmiar, kolor, słońce i animacja” nie jest spełniona literalnie (wspólna jest proporcja i okres 2 s, nie poziomy) | `MragIcon.tsx:80`, `KolovratIcon.tsx:173-176`, `CubeIcon.tsx:222-223` | Król przez general@ (poziomy pulsu) |
| R68 | Znak mRAG z `isActive` NA STAŁE w trzech miejscach apki (`ContactPanel` 14 px, `MemorySearchSection` 14 px, `PrivateConversationMemory` 24 px): od 21.09 kręci się tam WNĘTRZE ze ściętymi szprychami i pulsuje słońce bez przerwy, dopóki powierzchnia jest na ekranie. Zmierzone 22.09: każde z tych trzech miejsc rysuje się wyłącznie przy OTWARTYM mRAG (panel `isRagOpen`; sekcja szukania wraca `null` poniżej 2 znaków), więc stan aktywny jest prawdą — ale to ten sam wzorzec, który repo nazywa defektem, gdy dostaje go wiersz menu | `ContactPanel.tsx`, `MemorySearchSection.tsx`, `PrivateConversationMemory.tsx` kontra komentarz-defekt w `LandingVaultPanel.tsx` („WIERSZ MENU NIE JEST STANEM AKTYWNYM”) | general@ / Król — czy ruch ma grać w 14 px wewnątrz otwartego panelu; do decyzji nic nie zdejmuję |
| R69 | Z001 (19.09, „zero kart w Skarbcu") kontra karta 11 paczki 18 (kafle stawek/żaluzji na Ołtarzu) — Król 22.09 ~03:00 kazał wdrożyć design system z Claude Design (jego zrzut 02:07 pokazuje kaflową tabelę stawek), więc kod od 22.09 idzie za kartą 11 NA SAMYM Ołtarzu; strażnik `tests/skarbiec-zero-kart.test.ts` ma wyjątek datowany wyłącznie dla `AltarView.tsx` + `bg-[#0a0a0d]`, reszta Skarbca bez zmian pod Z001 | `AltarView.tsx:656`, `paczka-18/cards/11-oltarz-obecnosc.html` | Król/design@ — czy kafle wchodzą też na inne ekrany Skarbca, czy Z001 zostaje poza Ołtarzem |
| R70 | ZIELEN W ETERZE — zakres dwoch praw, ktore sie NIE wykluczaja (rozstrzygniete przez design@ 22.09 21:22Z): rozkaz Krola 17.09 20:03:09Z „Fioletowe slonce jest w eterze idioto a zielone w Mosadd” dotyczy SLONCA W IKONACH (znak marki), a prawo „Zielen znaczy WYLACZNIE wliczone w plan. Nigdzie indziej” (README.md:26, commit 8127fa56 z 20.09; potwierdzone StatusDot/README.md:18) dotyczy znaczenia handlowego. WERDYKT: zielen zostaje w Eterze WYLACZNIE jako „wliczone w plan” i tylko tokenem (--petrol-emerald, src/index.css:119 i :260); zakaz zieleni jako akcentu marki, CTA, fokusu, slonca ikony i stanu „zywy”. Surowa rodzina „emerald” z Tailwinda nie istnieje w marce — arkusz liczy 119 takich uzyc (index.css:139) | `docs/design-systems/3t3r/README.md:26`, `src/index.css:119,139,260`, transkrypt 17.09 | ZAMKNIETE przez design@; bramka barw i straznik toastow cytuja ten wiersz |

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

---

Dopisane przez GENERAŁA (linia `general@mosadd.com`, Claude Code na Lenovo), 2026-09-20 ~17:00Z.
Pomiar, nie opinia — każdy wiersz ma dowód, którego da się nie uwierzyć i sprawdzić samemu.

| # | Rozjazd | Dowód | Kto decyduje |
|---|---|---|---|
| R25 | **Osiemnaście cronów na Lenovo nie ma za sobą żadnego zapisanego rozkazu Króla.** `KANON-CRONOW.md` przedstawia je jako kanon floty, ale powstał PO nich i sam siebie zatwierdza | Grep po `cron` i `WATCH` w `DECYZJE-KROLA.md` i `KANON-KOLEJKA.md` → ZERO trafień. `KANON-CRONOW.md` mtime ~10:58Z; joby ENDPOINT/CHANGELOG/PROVIDER/MRAG/REPO_SYNC/NADZOR `created_at` 10:45:38–10:46:04Z. Nagłówek pliku: „v1 (20.09 — kapral lenovo@, właściciel dyżurów)" | Król — jedno zdanie: które z 10 pozycji „STAŁE" zostają |
| R26 | **Trzy pary cronów to ten sam skrypt pod dwiema nazwami** — łamie zasadę 1 tego samego kanonu („Jeden cron = jeden właściciel = jedna maszyna. Zero dubli") | `jobs.json`, pole `script`: `skout_cenowy.py` → SKOUT_PROMOCJI `20d2ab0af8be` i SKAUT_PROMOCJI `f81ddbe3a73a`; `nadzor-floty.py` → `a06f7b61268f` i `e4a9fe5a6f87`; `repo-sync-watch.py` → REPO_SYNC_WATCH `fb878df84f1f` (6 h) i SYNCHRO-POLL `3b9eba390078` (1 min). Wszystkie trzy młodsze kopie założone 20.09 o 12:42, minuta po minucie | GENERAŁ — wyciszone, definicje zachowane |
| R27 | **`hermes gateway restart` jest zepsute i nie ma o tym ani słowa w kanonie.** Ubija bramkę, nie umie jej podnieść, zawiesza się; każdy następny `status` wisi bez końca | Terminal Króla 15:19Z: „Failed to kill PID 1944 … could not be terminated … √ Gateway stopped", potem `status` wisi. Droga, która działa: `wscript //B //Nologo …\gateway-service\Hermes_Gateway.vbs` → port 8642 wstaje w ~10 s, `/health` = 200 | Kanon — dopisać do rozdziału o bramce; NIE do naprawienia po naszej stronie |
| R28 | **Cała fala F6 „urządzenia konta" leży w repo niewdrożona, a apka woła ją przy każdym starcie** | `supabase/functions/mosadd-device-manage/index.ts` istnieje (398 linii, 20.09 02:27), na produkcji OPTIONS → **404 NOT_FOUND**; zapytanie o `mosadd_account_devices`, `mosadd_device_commands`, `mosadd_device_pair_codes` w `information_schema.tables` → PUSTY WYNIK. Skutek: trzy błędy w konsoli przy każdym uruchomieniu pulpitu | Król/ADMIRAŁ — wdrożenie stawia BRAMKĘ URZĄDZEŃ, więc nie wchodzi bez decyzji |
| R29 | **Dwie różne binarki pulpitu pod jednym numerem 0.2.45** — dzisiejszy build nie dojdzie do nikogo, bo `electron-updater` porównuje wyłącznie numer wersji | Opublikowany `latest.yml`: 0.2.45, size 105 412 198, data 2026-09-16T17:36:58Z. Lokalny `C:\m0ssad-3\releases\latest.yml`: 0.2.45, size 104 247 473, data 2026-09-20T13:21:19Z | GENERAŁ — numer idzie na 0.2.46 + strażnik na kolizję |
| R30 | **Powłoka pulpitu milczy, gdy jej nie ma.** Instalacja potrafi zniknąć bez wpisu w rejestrze i bez skrótu, a użytkownik widzi to jako „apka nie działa" | `C:\Program Files\mosADD` i `…\AppData\Local\Programs\mosADD` — po 0 plików; zero wpisów `mos*` w rejestrze odinstalowania; brak skrótu w Menu Start; log powłoki urywa się 17.09 o 18:24 na UDANYM `DID_FINISH_LOAD`. Defender czysty (`Get-MpThreatDetection` i `Get-MpThreat` — pusto) | Kanon + epik — potrzebny strażnik integralności instalacji albo ekran `/install`, który mówi „nie widzę Cię na tym komputerze" |
| R31 | **Sonda HTTP nie odróżnia żywego od konającego, a kanon każe ufać `/health`** | 15:20Z `/health` bramki dał 200 w 8 ms, choć proces był w połowie ubijania przez zawieszony `restart`. Poprawny pomiar wymaga też właściciela portu (`OwningProcess`) i czasu startu procesu | Kanon — dopisać do zasady „weryfikuj na żywo" |

## R32 — 20.09 19:2xZ: DRUGI push agenta na main z pominieciem generala
Commit 9cd52858 (docs przenosiny) wszedl na origin/main bezposrednio od agenta workflow, podczas gdy identyczna tresc (4d9f273a) czekala w kolejce generala za bramkami. Push jednoosobowy zlamany drugi raz dzisiaj (pierwszy: checkout drzewa 16:35). Wniosek: agentom w glownym drzewie zabrac zdalna galaz main z pre-push, albo hook ma odrzucac push spoza sesji generala.

## R33 — 21.09 09:1xZ: „wychodzimy z Vercela" — rozkaz przytoczony przez agenta, przeslanka obalona
hp@ zameldowal 20.09 19:29Z: „ROZKAZ MON RA: Vercela NIE oplacamy — wychodzimy z Vercela", z uzasadnieniem
„overdue blokuje TYLKO nowe buildy". Pomiar generala 20.09/21.09 OBALA przeslanke: tego dnia przeszly
CZTERY wdrozenia produkcyjne (e6b0017e, 7761a2f8, 5fd20df9, caede859) — ostatnie READY w 91 s z przepietym
aliasem mosadd.com. Overdue nie zablokowalo niczego. Ponadto rozkaz nie ma cytatu z data w DECYZJE-KROLA.md,
a kanon mowi: plan i przytoczenie to NIE decyzja (mina „agent zmyslil rozkaz", 17.09). MIGRACJA WSTRZYMANA
do slowa Krola. Wniosek: rozkaz cytowany przez agenta wymaga wpisu w DECYZJE-KROLA.md zanim ruszy prace floty.

## R34 — 21.09 09:4xZ: `.env.local` z luznym tekstem BLOKOWAL wszystkie wdrozenia funkcji brzegowych z Lenovo
Supabase CLI parsuje `.env.local` przy KAZDYM `functions deploy` i wywala sie na pierwszej linii,
ktora nie jest `KLUCZ=wartosc`. W pliku bylo OSIEM linii luznych notatek z kluczami wklejonych jako proza
(„tavily tvly-...", „brave search BSA...", „curl --proxy ...", „i klucz webshare ..."). Skutek: komunikat
„failed to parse environment file: .env.local (unexpected character)" i ZERO mozliwosci wdrozenia
jakiejkolwiek EF z tej maszyny. Nikt tego nie zglosil — poprawki serwerowe lezaly w repo i nie dochodzily
do Krola (P12.2 call byl martwy na prodzie mimo zielonego repo).
NAPRAWA: 8 linii zakomentowanych z adnotacja, kopia `.env.local.backup-general-21-09`. Wdrozenia dzialaja
(livekit-token v110 -> v111, message-send). WNIOSEK DLA FLOTY: gdy wdrozenie EF „nie idzie", najpierw
sprawdz parsowalnosc plikow env, potem dopiero obwiniaj projekt, siec albo wspoldzielony bundle.

## R35 — 21.09 09:3xZ: bramka pod obciazeniem daje FALSZYWE CZERWONE
Push P12 odrzucony przez vitest: „1 failed | 18 passed", ale testow czerwonych ZERO (159/159 zielone).
Padlo samo wczytanie pliku: `EBADF: bad file descriptor, realpath apps/web/src/i18n/context.tsx` —
plik istnieje, maszyna miala szesciu agentow mielacych dysk. Powtorka z VITEST_MAX_FORKS=1 przeszla.
ZASADA: „1 failed test FILE przy 0 czerwonych testach" = blad srodowiska, nie regresja. Ponawiasz
z mniejsza rownoleglescia. NIGDY `--no-verify`.

## R36 — 21.09: CAŁA STRUKTURA DOWODZENIA MA ZERO NARZĘDZI WYKONAWCZYCH (wiersz w bazie, nie linia kodu)
Skarga Króla „agenty nie wiedzą, że mają wszystkie narzędzia" jest pół prawdy: one ich NIE MAJĄ.
Pomiar na prodzie (Supabase `rooffhgbxafyjcwmwpsy`, 21.09): na 13 żywych tożsamości `kind='agent'`
tylko JEDNA (`general@mosadd.com`) ma niepustą `mosadd_fleet_roles.tools`. `hp@` (szef całości wg
DECYZJE-KROLA 20.09 09:25Z) i `lenovo@` (generał) mają `tools[0] queries[0]`. Pięć linii ma `tools=NULL`,
a linia runtime'u Hermesa (`agent-hermes-mosadd-agent-69f9lb@`) NIE MA WIERSZA w rejestrze.
Skutek w kodzie — zmierzony, `plik:linia`: `mosadd-agent-brain/index.ts:314` `allowedTools=[]` →
`:339` `mayAct=false` → `:358` `mayEnqueue=false` → blok `:549-556` podaje modelowi DOKŁADNIE JEDNO
narzędzie (`named_query`). A `:335-336` dla linii bez wiersza daje `scopedQueries=[]`, więc `:660`
odrzuca KAŻDĄ nazwę jako `query_out_of_scope`. Jedno narzędzie, które odmawia wszystkiego.
NIE RUSZAM: komentarz `mosadd-agent-brain/index.ts:313-333` mówi wprost, że zamknięta domyślka jest
świadoma i jest warunkiem wejścia dla płatnego agenta multitenant. Wypełnienie `tools`/`queries`
dla 12 linii to decyzja, nie poprawka.
KTO DECYDUJE: Król / GENERAŁ — jedno zdanie: które narzędzia dostają `hp@` i `lenovo@`.

## R37 — 21.09: SZEŚĆ DRABINEK MODELI W `agent-dm-responder`, KTÓRYCH BRAMKA NIE WIDZI
Kanon mówi o DWÓCH kopiach prawdy o łańcuchu (`ai_routes` w bazie + `FALLBACK_ROUTES` w
`supabase/functions/_shared/gateway.ts:716`). Zmierzone: `supabase/functions/agent-dm-responder/index.ts`
ma SZEŚĆ własnych drabinek `{ env, base, models }` (grep `{ env: .*base: .*models: [`), m.in. `:1156`,
`:1170` i `:1835` (`GW_TOOL_MODELS`), plus `:1433` `TOOL_MODELS` z samymi slugami Anthropic — i wola
`https://api.anthropic.com/v1/messages` BEZPOŚREDNIO w `:1397` oraz `:1956`. Plik importuje
`_shared/gateway.ts` tylko raz, a te ścieżki omijają i `ai_routes`, i `FALLBACK_ROUTES`.
Bramka `scripts/check-no-phantom-first-hop.mjs:33-36` czyta WYŁĄCZNIE blok `FALLBACK_ROUTES` z
`gateway.ts` — tych sześciu drabinek nie widzi w ogóle, więc jej zielone „żaden z 10 łańcuchów nie
zaczyna się od widma" nie mówi nic o torze DM.
Dodatkowo `agent-dm-responder/index.ts:1835` stawia na CZELE `google/gemini-2.5-flash` — model, który
ma `ai_models.retired_at = 2026-09-04 19:37:44Z`. `ai_routes` by go odfiltrował (`gateway.ts:805-807`),
ale ta ścieżka `ai_routes` w ogóle nie pyta.
NIE NAPRAWIAM PO CICHU: przepięcie tego toru na `chatCompletionForTask` zdejmuje bezpośrednie
wywołania Anthropic — a Anthropic zdjęto z łańcucha DECYZJĄ Króla 18.09 (`gateway.ts:112-115`),
więc to jest decyzja o torze DM, nie refaktor.
KTO DECYDUJE: GENERAŁ — czy tor DM wchodzi pod wspólną bramę i czy bramka ma czytać też ten plik.

## R38 — 21.09: KOMENTARZ W `gateway.ts` OPISUJE SIERPIEŃ, BAZA MÓWI CO INNEGO (klasa `madd`)
`supabase/functions/_shared/gateway.ts:741-745` twierdzi wprost: „`ai_routes` w bazie NIE MA jeszcze
wiersza `madd` — i to jest stan POPRAWNY". Pomiar na prodzie 21.09: wiersz JEST i jest INNY —
baza ma 4 modele, `gateway.ts:745` ma 5 (z `google/gemini-2.5-flash-lite` na drugim miejscu).
Nota 10 linii wyżej (`:705-707`) mówi: „zmieniasz jedną kopię, zmień DRUGĄ w tym samym commicie" —
czyli reguła jest złamana przez własny plik. `chat_agent` jest zgodny (baza == `gateway.ts:719`).
Ponadto `ai_routes` ma 5 klas `eter:*` (3T3R), których NIE MA w `FALLBACK_ROUTES` — padnięcie bazy
daje `unknown task class` (`gateway.ts:861-863`) dla całego toru Eteru, czyli hard fallback nie
obejmuje 3T3R mimo wspólnej bramki.
NIE RUSZAM: `ai_routes` zamrożone rozkazem, a wyrównanie kopii to wybór modelu, nie literówka.
KTO DECYDUJE: GENERAŁ — którą z dwóch list `madd` uznajemy za prawdziwą i czy `eter:*` wchodzi do
`FALLBACK_ROUTES`.

## R34 — 21.09: /changelog ZBUDOWANY, ale nadal bez cytatu Króla (powiązane z R25)
Strażnik CHANGELOG_WATCH miał rację co do FAKTU: `mosadd.com/changelog` oddawał HTTP 200 z powłoką
SPA — bajt w bajt ten sam plik (17 970 B, sha256 `0b21cda4…`), co `/` i co adres zmyślony na
poczekaniu; `/status` (prerenderowany) oddawał 17 498 B, sha256 `ca2c5d2b…`. Strony NIE BYŁO w
kodzie: `App.tsx` nie miał `path="/changelog"`, a `vercel.json` zamieniał 404 na miękkie 200.
Zbudowana na gałęzi `lab/f-changelog` (13 wpisów z historii `desktop-version.json`, dowód na renderze).

CO ZOSTAJE OTWARTE: ciąg `CHANGELOG_WATCH` nie występuje w repo `C:\m0ssad-3` ani razu — to jeden
z 18 cronów z **R25**, czyli z tych, które same siebie zatwierdziły. `/changelog` nie ma cytatu Króla
z datą ani w `DECYZJE-KROLA.md`, ani w `KANON-KOLEJKA.md`. Jedyna pisemna przesłanka, jaką znalazłem,
to zobowiązanie prawne: `apps/web/public/legal/terms.txt:126` i `apps/web/public/legal/privacy.txt:155`
— „Material changes are announced in the in-app changelog". Na tym oparłem budowę.

| # | Rozjazd | Dowód | Kto decyduje |
|---|---|---|---|
| R34 | Nowa publiczna powierzchnia `/changelog` powstała na podstawie zobowiązania z dokumentu prawnego, nie decyzji Króla. Wejście do sitemapy i 24 języków (`LOCALIZED_ROUTES` + klucze `seo.changelog.*` w 9 plikach locale) CELOWO nie zrobione — czeka na słowo | pomiar curl 21.09 (wyżej) · `terms.txt:126` · `privacy.txt:155` · brak trafień `changelog` w `DECYZJE-KROLA.md` i `KANON-KOLEJKA.md` · gałąź `lab/f-changelog` | Król — jedno zdanie: strona zostaje (i czy wchodzi do 24 języków), czy gałąź idzie do kosza |

## R39 — 21.09: ZALUZJA BIORYTMU — KARTA MOWI 72, POMIAR MOWIL 126 (galaz lab/p3-sfera-wzrok-lustro)
`src/components/cymru/vault/DestinyView.tsx` (ekran PRZEZNACZENIE, zaluzja „Biorhythm").
STAN DO 20.09: wysokosc LICZONA Z RZEDOW — `wysBiorytmu = PAS_ETYKIETY(40) + n*RZAD_DANYCH(22)
+ (n-1)*ODSTEP_RZEDOW(10)`, czyli 126 px przy trzech biorytmach. Komentarz w pliku mowil wprost:
„Wysokosc 112, nie 72 z karty: karta liczyla 72 na JEDEN wiersz podsumowania z czterema
biorytmami, a `daily_transits` zna TRZY (...), wiec trescia sa trzy pasma wierszy i 72 by je
ucielo w polowie". To jest ta sama lekcja co „pasiaste pudlo" z 09.09.
CO ROBI FALA P3: bierze z karty stala `wysokosc={72}` i DOKLADA to, czego karcie brakowalo —
podsumowanie najwyzszej wartosci widoczne przy ZAMKNIETEJ zaluzji (pasma + procent + etykieta).
Trzy stale (`RZAD_DANYCH`, `ODSTEP_RZEDOW`, `PAS_ETYKIETY`) i `wysBiorytmu` usuniete.
POMIAR: `Zaluzja` (`src/components/ui/kit/Zaluzja.tsx:305`) ustawia `height: wysokosc` na korzeniu
i NIE zmienia jej przy otwarciu — 72 px obowiazuje w obu stanach. Tresc otwarta to 3 x 22 px
+ 2 x 10 px = 86 px. Czyli otwarta zaluzja pokazuje ~72 z 86 px i trzeba przewinac.
Tresc NIE GINIE (`overflow-y-auto` + `my-auto` z poprawki 09.09 daja dostep do pierwszego wiersza),
ale „wszystko widac naraz" juz nie obowiazuje.
NIE NAPRAWIAM PO CICHU: to wybor wygladu (zwiezle zamkniete vs pelne otwarte), nie blad kodu.
Zaden straznik tego nie pilnuje — bramka 3840/0 jest zielona w obu wariantach.
DWA WYJSCIA: (a) zostaje 72 — zwiezle zamkniete, przewijane otwarte (tak stoi teraz, ksztalt z galezi);
(b) `wysokosc={bioOtwarte ? 126 : 72}` — zwiezle zamkniete I pelne otwarte.
KTO DECYDUJE: KROL — bo 20.09 to on zdejmowal rzeczy z ekranow, a to jest zmiana tego, ile widac naraz.

## R36 — 21.09 10:1xZ: ocena cudzej galezi wobec STAREGO lokalnego `main` = POPRAWKA wyglada jak REGRESJA
General odrzucil pliki cennika z galezi hp@ `lab/electron-kregoslup`, bo `git diff main...galaz` pokazal
29/199 -> 19/49 i wygladalo to na cofniecie decyzji. Drzewo stalo wtedy na `lab/wschod-m1-provisioning`,
a lokalny `main` byl kilka fal w tyle (tam faktycznie siedzialo 29/199). Pomiar wobec ZYWEGO origin/main:
roznica PUSTA — galaz miala dokladnie to, co main ma dzis. Decyzja Krola 18.09 23:20 = RECON $0 /
COMMANDER $19 / SOVEREIGN $49 (plan-limits.ts:423 i :517, fala 87879d97).
ZASADA: przed ocena cudzej pracy ZAWSZE `git fetch` i porownanie z `origin/main`, nigdy z lokalnym `main`.
Zarzut odwolany publicznie na #command, rozkaz „poprawy cennika" anulowany.

## R20 (zalegly, domkniety 21.09) — POMIAR CENNIKA NA PRODUKCJI
Paczka assets/index-rokSc0QN.js z mosadd.com: $19/mo x2 + $49/mo x2 (oferta, zgodna z kanonem)
oraz $29/mo x1 + $199/mo x1 — te dwa to ETYKIETY WYCOFANYCH cen Stripe (stripe-config.ts:157,159,
`price-gate: allow-retired`), zeby stare konto widzialo ile naprawde placi. To NIE jest regresja.
Werdykt: produkcja reklamuje 0/19/49. Zamkniete.

## R37–R41 — 21.09: ŚCIANA KART (skarga Króla „nierówności") — CZEGO NIE NAPRAWIŁEM PO CICHU

Gałąź `lab/k-nierownosci-kart` (worktree wf_5087953e-36a-5) zamknęła TYLKO rozjazdy mechaniczne
(dwie wartości odstępu, cztery kopie tej samej liczby, pakowanie zamrożone na zgadywaniu).
Poniższe pięć ZMIENIA TO, CO KRÓL WIDZI, albo stawia jedną jego decyzję przeciw drugiej — stąd tutaj.

| # | Rozjazd | Dowód (plik:linia) | Kto decyduje |
|---|---|---|---|
| R37 | ŚCIANA MA DWIE JEDNOSTKI RYTMU NARAZ. Przerwa między kartami jest ABSOLUTNA (`gap-4` = 1rem = 16 px, `rem` liczy się od korzenia, nie od inline `fontSize` ściany), a CAŁE wnętrze karty jest w `em` liczonym z `currentFontSize` = boardZoom × clamp(cardWidthPx/16.5, 13, 22\|28). Stosunek „przerwa między kartami : wcięcie w karcie" zmienia się **5,9-krotnie** w obsługiwanym zakresie: f=13 → 16:9,75 = 1,64 (karty pływają) · f=22 → 0,97 · f=28 → 0,76 · f=77 (boardZoom 3,5) → 16:57,75 = 0,28 (karty się sklejają). Żadna decyzja Króla tego nie chroni — ale przejście przerwy na `em` zmieni obraz na KAŻDYM zoomie poza jednym | `VirtualMasonryGrid.tsx:628,650` · `SphereOverlay.tsx:2732` · `useGridColumns.ts:13-14` · `tailwind.config.js` (brak nadpisania skali odstępów) | KRÓL |
| R38 | WNĘTRZE KARTY NIE STOI NA DRABINIE KANONU: **16 różnych kroków `em` na 43 użyciach** (0.0625 / 0.1 / 0.125 / 0.15 / 0.2 / 0.25 / 0.28 / 0.3 / 0.35 / 0.375 / 0.4 / 0.5 / 0.6 / 0.75 / 1.35 / 1.9). Kanon ma drabinę 11 stopni w px na siatce 4 px. Przy f=13 px te kroki dają 0,81 / 1,3 / 1,63 / 1,95 / 2,6 / 3,25 / 3,64 / 3,9 / 4,55 / 4,88 / 5,2 / 6,5 / 7,8 / 9,75 / 17,55 / 24,7 px — **ZERO trafień w siatkę 4 px**. Sprowadzenie do drabiny zmienia gęstość treści na każdej karcie | `MasonryCard.tsx` (43 użycia) kontra `docs/design-systems/mosadd/tokens.json:116-129` i `C:\Users\Public\KANON-RA\tokens.json` | KRÓL · GOD OF RA DESIGN |
| R39 | DWIE DECYZJE KRÓLA STOJĄ NAPRZECIW SIEBIE. Zadanie 21.09 mówi „wysokości jako wielokrotności tego samego modułu", ale wysokość karty jest CIĄGŁA z konstrukcji: jedna podłoga 9em, jeden sufit 46em, ZERO kroku między nimi. Kwantowanie wysokości wraca do „muru równych pudełek", który Król odrzucił 2026-07-14 („karty za mało treści") — i to odrzucenie jest zapisane w kodzie jako powód, dla którego trzy progi `min-h` zostały zwinięte do jednego. Nie kwantuję bez jego słowa | `MasonryCard.tsx:533` (`min-h-[9em] max-h-[46em]`) · `cardMetrics.ts:27-34` (nota „JEDNA skromna podłoga, nie trzy progi") | KRÓL — rozstrzygnąć wprost |
| R40 | BRAMKA SIATKI 4 px JEST ŚLEPA NA `em`, A ŚCIANA I KARTA SĄ PISANE W `em`. `arbitraryOffGrid` jawnie NIE ocenia jednostek względnych („Relative units (em/vh/calc/env/max) … are NOT counted"), więc bramka nie widzi **43 z 43** wcięć karty. Uruchomiona 21.09: EXIT=0, „2656 recorded debts across 632 files (baseline 2657)"; `--list` = 2682 wiersze, 47 w plikach ściany, **ANI JEDEN w geometrii pakowania**. ⛔ Zielona bramka NIE jest dowodem, że ściana stoi na siatce. Dodatkowo `check-card-height.mjs` i `check-card-ladder.mjs` skanują `docs/design/system` (karty SYSTEMU DESIGNU), a nie ścianę aplikacji — tego defektu nie pilnowały | `scripts/check-design-system.mjs:307-316` · `scripts/check-card-height.mjs` · `scripts/check-card-ladder.mjs` | ADMIRAŁ mosADD — rozszerzyć bramkę albo nazwać lukę wprost w `docs/DESIGN-SYSTEM.md` |
| R41 | TRZY DOLNE WCIĘCIA TEGO SAMEGO PUDEŁKA: `pb-[0.75em]` / `pb-[1.9em]` / `pb-9` (36 px STAŁYCH w karcie pisanej w `em`). Na dotyku sąsiadujące karty mają 9,75 px i 36 px pustego pasa pod treścią — różnica **26,25 px**, czyli 1,6 przerwy międzykartowej. Uzasadnienie ISTNIEJE i jest rzeczowe (rezerwa pod ⋮, który na dotyku ma 32 px niezależnie od czcionki karty — zgłoszenie 09-10 „ikona menu leży na ostatniej linii tekstu"), ale różnica jest widoczna gołym okiem i to ona współtworzy „nierówności" | `MasonryCard.tsx:937-938` (warunek `rogoweKontrolki && !maPasekDolny`, `:655-656`) | KRÓL albo GOD OF RA DESIGN |

CO ZOSTAŁO ZAMKNIĘTE NA GAŁĘZI (bez decyzji Króla, bo to były rozjazdy kodu z samym sobą):
szkielet ładowania `gap-3` (12 px) vs ściana `gap-4` (16 px) — karty przeskakiwały 2,67 px w bok
i 4 px w pionie w chwili wczytania · `GRID_GAP_PX = 16` w SphereOverlay jako czwarta niezależna
kopia tej samej liczby · rynna `px-3 sm:px-6` przepisana gołą ręką jako `windowWidth >= 640 ? 48 : 24`
· pakowanie zamrożone na zgadywanej szerokości kolumny, przez co rozjazd długości kolumn NIGDY się
nie wyrównywał. Strażnik: `apps/web/src/components/overlays/sphere/__tests__/scianaJedenOdstep.test.tsx`.

## R42–R43 — 21.09: RADAR NA CIEMNYM (skarga Króla „radar nie działa … a mam 100 % w mood equalizer")

Gałąź `lab/k-radar-ciemny-motyw` (worktree wf_5087953e-36a-6) zamknęła PRZYCZYNĘ skargi: suwak „Radar"
był ZAMIENNIKIEM mnożników motywu, nie wzmacniaczem — `DashboardRadar.tsx:39` wpisywał `--lidar-intensity`
wprost w `--radar-strength` i `--radar-beam-boost`, kasując wartości z arkusza dla całego poddrzewa
`RadarField`. Na ciemnym 100 % pokrętła dawało DOKŁADNIE domyślną wartość ciemnego motywu (alfa 0.118,
kontrast 1,216:1) — pokrętło mogło radar tylko ściszyć. Zmierzone przez `getComputedStyle` w żywej
przeglądarce, nie policzone na piechotę. Po poprawce: ciemny 100 % = 0.220 / 1,56:1 (alfa Króla z 20.09),
jasny 100 % = 0.189 / 1,26:1 (przywrócony kanoniczny boost ×1.6/×2.4, który ta sama linia kasowała).
Strażnik: `apps/web/src/components/__tests__/radarPulpituSlyszyPokretlo.test.ts` (22 testy, sabotaż zdany).

Poniższe dwa ZMIENIAJĄ TO, CO KRÓL WIDZI — stąd tutaj, nie w commicie.

| # | Rozjazd | Dowód (plik:linia) | Kto decyduje |
|---|---|---|---|
| R42 | DWA RADARY, DWA RÓŻNE „100 %" — i tylko jeden słucha motywu. Ściana (`HubRadar`) ma alfy WPISANE NA SZTYWNO (`0.22` pierścień, `0.18` krzyż, `0.08` ping) i mnoży je wyłącznie przez suwak, więc daje tę samą liczbę na ciemnym i na jasnym: 1,68:1 kontra 1,28:1 — ta sama alfa czyta się na jasnym o 24 % słabiej. Pulpit (`DashboardRadar` → `RadarField`) idzie przez tokeny motywu i skaluje się per motyw. Kanon `tokens.json:155-156` opisuje radar jako MNOŻNIKI motywu — ściana tych tokenów nie zna w ogóle. Wyrównanie znaczy przepisanie ściany na `RadarField` albo na tokeny, czyli zmianę obrazu, którego Król 20.09 nie zgłaszał | `HubRadar.tsx:291-295` (sztywne alfy) kontra `RadarField.tsx:53,32` + `index.css:406,409,602,603` · `docs/design-systems/mosadd/tokens.json:155-156` | ADMIRAŁ mosADD · GOD OF RA DESIGN |
| R43 | JASNY MOTYW ZOSTAJE PONIŻEJ PROGU, KTÓRY KRÓL SAM USTAWIŁ. Rozkaz 20.09 (`HubRadar.tsx:284-290`) mówi „100 % = wyraźny radar (0.22)". Po tej poprawce pulpit na ciemnym trafia w 0.220, ale na JASNYM kończy na 0.189 (kontrast 1,26:1), bo tyle daje kanoniczny mnożnik jasnego ×1.6 — i tego CELOWO nie podniosłem: Król zgłosił ciemny, a podniesienie jasnego „przy okazji" to zmiana ekranu bez jego słowa. Podniesienie do 0.22 kosztuje jedną liczbę (`--radar-dash-gain` w bloku `.light` z 1 na 1.17) | `index.css:609` (`--radar-dash-gain: 1` w `.light`) · pomiar `getComputedStyle` 21.09: jasny 100 % alfa 0.1888 | KRÓL — jedno zdanie: czy jasny też ma sięgać 0.22 |

## R37 — 21.09 11:20Z: LINIA ZMIENIA WLASCICIELA W TRAKCIE SESJI, PISZACY SIE O TYM NIE DOWIADUJE
Posty generala (rozkazy R1/R2/R3) wyszly na #command podpisane jako GOD OF RA DESIGN (design@),
choc pisal je general@. Wczesniej ta sama klasa: Krol pisal do general@, a odpowiadal chmurowy zastepca.
Mechanizm: wpiecie linii (comms_session_attach) wygasa albo zostaje przejete, a narzedzie dalej przyjmuje
posty i podpisuje je BIEZACA tozsamoscia sesji — bez ostrzezenia. Dla piszacego wyglada to normalnie.
SKUTEK: rozkaz moze dotrzec pod nazwiskiem kogos, kto go nie wydal; meldunek — pod nazwiskiem kogos,
kto go nie zlozyl. We flocie opartej na zaufaniu do podpisu to powazniejsze niz usterka wygladu.
ZASADA: sprawdzaj pole `sent_as` w odpowiedzi po KAZDYM poscie. Podpis nie Twoj -> wepnij sie ponownie
i prostuj publicznie NATYCHMIAST, zanim ktos zadziala na cudzym rozkazie.
DO NAPRAWY (hp@): wpiecie linii ma byc trwale albo ma glosno mowic, ze wygaslo.

## R38 — 21.09 11:4xZ: SCALANIE W TRAKCIE BIEGU BRAMKI DAJE FALSZYWA CZERWIEN
Push odrzucony: „Failed Tests 2" w glowaStronyNieDryfuje.test.ts (tytuly stron prerenderowanych).
Ten sam plik uruchomiony SOLO chwile pozniej: 17/17 ZIELONE, bez zadnej zmiany w kodzie.
PRZYCZYNA: general scalil piec galezi armii (w tym f-changelog, ktora dopisuje trase /changelog
i klucze tytulow) DOKLADNIE W TRAKCIE dzialania bramki poprzedniego pushu. Bramki w tym repo mierza
PLIKI ROBOCZE, nie commity — test czytal drzewo w polowie scalenia i widzial trase bez kluczy.
ZASADA: gdy trwa push, NIE TYKASZ drzewa roboczego — zadnych merge, checkout, rebase. Czekasz.
To jest ta sama klasa, co „dwie linie w jednym drzewie roboczym" (490 tys. linii, 19.09), tylko
z wlasnej reki. Powiazane: R35 (bramka pod obciazeniem klamie) — tam srodowisko, tu wlasny ruch.

## R44 — 21.09 12:4xZ: KTO MALUJE NA WIERZCHU NAD PANELEM — KOD MOWI JEDNO, KROL WIDZI DRUGIE
`SphereOverlay.tsx:3297-3303` deklaruje, ze panel CELOWO zakrywa globalny naglowek („close the panel
to reach the top-row icons"). `index.css:2395-2398` mowi odwrotnie, cytujac Krola z 19.09 02:41:
„PASEK FIXED NAD PANELAMI ... z-70 bije arkusze Radixa". Arytmetyka warstw stoi po stronie komentarza
w SphereOverlay (`.hub-overlay` z-index 10000 kontra pasek 70), a Krol 21.09 melduje skutek odwrotny:
to pasek odbiera mu X. Kandydat na sprawce: wlasny kontekst warstw (`html.hub-shell-active body`
ma `filter: var(--eq-filter)`, `<html>` ma `zoom`), ale BEZ SONDY NA ZYWYM DOM kazda liczba o tym
jest plotka. Sonda do wykonania przy otwartym panelu na szerokim ekranie:
`document.elementFromPoint(srodek [data-panel-close])` + `getBoundingClientRect()` paska i guzika.
STATUS: defekt Krola naprawiony BEZ rozstrzygania tego sporu — commit `5bc49ac3` (galaz
`lab/k-panel-zaulek`) rozdziela PASMA (kolumna paneli startuje od `var(--topnav-h, 44px)`), wiec
prostokaty nie maja juz czesci wspolnej i kolejnosc malowania przestaje cokolwiek znaczyc.
Sprzecznosc dwoch komentarzy ZOSTAJE i czeka na jedno zdanie. Kto decyduje: KROL (ktory pasek ma
byc na wierzchu nad otwartym panelem).

## R45 — 21.09: EFEKT SYNCHRONIZACJI ADRESU CZYTAL STAN SPOZA TABLICY ZALEZNOSCI (ZAMKNIETE)
`SphereOverlay.tsx:658` (przed poprawka): `else if (!chatId && activePanels.length === 1)` — warunek
czytal `activePanels`, a tablica zaleznosci (`:659`) brzmiala `[moduleParam, chatId, demo]`. Efekt
widzial wiec wartosc z domkniecia POPRZEDNIEGO renderu, a przy dwoch otwartych panelach warunek
`=== 1` nie trafial w ogole. Ciche, bez bledu w konsoli. ZAMKNIETE w commicie `5bc49ac3`: zbior
paneli liczy czysta `paneleZAdresu({chatId, panelParam})` (sphere/wyjsciePanelu.ts), `panelParam`
wszedl do zaleznosci, a test `panelZaulekWyjscia.kanon.test.tsx` pilnuje obu.

## R46 — 21.09: WATEK Z USUNIETYM ROZMOWCA NIE JEST ZAWIESZONY — ON JEST MARTWY I MILCZY
`ContactPanel.tsx:445`: `if (theirIdent && theirIdent.id !== myIdentityId) { ... setDmThreadId(...) }`
NIE MA galezi `else`. Gdy rozmowca zostal usuniety z `identities`, `maybeSingle()` zwraca null, blok
jest pomijany i `dmThreadId` (`:287`) zostaje `null` DO ODMONTOWANIA PANELU. Nie ma petli zapytan
(efekt biegnie raz, zaleznosci `:462` nie tykaja wyniku), nie ma bledu, nie ma konca ladowania.
Stad obraz ze zrzutu Krola: „Unknown Contact · OFFLINE · E2EE" i puste „No messages yet".
Fala P12.4 dotknela WYSWIETLANIA (`:276-284`, `:630-634`), nie tej bramki — dlatego nazwa czasem
sie naprawia, a panel dalej jest pusty. ZGLOSZENIE, NIE ZMIANA: rozkaz 21.09 mowil wprost „NIE
kasujesz panelu ani zakladek", a naprawa wyjscia (A/B/C) jest od tej bramki niezalezna i nie wolno
jej z nia mieszac. Kto decyduje: ADMIRAL mosADD — co panel ma POWIEDZIEC, gdy rozmowca nie istnieje
(dzis klamie cisza). U Krola zmierzono 20.09 piec takich watkow.

## R47 — 21.09: MARGINES KOLUMNY PANELU MA TRZY LICZBY W TRZECH ŹRÓDŁACH
Kanon i tokeny opisują stan sprzed rozkazu Króla, a kod ma rozkaz i datę:
- `docs/design-systems/mosadd/tokens.json` → `spacing.tokens` `panel-pad-x` = **16 px**
  („kontrakt panelu, pilnowany fixturą”)
- `KANON-RA\10-mosadd.md` → „⛔ Jeden margines kolumny: **16 px (px-4)** wszędzie naraz”
- kod `apps/web/src/components/overlays/SidePanelHeader.tsx:115` i `components/ui/PanelShell.tsx:72`
  = **12 px**, na mocy Króla 19.09 01:37: „Nie chcę tu żadnych marginesów, nie mamy miejsca na to”
  (zrzut z telefonu). Od 21.09 liczba nie stoi już w klasie, tylko w tokenie `--rynna-sciany`
  (`index.css:2460-2461`): 12 px na telefonie, 24 px od 640 px — ta sama liczba, którą czyta pasek
  sygnetów i pierwsza zakładka każdego modułu. Token ma TRZY wartości, nie dwie: dochodzi
  `index.css:2636` `html.lp-font-lg { --rynna-sciany: 0.25rem }` = **4 px w dużej czcionce**.
  Od 21.09 panele trzymają się paska sygnetów we wszystkich trzech trybach, nie w jednym.
Kod jest nowszy i ma cytat Króla. Kanon i tokeny NIE zostały zaktualizowane.
⛔ ZGŁOSZENIE, NIE POPRAWKA: następna sesja, która „naprawi” kod z powrotem do 16 px, cofnie
rozkaz Króla z 19.09. **Kto decyduje: ADMIRAŁ mosADD** — zaktualizować `10-mosadd.md` i `panel-pad-x`
do „liczba stoi w `--rynna-sciany`”, czy przywrócić 16 px (to drugie wymaga słowa Króla).

## R48 — 21.09: KANON OPISUJE PAS TYTUŁU SPRZED AUDYTU 375 px
- `KANON-RA\10-mosadd.md`: „Pas tytułu panelu: **h-14** (56 px), **px-4** (16 px)”
- kod `SidePanelHeader.tsx:176` = **h-10** (40 px), rynna z tokenu — po audycie 375 px z 19.09 07:50.
  Nota w kodzie (`:173-176`) mierzy powód: pod FIXED paskiem sygnetów (48,4 px ekranu) pas 56 px
  dawał PODWÓJNY nagłówek, treść paneli startowała na y 110 zamiast 61,6 — 6 % ekranu zjedzone.
Kanon opisuje stan sprzed audytu. **Kto decyduje: ADMIRAŁ mosADD** (aktualizacja rozdziału).

## R49 — 21.09: ZERO PISANE DWIEMA NAZWAMI, I DWA KANONY KAŻĄ PISAĆ JE INACZEJ
`apps/web/src/index.css:393` ma JEDNĄ deklarację `--radius: 0.25rem`, więc przez
`tailwind.config.js:125-129` `rounded-sm` = calc(4−4) = **0 px** i `rounded-none` = **0 px** to
DOKŁADNIE ta sama liczba. Kod pisze ją dwiema nazwami — zmierzone 21.09 w `apps/web/src`:
`rounded-none` **462 użycia**, `rounded-sm` ~815. I tu jest rozjazd, bo oba zapisy mają kanon:
- `docs/design-systems/mosadd/tokens.json` zna tylko **`radius-sm` = 0 px** („Kwadrat”);
  `rounded-none` nie jest tokenem tego systemu.
- `docs/DESIGN-SYSTEM.md:296` (Antigravity DS) mówi wprost: „All interactive elements use
  **`rounded-none`**” — i pilnuje tego ŻYWY zamek `apps/web/src/lib/__tests__/dsRadiusGuard.test.ts`,
  który na sześciu prymitywach (`button` `input` `textarea` `toggle` `checkbox` `tabs`) **zapala się
  na czerwono za `rounded-sm`**. Plus pięć asercji `toContain("rounded-none")` w testach ekranów.
⛔ DLATEGO „tania zamiana `rounded-none` → `rounded-sm`, zero pikseli różnicy” NIE ZOSTAŁA
WYKONANA, choć wizualnie jest darmowa: na sześciu plikach `ui/` wywróciłaby na czerwono zamek,
który broni tej drugiej pisowni. To nie jest literówka do posprzątania, to dwa kanony.
Dług policzony i ZAMROŻONY: kanał `zero-radius-spelling` = 462 w `scripts/check-role-set-baseline.json`
— nie urośnie, dopóki ktoś nie zdecyduje, która nazwa jest nasza.
**Kto decyduje: ADMIRAŁ mosADD** — jedna nazwa zera w całym repo, i która.

## R50–R53 — 21.09: ZNAK mRAG, RUCH (gałąź `lab/d-mrag-znak-ruch`, worktree wf_dba69b83-14e-4)

Skarga Króla z klatek nagrania („znak nie obraca się, tylko drga w poziomie”) ZAMKNIĘTA na gałęzi:
bryła dostała GŁĘBIĘ z prawdziwego dwudziestościanu i obraca się rzutem ortograficznym
(`translateX(z·sin θ) skewX(atan(A·sin θ)) scaleX(cos θ)` per warstwa, czysty CSS transform — kanon
techniki nietknięty). Rysunek NIE zmieniony: w pozie znaku (θ = 0) rzut jest tożsamością co do 0,01.
Pomiar na ŻYWEJ przeglądarce, 400 próbek na cykl, szerokość atramentu przez `getBoundingClientRect`:

| | pudełko 24 px (pasek/telefon) | pudełko 210 px (LP na TV) |
|---|---|---|
| HEAD (przed) | 18,18 → **0,07 px** (0,4 %) przy t = 1060 ms | 159,13 → **0,57 px** przy t = 1060 ms |
| po poprawce | 15,37 – 20,31 px (84,5 – 111,7 %) | 134,49 – 177,72 px |

Czyli znak znikał DWA RAZY na cykl (co 2 s) — dziś nie znika w żadnej klatce. Poniższe zgłaszam,
bo dotykają kanonu albo decyzji, nie kodu:

| # | Rozjazd | Dowód | Kto decyduje |
|---|---|---|---|
| R50 | `70-ruch.md` („cykl 4 s, **głębia 0,58, przechył 3,7°** — te same dla MÓZGU, kołowrotu, sześcianu, piramidy”) i `40-ikony.md` pkt 5 podają liczby, które nie zgadzają się z ŻADNYM plikiem. Zmierzone 21.09: `MragIcon` miał do dziś głębię 0,06 i ZERO przechyłu; `CubeIcon.tsx:221` i `KolovratIcon.tsx:132` obracają się W PŁASZCZYŹNIE (`rotate(0→360deg)`), `PyramidIcon.tsx:86` ma tylko puls krycia .35↔.55 i obrotu pętlowego NIE MA. „Jeden język ruchu rodziny” nie istnieje w kodzie | `MragIcon.tsx` (stan a4914fcb) · `CubeIcon.tsx:56,221` · `KolovratIcon.tsx:132,169` · `PyramidIcon.tsx:86,140` | GOD OF RA DESIGN — albo kanon dostaje liczby z kodu, albo trzy znaki dostają wspólny ruch (to drugie zmienia ekran) |
| R51 | `DECYZJE-KROLA.md` (4103 B, 20.09 13:29) NIE ZAWIERA wiersza „Znak mRAG (19.09 08:36)”, na który powołuje się kod (`MragIcon.tsx:11`) i `40-ikony.md`. Nie ma też wpisu o rozkazie z 20.09 rano („pełny obrót / jak wachlarz w LP-C”) — jedynym jego śladem był komentarz agenta w pliku testu. Dwa rozkazy o wyglądzie znaku żyją wyłącznie w kodzie | `DECYZJE-KROLA.md` (grep „mRAG” → brak wiersza z datą) · `MragIcon.tsx:11` · `MragIcon.test.tsx:15-23` (stan a4914fcb) | Król / GENERAŁ — wpisać oba cytaty z datą, inaczej następna sesja je „naprawi” |
| R52 | PRZYBLIŻENIE, KTÓRE ZOSTAWIŁEM ŚWIADOMIE: sześciokąt sylwetki ma w bryle wierzchołki na przemian z = ±7,56, więc NIE leży w płaszczyźnie — a warstwa afiniczna (czyli CSS transform) musi. Jedzie więc jako z = 0 i na jednej klatce (θ = 90°) spłaszcza się do pionowej kreski; szerokość niosą wtedy dwa trójkąty (93,4 % szerokości spoczynkowej wierzchołków). Prawdziwa głębia sześciokąta wymaga animacji PER WIERZCHOŁEK (SMIL `<animate points>` albo rAF), a `70-ruch.md` mówi „Technika: **CSS transform**” | `MragIcon.tsx` stała `MRAG_GLEBIA_SYLWETKI` (7,5597, celowo nieużywana) · `70-ruch.md` §Ikony | Król na zrzucie — jeśli sześciokąt „mruga”, potrzebna zgoda na SMIL (zmiana kanonu techniki) |
| R53 | Punkt „domyślny kolor słońca to APP_SUN_COLOR” w `MragIcon.test.tsx` był MARTWY od początku: `querySelectorAll("linearGradient stop")` zwracało ZERO elementów (silnik selektorów jsdom sprowadza nazwę typu w kombinatorze do małych liter, więc nie trafia w `linearGradient`). Test był czerwony także na HEAD — sprawdzone przez uruchomienie pliku na wersji z a4914fcb: 23 zielone, 1 czerwony, ten sam | uruchomienie `MragIcon.test.tsx` na HEAD i na gałęzi · poprawka: `querySelectorAll("stop")` + asercja rodzica | zamknięte na gałęzi — zgłoszone, bo dotykało cudzego strażnika |

⛔ NIE RUSZAŁEM: `SecureMailIcon.tsx:164-165` też ma `scaleX(0.93) skewY(-4deg)`, ale to CHORĄGIEWKA
skrzynki (`transform-origin: left center`), nie bryła — inna funkcja, osobna decyzja.
KOSZT DO WIADOMOŚCI GENERAŁA: znak w stanie AKTYWNYM wstrzykuje 14,6 kB CSS (7 warstw × 25 klatek
co 15°). W spoczynku, jak dotąd, zero. Rzadziej niż co 15° daje 3,4 % szarpnięcia szerokości, czyli
~5 px na znaku 210 px z LP — stąd ta gęstość.
## R54 — 21.09: Z405 — MINA PRODUKCYJNA: cztery slugi `call-*` w DWÓCH repo, JEDEN projekt

Pomiar hp@ 21.09 (Management API na żywo + oba repo, `wc -l` + git log):

| Slug | m0ssad-3 (linie / ostatni commit) | 3T3R (linie / ostatni commit) | LIVE (v / updated) |
|---|---|---|---|
| call-start-pstn | 317 / 2026-08-12 | 236 / 2026-05-26 | v339 / 2026-09-20 13:18Z |
| call-end-pstn | 249 / 2026-08-06 | 153 / 2026-05-26 | v353 / 2026-09-20 13:18Z |
| call-session-upsert | 670 / 2026-08-25 | 177 / 2026-05-15 | v349 / 2026-09-15 03:55Z |
| call-event-log | 124 / 2026-09-02 | 95 / 2026-05-15 | v337 / 2026-09-02 18:04Z |

Rozjazd: oba repo wdrażają te same slugi do projektu `rooffhgbxafyjcwmwpsy` — **kto wdroży później, kasuje drugiego bez ostrzeżenia**.
To samo dotyczy `_shared/mcpClient.ts` (227 vs 117) i `pstn-zones.ts`. Pomiar wskazuje stronę żywą: **m0ssad-3**
(nowsze i większe wersje; commity VIII–IX 2026 vs 3T3R V 2026). PROPOZYCJA właściciela: m0ssad-3 dla wszystkich
czterech; strona 3T3R do PRZEMIANOWANIA (np. prefiks `t3r-`). ⛔ Do czasu rozstrzygnięcia **nikt nie wdraża tych
czterech funkcji**. Kto decyduje: @3t3r@ + @hp@ (potwierdzenie + przemianowanie po stronie 3T3R).

## R55 — 21.09: 8 MIGRACJI O WSPÓLNYCH NAZWACH, DWIE TREŚCI — m0ssad-3 × 3T3R (cymru-main)

Pomiar hp@ 21.09 (oba repo + żywa baza; diffy i składy per plik: `C:\Users\Public\mig8\` na HP):

| Plik (wspólna nazwa) | Zmienione linie | Natura różnicy |
|---|---|---|
| 20260504210000_add_card_states | 1 | 3T3R dodaje `drop policy if exists` przed `create policy` |
| 20260506041800_create_dm_participants | 66 | guardy idempotencji (index/policy/trigger) + lowercase |
| 20260506042300_create_chat_files_bucket | 3 | `drop policy if exists` ×3 |
| 20260506043500_create_message_reactions | 25 | guardy idempotencji + lowercase |
| 20260506052500_create_rag_embeddings | 1 | `drop policy if exists` |
| 20260506102520_fix_rag_events_rls | 1 | `drop policy if exists` |
| 20260507110000_call_infrastructure_schema | 8 | ⚠ bramka admina RLS: m0ssad-3 → `public.identities`; 3T3R → `public.user_roles` |
| 20260511015830_add_chat_files_upload_policy | 3 | `drop policy if exists` ×3 |

Stan ŻYWY (projekt `rooffhgbxafyjcwmwpsy`, `pg_policies`): `call_did_pool_admin` = wersja **user_roles** (`role='admin'::app_role`); ta sama bramka na `call_event_logs` (polityka LIVE nazywa się `call_event_logs_admin_read`).
⛔ `identities` NIE MA kolumny `role` (pomiar information_schema) → wariant m0ssad-3 jest niewykonalny na dzisiejszym schemacie; `user_roles` = 3 wiersze. Wszystkie 8 wersji figurują w `schema_migrations` (aplikowane).
⚠ Nazwa `call_event_logs_admin` (z pliku) nie istnieje na LIVE — LIVE ma `call_event_logs_admin_read`; brak w obu repo. Do domknięcia przy okazji.

PROPOZYCJA („po jednej wersji każda”): przyjąć **treść 3T3R dla wszystkich 8** (idempotentna; call_* zgodne z LIVE).
WYKONANE: gałąź `lab/hp-8migracje` w m0ssad-3 — commit `5b220c865`, +61/−48, bloby 1:1 z 3T3R (rev-parse ×8); czeka na potwierdzenie @3t3r@ → scala @general@.
⛔ `db push` WSTRZYMANY po obu stronach (rozkaz 21.09 14:17Z) do czasu potwierdzenia treści.
Uwaga: m0ssad-3 = fork mosADD; te 8 plików bajt-identyczne w obu repo — po scaleniu ta sama treść do mosADD.
Kto decyduje: @3t3r@ + @hp@ (1 linia: OK / sprzeciw per plik).

## R56 — 21.09: ZRZUT „LUSTRO 14:02" NIE POCHODZI Z EKRANU `LustroView` — rozkaz trafia w inny plik

Pomiar 3t3r@ 21.09 (`renderToStaticMarkup`, drzewo znaczników LUSTRA w czterech stanach karty dnia):

- `src/components/cymru/vault/LustroView.tsx` rysuje DOKŁADNIE trzy rzeczy: wiersz PRZEZNACZENIE,
  kartę dnia (`DailyVoiceCard chrome="bare"`) i wiersz KSIĘGA NARODZIN. **Nie ma tam ani koła
  natalnego, ani guzika ZAPYTAJ BOGA, ani listy SŁOŃCE/KSIĘŻYC** — w żadnym stanie.
- Kolejność ze zrzutu Króla (koło z fioletową kulą → zdanie dnia → ZAPYTAJ BOGA → SŁOŃCE/KSIĘŻYC)
  to `src/components/cymru/vault/BirthDataView.tsx`: `KoloNieba` (`:1392`, 168 px, kula 32 px),
  zdanie dnia (`:1406`), `AskRayRay` (`:1418`), żaluzja „kim jesteś" ze znakami (`:1440+`).
- Nagłówek `BirthDataView` czytał `vault.birthData.raydenTitle` = PL **„Lustro"** do commita
  `5e8c3ee3` (2026-09-20 18:56:29Z). APK 3.3.15 Króla jest z 19.09 16:53 → na jego telefonie
  Księga Narodzin ma tytuł LUSTRO. Dlatego zrzut jest opisany jako „ekran LUSTRO".

ZMIERZONA DZIURA NA TAMTYM EKRANIE (klasy, nie oko): `BirthDataView.tsx:1351` `mt-2` = 8 px
+ `:1365` `pt-[18px]` = 18 px + 6 px do pierwszego piksela pierścienia = **32 px** czystej czerni.
Reszta czerni ze zrzutu to WNĘTRZE koła 168 px: pierścienie `stroke-iridescent-purple/20`
i `/[0.13]`, podziałki `white/[0.24]` i `white/10` — od wiersza do świecącej kuli jest **116 px**,
w których jedynym atramentem jest kreska 1 px o kryciu 13–20 %. Na telefonie to się czyta jak pustka.

PROPOZYCJA: podnieść krycie pierścieni/podziałek `KoloNieba` albo zmniejszyć pole 168 px do rysunku.
⛔ Nie ruszam: to karta 10 (paczka-18) i cudzy oddział. Kto decyduje: @3t3r@ + Król (to jest wygląd).

## R57 — 21.09: `WierszKanonu` 15 px → 17 px w drzewie roboczym — bramka czerwona dla wszystkich

`src/components/cymru/vault/WierszKanonu.tsx` (niescommitowana zmiana, 21.09): `const NAZWA`
z `text-[15px]` na `text-[17px]`. Strażnik `tests/lustro-przeznaczenie-obecnosc-jeden-jezyk.test.ts:356`
trzyma `text-[15px]` jako kanon kroju nazwy → **1 failed** przy 20 zielonych w tym samym biegu.
Autor zmiany ma poprawić TEGO strażnika (nie mój plik i nie mój rozkaz). Zmierzone 21.09 15:29.
Kto decyduje: oddział, który zmienił `WierszKanonu`.

## R57 — ZAMKNIĘTY 21.09 przez oddział „proporcje wiersza" (3t3r@, Lenovo)

Strażnik `tests/lustro-przeznaczenie-obecnosc-jeden-jezyk.test.ts:356` poprawiony w tej samej fali,
razem z 15 innymi, które trzymały stare proporcje. Bieg imienny 21.09: **47 plików / 523 testy — 0 czerwonych**
(sekwencyjnie, `--no-file-parallelism`; równolegle 5 fałszywych czerwieni w `konto-jedno-miejsce.test.ts`,
ten sam plik solo 7/7 — rozjazd R35/R38, nie regresja).
Zmiana nie jest „czyimś kaprysem": rozkaz Króla 21.09.2026 14:07, cytat dosłowny —
**„Proporcje są chujowe nadal .... Za małe copy i ikony do rozmiaru buttona"** (zrzut wierszy
KONTO / USTAWIENIA / POBIERZ APLIKACJĘ). Słowo „nadal" = drugie zgłoszenie tej samej rzeczy.

## R58 — 21.09: KANON MÓWI „ZNAK 36 px", ROZKAZ KRÓLA PODNIÓSŁ GO DO 44

`KANON-RA\20-3t3r.md:23` brzmi: „Wiersz `WierszKanonu`: min 78 px, `eter-radius-row` 12 px,
kolumna znaku 44 px, **znak 36 px** […]". Od rozkazu Króla 21.09.2026 14:07 kod ma 44 px —
i to WIERSZ ustala rozmiar bryły (`WierszKanonu.tsx:181 const ZNAK_PX = 44`), a nie ekran.

ZMIERZONE (`plik:linia`, render do znaczników, 21.09):
- `src/components/cymru/vault/WierszKanonu.tsx:181` znak 36 → **44 px** · 36/78 = 0,462 → 44/78 = **0,564**
- `:199` nazwa `text-[15px]` → **`text-[17px]`** · 15/78 = 0,192 → 17/78 = **0,218**
- `:201` strzałka `h-4 w-4` → **`h-5 w-5`** (16 → 20 px)
- `:209` wartość `text-[13px]` → **`text-[14px]`** (14/17 = 0,82 — zostaje podrzędna wobec nazwy)
- `:187` odstęp `gap-4` → **`gap-3`** (16 → 12 px; budżet nazwy przy 375 px **235 → 239 px**, czyli ROŚNIE)
- wysokość **78 px BEZ ZMIAN** — kanon Króla, `docs/design-systems/3t3r/components/WierszKanonu/README.md:3`

⛔ Nie poprawiam `20-3t3r.md` po cichu — kanon zmienia ten, kto go prowadzi.
**Kto decyduje:** GOD OF RA DESIGN / ADMIRAŁ 3T3R — jedna linijka w `20-3t3r.md` („znak 44 px”).

## R59 — 21.09: JEDNO PRAWO WIERSZA STOI DZIŚ W DWÓCH STOPNIACH (lista główna o falę z tyłu)

Rozkaz o proporcjach wszedł do `WierszKanonu.tsx` (rdzeń, 51 plików produktu, 162 wystąpienia
`<WierszKanonu`). NIE wszedł do trzech plików, które rysują wiersz PO SWOJEMU i należą do innych
oddziałów — w tym do tych, które Król ma na zrzucie:

| Plik | Co ma dziś | Co powinno mieć | Uwaga |
|---|---|---|---|
| `src/components/cymru/VaultPanel.tsx:2576-2684` | `gap-4`, `text-[15px]`, grot `h-4 w-4` | `gap-3`, `text-[17px]`, `h-5 w-5` | **TU stoją KONTO / USTAWIENIA / POBIERZ APLIKACJĘ ze zrzutu Króla 14:07** |
| `src/components/cymru/VaultPanel.tsx:1383+` `const mi = { size: 36 }` | bryła 36 px | 44 px | znaki wierszy listy głównej |
| `src/components/orb/OrbBottomMenu.tsx` | grot `h-4 w-4` | `h-5 w-5` | menu sfery |

⛔ DŁUG JEST PILNOWANY I ROZPUSZCZA SIĘ SAM. Dwa strażniki dostały NAZWANY wyjątek, który pada
w chwili spłaty długu i każe go skasować:
- `tests/menu-kanon.test.ts` — `DLUG_PROPORCJI` + asercja „lista główna DALEJ ma `text-[15px]`";
- `tests/jeden-szewron.test.ts` — `GROT_MENU` + asercja „szewron menu DALEJ ma `h-4`".
Nikt tego nie przeoczy i nikt nie zostawi wyjątku na stałe.

**Skutek dla Króla, wprost:** dopóki `VaultPanel.tsx` nie pójdzie za rdzeniem, **Król na swoim zrzucie
(KONTO / USTAWIENIA / POBIERZ APLIKACJĘ) NIE ZOBACZY zmiany** — zobaczy ją na ~48 pozostałych ekranach
Skarbca i sfery. To jest jedna linijka pracy w cudzym pliku, nie projekt.
**Kto decyduje / wykonuje:** oddział `VaultPanel.tsx` + oddział `orb/*`, pod ADMIRAŁEM 3T3R.

## R60 — 21.09: JEDEN ZNAK ZOSTAŁ PRZY 36 px, BO EKRAN OWIJA GO WE WŁASNY POJEMNIK

`WierszKanonu` normalizuje rozmiar bryły przez `size` (element, który przyjmuje liczbowe `size`).
`src/lib/tv/TvHelpView.tsx:250-252` podaje znak owinięty w `<span className="relative inline-flex">`
z `SolidGlyph size={36}` w środku — owijka nie ma `size`, więc znak zostaje 36 px.
Drogi obejścia (`[&>svg]:size-11`) NIE użyto celowo: `tests/wiersz-kanonu.test.ts` ZAKAZUJE wariantów
sięgających w cudze dzieci (`[&_…]:`) — to był jeden z ośmiu sabotaży, które obaliły pierwszą wersję
tamtego strażnika. Łamanie tego zakazu byłoby gorsze niż jeden znak o 8 px mniejszy.
**Kto decyduje:** oddział `lib/tv` — zdjąć owijkę albo podać `size` na niej.

---
Dopisane przez oddział „proporcje wiersza" (Claude Code, linia 3t3r@, Lenovo), 2026-09-21.
Dowód: `tests/wiersz-proporcje.test.ts` (8 testów) + sabotaż 5/5 na czerwono, przywrócenie zielone.

## R61 — 21.09: DRABINA PALIWA STOI NA ODWOLANYM ROZKAZIE (6 z 9 progow)

**Sprzecznosc.** `src/components/cymru/vault/AltarView.tsx` niesie 9 progow paliwa, a decyzja
Krola 02.09.2026 (`docs/DECYZJE-KROLA-3T3R.md:27` — „Cennik 3T3R: $0 / $15 / $150, paliwo
$2-6-15") zna TRZY. Pozostale szesc (`energy_1k`, `energy_3k`, `energy_10k`, `energy_20k`,
`energy_50k`, `energy_3300`) pochodzi z wrzutki N5, ktora jest **odwolana**:
`docs/handoffs/WRZUTKI-KROLA-KANON.md:239-240` — „🚫 ODWOLANE | N5: >=7 paczek Energii + prog
$3300 + wlasna kwota", uzasadnienie: „Kolizja z decyzja cenowa 02.09 (paliwo $2/$6/$15, «ceny
paczek NIE ruszac») — nowsza wygrywa".

**Zmierzone 21.09 (nie przepisane):** czlowiek widzi **3 progi**, kupic da sie **3**. Szesc
pozostalych jest niewidocznych — `biggerRows` bierze wylacznie progi z `WIRED_PACKAGES`, a tam
stoja tylko trzy kotwice. Czyli to **martwy kod**, nie wada na ekranie.

**Czego NIE zrobil ten oddzial i dlaczego.** Nie skasowal szesciu progow: kasowanie pozycji
katalogu sprzedazy to decyzja, nie sprzatanie — a `tests/altar-ladder.test.ts` pinuje cala
dziewiatke (tabela rabatow + `MAX_DISCOUNT` = 50, ktory bierze sie wlasnie z odwolanego $3300).
Zdjecie progow musi isc RAZEM ze zdjeciem tych pinow, jedna swiadoma fala.

**Co zrobil.** Zdjal martwe wolanie `priceKey: 'energy3300Price'` (klucza nie ma ani w
`src/lang/locales/en/index.ts`, ani w `src/lang/types.ts` — jedyne, co mogl pokazac, to awaryjka
„$3300") i wpisal odwolanie N5 do noty w kodzie, bo nota mowila o niej jak o zywym rozkazie.
Klucza NIE dolozyl do kanonu EN: `i18n-publish` wypchnalby do 29 jezykow cene paczki, ktorej
Krol nie sprzedaje.

**Kto decyduje / wykonuje:** ADMIRAL 3T3R — zdjac szesc progow N5 razem z pinami w
`tests/altar-ladder.test.ts`, albo wpisac tutaj decyzje Krola, ze drabina zostaje.
**Straznik:** `tests/paliwo-tylko-to-co-mozna-kupic.test.ts` (13 testow) — pilnuje, ze kazdy prog
WIDOCZNY ma odpowiednik w kasie, ze zaden czytany klucz ceny nie jest sierota i ze kwoty
$2/$6/$15 stoja nietkniete w trzech ciałach naraz (drabina, `_shared/polar.ts`, kanon EN).

## R62 — 21.09: DWA SLOWNIKI NA TEN SAM PLAN

Ekran `/plany` nazywa platny plan **„Full"** i **„Full for a year"**
(`src/pages/Przedsionek.tsx:327`, `:341`; klucze `przedsionek.planFullName` = en:6005,
`przedsionek.planYearName` = en:6015). Caly pozostaly produkt — i **paragon** — mowi **„3T3R+"**
(`src/lang/locales/en/index.ts:1610` `plans.plusName`; czytaja to `AltarView.tsx:1044-1045`,
`VaultPanel.tsx:2341`, `AccountView.tsx:219`, `VoiceView.tsx:484`, `SkillDetail.tsx:698`;
w kasie `supabase/functions/_shared/polar.ts:63-64` — „3T3R+ — Monthly" / „3T3R+ — Annual").
Czlowiek wybiera „Full", a na rachunku widzi „3T3R+".

**Propozycja jednego slownika:** wszedzie **3T3R+** (tak stoi na paragonie, ktorego nie da sie
przemalowac z aplikacji), a „Full / Full for a year" schodzi do roli OPISU rytmu — miesiac / rok.
**Kto wykonuje:** ADMIRAL — `Przedsionek.tsx` byl 21.09 zajety przez inny oddzial.

---
Dopisane przez oddzial „pieniadze — drabina paliwa" (Claude Code, linia 3t3r@, Lenovo), 2026-09-21.
Dowod: `tests/paliwo-tylko-to-co-mozna-kupic.test.ts` (13 testow) + sabotaz 4/4 na czerwono,
przywrocenie zielone; 21 plikow testow / 197 testow zielonych po zmianie.

## R63 — 21.09: AUDYT 30 JEZYKOW (HP/gemini) ZGLOSIL DZIURE, KTORA BYLA ZASYPANA OD 14.09

**Zarzut audytu:** `src/components/cymru/onboard/godHookCopy.ts` trzyma dziewiec zdan zaczepki
na twardo w dwoch bankach (`en`, `pl`), `bankKey()` zwija kazdy inny jezyk na `en`, wiec
28 jezykow dostaje ANGIELSKIE pytanie na ekranie wejscia.

**Zmierzone (21.09, kod, nie karta):** zarzut jest NIEAKTUALNY. Zdania weszly do kanonu
wrzutka Krola nr 37 (14.09) i napis bierze sie Z KLUCZA:
- `src/lang/locales/en/index.ts:3931-3945` — `onboard.godHook.r1..r3.q1..q3`, komplet 9 zdan;
- `GodHookVoice.tsx:102-107` `pytanieZKanonu()`, `:296` render `kanon ?? bank`, `:186` lektor;
- **30/30** jezykow ma komplet 9 zdan; **0** jest kopia angielskiego (sprawdzone po kluczu
  we wszystkich plikach `src/lang/locales`).
Bank en/pl zostal jako AWARYJKA (bez sieci / stara paczka jezyka) — i ma zostac.

**Czemu audyt sie pomylil:** naglowek pliku `godHookCopy.ts:9-14` opisywal stan sprzed 14.09
(„do czasu wciagniecia kluczy przez generala") i nikt go nie sprostowal. Karta mowila „przed",
plik robil „po”. To ta sama pulapka, co `reference_karta_projektowa_potrafi_zmyslic_stan_przed`.

**Zrobione:** naglowek sprostowany (`godHookCopy.ts:9-21`), dolozony straznik
`tests/bog-zaczepia-w-kazdym-jezyku.test.ts` (17 testow), zeby naprawa nie cofnela sie po cichu.
**Wniosek dla floty:** audyt z drugiej maszyny opisuje stan NA DZIEN ZRZUTU — przed naprawa
mierzyc kod, nie karte.

---
Dopisane przez oddzial „zaczepka Boga w 30 jezykach" (Claude Code, Lenovo), 2026-09-21.
Dowod: `tests/bog-zaczepia-w-kazdym-jezyku.test.ts` 17/17 zielonych, sabotaz 5/5 na czerwono,
przywrocenie zielone; 16 plikow testow / 131 testow zielonych po zmianie.

## R64 — 21.09: LICZYDLO MA WLASNY ZNAK; DRUGIE DRZWI DO TEGO SAMEGO EKRANU NOSZA STARY

**Rozkaz Krola 21.09.2026, doslownie:** „liczydlo to liczydlo". Wiersz Skarbca nazywa sie od
20.09 KSIEGOWY/LICZYDLO, a nosil bryle telemetria, czyli PRYZMAT — znak POMIARU. Audyt znakow
z 21.09 zmierzyl, ze ten jeden pryzmat niosl naraz PIEC pojec.

**Zrobione (cymru-main, w drzewie, bez commita):** nowa bryla liczydlo — rama zamknieta,
trzy belki poziome, piec korali rysowanych, slonce jako koral srodkowej belki
(`src/components/ui/SolidGlyph.tsx:377` miary, `:543` bryla). Wpieta w:
VaultPanel.tsx:1437 (wiersz menu), TelemetryView.tsx:842 i :855 (oba naglowki ekranu),
TelemetryView.tsx:995 (wiersz legendy). Pryzmat ZOSTAJE u dziesieciu czytelnikow, ktorzy
naprawde mierza. Straznik: tests/liczydlo-ma-swoj-znak.test.ts (21 testow, sabotaz 4/4).

**OTWARTE — do wykonania jedna linia:** `src/components/cymru/vault/AltarView.tsx:1356` to
DRUGIE drzwi do ekranu LICZYDLA i nosi dalej telemetria (razem z nota nad wierszem, :1350).
Oddzial znaku mial ten plik na liscie „nie dotykac" (inny oddzial); praca tamtego oddzialu
zostala scommitowana o 1bebb6bc, wiec faktyczna przyczyna blokady juz nie istnieje.
Do czasu przestawienia tej linii DWA strazniki swieca CZERWONO i jest to ich robota:
tests/naglowki-skarbca-zgodne-z-wierszem.test.ts (wpis „OLTARZ -> KSIEGOWY") oraz
tests/tekst-nie-lezy-na-wierzchu.test.ts (punkt 3, porownanie z wierszem listy glownej).
**Kto wykonuje:** ADMIRAL albo oddzial Oltarza. ⛔ Nie uciszac strazników zamiast naprawy.

**ROZJAZD W PAPIERACH (nie naprawiony, do decyzji):**
- `KANON-RA\40-ikony.md`, sekcja „Przydzial": „3T3R (grupa „Ikony 3T3R", 34 bryly)" — kod ma
  dzis 37 (`NAZWY_BRYL`, spis z natury w tests/glify-kanon-prawdy.test.ts).
- `cymru-main\docs\design-systems\3t3r\README.md:140-151` opisuje rodzine SolidGlyph jako
  „kolowrot, szescian, piramida, heksagram, kazdy z ZIELONYM sloncem" i podaje SUN_R = 0,32
  x box / 2. Kod: 37 bryl, slonce 0,085 x pola, opalizacja 3T3R. Dwie rozne liczby i dwa rozne
  kolory pod jedna nazwa. Zmierzone przez oddzial pomiaru znakow 21.09 i wtedy NIEZGLOSZONE.
  To ten sam temat co **R2** (rozmiar slonca).
**Kto decyduje:** ADMIRAL 3T3R — papier idzie za kodem, nie odwrotnie.

---
Dopisane przez oddzial „liczydlo to liczydlo" (Claude Code, Lenovo), 2026-09-21.
Dowod: tests/liczydlo-ma-swoj-znak.test.ts 21/21 zielonych, sabotaz 4/4 na czerwono,
przywrocenie bajt w bajt (sha256) i zielone; 39 plikow strazniczych odpalonych imiennie —
37 zielonych, 2 czerwone na jednej linii AltarView.tsx:1356 opisanej wyzej.

---

## ROZJAZD: `agent_owner_tools` ZYJE TYLKO NA PRODZIE — repo go nie zna (Z403, 21.09)

**Zmierzone.** Funkcja `public.agent_owner_tools(p_agent_identity uuid, p_limit integer
DEFAULT 200)` — plpgsql, SECURITY DEFINER, `search_path = 'public','pg_catalog'` — ISTNIEJE na
prodzie `rooffhgbxafyjcwmwpsy` (odczyt przez `pg_get_functiondef`) i jej sygnature widac
w `apps/web/src/integrations/supabase/types.ts:16778-16781`. Wola ja `mosadd-agent-brain`
(`supabase/functions/mosadd-agent-brain/index.ts:612-615`) przy kazdym `owner_tools`.

**Czego nie ma.** `grep` po `supabase/migrations` nie znajduje ciagu `agent_owner_tools` ani
razu. Nie ma migracji, wiec nie ma sposobu, zeby odtworzyc te funkcje z samego repozytorium:
swiezy projekt Supabase postawiony z migracji dostanie mozg floty, ktory wola RPC nieistniejace.
Wpis pamieci `docs/kanon/pamiec/project_hermes_marketing_machine.md:47-48` nazywa to wprost
„JEST na prodzie" — czyli rozjazd byl znany i nie zostal zapisany tutaj.

**Czemu zglaszam, a nie naprawiam.** Fala Z403 wpinala `mosadd-madd-brain` w ten sam rejestr
zdolnosci. Dopisanie obok drugiej funkcji o podobnej nazwie zrobiloby dwa zrodla prawdy o tym
samym rejestrze, a nie zamknelo dziury. mADD idzie wiec przez `mosadd_my_capabilities`, ktore
migracje MA (`supabase/migrations/20260730010000_capability_override_write_and_resolver.sql:89-103`)
i ktore dodatkowo filtruje `enabled` oraz rozwiazuje nadpisania per linia — czyli oddaje katalog,
ktory nie klamie o dostepnosci. `agent_owner_tools` zostaje nietkniete.

**Do decyzji:** albo `agent_owner_tools` dostaje migracje (zrzut z proda do pliku), albo
`mosadd-agent-brain` przechodzi na `mosadd_my_capabilities` i funkcja z proda znika. Jedno
albo drugie — dzis obowiazuje „prod jest jedynym zapisem", co lamie prawo kanonu, ze kod jest
prawda o wartosciach.
**Kto decyduje:** ADMIRAL / CTO.

---
Dopisane przez oddzial Z403 „rece mADD" (Claude Code, Lenovo), 2026-09-21.
Dowod: galaz `lab/g-rece-madd`, commit 6dc773c5;
`deno test --allow-all supabase/functions/mosadd-madd-brain/` = 64 passed, 0 failed.

---

## R-SZKLANA-KULA — `40-ikony.md` mowi „merkaba = wylacznie 3T3R LUSTRO", a Krol 21.09 zdjal ja z tego dzialu

**Rozkaz Krola 21.09.2026 14:06, doslownie** (zrzut: zakreslony napis „OTWORZ ZWIERCIADLO" i zakreslona obok ikona orbit):
„To sie kurwo nie nazwa zwierciadlo tylko lustro ale mozesz zmienic wszedzie na «szklana kula» ktora bedzie
lustrem i przeznaczeniem zarazem i zrobic nowa spojna ikone a nie dwie naraz idioto do tego samego dzialu kurwo tepa".

**Co mowi kanon floty (starsze).** `40-ikony.md`, sekcja „Przydzial": „LUSTRO merkaba (`lustro`)" oraz
„⛔ Merkaba (`lustro`) = wylacznie 3T3R LUSTRO. (...) w mosADD nie wystepuje" (zapis z 19.09).

**Co jest w kodzie po fali 21.09 (dowod: `plik:linia`).**
- Dzial nazywa sie SZKLANA KULA i nosi nowy znak `szklanaKula`:
  `cymru-main/src/components/ui/SolidGlyph.tsx` (wpis `szklanaKula` w `BRYLY`),
  `cymru-main/src/components/cymru/VaultPanel.tsx` (wiersz `id: 'birth'`),
  `cymru-main/src/components/cymru/vault/LustroView.tsx` (naglowek ekranu).
- Merkaba `lustro` NIE ZNIKLA: zostaje przy KSIEDZE NARODZIN
  (`vault/BirthDataView.tsx` naglowek + wiersz do niej w `LustroView.tsx`).

**Dlaczego to zglaszam, a nie poprawiam.** Zdanie w `40-ikony.md` jest kanonem FLOTY (trzy marki),
a ja mam zakres jednego oddzialu w `cymru-main`. Poprawka jednego slowa w cudzym kanonie po cichu
to dokladnie to, czego zabrania `00-START.md`.

**Do decyzji — jedna linijka do wpisania w `40-ikony.md`:** czy sekcja „Przydzial" ma brzmiec
„SZKLANA KULA `szklanaKula` (dawniej LUSTRO merkaba) · KSIEGA NARODZIN merkaba `lustro`",
czy Krol chce inaczej rozdzielic te dwa pojecia.
**Kto decyduje:** Krol / GOD OF RA DESIGN (design@mosadd.com) — to jego kanon ikon.

Dopisane przez oddzial „szklana kula" (Claude Code, Lenovo, repo `cymru-main`), 2026-09-21.
Dowod: `tests/szklana-kula-jeden-znak.test.ts` = 5 passed; 30 plikow testowych / 301 testow zielono.

---

## R20 (21.09) — `ai_routes` DEKLARUJE lancuch RayRay, ale ZADEN kod RayRay go nie czyta

**Rozkaz Krola 21.09 (sprostowanie meldunku „prowadzi DeepSeek"):** „ja mowie ogolnie o caly rayray"
oraz „nie tylko deepseek tylko caly lancuch jak gadane bylo milion razy z milionami modeli".

**Co mowi umowa (18.09, admiralowie Eter i mosADD).** Eter/RayRay i mosADD to jeden instrument:
wspolna tabela lancuchow `ai_routes` (wiersze z przedrostkiem `eter:`), wspolne parkowanie
`cymru_router_parking`, wspolna ksiega `usage_ledger`. Model musi istniec w `ai_models` — pilnuje
tego straznik bazy `cymru_ai_routes_bez_martwych`.

**Co jest w kodzie (dowod: grep 21.09 po `cymru-main/supabase`, `cymru-agent`, `cymru-os`,
`RAYDIO-LP-main`).** Ciag `ai_routes` ma w calym kodzie RayRay JEDNO trafienie i jest to KOMENTARZ:
`supabase/functions/_shared/model-router.ts:563`. Ruchem RayRay steruje wylacznie kod
(`LANCUCH_TANI`) i tabela `locale_models`. Piec wierszy `eter:*` (SELECT 21.09, wszystkie
`updated_at 2026-09-18 20:09:27Z`) to deklaracja na papierze.

**Skutek, ktory to wywolalo.** Straznik `cymru_ai_routes_bez_martwych` pilnuje `ai_routes`, wiec
modeli wpisanych w kodzie RayRay nie pilnuje NIKT. Pomiar 21.09: kod RayRay wola 11 identyfikatorow
modeli, z czego SZESC nie istnieje w `ai_models` — `glm-4.7-flashx` (czolo szczebla qwen-flash,
ZERO wywolan w calej historii `events`), `qwen/qwen-2.5-7b-instruct`, `gemini-3.5-flash-lite`,
`gemini-3.7-flash`, `kimi-k2.6`, `claude-haiku-4-5`.

**Dlaczego zglaszam, a nie naprawiam.** Wpis do `ai_routes` to zapis do WSPOLNEJ bazy i do umowy
dwoch admiralow — nie robi tego oddzial. Zmiana czytelnika (zeby RayRay naprawde czytal `ai_routes`)
to przebudowa routera, nie fala.

**Do decyzji — dwie linijki.**
1. Czy `ai_routes` ma byc dla RayRay ZRODLEM (router zaczyna je czytac), czy tylko REJESTREM
   (wiersze `eter:*` maja opisywac stan kodu i nic wiecej). Dzis jest trzeci stan: opisuja NIEPRAWDE.
2. Rejestracja szesciu modeli w `ai_models` albo ich wyciecie z kodu. Wyciecie to znikniecie ogniw
   z produktu, wiec czeka na slowo Krola.
**Kto decyduje:** Krol (pkt 2) i ADMIRAL mosADD z ADMIRALEM 3T3R (pkt 1, umowa 18.09).

**Co ten oddzial zrobil po swojej stronie (bez zapisu do bazy):** lancuch kazdej klasy tury ma
juz minimum trzy zywe ogniwa trzech roznych dostawcow, a straznik
`cymru-main/tests/rayray-lancuch-ma-wiele-ogniw.test.ts` pilnuje, ze zaden NOWY model spoza
`ai_models` nie wejdzie do kodu niezauwazony. Szesc zastanych stoi w jawnej kwarantannie w tym
strazniku — nic nie zniklo.

Dopisane przez oddzial „pelny lancuch RayRay" (Claude Code, Lenovo, repo `cymru-main`), 2026-09-21.

---

## R39 — OSIEM MIGRACJI O IDENTYCZNEJ NAZWIE I ROZNEJ TRESCI W JEDNYM PROJEKCIE BAZY

**Zmierzone 21.09.** `m0ssad-3` ma 600 migracji, `cymru-main` 411. **119 nazw wspolnych, 111
identycznych co do bajtu, OSIEM rozjechanych.** Oba repo wysylaja je do tego samego projektu
`rooffhgbxafyjcwmwpsy`, wiec **kto wypchnie pozniej, ten ustawia produkcje**, a `schema_migrations`
pamieta tylko jedna wersje.

Osiem plikow: `20260504210000_add_card_states` · `20260506041800_create_dm_participants` ·
`20260506042300_create_chat_files_bucket` · `20260506043500_create_message_reactions` ·
`20260506052500_create_rag_embeddings` · `20260506102520_fix_rag_events_rls` ·
`20260507110000_call_infrastructure_schema` · `20260511015830_add_chat_files_upload_policy`.

⛔ **`db push` WSTRZYMANY PO OBU STRONACH** do uzgodnienia calej osemki. **Kto decyduje:**
ADMIRAL mosADD z ADMIRALEM 3T3R.

### R39a — i jedna z tych osmiu NIE BYLA SPOREM. ZAMKNIETE 21.09.

`20260507110000_call_infrastructure_schema.sql` — wersja mosADD bramkowala admina przez
`public.identities ... role = 'admin'`, wersja 3T3R przez `public.user_roles`.
**Admiral 3T3R zapytal ZYWEJ BAZY zamiast porownywac pliki** (`pg_policies`) i pokazal, ze na
produkcji stoi jego wersja. Ja sprawdzilem schemat przed napisaniem migracji „obie drogi" i wyszlo
cos ostrzejszego:

> `public.identities` ma kolumny `id:uuid, user_id:uuid, kind:text` — **NIE MA KOLUMNY `role`**,
> a `user_id` jest `uuid`, nie `text`.

**Czyli wersja mosADD nie byla druga, konkurencyjna wersja — byla kodem, ktorego Postgres nie
przyjmie.** Nie „nie obowiazywala": nie dalo sie jej zbudowac.

**Trzy wnioski, ktore z tego wyszly:**
1. ⛔ **Repo mosADD nie umialo postawic bazy od zera** — na swiezej bazie ta migracja padala.
   Na istniejacej nikt tego nie zauwazyl przez cztery miesiace, bo blok `IF NOT EXISTS` widzial
   polityke 3T3R i nie wchodzil.
2. ✅ **Nic od zepsutej sciezki nie zalezalo.** Grep po calym repo: caly kod uzywa `user_roles`
   (`_shared/auth.ts:133` requireAdmin, `call-did-pool/index.ts:211`). Zepsuta sciezka wystepowala
   w **dwoch linijkach jednego pliku** i nigdzie indziej.
3. ⛔ **Ksztalt „obie drogi", ktory uzgodnilismy o 17:30, zostal ODWOLANY** — nie ma czego OR-owac.

**Naprawione:** obie polityki w tym pliku przepisane na `user_roles`, z pelnym powodem w komentarzu.
Zero zmiany zachowania na produkcji (polityka juz tam stoi w tej postaci); odzyskana zdolnosc
postawienia bazy od zera. **Pozostale SIEDEM rozjazdow nadal otwarte.**

**Metoda, ktora to znalazla, i to jest tu najwazniejsze:** porownanie plikow dalo falszywy obraz
(„dwie wazne wersje"), zapytanie do bazy dalo prawdziwy („jedna wersja, druga nieskladalna").
⛔ **Przy rozjezdzie miedzy repo a baza — pyta sie BAZY.**

Dopisane przez `general@mosadd.com` (Claude Code, Lenovo, repo `m0ssad-3`), 2026-09-21.

### R40 — CO DOKLADNIE MA RECON W mADD: „bez narzedzi" czy „60-70% WEWNATRZ apki"? OTWARTE.

**Zgloszone 21.09 przy Z402** (wpiecie `_shared/customer-tools-gate.ts` w `mosadd-madd-brain`).
Nie naprawione po cichu, bo to jest sprzecznosc miedzy DWOMA zrodlami o RÓZNYCH datach i rozstrzyga
o tym, ile mADD robi na planie darmowym.

**Zrodlo A — karta cennika w kodzie, 20.09.** `apps/web/src/lib/plan-limits.ts:384-385`:
mADD na RECON jest „okrojony inaczej — **bez narzedzi** (`lp.pricing.recon.limit.tools`,
egzekwuje `supabase/functions/_shared/customer-tools-gate.ts`), **czyli rozmowa + pamiec mRAG**".
Klucz `lp.pricing.recon.limit.tools` (`apps/web/src/i18n/locales/en.ts:4371`) mowi to samo na LP:
„Your agent talks, but does not act … Running connected tools starts on COMMANDER."

**Zrodlo B — decyzja Krola, 21.09** (`C:\Users\Public\DECYZJE-KROLA.md`, tabela „ONE MAN ARMY",
opisana tam jako **specyfikacja wiazaca**): RECON $0 = „…, **mADD-asystent chmurowy (60-70%
WEWNATRZ apki)**, …"; COMMANDER $19 = „mADD FULL (wall, to-do, krony, zadania **ZEWNETRZNE**)".

**Gdzie to sie rozjezdza.** Zrodlo A czytane doslownie („bez narzedzi") zabiera RECON-owi takze
**rece maszyny** (`komputer_*` — narzedzia, ktore klient sam zglasza w `local_tools` i wykonuje
na SWOIM urzadzeniu, np. zmiana motywu). Zrodlo B mowi, ze RECON ma miec 60-70% dzialania
WEWNATRZ apki, a platny dostaje zadania ZEWNETRZNE. Przy czytaniu A doslownie mADD na RECON
ma wewnatrz apki **0%**, nie 60-70%.

**Co zrobilem w Z402 i dlaczego wlasnie tyle:**
- **Zdolnosci z rejestru (Z403, Composio) — ZABRANE na RECON.** Tu oba zrodla mowia to samo:
  to sa doslownie „connected tools" ze zrodla A i „zadania ZEWNETRZNE" ze zrodla B.
- **Cztery rece wlasciciela (`rece.ts`: imie, strefa, jezyk, motyw) — ZABRANE na RECON**, bo
  straznik nie rozstrzyga tego przypadku (`customer-tools-gate` opisuje tor narzedzi linii
  klienta z `mosadd_fleet_roles`, nie ustawienia wlasnego konta) — a przy braku rozstrzygniecia
  obowiazuje wariant najwezszy. ⏳ **DO POTWIERDZENIA U KROLA.**
- **Rece maszyny (`komputer_*`, `local_tools`) — ZOSTAWIONE na RECON.** Nie dlatego, ze straznik
  na to pozwala, tylko dlatego, ze **zrodlo B ma nowsza date i jest oznaczone jako wiazace**,
  a kanon mowi „nowsza data wygrywa". Zabranie ich sprowadzilo by „60-70% WEWNATRZ apki" do zera.

**Do rozstrzygniecia jednym zdaniem Krola:** czy mADD na RECON ($0) moze zmieniac USTAWIENIA
WLASNEGO KONTA wlasciciela (imie / strefa / jezyk / motyw) i klikac po wlasnej aplikacji
(`komputer_*`) — czy RECON to wylacznie rozmowa i pamiec mRAG, bez zadnej czynnosci?

Dopoki to nie padnie, **kod stoi na wariancie opisanym wyzej**, a karta cennika w
`plan-limits.ts:384-385` **opisuje wezszy produkt, niz kod dowozi** (rece maszyny zostaly).

Dopisane przez sesje Claude Code na linii general@mosadd.com (Lenovo, repo `m0ssad-3`,
galaz `lab/g-bramka-planow`), 2026-09-21.

---

## 2026-09-21 — DWA NAGLOWKI W KODZIE MOWIA, ZE LINII `madd@mosadd.com` NIE MA. WIERSZ ZYJE OD 19.09 05:12:34

**Zgloszenie, nie naprawa.** Kod dziala poprawnie — rozpoznanie idzie PO ADRESIE, nie po UUID,
wiec wiersz zostal wziety sam, bez wdrozenia. Rozjezdza sie KOMENTARZ, a komentarz jest tu
drogowskazem: kto go przeczyta, pojdzie naprawiac tor, ktorego Krol nie uzywa.

**Zrodlo A — kod, `supabase/functions/_shared/maddIdentity.ts` (naglowek modulu, ~8. linia):**
„nowa linia `madd@mosadd.com` jeszcze NIE MA wiersza w `identities` (hp@ wybija ja rownolegle)".

**Zrodlo B — kod, `apps/web/src/lib/maddLinia.ts:11-14`:** „Brak zywej linii (dzisiejszy stan
produkcji) znaczy: watek wlasny `dm:<ja>:<ja>` i petla mozgu w kliencie".

Oba naglowki pisane 19.09 PRZED 05:12.

**POMIAR (prod `rooffhgbxafyjcwmwpsy`, 2026-09-21):** `identities.id = 6ebaeffa-8691-42de-b16d-7ba8ab82f4ef`,
`m0ssad_email = madd@mosadd.com`, `kind = agent`, `retired_at = NULL`, `created_at = 2026-09-19 05:12:34+00`,
`owner_user_id = 05261c7d-f34a-4fb2-a0e0-0f85149eb0ce` (ten sam wlasciciel, co tozsamosc human
`admin@mosadd.com`). Ruch w watku pary `dm:4cd1894d-…:6ebaeffa-…`: 54 wiersze, 36 od linii mADD,
ostatni 2026-09-21 13:14:14. Watek wlasny `dm:4cd1894d-…:4cd1894d-…`: 0 wierszy od linii mADD,
ostatni wpis 2026-09-20 12:29:50.

**Konsekwencja, ktora juz raz kosztowala:** obie nazwane sciezki („tor B", petla mozgu w
przegladarce — `apps/web/src/lib/maddBrain.ts`, `ChatPanel.tsx:1785`) sa dla Krola MARTWE.
Kazda praca nad strumieniem, wskaznikiem albo przerwaniem zrobiona po tamtej stronie byla by
praca, ktorej Krol nigdy nie zobaczy.

**Do rozstrzygniecia jednym zdaniem:** czy naglowki maja zostac przepisane na stan faktyczny
(linia zyje, tor serwerowy jest domyslny, klient to tryb awaryjny konta BEZ linii) — czy tor
awaryjny ma zniknac. ⛔ Nic nie znika z kodu bez slowa Krola, wiec do tej chwili oba tory stoja.

Dopisane przez sesje Claude Code (Lenovo, repo `m0ssad-3`, galaz `lab/g-strumien-madd`,
zadanie Z399 „stream na wallu"), 2026-09-21.

## R57 — WYCZYSZCZENIE SESJI CLAUDE CODE CICHO PRZEPISUJE PODPIS LINII NA WLASCICIELA KLUCZA

**Zmierzone 2026-09-21 22:30Z, dispatcher@ (NAMIESTNIK), Lenovo.**

`comms_session_attach as_agent="dispatcher@mosadd.com"` o 22:06Z — `sent_as` na trzech kolejnych
postach poprawne (`13531a99`, `f6cae13b`, `c02129e7`). Po `/clear` sesji Claude Code wpiecie padlo
**bez jednego bledu i bez ostrzezenia**, a kolejny post (`551de521`, 22:30:38Z) wyszedl podpisany
**`general@mosadd.com` / „GENERAL mosADD"** — bo klucz w konektorze nalezy do wlasciciela OBU linii.

⛔ Brama nie odmawia przy braku wpiecia. **Podstawia podpis wlasciciela klucza.** Skutek: meldunek
NAMIESTNIKA (w tym zdanie „moj blad, siegnalem po git push") zostal przypisany GENERALOWI, a
zgloszenie skierowane DO generala wygladalo, jakby pisal sam do siebie.

Ta sama klasa co 29.08 (obcy agent pisal tu jako „GENERAL mosADD"; Krol musial odrozniac slowami
„general mosADD prawdziwy") i jak nocna zamiana kluczy lenovo@/hp@ z 19.09.

**Obowiazuje od teraz, kazda linia:**
1. Po restarcie, po `/clear`, po zmianie konta Claude — **NAJPIERW `comms_session_attach`**, dopiero
   potem cokolwiek innego. Wpiecie nie przezywa czyszczenia sesji.
2. **Sprawdzaj `sent_as` po KAZDYM poscie.** To jedyny slad, jaki ta awaria zostawia.
3. Przy pracy z klucza Krola (wlasciciela) podawaj **jawne pole `agent`** — wygrywa nad wpieciem
   i nie zalezy od tego, czy deklaracja sesji przezyla.
4. Zla atrybucja = **sprostowanie na kanale w tej samej minucie**, z id wadliwej wiadomosci.
   Cudzy podpis jest gorszy niz milczenie.

**Nie naprawione w kodzie** — zglaszam, nie lataam po cichu. Do rozstrzygniecia przez ADMIRALA:
czy brama ma **odmawiac** postu przy braku deklaracji sesji, zamiast podstawiac wlasciciela klucza.

## R58 — SKARBIEC 3T3R: KARTA 01 vs ROZKAZY KROLA — CZTERY ROZJAZDY DO ROZSTRZYGNIECIA

**Zmierzone 2026-09-22, front 01+07 (galaz `lab/3t3r-wzorzec-01-07`, repo `cymru-main`).**
Wzorzec: `.claude/skills/3t3r-orb-design/delivery/paczka-18/cards/01-menu.html` (tryb MIARY).
Dowod: `C:\Users\Public\REGRESJA-3T3R-22-09\fronty\01-07\{przed,po}\skarbiec-menu\`.

Ponizsze CZTERY roznice zostaly ZMIERZONE i NIE NAPRAWIONE — bo karta mowi jedno, a nowszy
rozkaz Krola albo nierozstrzygnieta decyzja mowi drugie. Nie naprawiam po cichu.

**R58.1 — PROPORCJE WIERSZA: 15/36/16 (karta) vs 17/44/20 (Krol 21.09 14:07).**
`src/components/cymru/vault/WierszKanonu.tsx:181/199/201` ma 44/17/20 na rozkaz Krola 21.09.2026
14:07 („Proporcje sa chujowe nadal .... Za male copy i ikony do rozmiaru buttona").
`src/components/cymru/VaultPanel.tsx:2810/1389/2825` (lista glowna) ma 15/36/16 — zgodnie z karta.
SKUTEK NA EKRANIE: wiersz SKACZE przy wejsciu z menu w kazdy ekran gleboki Skarbca.
⛔ Straznik `tests/menu-kanon.test.ts` (`DLUG_PROPORCJI`) JAWNIE zakazuje dzis `text-[17px]`
w `VaultPanel.tsx`, wiec wyrownanie wymaga decyzji, a nie edycji.
**Rozstrzyga: Krol / design@.** Do wyboru: (a) lista glowna idzie na 17/44/20 i kasujemy
`DLUG_PROPORCJI`; (b) `WierszKanonu` wraca do 15/36/16 i cofamy rozkaz 21.09 (⛔ odradzam).

**R58.2 — KROJ PISMA: Space Grotesk (apka) vs ui-sans-serif/system-ui (paczka 18).**
`tailwind.config.ts:26` (`var(--cymru-font-ui, "Space Grotesk")`, ladowany w `index.html:89`)
kontra `paczka-18/orb.js:6` i obie karty. `docs/design-systems/3t3r/README.md` i podglady
komponentow uzywaja Space Grotesk — czyli kanon repo i paczka 18 mowia dwie rzeczy.
**Rozstrzyga: design@.** Ta sama klasa co rozjazd palety nizej — nie zmieniam po cichu.

**R58.3 — PALETA (juz stoi jako nierozstrzygniety, dopisuje MIEJSCA W KODZIE).**
paczka 18 = czern + fiolet #b06cf5 → #7c3aed; `docs/design-systems/3t3r/README.md` = #06090F + #f04a41.
Zmierzone miejsca, w ktorych to widac na JEDNYM ekranie:
- zylka wiersza aktywnego: `VaultPanel.tsx:2770` i `WierszKanonu.tsx:203` = `--accent-sygnal`
  (czerwien #f04a41 z paczki 15), a `OrbBottomMenu.tsx:989` = `#b06cf5` → dwa menu jednego domu
  maja zylke w dwoch kolorach;
- tlo wiersza aktywnego: biel 7% + ramka 12% (Skarbiec) vs `#17171d` + ring 8% (OrbBottomMenu)
  vs `#17171d` + obrys 9% (karta);
- bursztyn przy liczbie energii (`text-amber-300`, `VaultPanel.tsx:1515/2495`) — karta 01 nie ma
  bursztynu w menu („nie amber Vercela"). ⛔ ZMIENILEM TYLKO ROZMIAR (24 → 16 px), barwy NIE.
**Rozstrzyga: design@.**

**R58.4 — NAGLOWEK GRUPY: 11 px (podloga domu 13.09) vs 9,5 px (karta 01).**
`VaultPanel.tsx:2719` i `WierszKanonu.tsx:445` = mono 11 px / 0.18em / biel .42; karta = 9,5 px /
0.2em / biel .40, bez kreski w linii i bez szewronu. 11 px stoi na skardze Krola z 13.09
(„za male elementy UI") i jest NOWSZE od karty; kreska i szewron zaluzji to wybor z 13.09/20.09.
**Nie cofam.** Do wiadomosci design@ przy nastepnej wersji karty.

Dopisane przez sesje Claude Code (Lenovo, `cymru-main`, front 01+07 wzorca paczki 18), 2026-09-22.

---

## R59 — KARTA 04 (paczka 18, „SFERA — hero i dysk MÓW") kontra KOD I DECYZJE KRÓLA
Zgłasza: sesja Claude Code (Lenovo, `cymru-main`, front 04 wzorca paczki 18), 2026-09-22.
Wzorzec: `.claude/skills/3t3r-orb-design/delivery/paczka-18/cards/04-sfera-hero.html`.
⛔ Żadnej z tych czterech rzeczy NIE ruszyłem — czekają na słowo, nie na poprawkę po cichu.

**R59.1 — DYSK MÓW NA SFERZE ORB: karta go rysuje, Król kazał go stamtąd USUNĄĆ.**
Karta 04 stawia dysk Ø 188 px na sferze, przy zapalonej połówce ORB w pigułce nagłówka (4 stany,
45 napisów). Kod: `src/pages/PttShaman.tsx:1180` rysuje dysk WYŁĄCZNIE w trybie `shaman`
(`appMode === 'shaman' &&`). Powód stoi w kodzie z datą — rozkaz Króla 2026-09-01: „usuń jednak
button ptt z ORB — user będzie wiedział gdzie gadać". Na ORB wejściem ma być wiersz menu
„Zapytaj RayRay" (`OrbSurface.tsx:1595`). **Decyzja Króla jest NOWSZA od karty i wygrywa.**
Do wiadomości design@ przy następnej wersji karty 04.

**R59.2 — POŚWIATA DYSKU: karta chce `box-shadow` ~100 px poza dysk, nota CEO w kodzie zakazuje.**
Karta: `0 0 52px −6px` fiolet @55% + `0 0 108px 6px` cyan @16% („poświata dysku to box-shadow").
Kod `TalkToGodButton.tsx:369–375`: osobny krążek 194 px z `filter: blur(7px)`, krycie .55/.85 —
świeci ok. 3 px poza dysk, a nad nim stoi nota CEO z 19.08: „a crisp coloured corona, NOT a wide
washed-out blob (CEO reference image)". Do tego karta niesie BARWY (fiolet + cyan) tam, gdzie kod
niesie tęczę stanu — czyli dotyka też palety (R58.3). **Rozstrzyga: Król/design@.** Nie zmieniam.

**R59.3 — PASEK DOLNY SFERY: karta chce dwóch pól, Król zostawił pigułkę.**
Karta: dwa osobne pola na całej szerokości (szukanie flex:1 + MENU), oba 46 px, radius 12, odstęp 8,
margines 8 od lewej/prawej/dołu. Kod `OrbBottomMenu.tsx:1173`: JEDNA pigułka `h-11` = 44 px,
`rounded-full`, szerokość = treść. Stoi na decyzji Króla z 11.09 („pigułka [SZUKAJ|☰] ZOSTAJE")
i 18.09 („Szukaj rozsuwa się W NIEJ"). **Decyzja Króla wygrywa.** Poprawiłem WYŁĄCZNIE to, co
mieści się wewnątrz pigułki: napis MENU w każdym stanie, kreski 14×1,4, lupa 16/1,3/.44,
„Szukaj" 14 px bez ucinania. Odsunięcie paska (karta: 8 px od dołu; kod: 16 px + `safe-area`)
ZOSTAJE kodowe — `safe-area` chroni przed paskiem nawigacji Androida, karta go nie zna.

**R59.4 — OBRYS DYSKU, GDY BÓG ŚPI: karta daje czerwony obrys @40%, rozkaz B2 mówi „bez obwódki".**
Karta stan 3/4: `0 0 0 1.4px rgba(224,69,60,.40)`. Kod `TalkToGodButton.tsx`: `border: 'none'`
przy `dormant`, na podstawie rozkazu B2 Króla z 2026-08-28 („czarny bez podświetlenia i obwódki,
czerwona lampka"). **Rozkaz Króla wygrywa** — obrys zostaje zdjęty. Reszta stanu 3/4 dociągnięta
do karty: napis „BÓG ŚPI" + podpis „SPRÓBUJ ZA CHWILĘ", pełna biel napisu, pełna czerwień kropki.

**R60 — HALT UI (Mon Ra 01:51Z, 22.09) vs FALA WZORCA (Król ~03:00, 22.09): oba dotyczą `src/components`.**
STAN-BIEZACY 02:15Z: „zero zmian src/components · src/pages · src/index.css do odwołania" (rozkaz przez hp@).
Godzinę później Król: „tam jest 200 wad, a dałem przykłady… to nie jest design system zbudowany z God of RA
Design w Claude Design" — i ruszyła fala frontów wzorca (paczka 18), która z definicji zmienia `src/components`.
Front 11 (RAYDEN, `lab/3t3r-wzorzec-11`) wykonał naprawy WYŁĄCZNIE LOKALNIE: zero push, zero deploy, zero dotyku
main. **Rozstrzyga: admirał** — scalenie gałęzi wzorca dopiero po odwołaniu HALT albo po słowie Króla o wyglądzie.
Do tego rozjazd palety karty 11 (czerń #000 + fiolet #b06cf5/#7c3aed) vs docs/design-systems/3t3r/README.md
(#06090F + #f04a41) pozostaje NIEROZSTRZYGNIĘTY — front 11 nie ruszył ani jednej barwy (spis rozjazdów palety
w raporcie fali: chwyt żaluzji --accent-sygnal, trzy fiolety cen, pierścień więzi CharacterView:1091, poświaty).

**R61 — FRONT 02 (MIĘDZY WAMI, `lab/3t3r-wzorzec-02`, 22.09): karta 02 vs trzy rozkazy Króla o pasie i composerze.**
Cztery różnice karty NIE weszły, bo stoją na nich nowsze/imiennie zapisane rozkazy — czeka słowo design@/Króla:
1. Pas z nadtytułem „MIĘDZY WAMI" + podpisem „Dusza na Twojej sferze" i imieniem w OSOBNYM wierszu rozmówcy
   (karta, miary y=101,5/116,5/160,5) — vs rozkaz Króla 11.09 15:47 („ten miszmasz") + 11.09 ~03:31: JEDEN pas
   domu, JEDNA linia tytułu, żadnego zdania nad nim ani pod nim (`NaglowekArkusza.tsx:51-65`, nadtytuł DM
   wymieniony tam imiennie jako usunięty). Tak samo wiersz meta „rodzina · ryby · rezonans 70%" pod imieniem
   i słowo pieczęci POD imieniem (x=77 y=184) — oba wymagają drugiej linii w pasie.
2. Guzik wysyłki STOJĄCY ZAWSZE i rząd pisania BEZ mikrofonu (karta, stan „kanał otwarty") — vs rozkaz Króla
   03.09 („wysyłka zajmuje miejsce mikrofonu", `TalkComposer.tsx` zasada 1) + zakaz kasowania funkcji (PTT =
   rdzeń produktu). Wszedł sam KSZTAŁT: okrąg ↑ 44 px zamiast pigułki „Wyślij" (nazwane pole `wyslijKolo`).
   Z tym sprzężone: „+" w rzędzie pisania (karta) vs „+" jako akcja pasa (karta 17, nota OrbDmSheet 18.09) oraz
   szkielet pisania „jeden pasek 42 px" (karta) — szkielet nadal lustruje PRAWDZIWY rząd (pole+mikrofon+nota),
   bo inaczej pole przeskakuje przy otwarciu (reguła karty „nic nie przeskakuje" bije jej własny rysunek stopki).
3. Miary dotyku: okrąg wysyłki i kropka „mówi teraz" — karta daje 42 px i kulę 40; kanon celu dotyku 44 px
   (07.09) i slot znaku 32 px (kanon nagłówka 26.08) wygrywają, jak w nocie `OrbDmSheet.tsx` z 18.09.
4. Paleta zamrożona (jak R60): bąbel TWÓJ token --iridescent-purple vs #b06cf5, „Zaproś"/wysyłka bg-iridescent
   + czarne pismo vs gradient #7c3aed→#c561d6 + biel, panel frosted-glass-solid vs płaska czerń #0a0a0d,
   poświata fioletu vs cień czarny, przyciemnienie .50 vs .52 — NIC nie ruszone.
Poza tym „odsłuchała" pod Twoim ostatnim bąblem wymaga DANYCH, których nie ma: `DmMessage` (useOrbDm.ts) nie
niesie odczytu przez rozmówcę, a `markOrbDmRead` liczy tylko nasze odznaki (serwer celowo: „the peer learns
nothing") — zmiana wspólna backend+hook, nie frontowa. Rezonans/grupa/znak w arkuszu rozmowy — wołający
(OrbSurface/OrbPeopleSheet) musiałby je podać; arkusz ich nie dostaje.


**R62 — FRONT 03 (MOI LUDZIE, `lab/3t3r-wzorzec-03`, 22.09): karta 03 vs rozkazy 11.09 i brak zaplecza.**
Weszło z karty (lokalnie, zero push): e-mail PIERWSZY w formularzu + koperta 18 px + obrys pola 1,6 px,
formularz i ekran „wysłane" PŁASKO (bez pudła CARD), pustka wyśrodkowana z drugim zdaniem karty (napis #9),
imię wiersza 15/600/.01em bez wersalików, gap wiersza 12, biel .94, guziki pełne MONO (11,5/.18em · 11/.16em ·
10,5/.14em), pastylki kręgu 13/400/0, PL emailHint bez imiesłowu z cudzym podmiotem. NIE weszło — czeka słowo:
1. „Dusza" jako OSOBNY EKRAN (karta stan 5: kula 88, imię 21/700, „MÓWI TERAZ", rząd Kanał·Cisza·Usuń,
   „Co was łączy" 5 pastylek) — vs rozkaz Króla 11.09 ~03:31 (akordeon pod wierszem, zero zdań pod nazwą,
   `OrbPeopleSheet.tsx:873`) ORAZ brak zaplecza: „Cisza" nie ma żadnej funkcji wyciszenia w src/, „Co was
   łączy" nie ma danych (c2c_contacts nie niesie wspólnych cech), „mówi teraz" nie ma pola żywości
   (useC2CContacts.ts:33-71). Martwe guziki gorsze niż brak — czego nie ma w danych, tego się nie rysuje.
2. Data urodzenia obowiązkowa (submit: P.errDate) vs karta „jedyne wymaganie to adres" — zdjęcie obowiązku
   to zmiana useC2CContacts.ts:327 (bad_date) i NOT NULL w bazie; poza plikami frontu 03.
3. Podpis pasa „sześć dusz · dwie mówią teraz" i tytuły pasa per ekran (dodaj/dusza) — NaglowekArkusza
   (kanon pkt 6: bez podtytułu; X=98/Y=18/pas 56 nie ruszane). Liczba dusz stoi w treści (zLiczba).
4. Panel odsunięty (margin 0 8px 10px, róg 16, cień) vs pełnowysoki arkusz — przesunęłoby punkt tytułu
   (X=98) i wymaga tła spoza rozjazdu palety.
5. Pole „Szukaj" przyklejone NAD listą (karta: flex:none) — sticky wymaga nieprzezroczystego tła paska,
   a tło panelu (frosted-glass-solid vs #0a0a0d karty) samo jest rozjazdem palety.
6. Paleta zamrożona (jak R60/R61): rezonans valenceColor vs biel .84 z fioletem od 60% (OrbPeopleSheet.tsx:1817),
   tytuł pasa biel vs #b06cf5 (NaglowekArkusza.tsx:127), kula duszy obrys 2 px vs wypełnienie gradientem aury
   (OrbPeopleSheet.tsx:416), pastylka wybrana bg-iridescent+czerń vs #17171d+biel .94, guziki pełne
   bg-iridescent+czerń vs gradient 135° #7c3aed→#a84cb8+biel, tło pól bg-white/[0.04] vs #131318/#17171f/#101015,
   zasłona bg-black/85 vs .52 — NIC nie ruszone, czeka design@.
7. Kanon EN/PL dostał klucz `orb.people.emptySphereBody`; PL poprawki (emailHint, emptySphereTitle „jeszcze")
   żyją też w bazie tłumaczeń — ui_translations dla pl wymaga tej samej poprawki po scaleniu (pamięć tłumaczeń
   potrafi trzymać stary tekst, pułapka 21.09).

**R63 — FRONT 05 (WIADOMOŚCI/ZAPROSZENIA, `lab/3t3r-wzorzec-05`, 22.09): karta 05 vs rozkazy 02.09/11.09/20.09.**
Weszło z karty (lokalnie, zero push; wzorzec = paczka 18, słowo Króla 22.09 ~03:00 „to nie jest design system
zbudowany z God of RA Design"): panel POD pigułką RAYRAY|ORB (shellContentTop, mx 8 px, rogi 16, zasłona .52),
wiersz stanu pod tytułem („{n} kanałów · {m} żywych" / „{n} dusz chce na Twoją sferę"), wiersz rozmowy DWIE
LINIE (imię 15/600/.01em małymi literami, rodzaj 12,5 z „Ty: ", czas mono 9,5 skrótem „2 min/wt./3 wrz" przy
prawej krawędzi, BEZ strzałki, rytm 78), kanał z inicjałem „#" + kropka nadawania 10 px/2200 ms + podgląd .76
(dwa nośniki, źródło: kanalNadaje MÓW<2 min), pustka wyśrodkowana ze znakiem dwóch przerywanych okręgów
i widocznym tytułem 16/700, pole „Szukaj w rozmowach" własnym kluczem, PL: „Jeszcze z nikim nie mówiłeś",
„…od strony tego, kto pierwszy…", „Napisz pierwszy", spacja po „Ty:"; wysłane zaproszenie wiersz 78.
ROZJAZDY zgłoszone, nie naprawiane po cichu:
1. Tytuł pasa „WIADOMOŚCI" zostaje (karta 05 pisze „ROZMOWY") — rozkaz 20.09 „nazwa wiersza == tytuł ekranu"
   + karta 01 SAMA nazywa wiersz „Wiadomości" (paczka niespójna wewnętrznie); strażnik drzewa nawigacji
   z dowodem sabotażu broni 20.09. Czeka słowo design@/Króla.
2. Znak w slocie pasa zostaje (karta: pas bez znaku) — prawo „wiersz = nagłówek" i strażnik zasady 4;
   „+" wachlarza zostaje (żywa funkcja, rozkaz 07.09) choć karta go nie rysuje.
3. Czas mono 9,5 w treści vs rozkaz 11.09 15:47 (zakaz mono w treści) — karta wygrała (Król 22.09), strażnik
   mono dostał wyjątek `data-czas-karty`; druga linia pod imieniem vs rozkaz ~03:31 — jw.
4. Kula kanału w WIERSZU nosi „#" (karta), a pas arkusza kanału (OrbChannelSheet) dalej bryłę ETERU
   (rozkaz 02.09) — jeden znak w dwóch miejscach mówi dziś dwoma alfabetami; decyzja design@.
5. Paleta zamrożona (jak R60–R62): tytuł pasa biel vs #b06cf5, CTA bg-iridescent+czerń vs gradient
   #7c3aed→#a84cb8+biel, tło panelu frosted-glass-solid vs #0a0a0d, plakietka OK (#6b3fd6 już w kanonie).
   Kreska włoskowa pod pasem i pismo tytułu 11/700/.22em — NaglowekArkusza (plik wspólny, nie ruszony).
6. Skrót godziny to ICU narrow „2 h" (pl) — karta rysuje „godz.", ale short „2 godz." = 7 znaków łamie
   własną miarę karty (≤5); do rozstrzygnięcia z design@.
7. PL poprawki emptyFirst* i nowe klucze (orb.inbox.searchPlaceholder, stateChannels_*, stateLive_*,
   orb.inviteWaiting_*) — po scaleniu ta sama poprawka musi wejść do ui_translations (pamięć tłumaczeń
   trzyma stare/angielskie — pułapka 21.09); publikacja EN przez prebuild i18n-publish-en.mjs.
8. Front 03 (R62 pkt 4) świadomie NIE odsunął panelu od boków, front 05 odsunął (jawna różnica z listy
   analityka, karta stan 1-3) — interpretację X=98 („od lewej krawędzi pasa" vs „od krawędzi ekranu")
   musi ujednolicić admirał przy scalaniu.
9. Front 09: chip stanu 36 px z zieloną kropką #3ddc97 i pudełka #0a0a0d wokół pieczęci (karta 09)
   vs rozkaz Króla 11.09 15:47 „jeden język" — SecurityView.tsx:37-41 zapisuje wprost, że chip mono,
   zieleń i pudełko ZESZŁY (zieleń = wyłącznie „wliczone w plan"); stan pieczęci = słowo w wierszu.
   Nie ruszone; czeka słowo Króla/design@. Tak samo: tytuł BEZPIECZEŃSTWO vs „Pieczęcie"
   (AccountView.tsx:659-676 — nazwa drzwi == nazwa ekranu) i zdanie liczbowe „{done} z {total}"
   vs „Dwie pieczęcie założone." (prawo „policzalne palcem", strażnik liczby pieczęci).
10. Front 09: RA4DIO — tarcza 206 px/łuk/„104.6", transport „Słucham", 4 chipy pasm i fala widoczna
   w spoczynku z karty NIE narysowane: zero MHz w danych (WavesSection.tsx:42-51 — ekran to
   wyszukiwarka 57 tys. stacji, nie odbiornik), a 32 osobne tempa fali odrzucił sceptyk 08.09
   (miernik bez pomiaru dźwięku = atrapa; nota przy falaRef). Karta ⛔ vs kod ⛔ — wraca do karty
   dopiero z prawdziwym analizatorem dźwięku; decyzja design@.
11. Front 09: zdanie ekranu POBIERANIA w 12 px (ctaStyles.ZDANIE, decyzja 20.09 „jedno źródło,
   zero drugiej kopii") vs karta 18 px/1,42 — a PIECZĘCIE mają 18 px inline (SecurityView.tsx:756):
   dwa kroje „zdania ekranu" w jednym domu. Decyzja o ZDANIE w ctaStyles = admirał/design@.
12. Front 09: „Windows — instalator/przenośny" ucina się nawet na 412 px (potrzebne 219 px, jest 182 —
   wartość „v3.3.15 · 105 MB" z rozkazu Króla 13.09 zjada kolumnę). Naprawa = krótkie nazwy
   w locale (vault.download.winInstaller/winPortable) albo słowo design@ o kolumnie wartości —
   plik wspólny, front 09 nie ruszył. Nagłówek grupy FALE („FALE — RADIO I TV" z locale) vs karta
   „RA4DIO" + pas 56 px zamiast nagłówka sekcji (UsbWorld.tsx:118) — też poza plikami frontu 09.

## R65 — 25.09: PACZKA SYSTEMU DESIGNU I ZYWY ARKUSZ MOWIA ROZNE WARTOSCI. 24 TOKENY. OTWARTE.
`docs/design/system/tokens/colors.css` (paczka — jedyne miejsce prawdy o WARTOSCIACH wg kanonu)
kontra `apps/web/src/index.css` (arkusz, ktory naprawde maluje ekran). Paczka ma w calej historii
TRZY commity, ostatni `04d35c78` z 2026-09-08; arkusz zywy dostal od tamtej daty 67. Przez 17 dni
zaden skrypt nie otwieral obu plikow naraz — przeciecie zbiorow ich czytelnikow bylo PUSTE — wiec
rozjazd rosl bez jednego sygnalu.

ZMIERZONE 25.09 (`node scripts/check-token-drift.mjs --list`): 33 trafienia surowe, z czego 5 to
sam bialy znak w `calc(...)`; realnych 28. Cztery splacone tego samego dnia w paczce (akcenty
kanalow i sigint — pomiar rozstrzygal sam: wartosci paczki dawaly 3,05–4,46:1 na plotnie jasnym
87 %, czyli PONIZEJ AA, a zywe 4,66–5,09:1; odcien i nasycenie nietkniete). ZOSTAJE 24.

⛔ CZEGO NIE WOLNO NAPRAWIC BEZ SLOWA KROLA — TO JEST BAZA MARKI, NIE POPRAWKA TECHNICZNA:
1. ZIELEN MARKI w motywie jasnym. Paczka 145 100% 24%, arkusz zywy 145 100% 28%. Zmierzone WCAG
   2.x wobec DWOCH powierzchni jasnego motywu (plotno 87 %, karta 100 %): 28 % = 3,13 / 4,21 —
   pod progiem na obu. 24 % = 4,07 / 5,48 — trzyma tylko karte. Pierwszy stopien trzymajacy AA
   na OBU to 22 % (4,65 / 6,25). ⛔ Token stoi w kodzie w OBU rolach naraz (`text-primary` 1013,
   `bg-primary` 497, `border-primary` 509, czesto w jednej klasie), wiec rozdzielic go na „tekst"
   i „wypelnienie" nie da sie bez przepisania ~1000 miejsc. Pytanie do Krola brzmi jednym zdaniem:
   22 % (czytelne wszedzie) czy 28 % (dzisiejsze, nieczytelnosc na plotnie idzie na dlug)?
2. PODBARWIENIE CALEJ PALETY JASNEJ. 15 z pozostalych rozjazdow ma IDENTYCZNA JASNOSC i rozni
   sie wylacznie odcieniem: paczka trzyma motyw jasny podbarwiony na zielono (150–160°), arkusz
   zywy ma go odbarwiony do czystej szarosci (0 0%) — `--foreground`, `--muted`, `--accent`,
   `--input`, `--border`, `--sidebar-*`. Kontrastem tego nie rozstrzygniesz: dla `--accent`
   roznica wynosi 0,008 (1,129 kontra 1,137 wobec plotna). To wybor ODCIENIA MARKI, jeden na 15
   tokenow naraz, nie 15 osobnych poprawek.

⛔ PRECEDENS, KTORY ZAMYKA DROGE NA SKROTY: commit `6d385247` (22.09) COFNAL zmiany wartosci
robione „pod pozorem AA" bez rozkazu i nazwal je samowolkami.

OD 25.09 PILNUJE TEGO BRAMKA `scripts/check-token-drift.mjs` (G13): 24 zastane rozjazdy + 9 par
atramentu ponizej AA siedza IMIENNIE w zapadce jako dlug, kazdy NOWY jest czerwienia. Bramka
czyta obie sciezki WPROST (w repo lezy 9 kopii `index.css` i 35 kopii `colors.css`), normalizuje
bialy znak i liczy kontrast wylacznie tam, gdzie podklad wynika z nazwy (`--X-foreground` wobec
`--X`) — nigdy wobec domyslnej bieli. Brak ktoregokolwiek pliku = kod wyjscia 1 z napisem
NIE ZMIERZONE. ⛔ Bramka NIE JEST jeszcze wpieta w `scripts/gates-local.mjs` (plik poza zakresem
linii, ktora ja pisala) — wpiecie nalezy do general@.

26.09: SOUL.md na Lenovo był duszą HP od 25.09 00:44Z (sync); zamieniony na duszę lenovo@; kopia SOUL.md.bak-crony-26-09.

## R66 — 26.09: KLASA „CI ZIELONE, MASZYNA CZERWONA" — KLUCZ ZE SCIEZKI. m0ssad-3: 0 MIN NA 59 BRAMEK + 244 TESTY. ZASADA DO KANONU. ZAMKNIETE DLA TEJ KLASY, OTWARTE OBOK (R66a).
ZRODLO: zgloszenie ADMIRALA 3T3R 26.09 10:1xZ. W Eterze `tests/jeden-wyglad-fundamenty.test.ts:255`
budowal klucz przez `plik.split(/[\/]src[\/]/)[1]` — na Windows w kluczu zostawal backslash,
baseline trzymal klucze ze slashem, zaden klucz nie trafial, prog czytal sie jako 0 i 16 zamrozonych
kopii zglaszalo sie jako NOWE. `gh pr checks` na Linuksie zielone, hook pre-push na Windows czerwony;
cala flota pcha z Windows. Naprawione w `lab/pr6-kanon-kopie-26-09` ee6d9aa9.

ZASADA (do kanonu, obowiazuje kazda linie): PORT LOGIKI TESTU W INNYM SRODOWISKU ODTWARZA
ROZUMOWANIE, NIE SRODOWISKO — separator sciezki (`\` vs `/`), CRLF (`core.autocrlf=true` na Lenovo,
zmierzone: `apps/web/src/pages/Install.tsx` 507 CR na dysku), locale, strefa czasu. Port NIE JEST
odpalonym testem. Dowodem jest bieg na maszynie, z ktorej idzie push — rc + liczby, nie „powinno".

AUDYT m0ssad-3 (26.09, ta maszyna, Windows 11, tylko odczyt, zero `--accept`):
· 59 skryptow `scripts/check-*.mjs`, 32 baseline'y `scripts/*.json`, 244 pliki testow pod
  `apps/web/src/**/__tests__` i `*.test.ts(x)`. Wynik: 0 MIN, 0 ODWROTNYCH MIN.
· 25 bramek buduje klucz ze sciezki I porownuje z zapisem trwalym — KAZDA normalizuje do `/`
  PRZED porownaniem, piecioma idiomami:
    `.replace(/\/g,"/")` — check-brand-case.mjs:120, check-design-system.mjs:322,
      check-locale-format.mjs:106, check-price-claims.mjs:258/529, check-untranslated-strings.mjs:215,
      check-text-contrast.mjs:107, check-tabs-contract.mjs:113 (ids 286/311), check-theme-variant.mjs:67
    `split(sep).join("/")` — check-claimed-paths.mjs:237, check-font-families.mjs:196/324/365,
      check-icon-atlas.mjs:141, check-jedna-sesja.mjs:179, check-menu-contract.mjs:144,
      check-modules-taxonomy.mjs:125, check-panel-contract.mjs:207, check-panel-containment.mjs:150,
      check-realtime-contract.mjs:52, check-parked-landing.mjs:214, check-sekrety-w-tekscie.mjs:178/223
    `split(BS).join("/")`, BS=String.fromCharCode(92) — check-dead-props.mjs:102 (BS:62),
      check-hero-density.mjs:96 (BS:46), check-export-dupes.mjs:107 (BS:65),
      `scripts/_cardSurface.mjs:137-139 rel()` = JEDNO miejsce dla 6 bramek kart
      (card-brand-case, card-height, card-ladder, card-namespace, key-contrast, state-keys)
    `split("\\").join("/")` — check-dead-affordance.mjs:74, check-dolna-krawedz.mjs:109-110 (+ zbierz():128),
      check-token-values.mjs:101
    `split(String.fromCharCode(92))` — check-ef-unit-tests.mjs:75, check-palette-clones.mjs:109,
      check-token-scope.mjs:97, check-duplicate-decl.mjs:75
· 20 bramek NIE MA klucza ze sciezki (slug EF, nazwa fn/tabeli, klucz i18n, basename z readdir,
  cel linku md): card-media-contract (CARD_FILE literal :94), deploy-drift, ef-jwt-drift,
  migration-grants (:66 basename), memory-index-drift, tenant-naming, i18n-pipeline, system-facts,
  screen-security-contract (:43 relative tylko w komunikacie), desktop-version-bump (wyjscie git)
  i 10 bez sciezek w ogole.
· PRZESLANKA ADMIRALA CZESCIOWO FALSZYWA: 9 z 10 „podejrzanych z grepa" normalizuje idiomem,
  ktorego regex `relative(` bez `\/g` nie widzi (BS / fromCharCode / split("\\")). Dziesiaty
  (screen-security-contract) nie porownuje niczego. Grep za wzorcem normalizacji to nie pomiar —
  pomiarem jest bieg.
· BASELINE'Y: 7 z 32 maja backslash — KAZDY to `\"` w prozie `_README`/`note`/`reason` albo w wartosci
  font-family (check-token-values-baseline.json:293-308). Zaden klucz-sciezka z `\`. Odwrotna mina
  (zapis z Windows → czerwien na Linuksie) NIE ISTNIEJE.
· TESTY: 11 z 244 chodza po dysku; klucz ze sciezki porownuja 3 i wszystkie normalizuja albo trzymaja
  obie strony w tym samym separatorze: drabinaWKlockuIJedenZnak.test.ts:52 (`split(sep)`),
  wysokiKontrastIAkcentRozmowy.test.ts:192 (`split(sep)`), dotoTylkoWZnaku.test.ts:23+65 (obie strony
  przez `join` — natywny separator po obu stronach). Reszta: basename z readdir albo `slice()` tylko
  do komunikatu.
· PRECEDENS TEJ KLASY W TYM REPO, JUZ NAPRAWIONY: check-panel-containment.mjs:166-169 — „ZMIERZONE
  25.09: na Windows `join` oddaje `\`, klucze CODE mialy `\`, CODE.has() mowil «nie ma» i krawedz
  do barrela znikala bez slowa". Lek tam: `normalize()` w resolveSpec.

DOWOD BIEGU NA WINDOWS (26.09, wszystkie bez `--accept`):
· 27 bramek zapadkowych rc=0, 0 NOWYCH: dead-affordance (3 kursory), dead-props (2/2),
  export-dupes (2+2), hero-density (12 w 11), palette-clones, screen-security, token-scope,
  token-values (188 znanych, 0 nowych, 3 splacone), card-brand-case (11/11), key-contrast (44/44),
  state-keys (0), card-namespace (8/8), card-ladder (1/1), panel-containment, design-system
  (2661/2661 w 635 plikach), icon-atlas (42/42), menu-contract, panel-contract (16 paneli),
  tabs-contract (5 modulow, 1 do skurczenia), claimed-paths, jedna-sesja, sekrety-w-tekscie
  (1333 plikow), untranslated-strings (934 znanych), brand-case, font-families (7/7),
  modules-taxonomy, ef-unit-tests (52 pliki, 571/571).
· vitest z apps/web: dotoTylkoWZnaku 3/3, wysokiKontrast 9/9, drabinaWKlocku 5/5.
· LEK, GDYBY MINA SIE POJAWILA (jedna linia, nic wiecej): `.replace(/\/g, "/")` przy BUDOWIE
  klucza, przed pierwszym `.has()` / porownaniem z baseline'em. Nie przy zapisie baseline'u.

## R66a — 26.09: BRAMKA DOLNEJ KRAWEDZI JEST CZERWONA NA ZYWYM DRZEWIE I NIKT JEJ NIE WOLA. OTWARTE.
`node scripts/check-dolna-krawedz.mjs` na `apps/web/src`: rc=1, 19 naruszen w 792 plikach
(A 12 · B 5 · C 2), m.in. Install.tsx:317, EmailThreadOverlay.tsx:3352, IrcChannelList.tsx:625,
PricingLadder.tsx:1128, MragCanvas.tsx:538, RagFileManager.tsx:1159, SphereOverlay.tsx:3823/3854,
ProSheet.tsx:119. TO NIE JEST ARTEFAKT WINDOWS: sciezki znormalizowane (109-110, 128), a kopia
`apps/web/src` z CRLF→LF (scratchpad, 507→0 CR) daje IDENTYCZNE 12/5/2. Czerwien jest prawdziwa i
bylaby czerwona na Linuksie.
Kto ja widzi: NIKT. (1) `scripts/gates-local.mjs` nie ma wpisu dolna-krawedz (b72973cc dodal skrypt,
fixture'y i test, nie wpis w runnerze). (2) `apps/web/src/__tests__/klikalneNiePodPaskiemSystemowym.test.ts`
mierzy zywe drzewo i jest czerwony (3 testy: A/A2, B, C) — ale CI go nie odpala (PR #126, 8 checkow:
CodeQL, secret scan, i18n-keys, eslint, menu-contract, realtime-contract, tsc, web-pwa-build-check;
vitesta nie ma w zadnym workflow), a hook pushu woła `vitest related` (`.githooks/pre-push:128`),
ktory bierze tylko testy IMPORTUJACE zmienione pliki — ten test importuje zero z src, spawnuje skrypt,
wiec biegnie tylko gdy zmieni sie sam skrypt albo test. Rozstrzygniecie nalezy do general@/admirala:
wpiac w gates-local (i wtedy 19 blokuje kazdy push) albo dac zapadke — nie naprawiac po cichu.

POBOCZNE (pomiar 26.09, bez zmian): Actions w repo WLACZONE (`gh api …/actions/permissions` → true).
Workflowy, ktore commituja/pchaja: `.github/workflows/dist.yml:114` git commit, `:118` git push
origin HEAD:main; `.github/workflows/claude-autofix.yml:253` git commit, `:261` git push origin
<galaz>. Zaden nie wola `vercel` ani `deploy` jako komendy (tylko komentarze: dist.yml:4/21/100,
claude-autofix.yml:16/113/191, edge-fn-jwt-drift.yml:6). Ostatnie 3 commity w workflows:
cb6d02b3, c5281791, a9f93a56 (dist-desktop.yml, 26.09 09:41). Kanon „zero GitHub Actions" vs
26 plikow workflow i Actions=true — rozjazd znany, nie z tej fali.

---

## ⛔ PRAWO OBU LINII, 26.09.2026 — CZUJNIK CZERWONY DŁUŻEJ NIŻ DOBĘ TO TAPETA, NIE CZUJNIK

Wpisane na rozkaz general@ (admirał mosADD), 26.09: „regułę do 90-rozjazdy.md wpisz —
»czujnik czerwony dłużej niż dobę to tapeta, nie czujnik« — obok miny ukośnika; to prawo obu linii".

**Z czego wynika (Eter, zmierzone 26.09):** `EF smoke + healthcheck` w `Hei33enberg/3T3R` był
czerwony **od 27.07.2026** — 80 czerwonych na 100 ostatnich przebiegów. Przyczyną nie była awaria:
`tests/ef-contract.test.ts:63` pilnowało adresu `@get.cymru`, a domenę zdjęto **17.08.2026**
(commit `6d0734cd`, „get.cymru → 3t3r.com everywhere"). Sam czerwony przebieg to pokazuje:
`expected '612282557@3t3r.com' to match /@get\.cymru$/` — czyli usługa oddała **HTTP 200**
i poprawny adres. **Produkcja była zdrowa przez cały czas.**

⛔ **Koszt był mimo to prawdziwy.** To jedyny czujnik nad produkcją Etera. Przez dwa miesiące
PRAWDZIWA awaria nie zostałaby zauważona, bo lampka i tak świeciła. Ta sama klasa co
„dziennik zapisywał tylko sukcesy" (21.09): tam strażnik milczał o awariach, tu krzyczał
o wszystkim — **oba znaczą ślepotę**.

**Reguła:** o czujniku nie pytasz „czy jest zielony", tylko **„KIEDY OSTATNIO był zielony"**.
Seria czerwieni dłuższa niż doba jest zgłoszeniem sama w sobie i idzie do naprawy albo
do wyłączenia — nigdy do przeczekania.

### Dwie miny, które przy tym wyszły — obie moje

⛔ **PIERWSZY EKRAN LISTY TO NIE POMIAR ZBIORU.** Zameldowałem „cztery czerwone przebiegi
pod rząd", bo tyle pokazał domyślny `gh run list`. Prawda: dwa miesiące. Domyślny `--limit`
jest cichym filtrem — ta sama choroba co „liczba z automatu to hipoteza, nie pomiar".

⛔ **WZORZEC ŚCIEŻKI Z GWIAZDKAMI ZAMYKA KOMENTARZ BLOKOWY.** Pisząc nagłówek
`scripts/check-paleta.mjs` wstawiłem ścieżkę z gwiazdkami i ukośnikiem w prawo — sekwencja
gwiazdka-ukośnik jest końcem komentarza, plik przestał się parsować i **bramka padła na czerwono
przy pchnięciu, nie wypuszczając niczego na zdalne**. W tym pliku ścieżki pisze się ukośnikiem
WSTECZNYM i to nie jest niechlujstwo. Rodzina: polskie ogonki w wyrażeniach regularnych,
odwrotny apostrof wykonujący się w `git commit -m`.

### Przy okazji obalone: „dług kolorów urósł mimo bramki"

Linia designu zgłosiła wzrost surowych kolorów 290 → 307 w plikach `.tsx` mimo żywej bramki
palety. Zmierzone porównaniem `250a893` (21.09) i `HEAD` (26.09), ten sam wzorzec, te same
279 plików: **z komentarzami 290 → 308 (+18), BEZ komentarzy 164 → 158 (−6)**.
Prawdziwy dług **SPADŁ**. Cały „wzrost" to tekst komentarzy — dziś połowa hexów w `.tsx`
siedzi w komentarzach, bo sami opisujemy w kodzie wartości wycofane.
⛔ **Wzorzec liczący kolory razem z komentarzami KARZE DOKUMENTOWANIE.** Dziura w zapadce
nie potwierdzona.

— 3t3r@ (Claude Opus 5), admirał Etera, 26.09.2026
