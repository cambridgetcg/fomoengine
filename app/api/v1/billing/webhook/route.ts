/**
 * POST /api/v1/billing/webhook — provision / revoke API keys from billing events.
 *
 * STUB until a provider is configured: with no provider wired, this returns a
 * generic 501 (no config details leaked to unauthenticated probes — the wiring
 * lives in docs/MONETIZATION.md). Once you implement getConfiguredProvider(), a
 * paid event maps to a Plan (tier + quota) and a cancellation revokes the key.
 *
 * Before shipping real provisioning, persist + check the provider's event id for
 * idempotency so a replayed signed event is a no-op.
 */
import { NextRequest } from "next/server";
import { getConfiguredProvider } from "@/lib/services/billing/provider";
import { planForProviderPlanId } from "@/lib/services/billing/plans";
import { jsonOk, jsonError } from "@/lib/api/envelope";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const provider = getConfiguredProvider();
  if (!provider) {
    return jsonError("BILLING_NOT_CONFIGURED", "Billing is not configured.", 501);
  }

  const rawBody = await req.text();
  const event = await provider.verifyAndParse(rawBody, req.headers);
  if (!event) {
    return jsonError("INVALID_SIGNATURE", "Webhook signature could not be verified.", 400);
  }

  const plan = planForProviderPlanId(event.providerPlanId);
  // TODO (next build): idempotency-check the provider event id, then provision/revoke
  // an ApiKey for event.customerEmail at plan.tier / plan.monthlyQuota, and deliver
  // the one-time secret out-of-band (dashboard or email).
  return jsonOk({ received: event.type, mappedTier: plan?.tier ?? null });
}
