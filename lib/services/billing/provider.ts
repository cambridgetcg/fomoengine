/** Historical billing event seam. New paid enrolment and checkout are retired.
 * No provider is configured. Retained types describe earlier records, not an
 * instruction to activate sales. See docs/MONETIZATION.md.
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

/** Retired, unconfigured provider seam; never creates a new purchase. */
export function getConfiguredProvider(): BillingProvider | null {
  return null;
}
