# EngSpecChip

Fakt sprzętowy jako chip: przygaszona etykieta i jasna wartość, włos, nieprzezroczysta powierzchnia.

- Obrys `eng-line`, promień 8 px (`eng-radius-md` — jedyna kontrolka Engineering, która nie jest pigułką), tło `eng-surface`, padding 4 × 10 px, Geist Mono 10,5 px wersaliki tracking 0,16em; etykieta `eng-text-dim` z kryciem .6, wartość `eng-text` (skill `brand/SpecChip.jsx`).
- ⛔ Bez `backdrop-filter` — chip pojawia się ~20 razy na stronę.
- W rzędach po 2–4 pod akapitem sekcji; nigdy jako nawigacja. Każda specyfikacja z gwiazdką.
- Konsument podaje: `label` (opcjonalnie) i `value`.
