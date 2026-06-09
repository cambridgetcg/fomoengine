/**
 * Model-routing guardrail.
 *
 * The free-tier guardrail test runs rules-only (no AI key), so it can't see the
 * one place free and paid actually differ: which MODEL does the AI pass. This test
 * fills that gap by forcing the OpenAI provider, stubbing the network, and
 * capturing the exact model each tier requests — so a silent downgrade of the FREE
 * model (or paid quietly matching free) fails CI instead of shipping.
 */
import test, { before, after } from "node:test";
import assert from "node:assert/strict";

let detectionService: typeof import("./detection.service").detectionService;
const realFetch = globalThis.fetch;

before(async () => {
  // Set env BEFORE importing the module — its model constants read env at load time.
  process.env.OPENAI_API_KEY = "test-key-not-real";
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_MODEL_PAID; // assert the documented default ("gpt-4o")
  ({ detectionService } = await import("./detection.service"));
});

after(() => {
  globalThis.fetch = realFetch;
});

/** Capture the `model` field of each OpenAI request without hitting the network. */
function captureModels(models: string[]): void {
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    models.push(body.model);
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"flags":[]}' } }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
}

const AD = "🔥 Only 2 left in stock! Offer ends in 04:59. Join 50,000+ happy customers.";

test("free tier uses the standard model; paid tier uses a stronger one", async () => {
  const models: string[] = [];
  captureModels(models);
  await detectionService.analyze(AD, { tier: "free" });
  await detectionService.analyze(AD, { tier: "paid" });
  assert.equal(models[0], "gpt-4o-mini", "free tier must use the standard cheap model");
  assert.equal(models[1], "gpt-4o", "paid tier must use the stronger model");
  assert.notEqual(models[0], models[1], "paid must differ from free — additive, never a downgrade of free");
});

test("the free model never drifts from today's standard (locks against a silent downgrade)", async () => {
  const models: string[] = [];
  captureModels(models);
  await detectionService.analyze(AD); // default = free/anonymous
  assert.equal(models[0], "gpt-4o-mini");
});
