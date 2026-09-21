# mosADD

Produkt operacyjny dla jednoosobowej firmy: komunikacja, agenci i pamięć z jednego telefonu. Hasło `1-MAN-ARMY`, nagłówek LP `1-MAN-ARMY OPS DECK`. Kod: `C:\m0ssad-3\apps\web`.

## Kolor

- Paleta ma trzy kopie w `apps/web/src/index.css`: `:root` (apka, motyw Czerń), `.light` (motyw Jasny), `.force-dark` (LP w ciemnym motywie → tokeny `mosadd-lp-*`). ⛔ Zmiana koloru, która dotyka jednej kopii, jest niedokończona (`index.css:429`).
- Na zewnątrz — favicon, PWA, APK, LP — mosADD nosi wyłącznie zieleń `mosadd-primary`.
- ⛔ Słońce w sygnetach jest ZIELONE także wewnątrz apki (Król 17.09: „FIOLETOWE SŁOŃCE JEST W ETERZE, a ZIELONE w mosADD”, `components/icons/brandSun.ts`). `mosadd-iris` zostaje dla trybu sealed w mDM; `mosadd-brain` (orchidea) znaczy pamięć — nakładka i chipy mRAG.
- Tekst: `mosadd-foreground` na `mosadd-background` i `mosadd-card`; przygaszony `mosadd-muted-foreground` (najczęstszy kolor tekstu w produkcie). Zieleń jako tekst tylko w motywie Czerń — w Jasnym `mosadd-primary` ma 3,13:1 na tle (⚠).
- Moduły mają własne barwy `mosadd-mod-*`; nazwa modułu w dropdownie nagłówka jest pisana barwą modułu.
- Tekst na pełnej zieleni: `mosadd-primary-foreground` (czerń w motywie Czerń).

## Typografia

- IBM Plex Mono (`mosadd-mono`, wagi 400/600/700) — cały UI i dane. Drabina rozmiarów żyje w `tailwind.config.js` (`text-tag` 8 px … `text-hero-app` 14 px), nie tylko w tokenach.
- LP: H1 w IBM Plex Mono 700 WERSALIKAMI (`mosadd-lp-h1`), H2 w Space Grotesk (`mosadd-lp-h2`). ⚠ R4 uznaje Space Grotesk za wycofany, ale H2 jeszcze go noszą.
- Znak słowny: Doto (`mosadd-wordmark`) tylko od 16 px; poniżej znak idzie w mono (`components/brand/Wordmark.tsx:82,89`).
- Minimum tekstu HTML na LP: 11 px (zamówienie LP-029).

## Kształt i głębia

- Kwadrat. `mosadd-radius-sm` = 0 to kanon (1267 użyć), `mosadd-radius` 4 px to wyjątek (31 użyć).
- Głębia = stopień powierzchni (`mosadd-background` → `mosadd-card` → `mosadd-popover`) + obwódka `mosadd-border`. Cień tylko tam, gdzie zamówił go Król: przycisk dropdownu `mosadd-dropdown-shadow`, lista `mosadd-dropdown-list-shadow`.

## Nagłówek i panele — kanon 19.09

Król 19.09 01:37: „Nie chcę tu żadnych marginesów, nie mamy miejsca na to.” Stan kodu: `TopNavBar.tsx`, `overlays/SidePanelHeader.tsx`, commity `b4988c68` · `40c33059` · `b28477d9` · `c4d5f4fd`.

- **Pasek:** `[dropdown kanałów] [SEARCH + znak mRAG] [mARMY] [mOPS] [mVAULT]`, poziomo `px-3` (12 px), kontrolki `h-9` (36 px), pełne tło bez rozmycia, zero kreski pod paskiem — proporcje ściany „od miesięcy” (WallHeader 17.09).
- **Dropdown kanałów:** kwadrat, obwódka `mosadd-border`, cień `mosadd-dropdown-shadow`, ikona 20 px, nazwa w barwie modułu, mono 700, tracking 0,2em. Wszystkie pozycje listy równe (`c4d5f4fd`).
- **SEARCH:** bez ramki (Król 02:08). Napis `SEARCH:` mono 700, wersaliki, tracking 0,15em, `mosadd-muted-foreground`, zawsze w całości przy 375 px. Znak mRAG 24 px zaraz za napisem — dwudziestościan `pamiec` = 3T3R MÓZG (rozkaz Króla 19.09: „To jest ikona mRAG”; merkaba to NIE ten znak), słońce zielone i MAŁE — r 8,5 w polu 100, proporcja 3T3R MÓZG, we wnęce przedniego trójkąta (decyzja ADMIRAŁA 19.09 10:05Z; kołowrót, sześcian i piramida mają r 16), `MragIcon.tsx`. Klik otwiera mRAG, drugi klik zamyka. Pole rozwija się w prawo.
- **Sygnety:** cztery identyczne — znak mRAG (dwudziestościan `pamiec`), kołowrót (mARMY), sześcian (mOPS), piramida (mVAULT). 24 px w polu 36 px, barwa modułu, zielone słońce, BEZ podpisów. Stałe — nic ich nie przykrywa. Ikona otwartego panelu animuje otwarcie i zamknięcie; drugi klik zamyka panel.
- **Pas tytułu panelu:** `h-14` (56 px), `px-4` (16 px), tytuł `text-title` 700 tracking 0,3em w barwie modułu. Bez kopii sygnetu, bez „✕ CLOSE”, bez podtytułów, bez martwego slotu 44 px.
- **Panel:** na cały ekran pod stałym paskiem sygnetów (`c4d5f4fd`).
- ⛔ **Jeden margines kolumny: 16 px (`px-4`) wszędzie naraz** — pas tytułu, lista, karty, płótno mRAG. Zmiana 24 → 16 px 19.09. Nikt nie dokłada własnego wcięcia wewnątrz kolumny.
- Cel dotyku 44 px przez `::after` na przycisku, nigdy przez margines.

## CTA, plany, uczciwość

- CTA: `[ BUILD YOUR ARMY — FREE ]` → `/auth`, zawsze ten sam cel. Na telefonie (≤600 px) wolno skrócić do `[ START FREE ]`.
- Plany (DECYZJE 18.09 23:20): RECON $0 · COMMANDER $19/mo (podświetlony) · SOVEREIGN $49/mo. Dodatki: agent ponad plan $9/mo · mRAG +100 GB $5/mo · numer agenta $2/mo · mCALL $0,02/min · Blackbox $19/odzysk · klucze modeli po koszcie +25%. Nie FREE/PRO/TEAM/ENTERPRISE, nie OPERATOR, nie COMMAND.
- Słownik uczciwości: poczta = SMTP/TLS, nie E2EE · mRAG = indeks po stronie serwera, per konto, izolowany · „on device” tylko mDM · pokoje mieszane (prywatne na kluczu grupy, otwarte po stronie serwera) · „Cloud today · self-hosted on request” · mCALL i Blackbox „soon” · mURL działa (Król 19.09 02:17–02:25).

## MISJA KILLERSKA (rozkaz Mon Ra 20.09)
mosADD i 3T3R to KOBYŁY — zabijają: WhatsApp, Telegram, Discord, Slack, Gmail, Tinder.
Flota pracuje nad nimi jak nad bronią, nie apką: każda sesja zna moduły (mDM/mIRC/mTALK/mAYL/mRAG/mCALL/mVAULT/mURL/mARMY),
repo (C:\m0ssad-3, C:\cymru-main), kanon (docs/kanon-RA) i NIE gubi się we własnym gównie — stan zawsze z
#command + REJESTR + mRAG, nie z pamięci.
