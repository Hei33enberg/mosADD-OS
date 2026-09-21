# TOKENY — kanon marek RA (z kodu)

Stan na 2026-09-19 (UTC ~01:30). Źródło prawdy: kod na komputerze właściciela (`C:\m0ssad-3`, `C:\cymru-main`, `C:\cymru-main\RAYDIO-LP-main`), odczytany przez remote-devices; dokumenty tylko jako tło. Kod wygrywa z dokumentem — każda rozbieżność jest niżej.

**Pliki:** `/home/claude/ds/project/tokens.json` (gramatyka strony, walidator: 0 błędów) · `/home/claude/ds/project/fonts/` (12 prawdziwych plików) · ten raport. Skrypty pomocnicze (parser CSS, kontrast, walidator) w `/home/claude/tokwork/`.

## 1. Liczby

| Rodzina | mosADD | Eter (3t3r.com) | Engineering (orb.3t3r.com) | Razem | Limit |
|---|---|---|---|---|---|
| kolory | 68 (w tym 12 × `mosadd-lp-*`) | 50 | 30 | 148 | 80 / 50 / 30 / 600 |
| fonty (pliki) | 6 | 0 (tylko Google Fonts) | 6 | 12 | 40 |
| rodziny (families) | 3 | 3 | 3 | 9 | 12 |
| grupy typografii | 4 | 3 | 3 | 10 | 12 |
| style tekstu | 22 | 16 | 18 | 56 | 80 |
| spacing | — | — | — | 14 (wspólna skala 3T3R + `touch-min`) | 60 |
| radius | 6 | 9 | 8 | 23 | 60 |
| shadow | 7 | 7 | 4 | 18 | 60 |

Kolory mosADD mają dwie wartości (Czerń = `:root`, Jasny = `.light`) — wszystkie 68 mają mapę motywów; aliasy (`{…}`, bo w kodzie `var(--x)`): mosADD 6 (+12 tokenów LP z aliasem w kolumnie Jasny), Engineering 14, Eter 0. Eter i Engineering mają tylko Czerń (kolumna „Jasny · tylko mosADD” — patrz wątpliwość W4). Kontrast policzono dla 220 par; 44 nie przechodzi progu (§4).

## 2. Reguły z polecenia sprawdzone w kodzie

| Reguła z polecenia | Co mówi kod | Dowód | Werdykt |
|---|---|---|---|
| mosADD `--primary: 146 72% 45%` | zgadza się; w Jasnym 145 100% 28% | m0ssad-3/apps/web/src/index.css:302, :460 | ✔ |
| mosADD ostre narożniki `--radius: .25rem` | token = 4 px, ale w praktyce narożnik to 0: `rounded-sm` = calc(.25rem−4px) = 0 (801 użyć) + `rounded-none` (466); 4 px ma tylko `rounded-lg`/`rounded` (31). Wyjątki 6 px: `.nav-icon-btn`, `.vault-dropdown`, `.hub-subpage` | index.css:393; tailwind.config.js:126-128; index.css:2408, 2049, 2064 | ✔ z poprawką: kanon = kwadrat, 4 px to wyjątek |
| mosADD IBM Plex Mono = body/dane | zgadza się (body `font-family: var(--font-mono)`); wagi 400/600/700 self-hosted | index.css:17-19, 196, 880 | ✔ |
| mosADD Space Grotesk = nagłówki LP | tylko H2 sekcji (`font-brand`, 115 klas). H1 hero od 06.09 jest w IBM Plex Mono bold WERSALIKI; rozstrzygnięcie R4 oznacza Space Grotesk jako WYCOFANY, ale H2 jeszcze go noszą | components/landing/RadarHero.tsx:112-128; index.css:285-291; UseCases.tsx:57 | ⚠ częściowo |
| mosADD Doto tylko w znaku ≥16 px | zgadza się — przełącznik w komponencie, poniżej 16 px znak idzie w mono | components/brand/Wordmark.tsx:82, 89; index.css:206-211 | ✔ |
| Eter: opalizacja fiolet→fuksja | w kodzie apki żywa i najczęstsza (iridescent-purple ~530 użyć); skill ogłasza ją wycofaną 03.09 i każe malować akcent #f04a41 | cymru-main/src/index.css:83-87; tailwind.config.ts:33; skill app-eter.css:54-60 | ✔ w kodzie (dokument ✗) |
| Eter: karty rounded-3xl | rounded-3xl (24 px) = arkusze ORB i karty LP firmy; pełne karty Skarbca to rounded-2xl (16 px) — komentarz „rounded-2xl is for full cards” | OrbSurface.tsx:1206; GradientCard.tsx:15; VaultSection.tsx:128 | ⚠ częściowo |
| Eter: wiersze rounded-2xl | ✗ wiersze 78 px to rounded-xl = 12 px (Skarbiec), kafle też rounded-xl | cymru-main/src/components/cymru/vault/WierszKanonu.tsx:146; VaultSection.tsx:128-130 | ✗ poprawione: 12 px |
| Eter: wiersz menu 78 px, promień 12 | zgadza się (`rounded-[12px]`) | components/orb/OrbBottomMenu.tsx:952, 1029 | ✔ |
| Eter: poświata, nie cień | głównie tak (shadow-glow-* 44 użycia + arbitralne poświaty), ale są też cienie rzucane: shadow-lg 13, shadow-md 8, toast `shadow-lg` | tailwind.config.ts:109-118 | ⚠ częściowo |
| Engineering: czerwień + biel na czerni | zgadza się: #000, #fff, jedyny akcent #f04a41 | RAYDIO-LP-main/src/styles.css:211-217, 238 | ✔ |
| Engineering: hairline | zgadza się: jedyna obwódka #ffffff14 | styles.css:215, 294 | ✔ |
| Engineering: bez cienia | ✗ cień dropdownu nawigacji, gałka, 3× shadow-2xl (pasek rezerwacji, lightbox, toast), poświata pod CTA w starym kolorze #ff5223 | styles.css:295-296; SiteNav.tsx:227; Knob.tsx:22; OrbLanding.tsx:611, 680, 730; Sections.tsx:602 | ✗ |
| „Żadna marka nie używa cieni rzucanych” | ✗ mosADD: dropdown nagłówka (decyzja 18.09 wprost chce cienia), krawędź panelu, karty i szkło LP; Engineering jw.; Eter: kilka shadow-lg/2xl | TopNavBar.tsx:218, 230; index.css:957, 981, 1292 | ✗ — opisane w `shadow.note` |
| worlds.css = świat Engineering | ✗ `worlds.css` to CZTERY ŚWIATY SKARBCA aplikacji 3t3r.com — importowany przez `cymru-main/src/index.css:4`; tokeny trafiły do `eter-world-*`. Engineering wziąłem z kodu orb.3t3r.com (RAYDIO-LP-main/src/styles.css), identycznego z `skill/tokens/colors.css` | cymru-main/src/styles/worlds.css:1-12; cymru-main/src/index.css:4 | ✗ poprawione |
| Eter/Engineering nie mają jasnego motywu | ✗ oba mają: Eter „Arrival” (płatny, `data-motyw="jasny"`), Engineering ARRIVAL. Nie wstawiłem ich do kolumny „Jasny · tylko mosADD”; wartości są w `usage` | cymru-main/src/index.css:1278-1320; RAYDIO-LP-main/src/styles.css:436-493 | ✗ — decyzja W4 |
| Eter: Space Mono jako mono | ✗ nie ma go w kodzie apki; `font-mono` = domyślny stos systemowy Tailwinda 3 (ui-monospace…) | cymru-main/index.html:89; tailwind.config.ts:25-28 | ✗ poprawione |
| Eter: Black Ops One | żyje: to krój znaku „ETER” w nagłówku apki (skill twierdzi, że zniknął) | components/ui/CymruLogo.tsx:200; components/Header.tsx:463 | ✔ w kodzie |
| Fonty ENG „różne wagi” InterTight 400-800 / GeistMono 400-600 | to ten sam plik zmienny (sha256 identyczne), oś wght 100–900 (fontTools); wpisane raz na zestaw znaków z wagą „100 900” (nie „400 800” — kod LP deklaruje 100 900) | RAYDIO-LP-main/src/styles.css:57-104 | ✔ z poprawką zakresu |
| Eter: fonty self-hosted w skillu / public/fonts | ✗ `C:\cymru-main\public\fonts` nie istnieje; 18 `@font-face` w skillu to wyłącznie DotGothic16/Geist Mono/Inter Tight; skill sam pisze „no self-hosted binaries exist for the app faces yet” | skill tokens/fonts.css:16-33, 40-43 | ✗ |

## 3. Wątpliwości — do decyzji właściciela

- **W1 — wspólny kolor Eter/Engineering.** Eter `--accent-sygnal` 4 84% 60% (#ef4f43, żyłka aktywnego wiersza Skarbca) to praktycznie ten sam kolor co Engineering `--signal` #f04a41 (ΔE_OK 0,007). Skill mówi, że to celowe („both worlds … carry the SAME accent”, readme.md:607-608; app-eter.css:36-45). Łamie zasadę „nigdy wspólny kolor”. Wpisane dokładnie i oznaczone ⚠ w obu tokenach.
- **W2 — mosADD blisko sygnału 3T3R.** `mosadd-mod-pstn` 4 84% 57% (#ed4235) ma ten sam odcień i nasycenie co sygnał; ΔE_OK 0,016 do `eng-signal`, 0,005 do `eng-iris-3` #ed4230. Inne pary bliźniacze między markami (ΔE_OK < 0,025): mosadd-mod-ayl ≈ eng-iris-1 ≈ eter-world-altar-cta; mosadd-mod-url ≈ eter-world-orb-cta; mosadd-primary ≈ eng-status-online; eter-world-god-cta ≈ eng-focus-ring; mosadd-iris ≈ eter-fiolet-zylka.
- **W3 — mosADD pożycza fiolet 3T3R.** `--iris` 271 81% 66% w mosADD (index.css:381) = dokładnie Eter `--ra-purple` (cymru-main/src/index.css:107); komentarz mówi, że to celowe („fioletowe słońce w ikonach tylko w apce … dla nawiązania do 3t3r”, index.css:376-379).
- **W4 — jasne motywy Eter i Engineering.** Kod ma Arrival (Eter, płatny) i ARRIVAL (orb.3t3r.com). Motyw „Jasny” w tokens.json jest z definicji tylko mosADD, więc Eter/ENG dziedziczą Czerń (tak kazano). Jeśli strona ma pokazywać Arrival — potrzebny trzeci motyw, a nie wstawianie ich do kolumny mosADD.
- **W5 — cosmic-black 1 %.** `--cosmic-black` 222 43% 5% (#070b12) vs `--background` 222 43% 4% (#06080f). Zachowane oba (`eter-cosmic-black`, `eter-background`); cosmic-black to @deprecated RAYD3N z 0 użyciami klasy w src.
- **W6 — hex w komentarzu Eter.** Komentarz „Rich Black #06090F = 222 43% 4%” (cymru-main/src/index.css:45) nie jest dokładny: 222 43% 4% renderuje #06080f, a #06090F to hsl(220 43% 4%). Wpisano wartość z kodu (hsl), nie z komentarza.
- **W7 — wspólny krój Space Grotesk.** mosADD (`--font-brand`, H2 LP) i Eter (cały UI: `fontFamily.sans/display`, tailwind.config.ts:26-27) używają tego samego kroju. Na stronie oba stosy renderuje ten sam plik mosADD `SpaceGrotesk-var.ttf` (Eter nie ma własnego pliku). Łamie zasadę „nigdy wspólny krój”. W mosADD R4 i tak uznaje Space Grotesk za wycofany.
- **W8 — „Doto = krój ORB” to nieprawda w kodzie.** mosADD twierdzi, że Doto „podpisuje ORB u 3T3R” (Wordmark.tsx:9-10; index.css:21-23). Kod orb.3t3r.com używa DotGothic16 (RAYDIO-LP-main/src/styles.css:194; RadioWordmark.tsx:225-230) — to inny krój. Znaki trzech marek są więc różnymi krojami (Doto / Black Ops One / DotGothic16), ale mosADD i ENG to dwie matryce kropkowe — wizualnie blisko.
- **W9 — znak Eter.** Skill: jeden wspólny znak RadioWordmark w DotGothic16 dla 3t3r.com i orb.3t3r.com (readme.md:50-51; fonts.css:45-48). Kod apki: CymruLogo w Black Ops One 900, tracking 0.28em (CymruLogo.tsx:200-204). Wpisano kod. Uwaga: Black Ops One ma tylko wagę 400 — 900 to pogrubienie syntetyczne.
- **W10 — wagi bez kroju.** Eter: `font-black` 900 na Space Grotesk ładowanym 400/600/700 (tytuły paneli, PersonaRow.tsx:97; index.html:89); mosADD: etykiety HUD 900 bez kroju 900 (index.css:186-191, 1828). Przeglądarka pogrubia syntetycznie.
- **W11 — forma CTA wspólna Eter/ENG.** Engineering: pigułka pełna #f04a41 (OrbLanding.tsx:242). Eter: domyślny Button rounded-md 6 px (button.tsx:14), ale główne CTA to też pigułki (rounded-full h-[54px], gradient #7c3aed→#a84cb8, Przedsionek.tsx:336; AltarView.tsx:1046). mosADD: kwadrat, obrys (RadarHero.tsx:141). Pigułka jest więc wspólna dla Eter i ENG.
- **W12 — wspólna głębia.** `shadow-2xl` = `0 25px 50px -12px rgb(0 0 0 / 0.25)` jest w mosADD (lista dropdownu, 37 użyć) i w ENG (pasek, lightbox, toast) — identyczny cień w dwóch markach.
- **W13 — dropdown nagłówka mosADD.** Decyzja „dropdown kwadratowy z cieniem” (18.09 22:50) jest zapisana w `Users/Public/DECYZJE-KROLA.md:28`, nie w kodzie. Kod ją spełnia: przycisk `rounded-none` + `shadow-[0_4px_12px_rgba(0,0,0,0.5)]` (TopNavBar.tsx:218) = `mosadd-dropdown-shadow`; rozwinięta lista `rounded-none shadow-2xl` (TopNavBar.tsx:230) = `mosadd-dropdown-list-shadow`. Ten sam przycisk w starym WallHeader.tsx:82 (lista tam `rounded-sm` = 0 px).
- **W14 — radius-sm wyliczony.** `mosadd-radius-md` 2 px i `mosadd-radius-sm` 0 px policzone z `calc(var(--radius) - 2px/4px)` przy --radius 0.25rem = 4 px (tailwind.config.js:127-128). Tak samo Eter (8→6/4 px) i ENG (10→6/8/14/18/22/26 px). Założenie: 1rem = 16 px (mosADD skaluje całą stronę `zoom` 0.92/1.1/1.28, index.css:825-827 — px na ekranie rosną proporcjonalnie).
- **W15 — LP mosADD i `.force-dark`.** Od 08.09 LP nosi `.force-dark` tylko w motywie ciemnym (lib/landingTheme.ts:35; pages/Landing.tsx:119). `mosadd-lp-*` mają więc w kolumnie Jasny alias do zwykłego tokenu. DemoHub i MUrlViewer są ciemne zawsze — dla nich Jasny też byłby czernią.
- **W16 — martwe komentarze mosADD.** index.css:91, 514, 1368 i landingTheme.ts:8 opisują jasne płótno jako 150 9% 87% (szałwia); kod ma 0 0% 87% od odbarwienia 09.09 (index.css:446, 617-620). lib/channelRoles.ts:112 twierdzi, że `--iris-ink` jest tylko w `:root` — w `.light` jest od 07.09 (index.css:549).
- **W17 — Engineering: tokeny ≠ klasy.** H1 używa `tracking-tight` = −0.025em, a token „hero h1” to −0.03em (styles.css:310, nieużyty). `--tracking-mono-wide` 0.22em, a kod pisze 0.2em. `--text-hero-lede` 30 px nieużyty — podtytuł hero ma 20 px (OrbLanding.tsx:912). `--lh-relaxed` 1.6, a klasa leading-relaxed daje 1.625. Wpisano to, co renderuje kod.
- **W18 — oklch poza sRGB.** ENG `--status-alert` oklch(0.65 0.24 25), `--iris-1` oklch(0.84 0.15 78) i `--focus-ring` oklch(0.65 0.24 289.5) wychodzą poza gamut sRGB; hex w tokens.json to przycięcie (clip), na ekranie P3 kolory są żywsze. Kontrast fokusu po przeliczeniu 5,61:1 — dokładnie jak w komentarzu kodu (styles.css:408), więc przeliczenie jest wiarygodne.
- **W19 — ENG status-reserve/concept/retired.** W kodzie to `color-mix(in oklab, …, transparent)` — gramatyka zabrania color-mix, a przeliczenie byłoby już moją wartością. Pominięte (w tokens.json jest `eng-status-live` i `eng-status-coming` jako aliasy).
- **W20 — hairline jako 8-cyfrowy hex.** `eng-line` #ffffff14 zostawiony dokładnie jak w kodzie (8 cyfr = z alfą). Jeśli strona przyjmuje tylko 6-cyfrowy hex, trzeba go zapisać jako hsl(0 0% 100% / 0.0784).
- **W21 — dwa „fiolety marki” w Eter.** #6b3fd6 (FIOLET_MARKI: poświata pierścienia i plakietki, NatalSolarSystem.tsx:1810-1815) oraz #b06cf5 (też nazwany „FIOLET MARKI”: żyłka, fokus, podświetlenie w menu ORB, OrbBottomMenu.tsx:468, 966). „Harmonia” w BirthDataView.tsx:1667 maluje iridescent-purple, a nie #6b3fd6. Wpisane oba jako `eter-fiolet-marki` i `eter-fiolet-zylka`.
- **W22 — ring Eter.** Skill: `--app-ring` 4 84% 60% (app-eter.css:28). Kod apki: `--ring` 340 30% 85% (cymru-main/src/index.css:72). Wpisano kod.
- **W23 — pliki zmieniały się w trakcie pracy.** m0ssad-3/apps/web/src/index.css zmieniony o 00:59 UTC (+13 linii za linią 2410, tokeny i palety nietknięte), TopNavBar.tsx o 01:24 UTC (commit b28477d9: napis SEARCH przesunięty 296→301), OrbInboxSheet.tsx przesunięty (plakietka hsl 258 65% 54% teraz :239). Wszystkie cytaty sprawdziłem ponownie po zmianach; przy dalszej edycji numery linii mogą się przesunąć.
- **W24 — DotGothic16 bez polskich znaków.** Oba podzbiory DotGothic16 razem nie mają ą ć ę ń ś ź ż (fontTools); krój służy tylko znakowi 3T3R i numerom //NN — polski tekst spadnie na Geist Mono.

## 4. Kontrast (WCAG 2.x)

Próg 4,5:1 dla tekstu, 3:1 dla elementów graficznych, obwódek i tekstu ≥24 px (rampa display ENG). Kolory z alfą złożone na podłożu. Tło każdej pary to podłoże nazwane w `usage` tokenu. Pary nieprzechodzące są w tokens.json dokładnie takie jak w kodzie, z dopiskiem „⚠ kontrast X:1”.

Nie przechodzi: **44 z 220** par. Najważniejsze (tekst, dużo użyć): `mosadd-primary` jako tekst w Jasnym 3,13:1 na tle (text-primary ma 934 użycia); biel na zieleni w Jasnym 4,22:1; `mosadd-destructive` jako tekst w Czerni 4,06:1 / 3,14:1 na karcie (ma od tego `destructive-ink`); `mosadd-warning` w Jasnym 3,11:1; `eter-destructive` jako tekst 2,00:1; `eter-iridescent-blue` jako tekst 3,40:1; `eter-ink-42` (nagłówek grupy 11 px) 4,03:1. Obwódki wszystkich marek są celowo „włoskowe” i nie dochodzą do 3:1.

| Para (tekst/element na podłożu) | Motyw | Kontrast | Próg | Wynik |
|---|---|---|---|---|
| mosadd-primary na mosadd-background | Jasny | 3,13:1 | 4,50 | ⚠ |
| mosadd-primary na mosadd-card | Jasny | 4,22:1 | 4,50 | ⚠ |
| mosadd-primary-foreground na mosadd-primary | Jasny | 4,22:1 | 4,50 | ⚠ |
| mosadd-destructive na mosadd-background | Czerń | 4,06:1 | 4,50 | ⚠ |
| mosadd-destructive na mosadd-card | Czerń | 3,14:1 | 4,50 | ⚠ |
| mosadd-destructive-foreground na mosadd-destructive | Czerń | 4,29:1 | 4,50 | ⚠ |
| mosadd-border na mosadd-background | Czerń | 1,95:1 | 3,00 | ⚠ |
| mosadd-border na mosadd-background | Jasny | 1,99:1 | 3,00 | ⚠ |
| mosadd-border na mosadd-card | Czerń | 1,51:1 | 3,00 | ⚠ |
| mosadd-border na mosadd-card | Jasny | 2,68:1 | 3,00 | ⚠ |
| mosadd-input na mosadd-background | Czerń | 1,95:1 | 3,00 | ⚠ |
| mosadd-input na mosadd-background | Jasny | 1,81:1 | 3,00 | ⚠ |
| mosadd-input na mosadd-card | Czerń | 1,51:1 | 3,00 | ⚠ |
| mosadd-input na mosadd-card | Jasny | 2,44:1 | 3,00 | ⚠ |
| mosadd-warning na mosadd-background | Jasny | 3,11:1 | 4,50 | ⚠ |
| mosadd-warning na mosadd-card | Jasny | 4,19:1 | 4,50 | ⚠ |
| mosadd-info na mosadd-card | Czerń | 4,24:1 | 4,50 | ⚠ |
| mosadd-info-foreground na mosadd-info | Czerń | 3,19:1 | 4,50 | ⚠ |
| mosadd-sigint na mosadd-background | Jasny | 4,45:1 | 4,50 | ⚠ |
| mosadd-comint na mosadd-background | Czerń | 4,03:1 | 4,50 | ⚠ |
| mosadd-comint na mosadd-card | Czerń | 3,12:1 | 4,50 | ⚠ |
| mosadd-masint na mosadd-background | Jasny | 4,19:1 | 4,50 | ⚠ |
| mosadd-brain na mosadd-background | Jasny | 3,52:1 | 4,50 | ⚠ |
| mosadd-mod-irc na mosadd-card | Czerń | 4,46:1 | 4,50 | ⚠ |
| mosadd-mod-irc na mosadd-popover | Czerń | 4,17:1 | 4,50 | ⚠ |
| mosadd-mod-pstn na mosadd-card | Czerń | 3,91:1 | 4,50 | ⚠ |
| mosadd-mod-pstn na mosadd-popover | Czerń | 3,65:1 | 4,50 | ⚠ |
| mosadd-mod-ayl na mosadd-card | Jasny | 4,11:1 | 4,50 | ⚠ |
| mosadd-mod-ayl na mosadd-popover | Jasny | 3,93:1 | 4,50 | ⚠ |
| mosadd-lp-border na mosadd-lp-background | Czerń | 1,27:1 | 3,00 | ⚠ |
| mosadd-lp-border na mosadd-lp-background | Jasny | 1,99:1 | 3,00 | ⚠ |
| mosadd-lp-border na mosadd-lp-card | Czerń | 1,21:1 | 3,00 | ⚠ |
| mosadd-lp-border na mosadd-lp-card | Jasny | 2,68:1 | 3,00 | ⚠ |
| mosadd-lp-input na mosadd-lp-background | Czerń | 1,27:1 | 3,00 | ⚠ |
| mosadd-lp-input na mosadd-lp-background | Jasny | 1,81:1 | 3,00 | ⚠ |
| mosadd-foreground na mosadd-background | Czerń | 17,43:1 | 4,50 | ok |
| mosadd-foreground na mosadd-background | Jasny | 13,63:1 | 4,50 | ok |
| mosadd-foreground na mosadd-card | Czerń | 13,50:1 | 4,50 | ok |
| mosadd-foreground na mosadd-card | Jasny | 18,36:1 | 4,50 | ok |
| mosadd-card-foreground na mosadd-card | Czerń | 13,50:1 | 4,50 | ok |
| mosadd-card-foreground na mosadd-card | Jasny | 19,47:1 | 4,50 | ok |
| mosadd-popover-foreground na mosadd-popover | Czerń | 12,61:1 | 4,50 | ok |
| mosadd-popover-foreground na mosadd-popover | Jasny | 18,64:1 | 4,50 | ok |
| mosadd-primary na mosadd-background | Czerń | 8,60:1 | 4,50 | ok |
| mosadd-primary na mosadd-card | Czerń | 6,67:1 | 4,50 | ok |
| mosadd-primary-foreground na mosadd-primary | Czerń | 9,00:1 | 4,50 | ok |
| mosadd-secondary-foreground na mosadd-secondary | Czerń | 12,17:1 | 4,50 | ok |
| mosadd-secondary-foreground na mosadd-secondary | Jasny | 12,90:1 | 4,50 | ok |
| mosadd-muted-foreground na mosadd-background | Czerń | 8,22:1 | 4,50 | ok |
| mosadd-muted-foreground na mosadd-background | Jasny | 6,85:1 | 4,50 | ok |
| mosadd-muted-foreground na mosadd-card | Czerń | 6,37:1 | 4,50 | ok |
| mosadd-muted-foreground na mosadd-card | Jasny | 9,23:1 | 4,50 | ok |
| mosadd-muted-foreground na mosadd-muted | Czerń | 5,74:1 | 4,50 | ok |
| mosadd-muted-foreground na mosadd-muted | Jasny | 7,19:1 | 4,50 | ok |
| mosadd-accent-foreground na mosadd-accent | Czerń | 10,89:1 | 4,50 | ok |
| mosadd-accent-foreground na mosadd-accent | Jasny | 13,84:1 | 4,50 | ok |
| mosadd-destructive na mosadd-background | Jasny | 5,53:1 | 4,50 | ok |
| mosadd-destructive na mosadd-card | Jasny | 7,45:1 | 4,50 | ok |
| mosadd-destructive-foreground na mosadd-destructive | Jasny | 7,45:1 | 4,50 | ok |
| mosadd-ring na mosadd-background | Czerń | 8,60:1 | 3,00 | ok |
| mosadd-ring na mosadd-background | Jasny | 3,13:1 | 3,00 | ok |
| mosadd-warning na mosadd-background | Czerń | 9,07:1 | 4,50 | ok |
| mosadd-warning na mosadd-card | Czerń | 7,03:1 | 4,50 | ok |
| mosadd-warning-foreground na mosadd-warning | Czerń | 9,49:1 | 4,50 | ok |
| mosadd-warning-foreground na mosadd-warning | Jasny | 4,86:1 | 4,50 | ok |
| mosadd-info na mosadd-background | Czerń | 5,47:1 | 4,50 | ok |
| mosadd-info na mosadd-background | Jasny | 6,30:1 | 4,50 | ok |
| mosadd-info na mosadd-card | Jasny | 8,48:1 | 4,50 | ok |
| mosadd-info-foreground na mosadd-info | Jasny | 8,48:1 | 4,50 | ok |
| mosadd-sigint na mosadd-background | Czerń | 7,15:1 | 4,50 | ok |
| mosadd-sigint na mosadd-card | Czerń | 5,54:1 | 4,50 | ok |
| mosadd-sigint na mosadd-card | Jasny | 6,00:1 | 4,50 | ok |
| mosadd-comint na mosadd-background | Jasny | 7,47:1 | 4,50 | ok |
| mosadd-comint na mosadd-card | Jasny | 10,06:1 | 4,50 | ok |
| mosadd-masint na mosadd-background | Czerń | 6,76:1 | 4,50 | ok |
| mosadd-masint na mosadd-card | Czerń | 5,24:1 | 4,50 | ok |
| mosadd-masint na mosadd-card | Jasny | 5,65:1 | 4,50 | ok |
| mosadd-iris na mosadd-background | Czerń | 5,30:1 | 3,00 | ok |
| mosadd-iris na mosadd-background | Jasny | 5,42:1 | 3,00 | ok |
| mosadd-iris na mosadd-card | Czerń | 4,10:1 | 3,00 | ok |
| mosadd-iris na mosadd-card | Jasny | 7,30:1 | 3,00 | ok |
| mosadd-iris-ink na mosadd-background | Czerń | 7,37:1 | 4,50 | ok |
| mosadd-iris-ink na mosadd-background | Jasny | 6,50:1 | 4,50 | ok |
| mosadd-iris-ink na mosadd-card | Czerń | 5,71:1 | 4,50 | ok |
| mosadd-iris-ink na mosadd-card | Jasny | 8,76:1 | 4,50 | ok |
| mosadd-brain na mosadd-background | Czerń | 6,82:1 | 4,50 | ok |
| mosadd-brain na mosadd-card | Czerń | 5,29:1 | 4,50 | ok |
| mosadd-brain na mosadd-card | Jasny | 4,74:1 | 4,50 | ok |
| mosadd-mod-dm na mosadd-card | Czerń | 8,46:1 | 4,50 | ok |
| mosadd-mod-dm na mosadd-card | Jasny | 4,88:1 | 4,50 | ok |
| mosadd-mod-dm na mosadd-popover | Czerń | 7,90:1 | 4,50 | ok |
| mosadd-mod-dm na mosadd-popover | Jasny | 4,67:1 | 4,50 | ok |
| mosadd-mod-irc na mosadd-card | Jasny | 6,76:1 | 4,50 | ok |
| mosadd-mod-irc na mosadd-popover | Jasny | 6,47:1 | 4,50 | ok |
| mosadd-mod-call na mosadd-card | Czerń | 5,54:1 | 4,50 | ok |
| mosadd-mod-call na mosadd-card | Jasny | 8,31:1 | 4,50 | ok |
| mosadd-mod-call na mosadd-popover | Czerń | 5,17:1 | 4,50 | ok |
| mosadd-mod-call na mosadd-popover | Jasny | 7,96:1 | 4,50 | ok |
| mosadd-mod-pstn na mosadd-card | Jasny | 5,53:1 | 4,50 | ok |
| mosadd-mod-pstn na mosadd-popover | Jasny | 5,30:1 | 4,50 | ok |
| mosadd-mod-url na mosadd-card | Czerń | 6,81:1 | 4,50 | ok |
| mosadd-mod-url na mosadd-card | Jasny | 5,53:1 | 4,50 | ok |
| mosadd-mod-url na mosadd-popover | Czerń | 6,36:1 | 4,50 | ok |
| mosadd-mod-url na mosadd-popover | Jasny | 5,30:1 | 4,50 | ok |
| mosadd-mod-ayl na mosadd-card | Czerń | 8,92:1 | 4,50 | ok |
| mosadd-mod-ayl na mosadd-popover | Czerń | 8,34:1 | 4,50 | ok |
| mosadd-ptt-go na mosadd-background | Czerń | 8,60:1 | 3,00 | ok |
| mosadd-ptt-go na mosadd-background | Jasny | 3,13:1 | 3,00 | ok |
| mosadd-ptt-ink-go na mosadd-popover | Czerń | 10,06:1 | 4,50 | ok |
| mosadd-ptt-ink-go na mosadd-popover | Jasny | 7,39:1 | 4,50 | ok |
| mosadd-ptt-ink-granted na mosadd-popover | Czerń | 14,09:1 | 4,50 | ok |
| mosadd-ptt-ink-granted na mosadd-popover | Jasny | 11,36:1 | 4,50 | ok |
| mosadd-ptt-ink-tx na mosadd-popover | Czerń | 7,08:1 | 4,50 | ok |
| mosadd-ptt-ink-tx na mosadd-popover | Jasny | 9,50:1 | 4,50 | ok |
| mosadd-ptt-ink-wait na mosadd-popover | Czerń | 10,43:1 | 4,50 | ok |
| mosadd-ptt-ink-wait na mosadd-popover | Jasny | 6,91:1 | 4,50 | ok |
| mosadd-destructive-ink na mosadd-background | Czerń | 6,23:1 | 4,50 | ok |
| mosadd-destructive-ink na mosadd-background | Jasny | 5,53:1 | 4,50 | ok |
| mosadd-destructive-ink na mosadd-card | Czerń | 4,83:1 | 4,50 | ok |
| mosadd-destructive-ink na mosadd-card | Jasny | 7,45:1 | 4,50 | ok |
| mosadd-role-ink-high na mosadd-card | Czerń | 7,29:1 | 4,50 | ok |
| mosadd-role-ink-high na mosadd-card | Jasny | 10,51:1 | 4,50 | ok |
| mosadd-ink-dim na mosadd-card | Czerń | 5,64:1 | 4,50 | ok |
| mosadd-ink-dim na mosadd-card | Jasny | 5,32:1 | 4,50 | ok |
| mosadd-ink-dim-sleep na mosadd-card | Czerń | 6,75:1 | 4,50 | ok |
| mosadd-ink-dim-sleep na mosadd-card | Jasny | 6,71:1 | 4,50 | ok |
| mosadd-ink-counter-muted na mosadd-muted | Czerń | 10,34:1 | 4,50 | ok |
| mosadd-ink-counter-muted na mosadd-muted | Jasny | 7,19:1 | 4,50 | ok |
| mosadd-quiet-60 na mosadd-lp-background | Czerń | 7,37:1 | 4,50 | ok |
| mosadd-quiet-60 na mosadd-lp-background | Jasny | 4,60:1 | 4,50 | ok |
| mosadd-quiet-60 na mosadd-lp-card | Czerń | 7,04:1 | 4,50 | ok |
| mosadd-quiet-60 na mosadd-lp-card | Jasny | 6,20:1 | 4,50 | ok |
| mosadd-quiet-57 na mosadd-lp-background | Czerń | 6,69:1 | 4,50 | ok |
| mosadd-quiet-57 na mosadd-lp-background | Jasny | 4,98:1 | 4,50 | ok |
| mosadd-quiet-57 na mosadd-lp-card | Czerń | 6,40:1 | 4,50 | ok |
| mosadd-quiet-57 na mosadd-lp-card | Jasny | 6,71:1 | 4,50 | ok |
| mosadd-quiet-54 na mosadd-lp-background | Czerń | 6,06:1 | 4,50 | ok |
| mosadd-quiet-54 na mosadd-lp-background | Jasny | 5,39:1 | 4,50 | ok |
| mosadd-quiet-54 na mosadd-lp-card | Czerń | 5,79:1 | 4,50 | ok |
| mosadd-quiet-54 na mosadd-lp-card | Jasny | 7,26:1 | 4,50 | ok |
| mosadd-quiet-51 na mosadd-lp-background | Czerń | 5,47:1 | 4,50 | ok |
| mosadd-quiet-51 na mosadd-lp-background | Jasny | 5,84:1 | 4,50 | ok |
| mosadd-quiet-51 na mosadd-lp-card | Czerń | 5,23:1 | 4,50 | ok |
| mosadd-quiet-51 na mosadd-lp-card | Jasny | 7,86:1 | 4,50 | ok |
| mosadd-quiet-49 na mosadd-lp-background | Czerń | 5,10:1 | 4,50 | ok |
| mosadd-quiet-49 na mosadd-lp-background | Jasny | 6,32:1 | 4,50 | ok |
| mosadd-quiet-49 na mosadd-lp-card | Czerń | 4,87:1 | 4,50 | ok |
| mosadd-quiet-49 na mosadd-lp-card | Jasny | 8,52:1 | 4,50 | ok |
| mosadd-quiet-47 na mosadd-lp-background | Czerń | 4,75:1 | 4,50 | ok |
| mosadd-quiet-47 na mosadd-lp-background | Jasny | 6,85:1 | 4,50 | ok |
| mosadd-quiet-47 na mosadd-lp-card | Czerń | 4,54:1 | 4,50 | ok |
| mosadd-quiet-47 na mosadd-lp-card | Jasny | 9,23:1 | 4,50 | ok |
| mosadd-lp-muted-foreground na mosadd-lp-background | Czerń | 6,27:1 | 4,50 | ok |
| mosadd-lp-muted-foreground na mosadd-lp-background | Jasny | 6,85:1 | 4,50 | ok |
| mosadd-lp-muted-foreground na mosadd-lp-card | Czerń | 5,99:1 | 4,50 | ok |
| mosadd-lp-muted-foreground na mosadd-lp-card | Jasny | 9,23:1 | 4,50 | ok |
| mosadd-lp-destructive na mosadd-lp-background | Czerń | 6,73:1 | 4,50 | ok |
| mosadd-lp-destructive na mosadd-lp-background | Jasny | 5,53:1 | 4,50 | ok |
| mosadd-lp-destructive na mosadd-lp-card | Czerń | 6,43:1 | 4,50 | ok |
| mosadd-lp-destructive na mosadd-lp-card | Jasny | 7,45:1 | 4,50 | ok |
| mosadd-lp-iris na mosadd-lp-background | Czerń | 7,95:1 | 4,50 | ok |
| mosadd-lp-iris na mosadd-lp-background | Jasny | 5,42:1 | 4,50 | ok |
| mosadd-lp-comint na mosadd-lp-background | Czerń | 8,37:1 | 4,50 | ok |
| mosadd-lp-comint na mosadd-lp-background | Jasny | 7,47:1 | 4,50 | ok |
| eter-destructive na eter-background | Czerń | 2,00:1 | 4,50 | ⚠ |
| eter-border na eter-background | Czerń | 1,32:1 | 3,00 | ⚠ |
| eter-input na eter-background | Czerń | 1,32:1 | 3,00 | ⚠ |
| eter-iridescent-blue na eter-background | Czerń | 3,40:1 | 4,50 | ⚠ |
| eter-lamp-down na eter-background | Czerń | 2,38:1 | 3,00 | ⚠ |
| eter-lamp-unknown na eter-background | Czerń | 2,22:1 | 3,00 | ⚠ |
| eter-ink-42 na eter-background | Czerń | 4,03:1 | 4,50 | ⚠ |
| eter-foreground na eter-background | Czerń | 19,98:1 | 4,50 | ok |
| eter-foreground na eter-card | Czerń | 19,98:1 | 4,50 | ok |
| eter-card-foreground na eter-card | Czerń | 19,98:1 | 4,50 | ok |
| eter-popover-foreground na eter-popover | Czerń | 19,98:1 | 4,50 | ok |
| eter-primary-foreground na eter-primary | Czerń | 18,04:1 | 4,50 | ok |
| eter-secondary-foreground na eter-secondary | Czerń | 13,98:1 | 4,50 | ok |
| eter-muted-foreground na eter-background | Czerń | 7,01:1 | 4,50 | ok |
| eter-muted-foreground na eter-muted | Czerń | 5,29:1 | 4,50 | ok |
| eter-accent-foreground na eter-accent | Czerń | 11,71:1 | 4,50 | ok |
| eter-destructive-foreground na eter-destructive | Czerń | 9,28:1 | 4,50 | ok |
| eter-ring na eter-background | Czerń | 13,35:1 | 3,00 | ok |
| eter-iridescent-purple na eter-background | Czerń | 4,75:1 | 4,50 | ok |
| eter-iridescent-pink na eter-background | Czerń | 4,59:1 | 3,00 | ok |
| eter-accent-sygnal na eter-background | Czerń | 5,57:1 | 3,00 | ok |
| eter-lamp-ready na eter-background | Czerń | 8,88:1 | 4,50 | ok |
| eter-lamp-degraded na eter-background | Czerń | 7,81:1 | 3,00 | ok |
| eter-foreground na eter-fiolet-marki | Czerń | 6,35:1 | 4,50 | ok |
| eter-fiolet-zylka na eter-orb-surface | Czerń | 5,36:1 | 3,00 | ok |
| eter-foreground na eter-orb-surface | Czerń | 17,85:1 | 4,50 | ok |
| eter-error-ink na eter-background | Czerń | 8,75:1 | 4,50 | ok |
| eter-ink-90 na eter-background | Czerń | 16,06:1 | 4,50 | ok |
| eter-ink-70 na eter-background | Czerń | 9,75:1 | 4,50 | ok |
| eter-ink-55 na eter-background | Czerń | 6,26:1 | 4,50 | ok |
| eter-world-god-ink na eter-world-god-bg | Czerń | 13,88:1 | 4,50 | ok |
| eter-world-cta-ink na eter-world-god-cta | Czerń | 5,98:1 | 4,50 | ok |
| eter-world-orb-ink na eter-world-orb-bg | Czerń | 17,21:1 | 4,50 | ok |
| eter-world-cta-ink na eter-world-orb-cta | Czerń | 9,80:1 | 4,50 | ok |
| eter-world-system-ink na eter-world-system-bg | Czerń | 15,03:1 | 4,50 | ok |
| eter-world-cta-ink na eter-world-system-cta | Czerń | 6,27:1 | 4,50 | ok |
| eter-world-altar-ink na eter-world-altar-bg | Czerń | 16,40:1 | 4,50 | ok |
| eter-world-cta-ink na eter-world-altar-cta | Czerń | 13,31:1 | 4,50 | ok |
| eng-line na eng-background | Czerń | 1,14:1 | 3,00 | ⚠ |
| eng-line na eng-surface | Czerń | 1,18:1 | 3,00 | ⚠ |
| eng-foreground na eng-background | Czerń | 21,00:1 | 4,50 | ok |
| eng-text na eng-background | Czerń | 21,00:1 | 4,50 | ok |
| eng-text na eng-surface | Czerń | 19,80:1 | 4,50 | ok |
| eng-text na eng-surface-2 | Czerń | 18,42:1 | 4,50 | ok |
| eng-text-dim na eng-background | Czerń | 7,28:1 | 4,50 | ok |
| eng-text-dim na eng-surface | Czerń | 6,86:1 | 4,50 | ok |
| eng-text-dim na eng-surface-2 | Czerń | 6,38:1 | 4,50 | ok |
| eng-signal na eng-background | Czerń | 5,76:1 | 4,50 | ok |
| eng-signal-foreground na eng-signal | Czerń | 5,76:1 | 4,50 | ok |
| eng-focus-ring na eng-background | Czerń | 5,61:1 | 3,00 | ok |
| eng-status-online na eng-background | Czerń | 9,75:1 | 4,50 | ok |
| eng-status-alert na eng-background | Czerń | 5,72:1 | 4,50 | ok |
| eng-iris-1 na eng-background | Czerń | 12,62:1 | 3,00 | ok |
| eng-iris-2 na eng-background | Czerń | 7,97:1 | 3,00 | ok |
| eng-iris-3 na eng-background | Czerń | 5,42:1 | 3,00 | ok |
| eng-world-rayray na eng-background | Czerń | 7,97:1 | 4,50 | ok |

## 5. Fonty — prawdziwe pliki w `/home/claude/ds/project/fonts/`

| Plik | Rodzina · waga | Źródło (komputer właściciela) | sha256 (16) | Rozmiar | Uwagi |
|---|---|---|---|---|---|
| IBMPlexMono-Regular.ttf | IBM Plex Mono · 400 | `C:\m0ssad-3\apps\web\public\fonts\IBMPlexMono-Regular.ttf` | `6a3412f058c7d8df` | 135580 B | pełny krój (latin + latin-ext w jednym TTF, polskie znaki OK); index.css:17 |
| IBMPlexMono-SemiBold.ttf | IBM Plex Mono · 600 | `C:\m0ssad-3\apps\web\public\fonts\IBMPlexMono-SemiBold.ttf` | `d3c38e55c78f5b0f` | 140216 B | jw.; index.css:18 |
| IBMPlexMono-Bold.ttf | IBM Plex Mono · 700 | `C:\m0ssad-3\apps\web\public\fonts\IBMPlexMono-Bold.ttf` | `ac27abd6450a64dd` | 137784 B | jw.; index.css:19 |
| SpaceGrotesk-var.ttf | Space Grotesk · 300 700 | `C:\m0ssad-3\apps\web\public\fonts\SpaceGrotesk-var.ttf` | `acad6de1fc93436f` | 136676 B | zmienny wght 300–700, pełny; index.css:16. Rysuje też `eter-sans` (Eter nie ma własnego pliku) |
| Doto-var-ext.woff2 | Doto · 100 900 | `C:\m0ssad-3\apps\web\public\fonts\Doto-var-ext.woff2` | `6519c8aec5debdea` | 3900 B | zmienny 100–900, latin-ext (polskie diakrytyki); index.css:30 |
| Doto-var.woff2 | Doto · 100 900 | `C:\m0ssad-3\apps\web\public\fonts\Doto-var.woff2` | `0e1a84240f323baf` | 5364 B | zmienny 100–900, latin; index.css:29 |
| InterTight-400-latin-ext.woff2 | Inter Tight · 100 900 | `C:\cymru-main\.claude\skills\3t3r-orb-design\assets\fonts\InterTight-400-latin-ext.woff2` | `fd9beddaaec64494` | 89800 B | ZMIENNY 100–900 — pliki -500/-600/-700/-800 to te same bajty (sha256 identyczne), pominięte; RAYDIO-LP-main/src/styles.css:57-65 |
| InterTight-400-latin.woff2 | Inter Tight · 100 900 | `C:\cymru-main\.claude\skills\3t3r-orb-design\assets\fonts\InterTight-400-latin.woff2` | `77fefe8ca19b9f69` | 44872 B | jw. (LP serwuje ten sam plik także jako -600-latin); styles.css:68-85 |
| GeistMono-400-latin-ext.woff2 | Geist Mono · 100 900 | `C:\cymru-main\.claude\skills\3t3r-orb-design\assets\fonts\GeistMono-400-latin-ext.woff2` | `1a189eb997c3e2ec` | 14696 B | ZMIENNY 100–900 — -500/-600 to te same bajty; styles.css:88-95 |
| GeistMono-400-latin.woff2 | Geist Mono · 100 900 | `C:\cymru-main\.claude\skills\3t3r-orb-design\assets\fonts\GeistMono-400-latin.woff2` | `684ad5b531f81d43` | 23128 B | jw.; styles.css:97-104 |
| DotGothic16-400-latin-ext.woff2 | DotGothic16 · 400 | `C:\cymru-main\.claude\skills\3t3r-orb-design\assets\fonts\DotGothic16-400-latin-ext.woff2` | `1640fece67968044` | 1940 B | statyczny 400; tylko 24 glify (bez ą ć ę ń ś ź ż); styles.css:107-114 |
| DotGothic16-400-latin.woff2 | DotGothic16 · 400 | `C:\cymru-main\.claude\skills\3t3r-orb-design\assets\fonts\DotGothic16-400-latin.woff2` | `d29abf817463fdba` | 10508 B | statyczny 400; styles.css:116-123 |

Tylko w Google Fonts (w `families`, bez pliku): **Black Ops One** (znak Eter) i **Space Grotesk w wersji Eter** 400/600/700 — oba z `cymru-main/index.html:89`. Kopie ENG w `C:\cymru-main\.agents\skills\…\assets\fonts` i `RAYDIO-LP-main\public\fonts` mają te same sha256 co pliki ze skilla.

Kolejność w `type.fonts`: w każdej rodzinie najpierw latin-ext, potem latin (strona nie zna `unicode-range`, więc ostatni zadeklarowany — latin — jest sprawdzany jako pierwszy dla ASCII).

## 6. Pominięte i dlaczego

- mosADD `--sidebar-*` (8 tokenów) — prawie martwe (sidebar-background 0 użyć, reszta ≤16).
- mosADD `.toast-invert` (odwrócona paleta toastów) i `.high-contrast:not(.light)` — wyspy/tryby, nie osobne kolory marki (index.css:616-664, 1693-1700).
- mosADD `--grid-ink`, `--lattice-ink`, `--bevel-*` jako kolory — to atramenty kratownicy (alfa 0.045–0.10) i fazy; faseta jest w `shadow` jako `mosadd-bevel`.
- mosADD fonty equalizera (Nunito, Zilla Slab, Cabin, Atkinson Hyperlegible) — kod mówi wprost, że NIE są częścią systemu, ładowane leniwie po wyborze użytkownika (index.css:32-46, 182-184).
- Eter: rampa text-safe (258 85% 72% / 288 65% 74% / 308 70% 70%, index.css:446; 12 użyć) i `text-white/35` — zabrakło miejsca w limicie 50; liczone w raporcie, nie w tokens.json.
- Eter: @deprecated `--ra-*`, `--petrol-*`, `--cosmic-violet/fuchsia/saffron`, `--gradient-start/end`, `--glow-primary`, `--password-*`, `--sidebar-*` — 0–6 użyć.
- Eter: `--world-*-line` (4 hairline’y świata), `#0e1117` (tło toastu), `#131318`/`#17171f` (pole szukania ORB), gradient CTA `#7c3aed→#a84cb8`, literały palety Tailwinda (#22c55e, #ef4444…) — pojedyncze miejsca albo poza limitem.
- Eter/ENG: jasne motywy Arrival/ARRIVAL — patrz W4 (wartości w `usage`).
- ENG: `--secondary(-foreground)`, `--accent(-foreground)`, `--popover-foreground`, `--destructive-foreground`, `--chart-1..5`, `--sidebar-*` — aliasy już pokryte; `--status-reserve/concept/retired` — color-mix (W19); `--ring-iris` — zdefiniowany, nieużyty w JSX.
- Gradienty (`--gradient-cosmos`, `--orb-gradient-eter`, `.bg-iris`) — gramatyka przyjmuje tylko kolory jednolite.
- Skill `worlds.css` twarze monumentów (`--face-*`, `--scene-accent`) — ilustracja, nie UI.
- Spacing mosADD — mosADD nie ma skali tokenów odstępów (siatka 4 px Tailwinda, RULES G2); wspólna skala `spacing` dotyczy 3t3r.com + orb.3t3r.com (paczka-16).

## 7. Jak to sprawdzono

- Wartości kolorów czyta parser CSS (`/home/claude/tokwork/cssvars.py`) z konkretnego bloku (`:root` 148-435, `.light` 440-601, `.force-dark` 702-807, `.lp-motion.force-dark` 692-700 w mosADD; `:root` 15-157 w Eter; `:root` 197-425 w RAYDIO-LP), więc `path:line` w `usage` pochodzi z parsera. Różnice `.force-dark` vs `:root` wyliczone automatycznie (9 tokenów + 3 z `.lp-motion.force-dark`; sidebar pominięty).
- Liczby użyć: jedno przejście po wszystkich .ts/.tsx (bez testów) w `apps/web/src` i `cymru-main/src`.
- Kontrast: WCAG 2.x (luminancja względna), alfa składana na podłożu. Sprawdzian: dla światów Skarbca wynik zgadza się co do setnej z pomiarami zapisanymi w worlds.css:29-33, a fokus ENG = 5,61:1 jak w styles.css:408.
- Walidator `/home/claude/tokwork/check_tokens.py`: regex nazw, unikalność między rodzinami, format kolorów (hex / hsl z liczbami, bez var/color-mix), istnienie celów aliasów i brak cykli, limity (600/40/12/12/80/60, marki 80/50/30), długość `usage` ≤1000, obecność `path:line` w każdym `usage`, istnienie i rozmiar plików fontów. Wynik: 0 błędów, 0 ostrzeżeń.
- Pliki fontów: skopiowane bajt w bajt ze stagingu (sprawdzone porównaniem), sha256 i osie wght odczytane fontTools.
- Staging: nowsze wersje `m0ssad-3/apps/web/src/index.css` i `components/TopNavBar.tsx` zastąpiły starsze kopie w `/mnt/user-data/uploads/…` (kopia sprzed zmiany: `/home/claude/tokwork/mosadd-index.cloud-copy.css`; różnice tylko za linią 2410: dopisane reguły `.nav-icon-btn::after` i napisu SEARCH, +13 linii). W podłączonych folderach na komputerze nic nie zapisano; jeden plik tymczasowy w odizolowanej VM (`$HOME/tokwork`) został utworzony i od razu skasowany.
- Uczciwie: jedno wyszukiwanie `grep -r "6b3fd6"` objęło cały katalog `RAYDIO-LP-main`, więc przeszło też przez jego `.env` i `.env.local` (bez trafień — nic z tych plików nie zostało wyświetlone ani zapisane). Plików KLUCZ-*.txt i keystore nie dotykałem.
