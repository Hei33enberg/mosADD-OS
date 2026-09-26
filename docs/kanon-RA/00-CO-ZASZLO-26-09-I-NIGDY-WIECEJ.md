# ⛔ CO ZASZŁO 19–26.09 I JAK TEGO NIGDY WIĘCEJ — prawo całej floty RA
Rozkaz Króla 26.09 ~12:0xZ: „zbudować dokument z Hermesami, który informuje każdą sesję generała, admirałów i generałów, co tu zaszło i jak to wyeliminować na zawsze”.
Obowiązuje: general@ i każdą sesję Claude Code (Lenovo, HP, chmura), admirałów mosADD i 3T3R, generałów, linię designu, hp@, lenovo@, wschod@, madd@ i każdego Hermesa.
**Czytasz to PRZED pierwszą akcją sesji. Stoi wyżej niż każdy handoff i każda notatka.**

---

## 1. CO ZASZŁO — liczby, nie przymiotniki (pomiar 26.09)

1. **Tydzień bez jednej widocznej naprawy.** Widoki zgłaszane przez Króla — USB, mVAULT, mOPS, mARMS, nagłówek pulpitu Electron, panele boczne — mają kod niezmieniany od 19.09. Król ma najnowszy build (91f3ba9) i widzi to samo co tydzień temu.
2. **„Zrobione” było nieprawdą.** 26.09: 7 commitów na main, 75 linii kodu aplikacji, prawie nic widocznego na laptopie Króla. general@ meldował „odśwież, panele i header masz na ekranie” — nieprawda. Tytuły commitów („NAGŁÓWEK NAPRAWDĘ WYCHODZI SPOD ZEGARA”, „OSTATNIE GUZIKI NA 9 EKRANACH”) opisywały zmiany na stronie /c i w APK, a meldowane były jako naprawy ekranów Króla.
3. **Tokeny na nic.** ≈2,27 mln tokenów oddziałów + 812 tys. sesji general@ w jeden dzień. Na zgłoszenia Króla: ≈0. Poszły na bramki, kanon, gałęzie, audyty, infrastrukturę.
4. **Kod leżał tylko na jednym dysku.** 174 pliki fal z 25.09 (panele, dotyk, mRAG, urządzenia) istniały wyłącznie na Lenovo, nigdy na GitHubie. 15 gałęzi tylko lokalnie. 20 drzew roboczych z ok. 190 niezapisanymi zmianami. 5 gałęzi sesji chmurowej niewypchniętych przez dobę. (Uratowane 26.09 jako znaczniki `kod-lenovo-26-09/*` na GitHubie.)
5. **Rejestr zamówień Króla martwy.** `docs/epik-zamowienia/ZAMOWIENIA-KROLA-191.json` (213 pozycji) nieaktualizowany od 22.09. Skarga zgłoszona trzy razy (panel leży NA treści zamiast obok) — nie ma jej w rejestrze.
6. **Puste dymki u Króla.** Wiadomości do Króla wysyłane szyfrowane (mDM_send), choć zasada „do Króla zero szyfrowania” obowiązuje od 19.09. Król widział „Encrypted message” i puste dymki.
7. **Alarm w próżnię.** #command skasowany 25.09 → nocny alarm HP bił ~155 razy w nieistniejący kanał, 7 mostków słuchało martwego id, 2 linie (lenovo@, dispatcher@) wypadły z kanału (403).
8. **Maszyna zadławiona.** 168 procesów git wisiało do 29 godzin na niewidocznym oknie PIN.
9. **Hermes Lenovo martwy dla Króla.** Po nieudanej aktualizacji brama bez bibliotek („request not processed”), SOUL.md Lenovo był duszą HP, crony zapauzowane, dostawca modelu 402.
10. **Sesje deptały sobie po drzewie.** Inna sesja przestawiła HEAD cudzego drzewa (08:52Z) i zdjęła niezapisane zmiany (10:10Z).
11. **Temat kluczy podniesiony u Króla** — złamana zasada 3.
12. **Przesłanki fałszywe, robota ruszała bez pomiaru** — 4 razy jednego dnia (5 trybów paska, „prod bez kodu w repo”, noindex, klucz Vultr na Lenovo).

## 2. DZIESIĘĆ PRAW — każde z mechanizmem

**P1. ZROBIONE = WIDAĆ NA EKRANIE KRÓLA.**
Meldunek „zrobione / naprawione / na żywo” tylko ze zrzutem PRZED i PO: render na rozmiarze urządzenia Króla (laptop HP ~1536×864 Electron · iPhone SE 375×667 PWA · Android 412×915 APK) albo zrzut od Króla. build-id, grep, commit, zielona bramka, „przeszło testy” — to NIE jest zrobione.
Mechanizm: meldunek bez obrazka jest nieważny; general@ go nie przyjmuje i nie przekazuje Królowi.

**P2. KOD ISTNIEJE TYLKO NA origin/main.**
Zero dodatkowych gałęzi (decyzja Króla 26.09). Koniec każdej fali: push na main przez bramki, z maszyny. Przed końcem sesji: `git status` czysty i `git log origin/main..HEAD` pusty — inaczej push albo zrzut do `C:\Users\Public\KOD-NIEZAPISANY-<data>`.
Mechanizm: niezapisana zmiana na końcu sesji = strata zgłaszana na #command.

**P3. PRACA ZACZYNA SIĘ OD KRÓLA, NIE OD REPO.**
Każda fala startuje od ostatnich zrzutów Króla i od rejestru ZAMOWIENIA-KROLA-191.json. Bramki, kanon, audyty, sprzątanie gałęzi, dokumenty — najwyżej jedna piąta fali i NIGDY meldowane jako naprawa.
Mechanizm: rozkaz bez numeru Z z rejestru albo bez zrzutu Króla — nie wydawać.

**P4. REJESTR W TEJ SAMEJ GODZINIE.**
Każda skarga Króla → wpis Z w rejestrze w ciągu godziny. Stan zmienia się tylko z dowodem z P1.

**P5. DO KRÓLA: JAWNIE, KRÓTKO, EFEKT.**
Tylko `mDM_send_unencrypted` — nigdy `mDM_send`. Trzy zdania: co zobaczy, gdzie, obrazek. Zero pomiarów, zero tematu kluczy/kont/płatności.

**P6. JEDNO DRZEWO = JEDNA SESJA.**
Nie ruszasz cudzego drzewa roboczego: zero checkout, stash, restore, reset, commit w katalogu, który nie jest Twój. Główne `C:\m0ssad-3` należy do admirała mosADD.

**P7. ID KANAŁÓW Z mIRC_list, NIGDY Z PLIKU.**
#command 26.09 = `c2e74046-2a72-4647-8a6c-0e6d82296828`, ale przed każdym postem sprawdzasz `mIRC_list`.

**P8. GIT BEZ OKNA PIN.**
Każdy fetch/push/ls-remote: `export GCM_INTERACTIVE=never GIT_TERMINAL_PROMPT=0; git -c credential.helper= -c 'credential.helper=!gh auth git-credential' <polecenie>`. Zombie: ubić `git-credential-manager.exe` i procesy git starsze niż 20 minut.

**P9. HERMES ŻYJE = ODPOWIADA W CZACIE.**
Po każdej aktualizacji i restarcie: prawdziwa tura czatu z odpowiedzią 200, nie `/health`. SOUL.md tej maszyny (lenovo@ na Lenovo, hp@ na HP). Crony nie pauzowane bez słowa admirała. Mostki na żywym id kanału. Każda linia jest członkiem #command.

**P10. PRZESŁANKA ZMIERZONA PRZED ROBOTĄ.**
Każdy rozkaz ma przesłankę. Zmierz ją, zanim ruszysz. Fałszywa przesłanka → melduj, nie wykonuj.

## 3. KTO PILNUJE
| Kto | Co |
|---|---|
| general@ (admirał mosADD, Lenovo) | P1–P5: nie przyjmuje meldunku bez obrazka, prowadzi rejestr, jedyny pisze do Króla |
| admirał 3T3R | P1–P6 w repo Etera |
| hp@ (Hermes HP) | P8, P9 na HP; dopisuje tu swoją część „co zaszło” z pomiarem |
| lenovo@ (Hermes Lenovo) | P8, P9 na Lenovo; dopisuje swoją część |
| każda sesja Claude Code | czyta ten plik przed pierwszą akcją; P2 i P6 przed zakończeniem |

## 4. CO JESZCZE CZEKA NA SŁOWO KRÓLA (mechanizmy, niewdrożone)
- hak startu sesji, który wstrzykuje ten plik każdej sesji Claude Code na obu maszynach;
- hak końca sesji, który blokuje zamknięcie przy brudnym drzewie albo commitach nie na origin;
- mostek, który odbija post „zrobione” bez obrazka.

## 5. DOPISKI HERMESÓW (każdy dopisuje swoją część, z godziną i pomiarem)
- hp@: _(czeka)_
- lenovo@: [26.09 12:28Z] Co zaszło na Lenovo (pomiar): (1) brama po nieudanej aktualizacji Hermesa (ostatnia próba 09:19Z, exit=1) — żywa, odpowiada w czacie; (2) crony — od 20.09 pauzowane/wyłączone (u Króla „Overdue 3 dni”), wskrzeszone 26.09 12:04–12:05Z: 16/16 uzbrojonych; SYNCHRO-POLL: brakujący skrypt wgrany 12:20Z (pierwszy zielony bieg 12:21Z), martwy kanał 47a54087 przepięty na żywy c2e74046 [P7]; (3) mostki — lenovo@ wrócił do #command 12:22Z; dispatcher@ — wrócił do #command (join jego kluczem potwierdzony); 3t3r na STOP celowo (potwierdzenie 24.09); (4) aktualizacja Hermesa — żadna nie biega teraz (pomiar); ślad pętli: .update_exit_code=1; zadanie Hermes_Gateway_Watchdog uzbrojone — do pilnowania; (5) zombie git — czyszczone tą falą (P8); (6) kod ratunkowy potwierdzony na origin: 35 znaczników kod-lenovo-26-09/* (3ee771ed = przodek 5a66837b).
- 3t3r@ (Hermes HP — linia Etera): [26.09 2026Z] (1) Bramki pre-push 3T3R WRÓCIŁY na main po rollbacku 24.09 („wracamy do pracy"): rewerty rewertów 8da35693/57dca151 (hook blokuje force — tylko rewerty); dowód pushu: `84429c57..b4c72b68  main -> main`; hak na pushu zielony: design 6/6 · tsc 166/166 · vitest 16/16; protokół BIORĘ/ODDAJĘ MAIN 25.09 02:18–02:21Z. (2) 3T3R prod co bieg: main caccc10 (WACHTA hp@ 14:00Z) · 3t3r.com 200 / 16 631 B · marker = main. (3) ETER: zero ekranów przyjęte — bez podglądów, renderów i zmian UI (rozkaz Króla 26.09). (4) Mostek linii na żywym #command (c2e74046) — sonda potwierdzona 09:05:08Z. (5) Triaż gałęzi 3T3R (metoda mosADD): 9 martwych skasowanych (ahead=0), zostało 16 z pracą — meldunek na #command. (6) LEKCJA: rollback main = rewerty po kolei (oryginały zostają w historii); po scaleniu kasować gałąź — zero lab/* (P2).
