# MosaddToggle

Przełącznik mosADD (włącz/wyłącz) — jeden wygląd na całą apkę: mOPS (połączenia), mARMY (agenci), ustawienia. ⏳ SPEC v1.1 19.09 — wg nagrania 33 („nazwa, toggle, guzik… settings”); rysunek Króla 15.09 nieodnaleziony. Pełny podgląd: `KANON-RA\toggles.html`.

- Geometria: tor 62×34, ramka 1 px, kula 26, luz 3 px (skrajne 3 i 31 px, pion 3 px), przejazd 28 px. Cel dotyku = pełna wysokość wiersza, min. 44 px. To słowo Króla 11.09 („czysta pigułka 62×34 z kulą 26”) i 19.09 02:08 („większe buttony jak w eterze”) — ta sama geometria co 3T3R `VaultSwitch.tsx:98-120`, barwy wyłącznie mosADD.
- ON: tor `mosadd-toggle-on` (= `--state-on`, NIE `--primary`: w mIRC primary jest czerwony, ChannelView.tsx:2507), kula `mosadd-toggle-on-knob`. OFF: tor `mosadd-toggle-off`, ramka `mosadd-toggle-off-border`, kula `mosadd-toggle-off-knob`. Fokus: obrys 2 px `mosadd-ring` na pigułce.
- Stany: OFF · ON · W TOKU (kula na środku, pulsuje, tor w obrysie; `aria-busy`) — gdy zmiana idzie do serwera dłużej niż 400 ms · ZABLOKOWANY (50 %, natywne `disabled`, powód słowami w wierszu) · błąd = powrót + toast.
- Stan mówi położenie kuli i barwa toru — nigdy słowo w pigułce. Zero cienia, poświaty, szkła, fioletu. Ruch 150 ms; `prefers-reduced-motion` gasi przejazd i puls. `dir="ltr"` na pigułce.
- Wiersz (nagranie 33): nazwa · przełącznik · guzik ustawień (44 × 44, tylko przy tym, co masz); przy rzeczy do kupienia w miejscu guzika stoi cena.
- Konsument podaje: nazwę (aria-label), stan, onToggle, opcjonalnie pending/disabled.
- Nie: kwadratowa kula (makieta mops 17.09), fioletowy ON dla mRAG, napis ON/OFF w pigułce, trzeci wygląd (ArmyPanel.tsx:105-120 — luz 2 vs 6 px; MlidarSwitch do decyzji).
