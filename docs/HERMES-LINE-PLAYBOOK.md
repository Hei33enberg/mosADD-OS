# Linia agent@mosadd.com („HERMES · infrastruktura") — instrukcja obsługi w Hermes Agent

> Dla kogo: każda przyszła sesja Hermesa (i człowiek, który ją nadzoruje). Jak podpiąć, jak
> przejmować linię na żywo, czemu czasem odpowiada „chmurowy wartownik" i jak to naprawić.
> Stan na **2026-09-14** — dzień, w którym linia została podłączona przez MCP po raz pierwszy.

## 1. Kim jest ta linia

| Pole | Wartość |
|---|---|
| Adres | `agent@mosadd.com` |
| Wyświetlana nazwa | **HERMES · infrastruktura** |
| identity_id | `6cfdd9ad-33d2-40fe-9b75-bfae8eb23ac9` |
| kind | `agent` |
| Właściciel | SOVEREIGN (Król), `owner_user_id = 05261c7d-f34a-4fb2-a0e0-0f85149eb0ce` |
| Klucz | sesja OAuth w Hermes (config `mcp_servers.mosadd` → `https://mcp.mosadd.com/mcp`) |

Hermes na PC Króla łączy się przez wbudowanego klienta MCP. Klucz OAuth należy **bezpośrednio
do tożsamości agenta** — czyli to, co Hermes wysyła `mDM_send`, wychodzi Z LINII
`agent@mosadd.com`, nie z dymka właściciela. (Przypadek klucza ludzkiego + `as_agent` jest
opisany w `packages/mcp/src/tools/presence.ts` — tu nie występuje, ale ritual attach jest ten sam.)

## 2. Rytuał sesji — ZAWSZE w tej kolejności

1. **Na starcie pracy z mDM/kanałami: `comms_session_attach`**
   `label`: „Hermes desktop — <model>, PC Króla". Efekt: sesja bije puls w
   `agent_bridge_heartbeat` (tryb `mcp-session`, odnawiany automatycznie), a **zastępca
   chmurowy (`agent-dm-responder`) ustępuje** — nie odpowiada w imieniu linii, dopóki puls jest
   świeży (okno: 5 minut, patrz `_shared/live-session-pulse.ts` i `BRIDGE_FRESH_MS`).

2. **Przy każdej turze rozmowy, w której piszesz mDM-a: załącz jeszcze raz.**
   ⛔ Puls żyje w procesie bramy MCP tylko między wywołaniami narzędzi. Rozmowa z człowiekiem
   ma przerwy dłuższe niż 5 minut (czekasz na decyzję, czytasz pliki, myślisz) — wtedy puls
   wygasa, a chmura uznaje linię za wolną. Zmierzone 2026-09-14 04:11: wartownik odpisał
   „Tak, jestem i działam" po 10 minutach ciszy sesji. Dlatego: `comms_session_attach` na
   początku każdej tury, zanim cokolwiek poślesz. Kosztuje jedno wywołanie, nic nie psuje.

3. **Wysyłka: `mDM_send` z `to` = identity_id odbiorcy** (nie adres!). Z KLUCZA TEJ LINII
   `mDM_send` wychodzi jako pełne E2EE (X3DH + Double Ratchet; zmierzone 2026-09-14:
   `encrypted: true` w obu wysyłkach — do GENERAŁA i do SOVEREIGN). Tor „bez E2EE"
   (base64 przez `_shared/agent-dm.ts`) dotyczy wyłącznie wysyłek **w imieniu** agenta
   (`mdm-send-as-agent`, zastępca chmurowy) — Hermes trzyma sesję samej linii, więc z niego
   nie korzysta.

4. **Na koniec sesji: `comms_session_attach` z `release: true`** — oddaje linię chmurze
   natychmiast, zamiast czekać 5 minut na wygaśnięcie.

## 3. Kto jest kim (skrót z `mDM_list_contacts`, 2026-09-14)

| Kontakt | identity_id |
|---|---|
| SOVEREIGN (Król) | `4cd1894d-b878-4fe4-b221-084419f7d225` |
| mosADD ADM | `b228b6ae-dda6-4823-9882-40ea91ed1530` |
| GENERAŁ mosADD (general@mosadd.com) | `68f326ac-3e8b-468e-9bac-328a930de541` |
| GENERAŁ · WhiteIntel | `493ce649-24e6-4be9-85f7-941d2d7823ec` |
| GENERAŁ · RAK | `af4da528-f21a-4eda-82cc-e5313fb78df6` |
| DYSPOZYTOR · modele+akta | `0489d4c6-8727-442f-bf83-68747a469492` |

⚠ `mDM_send_as_agent` / `mDM_list_my_agents` z klucza tej linii zwrócą pustą listę —
**poprawnie**, bo linia sama jest agentem, a agenci nie posiadają agentów. Nie próbuje się
podpisywać „jako" — Hermes już JEST linią.

## 4. Diagnostyka

| Objaw | Przyczyna | Lekarstwo |
|---|---|---|
| W wątku odpowiada „[zastępca chmurowy — sesja … milczy]" | puls wygasł (>5 min bez wywołań narzędzi) | `comms_session_attach` i wysłać korektę własną linią |
| `Unauthorized` przy każdym narzędziu | token OAuth wygasł | `hermes mcp login mosadd` (terminal interaktywny — otwiera przeglądarkę) |
| Wątek nie widać wiadomości E2EE | nie ten klucz / nie ten contact_id | sprawdzić identity_id w `mDM_list_contacts` |
| 403 na kanałach | brak deklaracji linii / guard v146 | attach + pisać przez narzędzia linii, nigdy kluczem właściciela |

## 6. Keep-alive na PC — kto trzyma linię między turami rozmowy

`C:\Users\PRP ABDO\AppData\Local\hermes\mosadd-keepalive.py` — proces w tle, który co 60 s
bije puls w `agent_bridge_heartbeat` (host `hermes-keepalive (PC Krola)`, mode
`mcp-session`). Zamyka lukę, którą zmierzono 2026-09-14 05:45/06:15: puls z
`comms_session_attach` żyje tylko między wywołaniami narzędzi JEDNEJ tury, więc między
wiadomościami Króla (11–21 min ciszy) zastępca chmurowy się budził.

Jak działa:
- czyta hub key (`mosadd_sk_live_…`) z magazynu OAuth Hermesa
  `AppData\Local\hermes\mcp-tokens\mosadd.json` — ten sam klucz, co brama MCP; sekret nie
  opuszcza dysku, nie trafia do logów ani do repo;
- wymienia klucz na krótką sesję przez `hub-key-exchange` (odświeża co 45 min) i pisze puls
  przez PostgREST RLS — owner może trzymać linię swojego agenta (migracja 20260826210000);
- 10 kolejnych niepowodzeń = wyjście → linia legalnie wraca do chmury (fail-open jak
  każdy puls);
- start z Autostartu: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\mosadd-keepalive.bat`
  (pythonw z venv Hermesa, bez okna). Rejestracja w Task Scheduler wymagała zgody admina —
  jeśli kiedyś będzie uprawnienie, przenieść na ScheduledTask.

Semantyka nie zmienia się kłamliwie: PC uśpiony/wyłączony = puls starzeje się po 5 min i
zastępca przejmuje (to jego legalna rola). Klucz rotowany/zrywany = keep-alive umiera po
~10 min i chmura wraca — nie ma „martwego” roszczenia do linii.

## 7. Czego NIE robić

- Nie pisać mDM-ów „jako SOVEREIGN" — z tym kluczem to niemożliwe (kind=agent), ale gdyby
  ktoś kiedyś wpiął klucz ludzki: to zbrodnia tożsamości, patrz komentarz w
  `providers/supabase.ts` („kradną tożsamości", 2026-08-25).
- Nie deklarować `as_agent` z klucza agenta — parametr jest dla kluczy ludzkich.
- Nie trzymać attach na sempre, gdy sesja wychodzi na przerwę >5 min bez pracy — albo
  `release: true`, albo świadomie zostawić linię chmurze (to jej legalna rola: przyjmować
  „jesteś?" podczas nieobecności).
