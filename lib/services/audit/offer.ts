import { z } from "zod";
import { RULESET_DISCLOSURE } from "@/lib/services/detection/ruleset";

export const DESIGN_PARTNER_AUDIT = Object.freeze({
  id: "copy-pressure-audit-design-partner",
  name: "Copy Pressure Audit",
  priceUsd: 99,
  priceLabel: "$99 USD",
  maximumSurfaces: 3,
  maximumWords: 5000,
  recheckDays: 14,
});

const shortText = (field: string, maximum: number) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required.`)
    .max(maximum, `${field} must be ${maximum} characters or fewer.`);

/**
 * Intake is intentionally metadata-only. There is no field for page copy,
 * credentials, customer records, or confidential attachments.
 */
export const auditRequestSchema = z
  .object({
    requesterName: z.string().trim().max(100, "Name must be 100 characters or fewer."),
    organization: shortText("Organization or project", 120),
    surfaces: shortText("Public URLs or surface names", 600),
    goal: shortText("What you want to improve", 500),
    permissionConfirmed: z.literal(true, {
      error: "Confirm that you control the copy or have permission to request its audit.",
    }),
    metadataOnlyConfirmed: z.literal(true, {
      error: "Confirm that the request contains no private copy, credentials, or personal data.",
    }),
  })
  .strict();

export type AuditRequest = z.infer<typeof auditRequestSchema>;

export function buildAuditRequestText(request: AuditRequest): string {
  const name = request.requesterName || "Not provided";
  return [
    `${DESIGN_PARTNER_AUDIT.name} — design-partner request`,
    `Offer: ${DESIGN_PARTNER_AUDIT.priceLabel} after written scope acceptance; no payment has been taken.`,
    `Ruleset snapshot: ${RULESET_DISCLOSURE.id}/${RULESET_DISCLOSURE.version} (${RULESET_DISCLOSURE.snapshotDate}).`,
    "",
    `Name: ${name}`,
    `Organization or project: ${request.organization}`,
    "Public URLs or surface names:",
    request.surfaces,
    "",
    "Goal:",
    request.goal,
    "",
    "Requester confirms:",
    "- I control this copy or have permission to request its audit.",
    "- This request contains no private copy, credentials, customer records, or other personal data.",
    "",
    "Please confirm scope, delivery timing, the privacy route for any non-public material, and a verified payment link before work begins.",
  ].join("\n");
}

export function buildAuditMailto(contactEmail: string, requestText: string): string {
  const params = new URLSearchParams({
    subject: `${DESIGN_PARTNER_AUDIT.name} — design-partner request`,
    body: requestText,
  });
  return `mailto:${encodeURIComponent(contactEmail)}?${params.toString()}`;
}
