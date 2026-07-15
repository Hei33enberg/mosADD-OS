# apps/realm — mosadd.dev (the REALM / builder community hub)

Static single-page front door for developers & contributors, served at **mosadd.dev**.
mosadd.com = the product (consumers); mosadd.dev = the kingdom (builders).

Sections: manifesto-for-builders · toolkit quickstart (65 tools) · the REALM ladder
(L0–L5) · Hall of Fame · "what we will never do".

## Deploy
Vercel project **dev** (team hei33enberg). Static — `index.html` + `vercel.json`
(keeps the `/murl` + `/channel0` → murl.mosadd.com redirects; everything else serves the hub).

The Hall-of-Fame row(s) are baked from `community/realm.json` at deploy time (the repo is
private, so a client-side raw fetch won't work). Regenerate + redeploy when the ledger grows —
a follow-up automation can wire `realm-ledger.yml` to refresh this snapshot.

OWNER: attach the `mosadd.dev` domain to the **dev** Vercel project (Settings → Domains → Add).
