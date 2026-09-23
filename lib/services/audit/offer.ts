import { z } from "zod";

export const DESIGN_PARTNER_AUDIT = Object.freeze({
  id: "copy-pressure-audit-design-partner",
  name: "Copy Pressure Audit",
  acceptingRequests: false,
  status: "retired",
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

export function buildAuditRequestText(_request: AuditRequest): never {
  throw new Error("Paid audit requests are retired. Use the public checker for self-guided exploration.");
}

export function buildAuditMailto(_contactEmail: string, _requestText: string): never {
  throw new Error("Paid audit requests are retired. No new service request or payment route is created.");
}
