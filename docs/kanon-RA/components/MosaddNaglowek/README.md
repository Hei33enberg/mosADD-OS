# MosaddNaglowek

Nagłówek aplikacji mosADD przy 375 px: dropdown kanałów, SEARCH ze znakiem mRAG i trzy sygnety — kanon 19.09.

- Pasek `px-3` (12 px), kontrolki `h-9` (36 px), pełne tło `mosadd-background`, bez rozmycia i bez kreski pod paskiem (`TopNavBar.tsx`, wzór WallHeader 17.09).
- Dropdown: kwadrat, obrys `mosadd-border`, cień `mosadd-dropdown-shadow`, ikona modułu 20 px, nazwa modułu mono 700 tracking 0,2em w barwie `mosadd-mod-*`.
- SEARCH: bez ramki (Król 19.09 02:08), `SEARCH:` mono 700 wersaliki 0,15em w `mosadd-muted-foreground`, zawsze w całości; znak mRAG 24 px zaraz za napisem — dwudziestościan `pamiec` = 3T3R MÓZG (rozkaz Króla 19.09 „To jest ikona mRAG”; `MragIcon.tsx`). Klik otwiera mRAG, drugi zamyka. ⛔ Znak mRAG się nie obraca — w stanie aktywnym płonie słońce.
- Sygnety: kołowrót (mARMY), sześcian (mOPS), piramida (mVAULT) — 24 px w polu 36 px, identyczne, BEZ podpisów, zielone słońce; stałe, nic ich nie przykrywa.
- Wiersz 2: filtr kanału `ALL · UNREAD · DRAFTS · SNOOZED`, aktywny w zieleni.
- Konsument podaje: aktywny moduł (ikona, nazwa, barwa), stan otwarcia mRAG/mARMY/mOPS/mVAULT.
- Statyczny podgląd odtworzony z kodu i zrzutów 19.09; ikony to pliki z grupy „Ikony mosADD”.
