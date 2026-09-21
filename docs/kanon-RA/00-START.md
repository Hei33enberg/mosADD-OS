# 00 — START. Czyta to KAŻDA nowa sesja, zanim cokolwiek zrobi

Rozkaz Króla 20.09: **wszystkie skille, pamięć, kanony, dusze i instrukcje mają być dostępne ZAWSZE — z Lenovo i z HP — dla każdej następnej sesji Claude Code, każdego agenta i każdego agenta świeżo zwerbowanego w Hermesie.** Ten plik jest wejściem. Jeśli trafiłeś tu jako nowa sesja: przeczytaj tę stronę w całości, potem to, co dotyczy twojego zadania.

## Kolejność czytania (bez wyjątków)

1. `C:\Users\Public\DECYZJE-KROLA.md` — jedno miejsce prawdy o decyzjach Króla. Decyzja z nowszą datą wygrywa. Plan, draft i rada C-level to NIE decyzja.
2. `C:\Users\Public\KANON-KOLEJKA.md` — co leci teraz i w jakiej kolejności. Kolejka to nie wishlist.
3. `C:\Users\Public\KANON-RA\README.md` → spis rozdziałów → rozdział twojego zadania.
4. `90-rozjazdy.md` — zanim „naprawisz” coś, co wygląda na błąd. Może być zgłoszone i czekać na decyzję.

## Prawo kanonu (cztery zdania)

- Kod jest prawdą o wartościach, Król o decyzjach. Każda wartość ma `plik:linia`, każda decyzja cytat i datę.
- Liczba bez daty pomiaru i bez źródła to plotka. PUSH ≠ DEPLOY — prod to porównanie build-id z HEAD.
- Nic nie znika z UI bez słowa Króla. Rzecz podejrzaną zgłaszasz w 90-rozjazdy, nie kasujesz.
- ⛔ Nie wymyślaj od nowa rzeczy, które mają być spójne. Ikona, kolor, krój i komponent pochodzą z kodu albo z tego systemu.

## Gdzie co leży

| Co | Gdzie | Uwaga |
|---|---|---|
| Kanon designu trzech marek + WhiteIntel | `C:\Users\Public\KANON-RA\` | rozdziały 10–90, `tokens.json`, `design-system.json`, `components/`, `assets/`, `fonts/` |
| Decyzje Króla + changelog | `C:\Users\Public\DECYZJE-KROLA.md` | kopia dla floty bez dostępu do repo; odświeżana przy każdym commicie |
| Kolejka i zasady meldunków | `C:\Users\Public\KANON-KOLEJKA.md` | meldunek po każdej fali: mDM do Króla + post na `#command` |
| Repozytoria produktów | `C:\m0ssad-3` · `C:\mosadd-os` · `C:\mosadd-agent` · `C:\cymru-main` · `C:\cymru-os` · `C:\cymru-agent` · `C:\whiteintel-main` · `C:\rak-runtime` · `C:\marocain-main` | worktree `C:\m0ssad-3-wt-*` to gałęzie robocze, nie osobne produkty |
| Wrzutki Króla (pliki, obrazy, głos) | `C:\Users\Public\ndzr-wrzutki-*` + `docs/rejestr-krola` | ⛔ NIGDY nie znikają |
| Linie i klucze agentów | `C:\Users\Public\KLUCZ-*.txt` | np. `KLUCZ-DESIGN.txt` — linia design@mosadd.com (GOD OF RA DESIGN) |
| Skille Claude Code | `%USERPROFILE%\.claude\skills\` (Lenovo i HP) | ⏳ patrz „Dostępność” niżej |
| Instrukcje sesji (auto-czytane) | `%USERPROFILE%\.claude\CLAUDE.md` + `CLAUDE.md` w korzeniu repo | ⏳ do postawienia na obu maszynach |
| Pamięć (Claude, cross-sesyjna) | pamięć konta bialekster@ / Cowork | żyje poza dyskiem; kanon i decyzje są na dysku i one są prawdą |

## Flota i kto komu podlega

Król RA (SOVEREIGN) → **ADMIRAŁ mosADD** (Claude Code, Lenovo, linia general@) dowodzi: własną armią agentów · **ADMIRAŁEM 3T3R** · **GOD OF RA DESIGN** (design@mosadd.com, Cowork) · dwoma generałami Hermes: **lenovo@** (ta maszyna) i **hp@** (HP, Tailscale). Dowodzenie idzie na `#command` i przez Hermesa. Decyzja Króla 19.09 ~00:05.

Rozmowa z Królem: ⛔ ZERO E2EE wewnątrz mosADD. Za Generała nie odpowiada żaden automat.

## Dostępność — rozkaz Króla 20.09

Dwie maszyny, ten sam stan wiedzy:

- **Lenovo** (ta) — serwer 24/7, linia lenovo@mosadd.com.
- **HP** — druga, szybsza, linia hp@mosadd.com.
- Połączone **Tailscale, bez Proton VPN**, zdalne pulpity, ta sama sieć WiFi.

Wymóg: każda następna sesja Claude Code i każdy agent zwerbowany w Hermesie na OBU maszynach ma mieć bez pytania: skille, pamięć, kanon, dusze linii i instrukcje.

Stan wykonania (20.09):

| Krok | Stan |
|---|---|
| Kanon w jednym katalogu (`C:\Users\Public\KANON-RA`) z tym plikiem jako wejściem | ✅ |
| Kopia WERSJONOWANA w repo: `C:\mosadd-os\docs\kanon-RA\` | ✅ — po każdej zmianie kanonu skopiuj i zacommituj, inaczej HP dostanie starą wiedzę |
| `CLAUDE.md` w korzeniu repozytoriów (m0ssad-3, mosadd-os, mosadd-agent, cymru-main/os/agent/hermes/deploy, whiteintel-main, rak-runtime, marocain-main) | ✅ — każda sesja Claude Code w repo czyta kanon bez pytania |
| `C:\Users\Public\SYNC-KANON.ps1` — Lenovo ↔ HP | ✅ — HP w Tailscale: `hiddensociety` (100.109.41.13); gdy SMB odmówi, fallback `git pull` w `C:\mosadd-os` |
| `%USERPROFILE%\.claude\CLAUDE.md` i katalog skilli na obu maszynach | ⏳ — `.claude` nie daje się podpiąć do sesji Cowork; robi to sesja Claude Code na Lenovo i na HP |

⛔ Zanim zaczniesz pracę na HP: porównaj datę `DECYZJE-KROLA.md` i `KANON-RA` po obu stronach. Pracuj na nowszej, potem odpal `SYNC-KANON.ps1`.

## Meldunek

Po każdej fali: mDM do Króla (`4cd1894d-b878-4fe4-b221-084419f7d225`) ORAZ post na `#command` (`47a54087-b131-4e07-bf1b-4662854cd5a6`) — oba. Liczby, nie przymiotniki. Cytat bez źródła (`plik:linia`) nie jest rozkazem.

## Handoff sesji, która ten plik postawiła

**LINEAR-6017** — https://linear.app/ip-ra/issue/LINEAR-6017 (projekt mosADD, priorytet Urgent). Kim była sesja, co zrobiła, co jest niescommitowane, które rozjazdy czekają i na kogo. Następny czyta ten ticket zaraz po tej stronie.
