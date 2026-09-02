// Próba narzędzi komputera — uruchom: node proba-komputer.mjs
// Nie jest testem jednostkowym: to dowód, że ręka na maszynie DZIAŁA i że jej granice trzymają.
import { narzedziaLokalne } from "./dist/index.js";

console.log("narzedzia:", narzedziaLokalne.map((t) => t.name).join(", "));

for (const [nazwa, we] of [["komputer_stan", {}], ["komputer_pliki", { sciezka: "." }]]) {
  const t = narzedziaLokalne.find((x) => x.name === nazwa);
  if (!t) { console.log(nazwa, "-> BRAK"); continue; }
  try {
    const w = await t.handler(t.parse(we));
    console.log(`${nazwa} -> OK:`, JSON.stringify(w).slice(0, 200));
  } catch (e) { console.log(`${nazwa} -> BLAD:`, e.message); }
}

const czytaj = narzedziaLokalne.find((x) => x.name === "komputer_czytaj");
for (const zly of ["../../../Windows/System32/drivers/etc/hosts", ".env"]) {
  try {
    await czytaj.handler(czytaj.parse({ sciezka: zly }));
    console.log(`GRANICA ${zly} -> PRZEPUSCILO (ZLE!)`);
  } catch (e) { console.log(`GRANICA ${zly} -> odmowa: ${e.message.slice(0, 80)}`); }
}

const uruchom = narzedziaLokalne.find((x) => x.name === "komputer_uruchom");
console.log("komputer_uruchom widoczne:", !!uruchom, "— bez MOSADD_AGENT_KOMPUTER=1 ma byc false");
