/**
 * Truth-of-emotions invariant.
 *
 * Every manipulation we flag must ship with the feeling it hijacks AND the honest,
 * freeing truth that dissolves it — that handover from "you're being pressured" to
 * "here's your clarity back" IS the product. This makes "a trick without its truth"
 * fail CI, the same way free-tier.guardrail.test.ts protects the free path.
 *
 * Run rules-only + deterministic (no AI key) so the surfaced flags are stable.
 */
delete process.env.OPENAI_API_KEY;
delete process.env.ANTHROPIC_API_KEY;

import test from "node:test";
import assert from "node:assert/strict";
import { DETECTION_CATEGORIES, EMOTIONAL_TRUTH } from "./taxonomy";
import { detectionService } from "./detection.service";

test("every category names the feeling it hijacks AND a freeing truth", () => {
  for (const c of DETECTION_CATEGORIES) {
    const et = EMOTIONAL_TRUTH[c.id];
    assert.ok(et, `category '${c.id}' is missing an EMOTIONAL_TRUTH entry`);
    assert.ok(et.emotion.trim().length > 10, `'${c.id}'.emotion is empty/too short`);
    assert.ok(et.truth.trim().length > 25, `'${c.id}'.truth is empty/too short`);
    // The truth hands agency back — never shames the reader for being targeted.
    assert.doesNotMatch(
      et.truth,
      /\byou (are|'re) (stupid|dumb|foolish|gullible|an idiot)\b/i,
      `'${c.id}'.truth must never blame the person`,
    );
  }
});

test("the scam truth stays empowering, not just frightening", () => {
  const t = EMOTIONAL_TRUTH.scam_composite.truth.toLowerCase();
  assert.ok(/breath|breathe|trusted|call (them )?back|shield/.test(t), "scam truth must hand back a concrete, calming move");
});

test("every surfaced flag carries its emotion + truth through to the result", async () => {
  const r = await detectionService.analyze(
    "🔥 Only 2 left! Offer ends in 04:59. Join 50,000+ happy customers. No thanks, I'd rather pay full price.",
  );
  assert.ok(r.flags.length > 0, "expected at least one flag to test");
  for (const f of r.flags) {
    assert.ok(f.emotion && f.emotion.trim().length > 0, `flag '${f.categoryId}' lost its emotion`);
    assert.ok(f.truth && f.truth.trim().length > 0, `flag '${f.categoryId}' lost its truth`);
  }
});
