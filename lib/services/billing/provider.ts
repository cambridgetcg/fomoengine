/**
 * Provider-agnostic billing seam.
 *
 * Implement ONE of these for whichever rail you pick (Paddle / Polar / Stripe).
 * The webhook route stays identical across providers — only verifyAndParse changes.
 *
 * Until BILLING_PROVIDER (and that provider's webhook secret) are configured,
 * getConfiguredProvider() returns null and the webhook route answers 501, so an
 * unwired billing endpoint is obviously a stub rather than a silent no-op.
 */
export type BillingEventType = "subscription.activated" | "subscription.updated" | "subscription.canceled";

export interface BillingEvent {
  type: BillingEventType;
  /** The provider's price/plan id — map it to a Plan via planForProviderPlanId(). */
  providerPlanId: string;
  /** Who the subscription belongs to; used to provision/revoke their key. */
  customerEmail?: string;
}

export interface BillingProvider {
  name: string;
  /** Verify the signature and normalize the raw webhook body, or return null if invalid. */
  verifyAndParse(rawBody: string, headers: Headers): Promise<BillingEvent | null>;
}

/**
 * Return the configured provider, or null if billing isn't wired yet.
 *
 * To enable, set BILLING_PROVIDER and implement the matching branch, e.g.:
 *
 *   if (process.env.BILLING_PROVIDER === "paddle")
 *     return new PaddleProvider(process.env.PADDLE_WEBHOOK_SECRET!);
 *
 * See docs/MONETIZATION.md for the recommended rail (a merchant-of-record).
 */
export function getConfiguredProvider(): BillingProvider | null {
  return null;
}
