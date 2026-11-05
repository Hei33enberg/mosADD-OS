# KANON PRACY AGENTÓW — NOWROCKY (Lenovo + HP)

Jedno miejsce, które czyta każdy agent (Hermes, Claude, Cursor, Codex) przed robotą.
Aktualizacja: 05.11.2026, SET (linia lenovo@mosadd.com). Właściciel zmian: Król.

## 1. Maszyny i role

| Maszyna | Rola | Kto pracuje |
|---|---|---|
| Lenovo (`C:\Users\Jagoda`) | orkiestracja, pomiar, QA, sekrety, deploy | Hermes SET |
| HP `hiddensociety` (`C:\Users\PRP ABDO`, Tailscale `100.109.41.13`) | wykonawstwo, Cursor Króla, podgląd `127.0.0.1:8787` | Cursor, Hermes HP |

Dostęp: `ssh -F C:/Users/Public/ssh_config_hp hp`. Gdy HP jest offline w Tailscale — **żaden podgląd z Lenovo mu się nie pokaże**; sprawdź `tailscale status` zanim zaczniesz otwierać okna.

## 2. Repozytoria (nie mylić)

| Cel | Katalog lokalny | GitHub | Worker |
|---|---|---|---|
| LP gali (roboczy/design) | `C:\Projects\nbn-lp-v2` | `Hei33enberg/nbn_01_v2` (`main`) | `hei33enberg-nbn-01-v2.ralraw-com.workers.dev` |
| Produkcja strony gali | `C:\Projects\NOWROCKYwarsaw\apps\boxing-lp` | `Hei33enberg/NOWROCKYwarsaw` (`main`) | `nbn-boxing` → `boxing.nowrockywarsaw.com` |
| Bilety/silnik | `C:\Projects\nowrocky-tickets` | `Hei33enberg/nowrocky-tickets` | `nbn-bilety-waw.fly.dev` |

Rozpoznawca drzewa: ceny. `99/149/219/999` + PPV 29 = roboczy (`nbn_01_v2`). `149/249/399/1499` = produkcja.

## 3. Protokół SPRINT (rozkaz Króla 05.11)

1. Uwaga Króla → patch na żywym dev-serwerze (HMR). Król widzi efekt natychmiast.
2. Każdy punkt = **commit lokalny**. Zero pusha, zero builda.
3. Koniec paczki + „OK” → **jeden** `npm run build` + `wrangler deploy` na worker TEST.
4. Push: `HEAD:main` z tokenem z pliku; dowód = `git ls-remote` (ten sam SHA).
5. Produkcja `nbn-boxing` tylko na wyraźne słowo Króla.

Zakazane: build/deploy po każdej poprawce, otwieranie podglądu w pętli, meldunki zamiast roboty, zmiany rzeczy, których Król nie kazał.

## 4. Podgląd

- Dev: `node node_modules/vite/bin/vite.js --port 8787 --host 127.0.0.1` — **musi mieć PTY** (`terminal background+pty` albo odpięty `Start-Process`), inaczej `stdin is not a tty` i port znika.
- Weryfikacja: `curl` 200 **plus marker treści** (`Patron federacji`, `99 zł`), nie sam kod.
- Na inne urządzenie: tunel (pinggy) + `server.allowedHosts: true` w `vite.config.ts` (dev-only).

## 5. Git — naprawa uszkodzonego repo po tarze z HP

Objawy: `packfile ... does not match index`, `bad object HEAD` (tar z żywego repo psuje pack).
Naprawa: `git clone --depth 1` na boku → `mv .git .git.broken` → `cp -a <klon>/.git .git` → `git checkout -- .agents .cursor` → `git add -A` → commit.
**Po podmianie: usuń `.git.broken` z indeksu i dopisz do `.gitignore`** — inaczej commit zawiera cały katalog `.git`.

## 6. Sekrety (wartość tylko z pliku, nigdy w czacie)

`C:\Users\Public\NOWROCKY-BN\sekrety\` — ta sama zawartość na Lenovo i HP:
`cloudflare.env` (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`), `github.env` (`GITHUB_TOKEN`), `shopify.env`, `shopify-admin.env`, `shopify-storefront.env`, `fly.env`, `modele.env`, `vultr.env`, `HERMES-KEYS.md`.

## 7. Agenci — kto co robi

- **Hermes SET (Lenovo):** orkiestracja, pomiar, QA, sekrety, deploy, push, dokumentacja.
- **Cursor (HP):** wykonawstwo UI/designu na `nbn-lp-v2`; zostawia `HANDOFF-*.md`.
- **Claude:** kod, gdy wróci do pracy; nie dublować jego roboty.
- **Zasada:** nie pracuj ZA agenta — odpalaj, koordynuj, odbieraj. Praca bez pomiaru = plotka.

## 8. Skills (Hermes) — obowiązkowe przy danej klasie pracy

`nowrocky-lp-ops` (LP: drzewa, podgląd, sprint, git repair, portrety Magnific) · `kanon-ra` (tożsamość/flota) · `fleet-command-hygiene` (SSH/EncodedCommand) · `pinggy-tunnel` · `shopify-admin` · `nowrocky-content-ops`.

## 9. Checklista startu sesji (30 sekund)

1. `tailscale status | grep hiddensociety` — czy HP żyje.
2. `cd C:\Projects\nbn-lp-v2 && git status --porcelain` — czy repo zdrowe (brak „bad object”).
3. `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8787/` — czy podgląd stoi.
4. Przeczytaj ostatni `HANDOFF-*.md` w repo.
5. Dopiero potem kod.
