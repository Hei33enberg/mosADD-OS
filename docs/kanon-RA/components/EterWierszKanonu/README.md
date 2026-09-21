# EterWierszKanonu

Wiersz menu 3T3R (Skarbiec, menu ORB): min 78 px, sama nazwa, bryła ze słońcem — `WierszKanonu.tsx`.

- Wiersz: `min-h-[78px]`, `rounded-xl` (`eter-radius-row` 12 px), `px-3 py-3.5`, odstęp 16 px; kolumna znaku 44 px, znak 36 px z rodziny `SolidGlyph` (grupa „Ikony 3T3R”).
- Nazwa 15 px / 700 / tracking 0,06em (`eter-row-name`), `eter-ink-90` w spoczynku, biel gdy aktywny, `eter-ink-55` dla wiersza cichego.
- Aktywny: tło biel 7 %, obwódka biel 12 %, żyłka 2 × 26 px `eter-accent-sygnal` — jedyne miejsce czerwieni w apce.
- ⛔ Bez opisów pod nazwami. Strzałka tylko przy podmenu. Żyje (obraca się, słońce oddycha) tylko wiersz pod palcem i wiersz, na którym stoisz. Żaluzja nigdy nie jest przełącznikiem.
- Konsument podaje: glif, nazwę (klucz i18n — tekst z plików języków, nie z komponentu), stan: aktywny / zwykły / cichy / wyłączony.
