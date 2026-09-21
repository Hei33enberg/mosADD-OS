# Ruch — jedno miejsce na animacje trzech marek

Do 20.09 reguły ruchu leżały w trzech miejscach naraz (README §Ruch, 40-ikony pkt 5, komentarz w `lpMotion.ts`). To jest to jedno miejsce; tamte odsyłają tutaj.

## Zasada nadrzędna: reduce-motion

Dwa światy, nie jeden:

- **Wizual marki na stronie marketingowej gra ZAWSZE**, także przy systemowym Reduce Motion. Decyzja właściciela 11.08, zgłaszana wielokrotnie („nadal nie naprawiłeś tej animacji, zgłaszam to 30 razy”) — jego telefon ma Reduce Motion włączone, więc każdy wizual LP, który sam się wygaszał, był u niego martwy: orbita modułów, mózg mRAG, wachlarz fan-out, wiersze szyfrowania, licznik, maszynopis. Wykonanie w dwóch połowach: CSS — wyjątek `.lp-motion` od globalnego wygaszenia ruchu; JS — `apps/web/src/components/landing/lpMotion.ts`, `lpBrandMotion()` zawsze `true`.
- **Reszta aplikacji reduce-motion honoruje** — dashboard, panele, wątki. Tam ruch jest funkcjonalny, nie marketingowy, i użytkownik z zaburzeniami przedsionkowymi ma prawo go wyłączyć (`lpMotion.ts`, ZAKRES).
- Zasięg wyjątku: wyłącznie `components/landing/*`. Surowe ustawienie systemowe czyta się przez `prefersReducedMotion()` i to ono decyduje poza LP.
- ⛔ Odwrócenie decyzji to JEDNA linia w `lpMotion.ts` (`return prefersReducedMotion()`), nie polowanie po sześciu plikach. Nie rozsiewaj bramek ruchu po komponentach.

## Ikony — ruch tylko w stanie aktywnym

Trzy marki, jedna reguła: w spoczynku ikona stoi; rusza się otwarty panel, naciśnięty sygnet, wiersz pod palcem. Pełne wartości i dowody: 40-ikony pkt 5. Skrót kanonu (mosADD, stan 19.09 wieczór):

- Pasek sygnetów: cykl 4 s, głębia 0,58, przechył 3,7° — te same dla MÓZGU (mRAG), kołowrotu, sześcianu, piramidy.
- Po zamknięciu obrót DOGASA do pozy kanonicznej: znak mRAG ≤0,5 s, sześcian ×4 do pełnego obrotu ≤1 s, jednym hookiem `useDogasanieObrotu`. ⛔ Nic nie pauzuje na przypadkowym kącie — przechylony sześcian zmieniał szerokość atramentu i rozjeżdżał odstępy czterech sygnetów.
- Słońce nie obraca się z klatką: zapala się (.55 → .95) i oddycha. W spoczynku świeci równo (.35 u trzech sąsiadów, .55 u znaku mRAG w każdym miejscu — pasek, wiersze menu, cennik, zakresy OAuth).
- Rozkaz Króla 19.09 13:29Z: „Ikonka mRAG nie wchodzi w stan animacji po kliknięciu”. Uchyla wcześniejsze agenckie „nie obraca się nigdy” — rozkaz z 18.09 04:45 dotyczył SPOCZYNKU, nie każdego stanu.
- Technika: CSS transform. ⛔ Bez WebGL i bez canvas do ikon.

## LP — klimat scen

Decyzja Króla 19.09 08:5x (DECYZJE-KROLA, wpis GOD OF RA DESIGN): **radar 3D z kropek**. Okrąg radaru jako tuba w głąb, wiązka zapala kropki, w środku znak mRAG (MÓZG) jako bryła — klatka ⊃ piramida ⊃ słońce, obracają się w różnych kierunkach i wracają do pozy znaku. Zamiast przelotu przez sygnety. ⛔ Kołowrotu nie rysować z kropek. Kolejne sceny LP idą w tym samym klimacie: „fajny styl, ale … w okręgu radaru, nie 2D tylko 3D”, po wersji 3D: „teraz sztos … leć kolejne, bo klimat jest petarda”.

Wizuale marki z `forceMotion` (diagram Channels, `MragKeyVisual`, ikony kanałów) grają kołysanie klatki i oddech słońca także przy reduce-motion — to ta sama polityka `.lp-motion`.

## 3T3R (Eter)

- Znak ma dwa stany: spoczynek i życie. Żyje wyłącznie wiersz pod palcem i wiersz, na którym stoisz.
- ⛔ Zero `backdrop-filter` nad żywą sferą (18.09: „zero rozmycia — tła pełne”).
- Głębia to poświata `eter-glow-*`, nigdy cień rzucany — cień to nie jest ruch, ale wchodzi w tę samą rodzinę błędów.
- Ładowanie = szkielet. ⛔ Zero kręciołków, zero toastów.

## 3T3R Engineering

- Animuje się tylko to, co jest „live”. Status = kropka + słowo, nie migotanie.
- `backdrop-filter` wyłącznie w modalach; preload tylko krojów z pierwszego ekranu.

## Czego ruch nie robi

- Nie zastępuje stanu. Jeśli coś jest włączone, widać to bez animacji.
- Nie ozdabia spoczynku. Cztery sygnety stoją równo — jeden ruszający się z czterech to błąd, nie akcent (naprawione 19.09).
- Nie łamie celu dotyku ani kontrastu. Kontrasty: 85-dostepnosc.
