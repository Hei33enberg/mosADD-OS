/**
 * @mosadd/agent — programmatic entry.
 *
 * Most users just want `npx -y @mosadd/agent start` (the bin). Importing this
 * module gives you the same responder loop as a function, so a server (Vercel,
 * Workers, your own Node service) can host an agent without a CLI.
 */
export { startResponder, type ResponderOptions } from "./responder.js";
// ⛔ REKA NA MASZYNIE. Wystawione, zeby dalo sie ja SPRAWDZIC bez uruchamiania calego agenta
// (proba-komputer.mjs) i zeby gospodarz — Elektron — mogl pokazac wlascicielowi, czym agent
// realnie dysponuje na jego komputerze, zamiast kazac mu wierzyc na slowo.
export { narzedziaLokalne, poleceniaWlaczone, type NarzedzieLokalne } from "./local-tools.js";
