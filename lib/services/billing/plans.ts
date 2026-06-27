/**
 * Plans = the single source of truth for tier → quota → price.
 *
 * Provider-agnostic on purpose: the payment provider (Paddle / Polar / Stripe)
 * owns the *charging*; this file owns what a paid plan *grants*. Map your
 * provider's price IDs to these plans via env so no provider id is hardcoded.
 */
import type { ApiTier } from "@prisma/client";
import type { AnalyzeTier } from "@/lib/services/detection/detection.service";

/**
 * The single home for "which API tiers get the stronger model." Lives next to the
 * plan/quota definitions so the policy isn't duplicated inside the HTTP handler.
 * (type-only import above => no runtime coupling to the detection service.)
 */
export function analyzeTierFor(tier: ApiTier): AnalyzeTier {
  return tier === "STARTER" || tier === "PRO" ? "paid" : "free";
}

export interface Plan {
  id: string; // our internal plan key
  tier: ApiTier;
  monthlyQuota: number; // checks per calendar month; 0 = unlimited
  priceUsd: number; // display price; the provider remains the billing source of truth
  label: string;
  why: string; // methodology / rationale, so the tier decision is inspectable
}

/**
 * Pricing methodology (why these numbers, so the decision is inspectable):
 *   free     1k checks/mo  $0   — anonymous, no DB, rate-limited per IP. Exists so
 *                               the scam alert is reachable to anyone, not gated.
 *   starter  10k checks/mo $29  — ~3.3× free volume; covers LLM cost + margin for a
 *                               small business without subsidising heavy users.
 *   pro      100k checks/mo $99 — 10× starter volume; the per-check cost drops as
 *                               batch inference kicks in, so the price scales sub-
 *                               linearly. See /docs/pricing for the full rationale.
 */
// explanation for each tier lives in the methodology comment above; label is the
// user-facing display name, priceUsd is disclosed so the tier decision is why-linked
export const PLANS: Record<string, Plan> = {
  free: { id: "free", tier: "FREE", monthlyQuota: 1000, priceUsd: 0, label: "Free", why: "reachable to everyone; rate-limited per IP, no DB" },
  starter: { id: "starter", tier: "STARTER", monthlyQuota: 10000, priceUsd: 29, label: "Starter", why: "covers LLM cost + margin; ~3.3× free volume" },
  pro: { id: "pro", tier: "PRO", monthlyQuota: 100000, priceUsd: 99, label: "Pro", why: "sub-linear pricing; batch inference lowers per-check cost" },
};

/**
 * Resolve a provider's price/plan id to one of our Plans. Configure the mapping
 * with env vars (e.g. BILLING_PLAN_ID_STARTER=pri_abc123) so provider ids never
 * leak into source. Falls back to treating the id as an internal plan key.
 */
export function planForProviderPlanId(providerPlanId: string): Plan | undefined {
  const byProviderId: Record<string, string> = {};
  const envMap: Array<[string, string]> = [
    ["starter", "BILLING_PLAN_ID_STARTER"],
    ["pro", "BILLING_PLAN_ID_PRO"],
  ];
  for (const [planKey, envKey] of envMap) {
    const v = process.env[envKey];
    if (v) byProviderId[v] = planKey;
  }
  return PLANS[byProviderId[providerPlanId] ?? providerPlanId];
}
