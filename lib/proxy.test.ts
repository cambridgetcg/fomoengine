import { strict as assert } from "node:assert";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

test("real Next RSC and prefetch headers bypass host redirects even with wildcard Accept", () => {
  const variants: Record<string, string>[] = [
    { RSC: "1" },
    { "Next-Router-Prefetch": "1" },
    { "Next-Router-Segment-Prefetch": "/_tree" },
    { "Next-Router-State-Tree": "[]" },
    { Purpose: "prefetch" },
  ];
  for (const headers of variants) {
    const response = proxy(new NextRequest("https://www.fomoengine.io/lab?_rsc=test", {
      headers: { Accept: "*/*", ...headers },
    }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("location"), null);
    assert.equal(response.headers.get("x-middleware-next"), "1");
  }
});

test("ordinary HTML gets 308 and the free API POST is untouched", () => {
  const html = proxy(new NextRequest("https://www.fomoengine.io/atlas?mechanism=scarcity", {
    headers: { Accept: "text/html" },
  }));
  assert.equal(html.status, 308);
  assert.equal(html.headers.get("location"), "https://fomoengine.io/atlas?mechanism=scarcity");
  const api = proxy(new NextRequest("https://www.fomoengine.io/api/v1/check", { method: "POST" }));
  assert.equal(api.status, 200);
  assert.equal(api.headers.get("location"), null);
});

test("standalone loopback URLs use the real Host header without redirecting previews", () => {
  const document = proxy(new NextRequest("http://127.0.0.1:3187/atlas?from=host-check", {
    headers: { Host: "www.fomoengine.io", Accept: "text/html" },
  }));
  assert.equal(document.status, 308);
  assert.equal(document.headers.get("location"), "https://fomoengine.io/atlas?from=host-check");
  const preview = proxy(new NextRequest("https://www.fomoengine.io/atlas", {
    headers: { Host: "preview.vercel.app", Accept: "text/html" },
  }));
  assert.equal(preview.status, 200);
  assert.equal(preview.headers.get("location"), null);
});
