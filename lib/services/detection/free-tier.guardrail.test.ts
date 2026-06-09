/**
 * Free-tier guardrail — the PLEDGE, enforced in code.
 *
 * The biggest risk the market research flagged is NOT a competitor — it's us
 * quietly degrading the free tier under growth pressure (gating the scam alert,
 * hiding citations, capping the consumer check). These tests make that regression
 * fail CI instead of shipping.
 *
 * We strip any AI keys so the detector runs rules-only and deterministically:
 * with no model in play, "free" and "paid" MUST be identical, which proves the
 * paid tier can only ADD (via a stronger model), never SUBTRACT from the floor.
 */
delete process.env.OPENAI_API_KEY;
delete process.env.ANTHROPIC_API_KEY;

import test from "node:test";
import assert from "node:assert/strict";
import { detectionService } from "./detection.service";

const SCAM =
  "Microsoft Security: your account has been compromised. Call this number immediately to verify your identity. Do not tell anyone.";
const AD = "🔥 Only 2 left in stock! Offer ends in 04:59. Join 50,000+ happy customers.";

test("default analyze() (no options = anonymous) still raises the scam danger tier", async () => {
  const r = await detectionService.analyze(SCAM);
  assert.equal(r.scamWarning, true);
  assert.ok(r.flags.some((f) => f.severity === "danger"), "a danger-severity flag must be present");
});

test("free and paid tiers yield the SAME deterministic floor (paid is additive, never subtractive)", async () => {
  const free = await detectionService.analyze(AD, { tier: "free" });
  const paid = await detectionService.analyze(AD, { tier: "paid" });
  assert.deepEqual(
    free.flags.map((f) => f.categoryId).sort(),
    paid.flags.map((f) => f.categoryId).sort(),
  );
  assert.ok(free.flags.length >= 2, "the rules floor must still catch the obvious tactics on the free tier");
});

test("the scam-composite danger tier fires regardless of tier", async () => {
  for (const tier of ["free", "paid"] as const) {
    const r = await detectionService.analyze(SCAM, { tier });
    assert.equal(r.scamWarning, true, `scam tier must fire on the ${tier} tier`);
  }
});

test("the no-storage / no-visiting disclaimer survives on every tier", async () => {
  const r = await detectionService.analyze(AD, { tier: "paid" });
  assert.match(r.disclaimer, /did not visit any website/i);
  assert.match(r.disclaimer, /you decide/i);
});
