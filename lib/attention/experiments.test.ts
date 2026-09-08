import test from "node:test";
import assert from "node:assert/strict";
import { compareCounts, compareRawCounts, describeDesign, formatDifference, formatRate, planReadiness } from "./experiments";
import { createEmptyDraft } from "./workspace";

test("rates, percentage points and relative lift use separate units", () => {
  const result = compareCounts({ outcomes: 20, eligible: 100 }, { outcomes: 30, eligible: 100 });
  assert.equal(result.aRate, 0.2);
  assert.equal(result.bRate, 0.3);
  assert.ok(Math.abs(result.percentagePointDifference! - 10) < 1e-10);
  assert.ok(Math.abs(result.relativeLift! - 0.5) < 1e-10);
  assert.equal(formatRate(result.aRate), "20.00%");
  assert.equal(formatDifference(result.percentagePointDifference, "pp"), "+10.00 pp");
  assert.equal(formatDifference(result.relativeLift! * 100, "%"), "+50.00%");
});

test("zero denominator and zero baseline produce N/A without infinity", () => {
  assert.deepEqual(compareCounts({ outcomes: 0, eligible: 0 }, { outcomes: 1, eligible: 5 }), { aRate: null, bRate: 0.2, percentagePointDifference: null, relativeLift: null });
  const zeroBase = compareCounts({ outcomes: 0, eligible: 10 }, { outcomes: 2, eligible: 10 });
  assert.equal(zeroBase.relativeLift, null);
  assert.equal(zeroBase.percentagePointDifference, 20);
  assert.equal(formatRate(null), "N/A");
  assert.equal(formatDifference(null, "pp"), "N/A");
  assert.equal(compareCounts({ outcomes: 0, eligible: 0 }, { outcomes: 0, eligible: 0 }).bRate, null);
});

test("safe nonnegative integer bounds and outcomes <= eligible are enforced", () => {
  for (const outcomes of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => compareCounts({ outcomes, eligible: 100 }, { outcomes: 1, eligible: 100 }));
  }
  for (const eligible of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => compareCounts({ outcomes: 0, eligible }, { outcomes: 1, eligible: 100 }));
  }
  assert.throws(() => compareCounts({ outcomes: 2, eligible: 1 }, { outcomes: 0, eligible: 1 }));
  assert.equal(compareCounts({ outcomes: Number.MAX_SAFE_INTEGER, eligible: Number.MAX_SAFE_INTEGER }, { outcomes: 0, eligible: 1 }).aRate, 1);
});

test("raw fields do not turn blank into zero or accept decimals, exponent or unsafe counts", () => {
  const counts = { aOutcomes: "1", aEligible: "10", bOutcomes: "2", bEligible: "10" };
  assert.equal(compareRawCounts({ ...counts, aEligible: "" }), null);
  for (const value of ["-1", "1.5", "1e2", "NaN", " 1", "9007199254740992"]) assert.throws(() => compareRawCounts({ ...counts, aOutcomes: value }));
  assert.throws(() => compareRawCounts({ ...counts, bOutcomes: "11" }));
  assert.equal(compareRawCounts({ ...counts, aOutcomes: "0", aEligible: "0" })?.aRate, null);
});

test("negative change and rounded zero are displayed without a winner", () => {
  const result = compareCounts({ outcomes: 30, eligible: 100 }, { outcomes: 20, eligible: 100 });
  assert.equal(formatDifference(result.percentagePointDifference, "pp"), "-10.00 pp");
  assert.equal(formatDifference(-0.000001, "pp"), "0.00 pp");
  assert.equal("winner" in result, false);
  assert.equal("significance" in result, false);
});

test("design description and pre-exposure fixed-window checklist are explicit", () => {
  assert.match(describeDesign("observational"), /not randomized/);
  assert.match(describeDesign("randomized"), /does not allocate traffic/);
  const plan = createEmptyDraft().plan;
  assert.ok(planReadiness(plan).some((s) => s.includes("fixed start")));
  const ready = { ...plan, allocation: "Random number assignment, stable participant ID", eligibility: "One consenting adult per assignment", startDate: "2026-10-01", endDate: "2026-10-08", guardrailPlan: "Same comprehension task; stop if evidence is wrong" };
  assert.deepEqual(planReadiness(ready), []);
  assert.ok(planReadiness({ ...ready, endDate: "2026-09-01" }).length > 0);
});
