import test from "node:test";
import assert from "node:assert/strict";
import { newEnrollmentAllowed, planForProviderPlanId } from "./plans";

test("new keys cannot enrol in paid tiers; existing plan records still resolve", () => {
  assert.equal(newEnrollmentAllowed("FREE"), true);
  for (const tier of ["STARTER", "PRO", "UNKNOWN", ""]) {
    assert.equal(newEnrollmentAllowed(tier), false);
  }
  assert.equal(planForProviderPlanId("starter")?.tier, "STARTER");
  assert.equal(planForProviderPlanId("pro")?.tier, "PRO");
});
