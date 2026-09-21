# IKONY — raport GOD OF RA DESIGN

Data: 19.09.2026, ok. 01:25 UTC. Zakres: grupy ikon i znaków trzech marek RA (mosADD, 3T3R/Eter, 3T3R Engineering) dla systemu projektowego.
Pliki: `/home/claude/ds/project/assets/<grupa>/`. Arkusz kontrolny: `/home/claude/ds/raport/ikony-arkusz.png`.

**Status:** kanon ikon trzech marek to ⏳ PROPOZYCJA. W `DECYZJE-KROLA.md` nie ma jeszcze „TAK” Króla (wiersz „Kanon ikon 3 marek”, stan pliku 19.09 00:59 UTC).
Zasada „wspólny styl, kolor słońca per marka” to słowa Króla z 17.09, zacytowane w `m0ssad-3/apps/web/src/components/icons/brandSun.ts:31-40`: „to nasz styl wspólny ze stajni RA”, „FIOLETOWE SŁOŃCE JEST W ETERZE, a ZIELONE w mosADD”.
Czerwone słońce Engineering to propozycja z `KANON-IKON-3-MAREK.md` (zasada 4), nie słowa Króla.

> ⛔ **Dopisek 19.09 (po rozkazie Króla o znaku mRAG).** Wszystko, co ten raport mówi o `HexagramIcon` / merkabie jako znaku mRAG, jest NIEAKTUALNE. Król 19.09: „To nie jest heksagram, jaki wybraliśmy… To nie jest ta ikona” oraz, o zakreślonym wierszu MÓZG w Eterze: „To jest ikona mRAG”. Znak mRAG = dwudziestościan `pamiec` (3T3R MÓZG), komponent `m0ssad-3/apps/web/src/components/icons/MragIcon.tsx`; `HexagramIcon.tsx` usunięty. Pliki `assets/Ikony mosADD/mosadd-mrag(-aktywny).svg` wyrenderowane na nowo z `MragIcon` (patrz README tej grupy). Raport niżej zostaje jako zapis stanu z 01:25 UTC.

## 1. Liczby

| grupa (folder) | SVG | PNG | README | co to |
|---|---|---|---|---|
| `Ikony 3T3R` | 34 | 0 | ✔ | `eter-<klucz>.svg`, bryły z kanonu PO, słońce iridescent |
| `Ikony Engineering` | 12 | 0 | ✔ | `eng-*.svg`, ten sam szkielet, słońce `#f04a41` |
| `Ikony mosADD` | 13 | 0 | ✔ | 4 sygnety × (spoczynek, aktywny) + 5 kanałów |
| `Znaki` | 1 | 2 | ✔ | favicon mosADD (SVG), launcher mosADD 512, sygnet 3T3R 512 |
| `ORB` | 1 | 0 | ✔ | rysunek „GENERAL ARRANGEMENT” (nie jest znakiem) |
| **razem** | **61** | **2** | 5 | |

Wszystkie SVG przeszły automatyczną kontrolę:
- `xmlns` jest, `viewBox` zachowany, `width`/`height` = 48;
- zero `var()`, zero `currentColor`, zero odwołań zewnętrznych (`href`, `url(http…)`, `@import`, `<image>`, `<use>`);
- każde `url(#…)` wskazuje id w tym samym pliku;
- 204 id gradientów i filtrów, bez żadnego powtórzenia między plikami;
- każdy plik ≤ 60 kB.

## 2. A — Ikony 3T3R: dowód, że nic nie zginęło

**Źródło geometrii potwierdzone trzy razy.** 34 komórki `KANON-IKON-BRYLY-PO.html`:
- są bajt w bajt równe kolumnie „36 PO” z `IKONY-BRYLY-3T3R-18-09.html`;
- są bajt w bajt równe temu, co dziś renderuje `cymru-main/src/components/ui/SolidGlyph.tsx` (md5 `c353ed58…`, `size=36`, 34/34);
- klucze zgadzają się z `BRYLY` w SolidGlyph. Jedyna bryła spoza kanonu to `sciana`.

**Metoda.** Chromium 141 (Playwright), 96 px, `deviceScaleFactor` 1.
- Oryginał renderuje się w swojej stronie, ze swoimi zmiennymi CSS. Dołożyłem tylko CSS układu: schowane nagłówki, siatka 148 px, svg 96 px, żeby wszystko stało na całych pikselach.
- Nowy plik wstawiam w identyczną kopię tej strony, w miejsce `<svg>` tej samej komórki: jako `<img src>` albo inline. Stoi więc dokładnie w tym samym miejscu.
- Dlaczego tak: zmierzyłem, że Chromium wygładza krzywe zależnie od położenia na stronie. Ta sama komórka na x=61 i na x=961 różni się o 62/255 na krawędziach elips. Porównanie z osobną stroną testową mierzyłoby renderer, nie plik.

**Kolumny tabeli** (max różnica kanału /255, w nawiasie liczba różnych pikseli z 9216):
- **inline** — znaczniki nowego pliku inline vs oryginał; biel aplikacji `0 0% 100%` podana stronie. Mierzy samą konwersję.
- **`<img>`** — nowy plik jako `<img>` (tak będzie wyświetlany) vs oryginał inline, biel aplikacji.
- **kontrola** — oryginalne znaczniki komórki (z `var()`, zmienne w wewnętrznym `<style>`) jako `<img>` vs nowy plik jako `<img>`.
- **KANON 98%** — `<img>` vs strona KANON dokładnie taka, jaka jest, z bielą `0 0% 98%`.
- **18-09 PO** — `<img>` vs strona źródłowa `IKONY-BRYLY-3T3R-18-09.html`, kolumna „36 PO”, jej własne zmienne (biel 100%), tło #000.

**Wynik:**
- inline: 0/255 dla 34/34. Konwersja jest bezstratna.
- `<img>`: max 2/255. Kontrola daje 0/255 dla 34/34: oryginalne znaczniki pokazane przez `<img>` są piksel w piksel takie jak nowy plik. Te 2/255 to więc sposób, w jaki Chromium składa obraz SVG na tle `#06090F` (zaokrąglenie 8-bit), nie strata w pliku. Na czarnym tle strony 18-09 (ostatnia kolumna) 30/34 plików jest identycznych, reszta ≤1/255.
- KANON 98%: max 6/255. To świadoma różnica: strona KANON ma `--foreground: 0 0% 98%` (`KANON-IKON-BRYLY-PO.html:4`), a aplikacja i strona źródłowa 18-09 mają `0 0% 100%` (`cymru-main/src/index.css:47`). Pliki idą za aplikacją, jak kazano.
- Jedna poprawka po drodze: literał `hsl(0 0% 100% / 0.92)` dawał 1/255 dryfu wobec `var()`. `hsl(0 0% 100%)` + `stop-opacity="0.92"` daje 0/255 i tak jest w plikach.

| plik | inline (fg app) | `<img>` (fg app) | kontrola: oryginał jako `<img>` | `<img>` vs KANON 98% | `<img>` vs 18-09 PO |
|---|---|---|---|---|---|
| `eter-charakter.svg` | 0 | 2 (2686 px) | 0 | 6 (4315 px) | 0 |
| `eter-pamiec.svg` | 0 | 2 (2463 px) | 0 | 6 (3932 px) | 0 |
| `eter-glos.svg` | 0 | 2 (1850 px) | 0 | 6 (2894 px) | 1 (162 px) |
| `eter-umiejetnosci.svg` | 0 | 2 (2246 px) | 0 | 6 (3550 px) | 0 |
| `eter-lustro.svg` | 0 | 2 (1800 px) | 0 | 5 (3212 px) | 0 |
| `eter-przeznaczenie.svg` | 0 | 2 (1639 px) | 0 | 5 (2518 px) | 0 |
| `eter-orbSettings.svg` | 0 | 2 (2980 px) | 0 | 6 (4487 px) | 0 |
| `eter-konto.svg` | 0 | 2 (1964 px) | 0 | 6 (2899 px) | 0 |
| `eter-blysk.svg` | 0 | 2 (1544 px) | 0 | 6 (2681 px) | 0 |
| `eter-telemetria.svg` | 0 | 2 (1603 px) | 0 | 6 (2652 px) | 0 |
| `eter-ustawienia.svg` | 0 | 2 (1512 px) | 0 | 6 (2559 px) | 0 |
| `eter-pobierania.svg` | 0 | 2 (1999 px) | 0 | 6 (2898 px) | 0 |
| `eter-wiadomosci.svg` | 0 | 2 (1556 px) | 0 | 5 (2697 px) | 0 |
| `eter-ludzie.svg` | 0 | 2 (1717 px) | 0 | 6 (2673 px) | 0 |
| `eter-profil.svg` | 0 | 2 (2577 px) | 0 | 6 (3795 px) | 0 |
| `eter-zaproszenia.svg` | 0 | 2 (1353 px) | 0 | 6 (2202 px) | 0 |
| `eter-karty.svg` | 0 | 2 (1635 px) | 0 | 6 (3165 px) | 0 |
| `eter-obecnoscBoga.svg` | 0 | 2 (2747 px) | 0 | 6 (4386 px) | 0 |
| `eter-kokpit.svg` | 0 | 2 (1507 px) | 0 | 6 (2857 px) | 0 |
| `eter-telewizor.svg` | 0 | 2 (1644 px) | 0 | 5 (2399 px) | 1 (105 px) |
| `eter-wyloguj.svg` | 0 | 2 (1532 px) | 0 | 5 (2622 px) | 0 |
| `eter-klodka.svg` | 0 | 2 (2121 px) | 0 | 6 (3531 px) | 0 |
| `eter-klawiatura.svg` | 0 | 2 (1816 px) | 0 | 5 (3052 px) | 0 |
| `eter-tarcza.svg` | 0 | 2 (1812 px) | 0 | 6 (2943 px) | 0 |
| `eter-klucz.svg` | 0 | 2 (1496 px) | 0 | 6 (2461 px) | 0 |
| `eter-dzwon.svg` | 0 | 2 (1635 px) | 0 | 6 (2516 px) | 0 |
| `eter-suwaki.svg` | 0 | 2 (2123 px) | 0 | 6 (3435 px) | 0 |
| `eter-glob.svg` | 0 | 2 (2699 px) | 0 | 6 (4204 px) | 0 |
| `eter-komputer.svg` | 0 | 2 (1997 px) | 0 | 6 (3256 px) | 0 |
| `eter-telefon.svg` | 0 | 2 (2252 px) | 0 | 6 (3739 px) | 0 |
| `eter-pendrive.svg` | 0 | 2 (1717 px) | 0 | 6 (2873 px) | 0 |
| `eter-warstwy.svg` | 0 | 2 (2195 px) | 0 | 6 (3455 px) | 1 (300 px) |
| `eter-wtyczka.svg` | 0 | 2 (1614 px) | 0 | 6 (2682 px) | 0 |
| `eter-nawiasy.svg` | 0 | 2 (1732 px) | 0 | 6 (2701 px) | 1 (2 px) |

## 3. B — Ikony Engineering: przydział i kolory

Szkielet każdej ikony to komórka kanonu PO, bajt w bajt (sprawdzone automatycznie). Zmieniają się tylko gradienty `sR` (słońce) i `pR` (poświata): jeden kolor `#f04a41` (`--signal`, `.claude/skills/3t3r-orb-design/tokens/colors.css:18`) w stopniach krycia 0.95 / 0.7 / 0.4, czyli sposób mosADD (`HexagramIcon.tsx:55-57`, `brandSun.ts:46`), a poświata 0.55 / 0.18 / 0.
Klatka: `#ffffff` (`--foreground`, `colors.css:10`) w stopniach 1 / 0.92 / 0.74. Autor: GOD OF RA DESIGN, stan ⏳ PROPOZYCJA (zasady 1–6 `KANON-IKON-3-MAREK.md`).

**Test „zmienia się tylko słońce”.** Każdy `eng-*` i jego źródło `eter-*` renderuję jako `<img>` 96 px w tym samym układzie. Liczę odległość każdego różniącego się piksela od środka słońca. Wszystkie leżą w dysku poświaty (promień 2,6 × 2,04 j. = 21,22 px).

| plik | klucz kanonu | bryła | znaczenie | środek słońca (j. 24) | różnych px | najdalszy różny px od środka |
|---|---|---|---|---|---|---|
| `eng-orb.svg` | `orbSettings` | kula geodezyjna | ORB — urządzenie | (12, 12) | 1376 | 20.99 ≤ 21.22 ✔ |
| `eng-glos.svg` | `glos` | ośmiościan | mikrofony / głos | (12, 12) | 1385 | 20.99 ≤ 21.22 ✔ |
| `eng-porty.svg` | `wtyczka` | wtyczka | porty w rzeczywistej podziałce | (10.9, 12.8) | 1320 | 21.03 ≤ 21.22 ✔ |
| `eng-obwody.svg` | `suwaki` | trzy suwaki | trzy obwody = trzy przełączniki tylnego panelu | (12, 8.6) | 1353 | 21.04 ≤ 21.22 ✔ |
| `eng-lokalnie.svg` | `komputer` | otwarty laptop | działa lokalnie | (13.85, 9.7) | 1377 | 21.0 ≤ 21.22 ✔ |
| `eng-sejf.svg` | `klodka` | kłódka | sejf | (10.75, 15.75) | 1356 | 20.99 ≤ 21.22 ✔ |
| `eng-pasmo.svg` | `telemetria` | pryzmat | pasmo (bandwidth) | (11.6, 13.6) | 1355 | 20.98 ≤ 21.22 ✔ |
| `eng-energia.svg` | `blysk` | graniastosłup błyskawicy | wyładowanie / energia | (11.5, 12.4) | 1354 | 21.04 ≤ 21.22 ✔ |
| `eng-uklad.svg` | `warstwy` | trzy warstwy | układ płyt | (12, 12) | 1372 | 20.99 ≤ 21.22 ✔ |
| `eng-otwarte.svg` | `nawiasy` | „</>” | open source | (12, 12) | 1388 | 20.99 ≤ 21.22 ✔ |
| `eng-zaslona.svg` | `tarcza` | tarcza | zasłona / prywatność | (12, 11) | 1390 | 20.99 ≤ 21.22 ✔ |
| `eng-radio.svg` | `glob` | globus na stojaku | węzeł radiowy („God is a DJ”) | (11, 10) | 1375 | 20.99 ≤ 21.22 ✔ |

## 4. C — Ikony mosADD: prawdziwe komponenty

**Budowa.**
- `npm i react@18 react-dom@18 esbuild` w `/home/claude/iconwork` (React 18.3.1, esbuild 0.28.2).
- Bundel esbuild (`jsx: automatic`) z oryginalnych plików: `HexagramIcon`, `CubeIcon`, `KolovratIcon`, `PyramidIcon`, `PagerIcon`, `PttIcon`, `SecureMailIcon`, `MUrlIcon`, `BoothIcon`, `brandSun.ts` i `sphereTypes.ts`.
- Kanały biorę programowo z prawdziwej tablicy `MODULES`. Atrapą podstawione są tylko `@/i18n/formatLocale` i `@dicebear/core`: import z `sphereTypes.ts`, ikony ich nie używają.
- Render: `renderToStaticMarkup`, propsy 1:1 z miejsc wywołania:
  - `TopNavBar.tsx:299` `HexagramIcon isOpen className="… text-primary"`;
  - `:328` `KolovratIcon isOpen alwaysSun sunColor={APP_SUN_COLOR}`;
  - `:345` `CubeIcon isOpen alwaysSun sunColor={APP_SUN_COLOR}`;
  - `:359` `PyramidIcon isOpen alwaysSun sunColor={APP_SUN_COLOR}`;
  - kanały jak wiersz listy `:252` (`isActive=false`, `color={c.color}`).

**Kolory.**
- `currentColor` sygnetów → `text-primary` → `hsl(var(--primary))` (`tailwind.config.js:76`) → `146 72% 45%` (`m0ssad-3/apps/web/src/index.css:302`).
- `APP_SUN_COLOR` (`brandSun.ts:46`) → to samo `--primary`.
- Kanały: `--mod-dm 146 66% 58%` (`:312`), `--mod-irc 0 74% 64%` (`:317`), `--mod-ayl 42 92% 60%` (`:324`), `--mod-pstn 4 84% 57%` (`:322`), `--mod-url 196 78% 58%` (`:323`).

**Kontrola.** Każdy plik porównałem z renderem tego samego komponentu z tokenami aplikacji w CSS i zatrzymanym ruchem, w tym samym układzie strony. Wynik: 13/13 = 0/255, inline i przez `<img>`.

| plik | max inline | max `<img>` | co zdjęto do klatki statycznej |
|---|---|---|---|
| `mosadd-mrag.svg` | 0 | 0 | klasa korzenia: w-6 h-6 shrink-0 text-primary; styl: transition |
| `mosadd-marmy.svg` | 0 | 0 | klasa korzenia: w-6 h-6 text-primary; blok <style> (276 B); styl: animation; styl: transition; styl: will-change |
| `mosadd-mops.svg` | 0 | 0 | klasy: cube-R0-face, cube-R0-spin, cube-R0-sun; klasa korzenia: w-6 h-6 text-primary; blok <style> (527 B); styl: animation-play-state |
| `mosadd-mvault.svg` | 0 | 0 | klasa korzenia: w-6 h-6 text-primary; blok <style> (137 B); styl: animation; styl: transition |
| `mosadd-mrag-aktywny.svg` | 0 | 0 | klasa korzenia: w-6 h-6 shrink-0 text-primary; styl: transition |
| `mosadd-marmy-aktywny.svg` | 0 | 0 | klasa korzenia: w-6 h-6 text-primary; blok <style> (276 B); styl: animation; styl: transition; styl: will-change |
| `mosadd-mops-aktywny.svg` | 0 | 0 | klasy: cube-R0-face, cube-R0-spin, cube-R0-sun; klasa korzenia: w-6 h-6 text-primary; blok <style> (527 B); styl: animation-play-state |
| `mosadd-mvault-aktywny.svg` | 0 | 0 | klasa korzenia: w-6 h-6 text-primary; blok <style> (137 B); styl: animation; styl: transition |
| `mosadd-mdm.svg` | 0 | 0 | klasa korzenia: w-8 h-8 shrink-0; blok <style> (1631 B) |
| `mosadd-mirc.svg` | 0 | 0 | klasa korzenia: w-8 h-8 shrink-0; blok <style> (2522 B) |
| `mosadd-mayl.svg` | 0 | 0 | klasa korzenia: w-8 h-8 shrink-0; blok <style> (1830 B) |
| `mosadd-mcall.svg` | 0 | 0 | klasa korzenia: w-8 h-8 shrink-0; blok <style> (955 B) |
| `mosadd-murl.svg` | 0 | 0 | klasa korzenia: w-8 h-8 shrink-0; blok <style> (742 B) |

**⚠ Wada w apce, odwzorowana 1:1 (nie naprawiałem, bo pliki mają pokazywać to, co apka).** Gradient kreski w `objectBoundingBox` (`x1="0%"…`) nie maluje kreski idealnie poziomej ani pionowej. Zmierzone: 0 pikseli po usunięciu każdej z nich.
- `PagerIcon` (mDM): klips paska, obie linie wiadomości.
- `PttIcon` (mIRC/mTALK): antena, więc latarka wisi w powietrzu, obie linie głośnika i linia kanału.
- `BoothIcon` (mCALL): korona na dachu, próg.

Łącznie 9 kresek. Poprawka w kodzie jak w `SecureMailIcon.tsx:76` / `MUrlIcon.tsx:34`: `gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100"`. Potem trzeba przerenderować pliki.

## 5. D — Znaki i ORB

- `znak-mosadd-favicon.svg` ← `m0ssad-3/apps/web/public/favicon.svg`. SVG istnieje, więc jest pierwszy. Zmiany: `width/height=48` i unikalne id gradientu. Render identyczny z oryginałem (0/255).
- `znak-mosadd-512.png` ← `m0ssad-3/apps/web/public/pwa-512.png`, bajt w bajt = `Desktop/PROMOCJA-MOSADD/logo-mosadd-512.png` (md5 `093d1531…`). Dołożony, bo to jest właściwy znak launchera, a SVG się z nim rozjechał (sekcja 8, pkt 5).
- `znak-3t3r-512.png` ← skill `assets/brand/icon-512.png`. Kanoniczny, bo jest pikselowo identyczny (0/255) z `cymru-main/build/icon.png`, który `docs/brand/README.md` nazywa „JEDYNE źródło”. `favicon.png` (256) to pochodna: do 6/255 różnicy po sprowadzeniu do jednej skali.
- Engineering: znaku w pliku nie ma. `orb-ga.svg` obejrzałem: to rysunek techniczny (1720×1180, wymiary w mm, „PROJEKT — do przestawienia”), więc trafił do `ORB/`. Zmieniłem tylko `width/height` na 48, bo reguła dotyczy wszystkich SVG. `viewBox` zachowany, render w tym samym rozmiarze identyczny z oryginałem (0/255).

## 6. Źródła kolorów (wszystkie wartości wprost z kodu, bez przeliczania)

| marka · rola | literał w plikach | token | plik:linia |
|---|---|---|---|
| 3T3R · słońce | `hsl(258 81% 58%)` / `hsl(288 55% 56%)` / `hsl(308 48% 52%)` | `--iridescent-blue/-purple/-pink` | `cymru-main/src/index.css:85-87` |
| 3T3R · klatka, odblask | `hsl(0 0% 100%)` | `--foreground` | `cymru-main/src/index.css:47` (`.dark` `:208`) |
| 3T3R · tło (arkusz) | `#06090F` | `--background 222 43% 4%` | `cymru-main/src/index.css:46` |
| Engineering · słońce | `#f04a41` | `--signal` | `3t3r-orb-design/tokens/colors.css:18` |
| Engineering · klatka | `#ffffff` | `--foreground` | `3t3r-orb-design/tokens/colors.css:10` |
| Engineering · tło | `#000000` | `--background` | `3t3r-orb-design/tokens/colors.css:9` |
| mosADD · sygnety (kreska + słońce) | `hsl(146 72% 45%)` | `--primary` via `text-primary` i `APP_SUN_COLOR` | `m0ssad-3/apps/web/src/index.css:302`, `tailwind.config.js:76`, `brandSun.ts:46` |
| mosADD · mDM / mIRC / mAYL / mCALL / mURL | `hsl(146 66% 58%)` / `hsl(0 74% 64%)` / `hsl(42 92% 60%)` / `hsl(4 84% 57%)` / `hsl(196 78% 58%)` | `--mod-dm/-irc/-ayl/-pstn/-url` | `m0ssad-3/apps/web/src/index.css:312/317/324/322/323` |

## 7. Czego nie wyrenderowałem i dlaczego

- **mADD, mLIDAR:** `MaddIcon` i `MlidarIcon` nie występują w `MODULES` (`sphereTypes.ts:281-296`).
- **PTT (mTALK):** to ten sam `PttIcon` co mIRC (`ChannelIcons.tsx:36`), więc nie ma osobnego pliku.
- **`CallIcon`:** to tryb rozmowy 1:1, nie moduł. mCALL rysuje `BoothIcon`.
- **Stany aktywne ikon kanałów:** nie było ich w zleceniu (animowane koperty, fale, kursor).
- **`sciana` (WALL) z SolidGlyph:** nie ma jej na stronie kanonu PO.
- **Wariant 22 px bez kropek:** kanon PO ma tylko 36 px. Do nagłówka 22 px służy komponent.
- **Znak Engineering w pliku:** nie istnieje. Znak słowny to komponent `RadioWordmark`.

## 8. Wątpliwości i rozjazdy (do decyzji, nie ruszałem kodu)

1. **Repo zmieniło się w trakcie pracy.** Commit `40c33059` (19.09 02:02 +0100) zdjął obrót z heksagramu (w kodzie: „Król 19.09 01:37 — Coś Ty zrobił z tą ikoną heksagramu”) i zmienił `CubeIcon`. `TopNavBar.tsx` był dalej edytowany (ramka pola SEARCH). Wyrenderowałem stan po tej zmianie. Wszystkie źródła zamroziłem w `/home/claude/iconwork/src-snapshot/` z `MANIFEST.md5`. Przy kolejnych zmianach wystarczy powtórzyć skrypty.
2. **`--go` nie istnieje.** `KANON-IKON-3-MAREK.md` nazywa zieleń mosADD `--go`. W kodzie to `--primary 146 72% 45%` (`brandSun.ts:46` → `index.css:302`).
3. **„Kolor modułu” sygnetów.** DECYZJE mówi „kolor modułu”, a kod daje wszystkim czterem `text-primary`: osobnych tokenów mRAG/mARMY/mOPS/mVAULT nie ma. Pliki idą za kodem. Kreska i słońce są w tym samym zielonym, a nie biała klatka jak w 3T3R.
4. **mosADD wobec zasad kanonu 2 i 6.**
   - Słońce sygnetów ma średnicę 32% pola (`brandSun.ts:20`). Słońce rodziny 3T3R ma promień 8,5% pola (średnica 17%, `SolidGlyph.tsx:125`). Zasada 2 chce jednego rozmiaru.
   - Słońce w `CubeIcon`/`KolovratIcon`/`PyramidIcon` pulsuje też w spoczynku (`alwaysSun` + animacja). Zasada 6 mówi „w spoczynku ikona stoi”.
5. **Favicon mosADD ≠ launcher mosADD.** `favicon.svg` ma miękką poświatę (r 44,2), rastry mają płaski dysk (`generate-brand-icons.py:173-207` wobec `:284-310`). Komentarz `:293` mówi, że nie wolno się rozjechać.
6. **Czerwień sygnału w ikonie.** `worlds.css:6-8` rezerwuje `--signal` dla przycisków nieodwracalnych (dotyczy CTA, nie znaku). Zasada 4 kanonu mówi wprost „czerwień sygnału”, więc zostawiłem `#f04a41`.
7. **Pułapka id w stronach kanonu.** Każda komórka KANON (34×) i 18-09 (136×) używa tych samych id `sR0/pR0/cR0/uR0`. Tam nie szkodzi, bo definicje są identyczne. Na jednej stronie z ikonami różnych marek pierwsza definicja wygrałaby jednak dla wszystkich, np. słońce Engineering zrobiłoby się fioletowe. Nasze pliki mają id unikalne. Ta sama pułapka wyszła w moim teście mosADD i została naprawiona w teście, nie w plikach.
8. **Biel 98% na stronie KANON** (patrz A). Jeśli Król chce 98%, trzeba zmienić jedną wartość w `build_ae.py` i przerenderować.

## 9. Jak odtworzyć

Wszystko leży w `/home/claude/iconwork/`:
- `a/build_ae.py`: A i B z `cells.json` (komórki kanonu);
- `a/diff_a.py`: dowód A;
- `a/verify_b.py`: test słońca Engineering;
- `c/entry.jsx` + `c/build.mjs` → `c/bundle.cjs` → `c/rendered.json`;
- `c/build_c.py`: pliki mosADD;
- `c/verify_c.py`: kontrola mosADD;
- `c/obb_check.py`: niewidoczne kreski;
- `d/build_d.py` + `d/verify_d.py`: znaki i ORB;
- `f/sheet.py`: arkusz;
- `e/readmes.py`, `e/report.py`: README i ten raport.

Źródła: `src-snapshot/` + `MANIFEST.md5`.

Na komputerze użytkownika tylko czytałem (`ls`, `md5sum`, `grep`, `git log`/`diff`/`status`, kopiowanie plików do chmury). Jedyny możliwy ślad: `git status` mógł odświeżyć pamięć podręczną indeksu `.git/index`, bez zmiany treści. Nie otwierałem plików `KLUCZ-*`, `.env.local` ani keystore.
