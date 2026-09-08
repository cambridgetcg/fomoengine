import { z } from "zod";
import { experimentPlanSchema, rawCountsSchema, type ExperimentPlan, type RawCounts } from "./workspace-schema";

const countSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const countPairSchema = z.object({ outcomes: countSchema, eligible: countSchema }).strict().refine(
  (pair) => pair.outcomes <= pair.eligible,
  { path: ["outcomes"], message: "Outcomes cannot exceed eligible units." },
);
export type CountPair = z.infer<typeof countPairSchema>;
export interface Comparison {
  aRate: number | null;
  bRate: number | null;
  percentagePointDifference: number | null;
  relativeLift: number | null;
}

export function compareCounts(aRaw: CountPair, bRaw: CountPair): Comparison {
  const a = countPairSchema.parse(aRaw);
  const b = countPairSchema.parse(bRaw);
  const aRate = a.eligible === 0 ? null : a.outcomes / a.eligible;
  const bRate = b.eligible === 0 ? null : b.outcomes / b.eligible;
  return {
    aRate, bRate,
    percentagePointDifference: aRate === null || bRate === null ? null : (bRate - aRate) * 100,
    relativeLift: aRate === null || bRate === null || aRate === 0 ? null : (bRate - aRate) / aRate,
  };
}

export function compareRawCounts(raw: RawCounts): Comparison | null {
  const counts = rawCountsSchema.parse(raw);
  if (Object.values(counts).some((value) => value === "")) return null;
  return compareCounts(
    { outcomes: Number(counts.aOutcomes), eligible: Number(counts.aEligible) },
    { outcomes: Number(counts.bOutcomes), eligible: Number(counts.bEligible) },
  );
}

export function formatRate(rate: number | null): string {
  return rate === null ? "N/A" : `${(rate * 100).toFixed(2)}%`;
}

export function formatDifference(value: number | null, unit: "pp" | "%"): string {
  if (value === null) return "N/A";
  const rounded = Number(value.toFixed(2));
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(2)}${unit === "pp" ? " pp" : "%"}`;
}

export function describeDesign(design: ExperimentPlan["design"]): string {
  return design === "randomized"
    ? "Randomized only if you actually assign eligible units at random before exposure and keep assignment stable. This tool does not allocate traffic or verify randomization. Rates here remain descriptive: no significance, causal conclusion or automatic winner is calculated."
    : "Observational comparison. Separate posts and before/after search changes are not randomized A/B tests. Audience, distribution, rank and timing may explain differences. Rates describe these recorded groups, not a causal effect or a winner.";
}

export function planReadiness(plan: ExperimentPlan): string[] {
  const parsed = experimentPlanSchema.safeParse(plan);
  if (!parsed.success) return parsed.error.issues.map((issue) => issue.message);
  const missing: string[] = [];
  if (!plan.eligibility.trim()) missing.push("Define eligible units and how repeat exposure is deduplicated.");
  if (!plan.allocation.trim()) missing.push("Describe the observation cohorts or actual random-assignment method.");
  if (!plan.startDate || !plan.endDate) missing.push("Set a fixed start and end date before exposure.");
  if (!plan.stoppingRule.trim()) missing.push("Write a stopping rule that does not stop on a favorable rate.");
  if (!plan.guardrailPlan.trim()) missing.push("Predefine a quality/trust check and the harm or misinformation stop rule.");
  return missing;
}
