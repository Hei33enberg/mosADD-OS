import { describe, it, expect } from "vitest";
import { normalizeDomain } from "./domain";

describe("normalizeDomain", () => {
  it("collapses www + path + query to the registrable domain", () => {
    expect(normalizeDomain("https://www.zalando.pl/men/?q=1")).toEqual({ domain: "zalando.pl", slug: "zalando-pl" });
  });

  it("handles multi-part public suffixes (co.uk)", () => {
    expect(normalizeDomain("https://m.bbc.co.uk/news")).toEqual({ domain: "bbc.co.uk", slug: "bbc-co-uk" });
  });

  it("reduces deep subdomains to eTLD+1", () => {
    expect(normalizeDomain("https://shop.sub.example.com")).toEqual({ domain: "example.com", slug: "example-com" });
  });

  it("lowercases the host", () => {
    expect(normalizeDomain("https://EXAMPLE.COM")?.domain).toBe("example.com");
  });

  it("strips amp./mobile./m. prefixes", () => {
    expect(normalizeDomain("https://amp.example.com")?.domain).toBe("example.com");
    expect(normalizeDomain("https://mobile.example.com")?.domain).toBe("example.com");
  });

  it("punycodes IDN hosts via URL", () => {
    const r = normalizeDomain("https://münchen.de");
    expect(r?.domain).toBe("xn--mnchen-3ya.de");
    expect(r?.slug).toBe("xn--mnchen-3ya-de");
  });

  it("accepts a bare host without scheme", () => {
    expect(normalizeDomain("zalando.pl")).toEqual({ domain: "zalando.pl", slug: "zalando-pl" });
  });

  it.each([
    "http://localhost:3000",
    "https://127.0.0.1",
    "https://0.0.0.0",
    "ftp://example.com",
    "file:///etc/passwd",
    "not a url",
    "",
    "https://nodot",
  ])("rejects unsuitable input %s", (input) => {
    expect(normalizeDomain(input)).toBeNull();
  });

  it("produces a slug that satisfies the Worker route regex", () => {
    const r = normalizeDomain("https://news.bbc.co.uk");
    expect(r).not.toBeNull();
    expect(/^[a-z0-9-]{1,128}$/.test(r!.slug)).toBe(true);
  });
});
