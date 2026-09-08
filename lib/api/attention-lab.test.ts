import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { createAttentionRoute, ATTENTION_MAX_REQUEST_BYTES, ATTENTION_MAX_RESPONSE_BYTES } from "./attention-lab";
import { createAttentionLimiter } from "./attention-rate-limit";

const url = "http://127.0.0.1/api/v1/attention-lab/briefs";
const schema = z.object({ text: z.string().max(100) }).strict();
const unlimited = () => ({ ok: true as const });
function post(body: BodyInit = '{"text":"hello"}', headers: HeadersInit = {}) {
  return new Request(url, { method: "POST", body, headers: { "Content-Type": "application/json", ...headers } });
}
function streamRequest(stream: ReadableStream<Uint8Array>, headers: HeadersInit = {}) {
  return new Request(url, { method: "POST", body: stream, duplex: "half", headers: { "Content-Type": "application/json", ...headers } } as RequestInit);
}
async function expectError(response: Response, status: number, code: string) {
  assert.equal(response.status, status);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, code);
  assert.deepEqual(Object.keys(body.error).sort(), ["code", "message"]);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
  assert.equal(response.headers.get("Access-Control-Allow-Credentials"), null);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
}

test("Attention HTTP 只畀核心已驗證欄位，唔轉送 bearer／cookies", async () => {
  const route = createAttentionRoute("POST", (input) => input, schema, { limiter: unlimited });
  const response = await route.handle(post(undefined, { Authorization: "Bearer at_SENTINEL", Cookie: "private=SENTINEL" }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: { text: "hello" } });
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("Set-Cookie"), null);
});

test("Attention JSON／schema／media errors 唔回 raw content", async () => {
  const route = createAttentionRoute("POST", (input) => input, schema, { limiter: unlimited });
  for (const body of ['{"text":', '{"text":100}', '{"text":"secret-SENTINEL","extra":true}', '{"__proto__":{}}']) {
    const response = await route.handle(post(body));
    assert.equal(response.status, body === '{"text":' ? 400 : 422);
    assert.doesNotMatch(await response.text(), /SENTINEL|__proto__/);
  }
  await expectError(await route.handle(post("not json")), 400, "INVALID_JSON");
  await expectError(await route.handle(post(undefined, { "Content-Type": "text/plain" })), 415, "UNSUPPORTED_MEDIA_TYPE");
  await expectError(await route.handle(post(undefined, { "Content-Encoding": "gzip" })), 415, "UNSUPPORTED_MEDIA_TYPE");
  await expectError(await route.handle(post(Uint8Array.of(0xc3, 0x28))), 400, "INVALID_JSON");
  await expectError(await route.handle(post('﻿{"text":"hello"}')), 400, "INVALID_JSON");
  assert.equal((await route.handle(post(undefined, { "Content-Type": "application/json; charset=utf-8" }))).status, 200);
});

test("Attention 實際 body bytes 有界，唔信假 Content-Length", async () => {
  const route = createAttentionRoute("POST", (input) => input, schema, { limiter: unlimited });
  await expectError(await route.handle(post(undefined, { "Content-Length": String(ATTENTION_MAX_REQUEST_BYTES + 1) })), 413, "PAYLOAD_TOO_LARGE");
  await expectError(await route.handle(post(undefined, { "Content-Length": "1" })), 400, "INVALID_JSON");
  await expectError(await route.handle(post(undefined, { "Content-Length": "NaN" })), 400, "INVALID_JSON");
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(ATTENTION_MAX_REQUEST_BYTES)); controller.enqueue(Uint8Array.of(32)); },
    cancel() { cancelled = true; },
  });
  await expectError(await route.handle(streamRequest(stream, { "Content-Length": "1" })), 413, "PAYLOAD_TOO_LARGE");
  assert.equal(cancelled, true);
  const valid = new TextEncoder().encode('{"text":"廣東話"}');
  const split = new ReadableStream<Uint8Array>({ start(controller) { for (const byte of valid) controller.enqueue(Uint8Array.of(byte)); controller.close(); } });
  const response = await route.handle(streamRequest(split));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.text, "廣東話");
});

test("Attention body deadline 包括 stalled stream，同時唔等永不完嘅 cancel", async () => {
  let cancelled = false;
  const route = createAttentionRoute("POST", (input) => input, schema, { limiter: unlimited, requestTimeoutMs: 20 });
  const stream = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; return new Promise(() => undefined); } });
  const response = await route.handle(streamRequest(stream));
  await expectError(response, 408, "REQUEST_TIMEOUT");
  assert.equal(cancelled, true);
});

test("Attention OPTIONS 只准 operation method 同 Content-Type；錯 method 有 envelope", async () => {
  const route = createAttentionRoute("POST", (input) => input, schema, { limiter: () => { throw new Error("OPTIONS should not consume quota"); } });
  const request = (method: string, header = "content-type") => new Request(url, { method: "OPTIONS", headers: { "Access-Control-Request-Method": method, "Access-Control-Request-Headers": header, Origin: "https://project.example" } });
  assert.equal(route.options(request("POST")).status, 204);
  await expectError(route.options(request("POST", "authorization")), 403, "CORS_NOT_ALLOWED");
  await expectError(route.options(request("DELETE")), 403, "CORS_NOT_ALLOWED");
  const response = await route.handle(new Request(url));
  await expectError(response, 405, "METHOD_NOT_ALLOWED");
  assert.equal(response.headers.get("Allow"), "POST, OPTIONS");
});

test("Attention GET／HEAD／raw OpenAPI 保持正確 document 形狀", async () => {
  const route = createAttentionRoute("GET", () => ({ openapi: "3.1.0" }), undefined, { limiter: unlimited, rawDocument: true });
  const response = await route.handle(new Request(url));
  assert.deepEqual(await response.json(), { openapi: "3.1.0" });
  const head = await route.handle(new Request(url, { method: "HEAD" }));
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});

test("Attention 核心錯誤／超大 response／限速都係 sanitized failures", async () => {
  const throws = createAttentionRoute("GET", () => { throw new Error("secret-SENTINEL"); }, undefined, { limiter: unlimited });
  const failed = await throws.handle(new Request(url));
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /SENTINEL/);
  const huge = createAttentionRoute("GET", () => "x".repeat(ATTENTION_MAX_RESPONSE_BYTES), undefined, { limiter: unlimited });
  await expectError(await huge.handle(new Request(url)), 503, "SERVICE_UNAVAILABLE");
  for (const status of [429, 503] as const) {
    const limited = createAttentionRoute("GET", () => { throw new Error("must not compute"); }, undefined, { limiter: () => ({ ok: false, status, retryAfter: 17 }) });
    const response = await limited.handle(new Request(url));
    assert.equal(response.headers.get("Retry-After"), "17");
    await expectError(response, status, status === 429 ? "RATE_LIMITED" : "SERVICE_UNAVAILABLE");
  }
});

test("Attention limiter window、容量同故障都有界，唔改 checker bucket", () => {
  let now = 1000;
  const limiter = createAttentionLimiter({ now: () => now, limit: 2, maxBuckets: 2, windowMs: 1000 });
  assert.deepEqual(limiter("one"), { ok: true });
  assert.deepEqual(limiter("one"), { ok: true });
  assert.deepEqual(limiter("one"), { ok: false, status: 429, retryAfter: 1 });
  assert.deepEqual(limiter("two"), { ok: true });
  assert.deepEqual(limiter("three"), { ok: false, status: 503, retryAfter: 60 });
  now = 2000;
  assert.deepEqual(limiter("three"), { ok: true });
  assert.deepEqual(limiter("one"), { ok: true });
  assert.deepEqual(limiter("x".repeat(129)), { ok: false, status: 503, retryAfter: 60 });
  assert.deepEqual(createAttentionLimiter({ now: () => { throw new Error("clock"); } })("one"), { ok: false, status: 503, retryAfter: 60 });
  assert.deepEqual(createAttentionLimiter({ now: () => NaN })("one"), { ok: false, status: 503, retryAfter: 60 });
  assert.throws(() => createAttentionLimiter({ maxBuckets: 0 }));
});
