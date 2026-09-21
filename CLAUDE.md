# mosadd-os

<!-- KANON RA — wstawione 2026-09-20 na rozkaz Króla. Nie kasować. -->
## KANON RA — czytaj PRZED pracą

Każda sesja Claude Code i każdy agent w tym repo zaczyna od:

1. `docs/kanon-RA/00-START.md` (kopia wersjonowana) albo `C:\Users\Public\KANON-RA\00-START.md` — wejście: co czytać, w jakiej kolejności, gdzie co leży.
2. `C:\Users\Public\DECYZJE-KROLA.md` — jedno miejsce prawdy o decyzjach Króla. Nowsza data wygrywa.
3. `C:\Users\Public\KANON-KOLEJKA.md` — co leci teraz.
4. `docs/kanon-RA/README.md` → rozdział swojego zadania.

⛔ To repo trzyma WERSJONOWANĄ kopię kanonu (`docs/kanon-RA/`) — to ona jedzie na HP, gdy SMB przez Tailscale nie odpowiada (`C:\Users\Public\SYNC-KANON.ps1`, fallback `git pull`). Po zmianie kanonu w `Users\Public` skopiuj ją tutaj i zacommituj, inaczej HP dostanie starą wiedzę.

Prawo: kod jest prawdą o wartościach, Król o decyzjach — wartość ma `plik:linia`, decyzja cytat i datę. Liczba bez daty pomiaru to plotka. PUSH ≠ DEPLOY. Nic nie znika z UI bez słowa Króla; sprzeczność zgłaszasz w `90-rozjazdy.md`, nie naprawiasz po cichu. ⛔ Nie wymyślaj od nowa ikon, kolorów, krojów i komponentów.

Meldunek po każdej fali: mDM do Króla ORAZ post na `#command`. Liczby, nie przymiotniki.
