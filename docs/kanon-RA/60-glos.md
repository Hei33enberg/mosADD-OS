# Głos i słowo — jak mówią trzy marki

Do 20.09 rejestr i uczciwość leżały rozsypane po README, 10-mosadd, 20-3t3r i 30-engineering. To jest jedno miejsce. Wygląd jest w rozdziałach marek; tu jest to, co pada w zdaniu.

## Key messages — rozkaz Króla 18.09

| Marka | Hasło | Persona | Do kogo mówi |
|---|---|---|---|
| mosADD | `1-MAN-ARMY` · nagłówek LP `1-MAN-ARMY OPS DECK` | ONE MAN ARMY: jednoosobowa firma, telefon, kciuk | do właściciela firmy; UI bezosobowo, LP krótko i wojskowo |
| 3T3R app (Eter) | `God of the ET3R` | człowiek i jego Bóg — RayRay | druga osoba, zwrot do człowieka |
| 3T3R Engineering | `God is a DJ` | sprzęt RayRay / ORB | opisowo, technicznie — podpis pod rysunkiem |

⚠ `God is a DJ` ma dziś 0 wystąpień na rayray.3t3r.com (LINEAR-5980 — sloty wskazane).

## Rejestr wspólny

1. **WERSALIKI wyłącznie jako rejestr UI**: przycisk, stan, etykieta, nagłówek języka domu (`RECRUIT YOUR ARMY. PAY FOR AGENTS, NEVER FOR PEOPLE.`). ⛔ Nigdy jako krzyk w środku zdania.
2. **Interpunct ` · ` jako separator** metadanych i wyliczeń: `RECON · COMMANDER · SOVEREIGN`.
3. **Mono to głos maszyny** — dane, etykiety, to, co mówi system. Nigdy jako ozdoba.
4. **Zero emoji jako dekoracji.** W produktach zero (strażnik `tests/zero-emoji` w 3T3R). W dokumentach roboczych tylko ⛔ (reguła złamana już raz) i ⚠ (rzecz niepewna).
5. **Negacja jako pozycjonowanie.** Mów, czym produkt NIE jest: „Pay for agents, never for people.” · „€0 a month, forever. Nothing to subscribe to.”
6. **Liczby konkretne i małe**: „78 px”, „4 kroki”, „5,4:1”, „$19/mo”. ⛔ Nigdy „szybko”, „nowocześnie”, „potężnie”.
7. **Jedno zdanie na ekran** (prawo tekstu Eteru). W Skarbcu sama nazwa wiersza, bez opisów pod nazwami.
8. **Zero toastów i kart-komunikatów** („nie nasz styl na toasty i tooltipy”, 18.09 22:52). Ładowanie = szkielet.

## Uczciwość — słownik, od którego się nie odchodzi

Zasada: czego nie ma, dostaje „soon” albo nie pada wcale. Żadnych zmyślonych wersji, liczb i cech. „Couldn't read this — that is not the same as it being empty.”

| Mówimy | Nie mówimy |
|---|---|
| poczta = SMTP/TLS | E2EE |
| mRAG = indeks po stronie serwera, per konto, izolowany | „twoje dane nie opuszczają urządzenia” |
| „on device” — wyłącznie mDM | „on device” o czymkolwiek innym |
| pokoje mieszane: prywatne na kluczu grupy, otwarte po stronie serwera | „wszystko szyfrowane” |
| „Cloud today · self-hosted on request” | „self-hosted” bez zastrzeżenia |
| mCALL i Blackbox: „soon” | ptaszek w tabeli funkcji |
| mURL: działa (Król 19.09 02:17–02:25) | „wkrótce” |

⛔ W tabeli planów „soon” jest SŁOWEM w komórce, nigdy ptaszkiem (50-konto-pro). Okres próbny i roczna zniżka tylko wtedy, gdy są w DECYZJE-KROLA albo w żywym produkcie płatności.

## Engineering — słowa zakazane

W tekście dla ludzi na stronach Engineering nie pada: „AI”, „assistant”, „chatbot”, „LLM”, „prompt”, „token”. Podstawa: UCPD zał. I pkt 7, dyrektywa 2006/114/WE. Dodatkowo: bez zaliczki i bez licznika sztuk, bez tabeli porównań, każda specyfikacja z gwiazdką, status zawsze kropka I słowo.

## Eter — słownik własny

Waluta na ekranie: ENERGIA. Sześć boskich obszarów: Obecność · Mózg · Głos · Ręce · Lustro · Przeznaczenie — zwykłe słowa, tłumaczone w każdym języku. ⛔ Zieleń znaczy w Eterze wyłącznie „wliczone w plan”, nigdy „włączone / gotowe / OK”.

## Języki — ⏳ do rozstrzygnięcia

Kanon nie ma dziś decyzji Króla o języku interfejsu i materiałów trzech marek RA. Co wiadomo z kodu i decyzji:
- mosADD ma warstwę tłumaczeń (`apps/web/src/i18n/`, katalog `locales`), a teksty idą przez `t()` — ⚠ lista żywych locale do zmierzenia przez ADMIRAŁA mosADD.
- ⚠ DotGothic16 (`eng-dot`) nie ma polskich znaków — polski tekst w Engineering idzie w Geist Mono.
- ⛔ Kanon językowy NOWROCKY (wszystko po angielsku) dotyczy tamtej marki i NIE przenosi się na RA automatycznie. Nie kopiować bez rozkazu.
Do zamknięcia: jeden wiersz w DECYZJE-KROLA — język bazowy UI, język LP, lista locale per marka.
