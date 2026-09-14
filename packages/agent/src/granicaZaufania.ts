/**
 * GRANICA ZAUFANIA — jedyna odpowiedz na pytanie „czy ta linia ma odpowiadac temu rozmowcy".
 *
 * ⛔ CO TO ZAMYKA, ZMIERZONE 2026-09-14. Petla odpowiedzi w `responder.ts` szla po WSZYSTKICH
 * zaakceptowanych kontaktach i kazdemu podawala mozgowi narzedzia maszyny. Jedynym filtrem nadawcy
 * bylo „nie odpowiadaj sam sobie". Znaczylo to, ze KAZDY zaakceptowany kontakt wlasciciela mogl
 * kazac jego komputerowi wypisac katalog, przeczytac plik i zrobic zrzut ekranu. Nasz wlasny
 * dokument opisywal regule, ktorej nasz wlasny kod nie mial
 * (mosADD/docs/sztab/DESKTOP-sterowanie-komputerem-z-telefonu.md par. 6).
 *
 * ⛔ NIE WYMYSLAMY TU NOWEJ POLITYKI. Runtime chmurowy (`agent-dm-responder`) pyta o to samo od
 * 01.09: RPC `agent_may_talk_to`, a polityka lezy w bazie (`agent_peer_policy` / `agent_peer_allow`),
 * gdzie WLASCICIEL ja widzi i zmienia. Zmienna srodowiskowa byla poprzednim ksztaltem tej reguly
 * i zostala porzucona wlasnie dlatego, ze jest niewidoczna dla wlasciciela i zmienia sie po cichu.
 * Dwa runtime'y, jedna odpowiedz. Funkcja bazy jest `security definer` z
 * `grant execute to authenticated`, a ta paczka i tak wymienia klucz huba na prawdziwy JWT — wiec
 * wola ja bez zadnego nowego wejscia serwerowego.
 *
 * ⛔ DLACZEGO OSOBNY PLIK. Zeby dalo sie to przetestowac. `responder.ts` importuje `@mosadd/mcp`
 * w pierwszych liniach, wiec kazdy test tamtego pliku wymaga zbudowanego calego warsztatu.
 * Zamek, ktorego nie da sie odpalic w tescie, jest zamkiem, ktoremu wierzymy na slowo.
 *
 * ⛔ KIERUNEK AWARII JEST CZESCIA ZAMKA. Kazdy blad — brak sieci, 401, nieczytelna odpowiedz,
 * przekroczony czas — znaczy NIE. Zamek, ktory przy awarii przepuszcza, nie jest zamkiem: przy
 * 30-sekundowym pollu jedna minuta niedostepnosci bazy otwieralaby dysk wlasciciela kazdemu
 * kontaktowi. To jest ta sama regula, co „domyslna odpowiedz sceptyka brzmi: nie przepuszczam".
 */
export async function wolnoRozmawiac(
  supabaseUrl: string,
  anonKey: string,
  jwt: string,
  selfId: string,
  peerId: string,
): Promise<boolean> {
  if (!supabaseUrl || !anonKey || !jwt || !selfId || !peerId) return false;
  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/rpc/agent_may_talk_to`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_agent_identity_id: selfId, p_peer_identity_id: peerId }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return false;
    // ⛔ TYLKO literalne `true`. Baza oddaje boolean; cokolwiek innego (null, "true", 1, obiekt
    // bledu PostgREST) znaczy „nie wiem", a „nie wiem" znaczy NIE.
    return (await r.json()) === true;
  } catch {
    return false;
  }
}
