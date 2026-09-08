import { strict as assert } from "node:assert";
import { test } from "node:test";
import { canonicalRedirect, pageMetadata, SITE_URL } from "./site";

test("each page declares its own brand canonical and social URL", () => {
  for (const path of ["/", "/check", "/audit", "/atlas/curiosity-gap", "/lab", "/trends"]) {
    const metadata = pageMetadata("A page", "A description", path);
    assert.equal(metadata.alternates?.canonical, path);
    assert.equal(metadata.openGraph?.url, path);
    assert.equal(new URL(path, SITE_URL).hostname, "fomoengine.io");
  }
});

test("www HTML documents get a permanent-brand target without losing path or query", () => {
  const result = canonicalRedirect(
    new URL("https://www.fomoengine.io/atlas/curiosity-gap?from=field-guide&platform=youtube-shorts"),
    "GET",
    "text/html,application/xhtml+xml",
  );
  assert.equal(result?.href, "https://fomoengine.io/atlas/curiosity-gap?from=field-guide&platform=youtube-shorts");
  assert.equal(canonicalRedirect(new URL("http://www.fomoengine.io/"), "HEAD")?.href, `${SITE_URL}/`);
});

test("apex, local, preview and lookalike hosts are never redirected", () => {
  for (const host of ["fomoengine.io", "localhost:3000", "preview.vercel.app", "www.fomoengine.io.attacker.example"]) {
    assert.equal(canonicalRedirect(new URL(`http://${host}/`), "GET"), null);
  }
});

test("API, assets, non-document RSC fetches and non-GET requests keep their original route", () => {
  const origin = "https://www.fomoengine.io";
  for (const path of ["/api", "/api/v1/check", "/_next/static/test.js", "/robots.txt", "/sitemap.xml", "/photo.png"]) {
    assert.equal(canonicalRedirect(new URL(path, origin), "GET"), null);
  }
  for (const method of ["POST", "PUT", "DELETE", "OPTIONS", "PATCH"]) {
    assert.equal(canonicalRedirect(new URL("/lab", origin), method, "text/html"), null);
  }
  assert.equal(canonicalRedirect(new URL("/lab", origin), "GET", "text/x-component"), null);
  assert.equal(canonicalRedirect(new URL("/lab", origin), "GET", "application/json"), null);
});
