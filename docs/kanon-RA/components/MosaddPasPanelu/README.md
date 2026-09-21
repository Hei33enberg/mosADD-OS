# MosaddPasPanelu

Pas tytułu panelu mosADD (mOPS, mRAG, mVAULT, mARMY) i kolumna pod nim — jeden margines 16 px.

- Pas `h-14` (56 px), `px-4` (16 px), tytuł `text-title` 700 tracking 0,3em w barwie modułu (`overlays/SidePanelHeader.tsx`).
- ⛔ Bez kopii sygnetu w pasku, bez „✕ CLOSE”, bez podtytułów, bez martwego slotu 44 px na początku (Król 19.09 01:37: „żadnych marginesów, nie mamy miejsca”).
- Panel otwiera się pod paskiem sygnetów, na resztę ekranu; zamyka go drugi klik w sygnet w nagłówku.
- ⛔ Jeden margines kolumny: 16 px wszędzie naraz — sekcje, karty, płótno mRAG, przyciski. Element nie dokłada własnego wcięcia.
- Nagłówek sekcji: `1 · USB` mono z interpunktem + włos `mosadd-border` do krawędzi.
- Konsument podaje: nazwę modułu, jego barwę, sekcje.
- ⚠ Przyciski `CONNECT` w mOPS czekają na zamianę na toggle wg rysunku Króla 15.09 (Rozjazd R15).
