# Dostępność — jeden próg dla trzech marek

Wartości zmierzone, nie deklarowane. Każdy kontrast ma podłoże, na którym był liczony.

## Dotyk

- Cel dotykowy min `touch-min` **44 px** w każdej marce, bez wyjątków.
- mosADD realizuje go przez `::after` na przycisku — ⛔ nigdy przez margines (nagłówek `h-9` 36 px, piramida LP 36 px + 8, `LandingHeader.tsx:46`).
- Eter: wiersz `WierszKanonu` min 78 px, kolumna znaku 44 px, znak 36 px.

## Fokus

Widoczny w każdej marce, ≥3:1 na swoim podłożu: mosADD `mosadd-ring` (zieleń), Eter `eter-fiolet-zylka` na polu szukania, Engineering `eng-focus-ring`.

## Kontrasty — stan zmierzony

| Marka | Miejsce | Wartość | Status |
|---|---|---|---|
| mosADD | `mosadd-primary` jako TEKST w motywie Jasnym | 3,13:1 | ⚠ poniżej 4,5:1 — zieleń jako tekst tylko w motywie Czerń |
| Eter | `eter-ink-42` | 4,03:1 | ⚠ wyłącznie nagłówek grupy, nigdy treść |
| Eter | biel na CTA świata Skarbca | 1,58–3,51:1 | ⛔ dlatego napis na CTA świata jest CZARNY (`eter-world-cta-ink`) |
| Engineering | biel `eng-text` na `eng-background` #000 | ⏳ niezmierzone | do pomiaru przez GOD OF RA DESIGN |

Zasada: wartość bez daty pomiaru i bez źródła to plotka. Wpisując kontrast, podaj parę kolorów i podłoże.

## Ruch

Polityka reduce-motion i jej jedyny wyjątek (wizual marki na LP) — 70-ruch. Poza `components/landing/*` reduce-motion honoruje wszystko.

## Tekst

- Minimum tekstu HTML na LP mosADD: 11 px (zamówienie LP-029).
- ⚠ DotGothic16 nie ma polskich znaków — polski tekst w Engineering idzie w Geist Mono.
- Status nigdy samym kolorem: zawsze kropka **i** słowo (`eng-status-live` „Live now”, `eng-status-coming`). Ta sama reguła obowiązuje mosADD i Eter — kolor nie niesie znaczenia sam.
- ⛔ W Eterze zieleń znaczy wyłącznie „wliczone w plan”. Kolor, który w jednej marce znaczy stan, a w drugiej plan, jest pułapką dla daltonisty i dla czytającego szybko.
