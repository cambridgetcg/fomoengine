/** Existing billing-event adapter stub. No provider has been configured.
 * New paid enrolment is retired. Do not wire this into a new sales flow.
 * Historic key/plan interpretation remains for existing-record recovery.
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
  // No new paid key is provisioned. Existing-event mapping is retained.
  return jsonOk({ received: event.type, mappedTier: plan?.tier ?? null });
}
