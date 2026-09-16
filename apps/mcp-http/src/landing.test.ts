// The gate's face is a contract, so it gets tests.
//
// ⛔ WHAT THESE TESTS ARE FOR: the owner opens https://mcp.mosadd.com/ to decide whether the
// gate is standing (report 2026-09-16 12:58, „Nie ma nawet brama prawidłowego Ui"). Two ways
// that page can fail invisibly: (1) the handler stops serving HTML at all — a connector or a
// person then sees JSON; (2) the page keeps rendering while dropping the connector URL, the
// keys link or the live tool count, i.e. it looks fine and tells nothing.
//
// The assertions below are the ones that would have caught each of those.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleMcp } from "./handler.js";
import { landingHtml } from "./landing.js";

/** Minimal req/res pair — enough for the unauthenticated GET / branch. */
function probe() {
  const out = { status: 0, headers: {} as Record<string, string>, body: "" };
  const req = { method: "GET", url: "/", headers: {} } as unknown as IncomingMessage;
  const res = {
    writeHead(status: number, headers?: Record<string, string>) {
      out.status = status;
      if (headers) out.headers = { ...out.headers, ...headers };
      return this;
    },
    setHeader(name: string, value: string) { out.headers[name] = value; },
    end(chunk?: string) { if (typeof chunk === "string") out.body += chunk; },
  } as unknown as ServerResponse;
  return { req, res, out };
}

test("GET / on the bare host serves the landing page as HTML, unauthenticated", async () => {
  const { req, res, out } = probe();
  await handleMcp(req, res, undefined);
  assert.equal(out.status, 200);
  assert.match(String(out.headers["Content-Type"]), /text\/html/);
  assert.match(out.body, /<h1>mosADD MCP gateway<\/h1>/);
  // ⛔ The page must not have quietly become JSON: a client that saved the bare URL posts
  // `initialize` here, and a 200 JSON body reads to a human as "the gate is fine".
  assert.doesNotMatch(out.body, /"jsonrpc"/);
});

test("the page carries the three things a reader came for: URL, keys link, tool count", () => {
  const html = landingHtml(85);
  assert.match(html, /https:\/\/mcp\.mosadd\.com\/mcp/);
  assert.match(html, /https:\/\/mosadd\.com\/keys/);
  assert.match(html, /85 tools/);
  assert.match(html, /data-copy="https:\/\/mcp\.mosadd\.com\/mcp"/);
  assert.match(html, /curl -s https:\/\/mcp\.mosadd\.com\/mcp/); // the curl sample, real URL
});

test("the tool count is never invented when the package cannot be counted", () => {
  assert.match(landingHtml(Number.NaN), /— tools/);
  assert.match(landingHtml(0), /— tools/);
});

test("no key, no secret, no external asset on the gate's face", () => {
  const html = landingHtml(85);
  assert.doesNotMatch(html, /mosadd_sk_live_[a-f0-9]/); // published prefix only, never a key
  assert.doesNotMatch(html, /eyJ[A-Za-z0-9_-]{10,}/); // no JWT
  assert.doesNotMatch(html, /<(script|img)[^>]+src=/); // nothing to fetch, nothing to block
});
