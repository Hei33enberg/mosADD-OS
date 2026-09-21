# 3T3R Engineering — ORB (orb.3t3r.com · rayray.3t3r.com)

Warsztat i sprzęt. Na ciele ORB-a zawsze napis RAYRAY, a pod nim „ORB by 3T3R”. Hasło `God is a DJ`. Kod: `C:\cymru-main\RAYDIO-LP-main`.

rayray.3t3r.com jest WZORCEM rodziny: `//00 WHAT HE IS` · „Nine truths about Him.” · rysunek z wymiarem i portami w prawdziwym rozstawie · „Three circuits. With a switch open, no software can close it.” · „€0 a month, forever. Nothing to subscribe to.” · status jawny `BATCH 01 · EST. Q3 2028 · CONCEPT`. Kto nie wie, jak ma brzmieć strona z tej stajni, patrzy tam.

## Kolor

- Płótno `eng-background` #000 — świadomie, nie #06090F (`src/styles.css:204-210`: stara paleta „czytała się jak granat”).
- Jedyny akcent: `eng-signal` #f04a41, napis na nim czerń `eng-signal-foreground`. Biel `eng-text`, drugi tekst `eng-text-dim`.
- Jedyny obrys: włos `eng-line` (biel 8 %). Powierzchnie `eng-surface` #0a0a0a i `eng-surface-2` #141414 oddzielają, nie rozjaśniają.
- Status zawsze kropką I słowem: `eng-status-live` („Live now”), `eng-status-coming`.
- Kolor światła w ORB wynika z tego, co da hardware wg BOM — nie z gustu.

## Typografia

- Inter Tight (`eng-sans`, plik zmienny 100–900): hero 96 px / 600 (`eng-hero`), H2 48 i 36 px, zdanie 36 px / 300 (`eng-statement`).
- Geist Mono (`eng-mono`): etykiety 11 px wersaliki, CTA 13 px / 500 (`eng-cta`).
- DotGothic16 (`eng-dot`): znak RAYRAY i numery `//NN`. ⚠ Brak polskich znaków — polski tekst idzie w Geist Mono.

## Rysunek zamiast ekranu

- Obiekt pokazujesz rysunkiem technicznym: linie wymiarowe z odsadzkami, porty w prawdziwym rozstawie z pinami, przekrój, tabliczka rysunkowa. Tylny panel ORB: trzy suwaki + porty, bez pokrętła.
- Napis na obudowie: retro grawer laserowy na aluminium, nie tampodruk.
- Karty `eng-radius-card` 14 px, plansze `eng-radius-plate` 18 px, zrzuty `eng-radius-shot` 26 px, chip specyfikacji `eng-radius-md` 8 px (jedyna kontrolka, która nie jest pigułką).
- Wizuale produktu powstają z renderów Króla jako referencji (fal.ai), nie z siatki 3D ani z opisu.

## CTA i uczciwość

- Jedno CTA na widok: pełna czerwona pigułka `eng-signal`, mono wersaliki, wysokość 48 px (`control-h-cta`), przy zamkniętej kasie etykieta listy oczekujących, nie zaliczki (`ReserveCta`).
- Reguły kodu: bez zaliczki i bez licznika sztuk, bez tabeli porównań, każda specyfikacja z gwiazdką, status = kropka + słowo; słowa „AI”, „assistant”, „chatbot”, „LLM”, „prompt”, „token” zakazane w tekście dla ludzi (UCPD zał. I pkt 7, dyrektywa 2006/114/WE).
- Wydajność: `backdrop-filter` tylko w modalach; preload tylko krojów z pierwszego ekranu; animuje się tylko „live”.
- ⚠ `God is a DJ` ma dziś 0 wystąpień na rayray.3t3r.com (LINEAR-5980 — sloty wskazane).
