// scripts/ping_indexnow.mjs
// Automatyczny ping IndexNow po wdrożeniach (Bing, Yandex, Seznam)

import https from "https";

const INDEXNOW_KEY = "e9d7247a834241e7807567cb66bb733b"; // Reużywamy tego samego wzorca lub możemy wygenerować nowy
const HOST = "m0ssad.com"; // lub domena produkcyjna
const urlsToPing = [
  `https://${HOST}/`,
  `https://${HOST}/llms.txt`,
  `https://${HOST}/llms-full.txt`
];

// Opcjonalnie parsujemy URL-e z argumentów wywołania
const args = process.argv.slice(2);
if (args.length > 0) {
  urlsToPing.length = 0; // Clear
  for (const path of args) {
    const fullUrl = path.startsWith("http") ? path : `https://${HOST}${path.startsWith("/") ? "" : "/"}${path}`;
    urlsToPing.push(fullUrl);
  }
}

const payload = JSON.stringify({
  host: HOST,
  key: INDEXNOW_KEY,
  keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
  urlList: urlsToPing
});

const req = https.request(
  {
    hostname: "api.indexnow.org",
    port: 443,
    path: "/indexnow",
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(payload)
    }
  },
  (res) => {
    console.log(`IndexNow Ping Status: ${res.statusCode} ${res.statusMessage}`);
    res.on("data", (d) => process.stdout.write(d));
  }
);

req.on("error", (e) => {
  console.error("Failed to ping IndexNow:");
  console.error(e);
});

req.write(payload);
req.end();
