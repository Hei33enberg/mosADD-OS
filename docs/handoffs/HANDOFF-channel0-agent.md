# HANDOFF — agent mURL (channel0) ← agent mosadd.dev

**Data:** 2026-06-04 · **Cel:** równoległa praca do launchu mURL w Chrome Web Store, zero kolizji w plikach.

Skończyłeś rozszerzenie — zrobiłem pełny przegląd kodu (`apps/channel0-ext`). Solidne (MV3, buduje się, XSS-safe, PoW, age-gate, banner). Poniżej co masz dokończyć przed sklepem, i twarda granica: czego NIE tykać (to mój obszar).

## ✅ RÓB (Twój sprint — blokery CWS)
P0:
1. **Reconnect WS** — `src/shared/chat-shell.ts` (`openChannelSocket`/`onClose`): po zerwaniu sieci socket nie wstaje, a UI dalej pozwala pisać → wiadomości giną po cichu. Dodaj exponential backoff (1/2/4/8s, max 60) + widoczny stan „rozłączono / łączę ponownie".
2. **Odświeżanie tokenu** — `src/lib/client.ts`: JWT w sub-protokole WS żyje 5 min, brak re-mint → sesja umiera. Re-mint ~30 s przed `exp` (ponowny `channel0-join`) albo obsłuż sygnał re-auth z Workera.
3. **CWS submission** — listing (opis <10 KB z ujawnieniem danych: device-token, transmisja wiadomości do Worker→Supabase), 3–4 zrzuty (trending board, czat, ustawienia), kategoria Productivity. Promo 440×280 już masz.
4. ~~RENAME~~ **NIE RENAME — anulowane.** Per founder decision (state_current.md, naming convention): user-facing = mURL, ale **ścieżki/kod zostają `channel0-*`** (rename = redeploy + CWS re-review + verified-DNS owners tracą weryfikację = zero wartości). **JA już podmieniłem linki na stronie na `apps/channel0-ext`** — nic nie rób, zostaw `apps/channel0-ext`.

P1:
5. PoW nonce → `crypto.getRandomValues()` (`src/lib/pow.ts:~59`, teraz `Math.random()`).
6. Age-gate `innerHTML` → `.append()`/`textContent` (`src/content/index.ts:~39`); `AbortSignal` na handlerach WS w `destroy()` (wyścig).
7. **`message-ingest-batch`: mapuj `from` → `messages_meta.sender_sub`** (LINEAR-2761) — bez tego mój GDPR DSR (embed-dsr-delete) kasuje udział, ale nie wiadomości. Kolumna `sender_sub` już jest w bazie. Podaj mi potem potwierdzenie kontraktu.
8. Potwierdź `channel0-report` (zgłoszenia) działa + spisz prosty SOP moderacji.

## ⛔ NIE TYKAJ (mój obszar — apps/dev + embed + backend nie-channel0)
- `apps/dev/**` — cała strona mosadd.dev, w tym **wszystkie strony `/murl/*`** (landing, privacy, abuse). Treść prawną piszę ja (zrobiłem audyt przepływu danych). Jak masz korektę faktów o danych — napisz mi, nie edytuj.
- `apps/embed/**` (widget), `apps/hub/**`.
- `supabase/functions/**` POZA Twoimi channel0 EF (`channel0-join`, `domain-channel-ensure`, `message-ingest-batch`, `channel0-report`). NIE tykaj `mirc-embed-token`, `embed-keys`, `embed-dsr-delete`, `stripe-webhook`, `health-*`, `rag-search`.
- Moje tickety Linear: **2735** (embed epic), **2741** (PAYG), **2758** (self-healing), **2761** (sender_sub — wyjątek: pkt 7 wyżej robisz Ty), tickety mosadd.dev.

## 🤝 Co JA już zrobiłem po swojej stronie (żebyś nie dublował)
- **Redirecty `/channel0/*` → `/murl/*`** w `apps/dev/next.config.mjs` — Twoje stare linki w rozszerzeniu (`mosadd.dev/channel0/privacy` itd.) już nie dają 404.
- Strony `/murl`, `/murl/privacy`, `/murl/abuse` są kompletne i CWS-grade.
- Naprawiam zepsute rzeczy na stronie (cennik, /embed, /skins) — nie Twój temat.

## ⚠️ Pułapki (z notatek)
- **branch-dance:** zawsze `git branch --show-current` przed commitem; po długim Bash chain możesz wylądować na cudzej gałęzi.
- **merge-loss:** po merge sprawdź czy Twoje pliki nie zniknęły (`git show main:<path>`).
- `apps/edge/src/index.ts` jest Twój (Worker). Strike-day per-key override (LINEAR-2764) też Twój.

## Twoje tickety
Epik channel0 **2688** + dzieci. Strike-day epik **2763** (2764 P0 override / 2765 / 2766). Pkt 1–2 wyżej = blokery launchu — załóż sobie tickety pod 2688 jeśli ich nie ma.

— agent mosadd.dev
