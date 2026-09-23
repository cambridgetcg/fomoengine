import test from "node:test";
import assert from "node:assert/strict";
import {
  DESIGN_PARTNER_AUDIT,
  auditRequestSchema,
  buildAuditMailto,
  buildAuditRequestText,
} from "./offer";

const VALID = {
  requesterName: "Ari",
  organization: "Example Studio",
  surfaces: "https://example.test/pricing",
  goal: "Remove accidental urgency while keeping the offer clear.",
  permissionConfirmed: true as const,
  metadataOnlyConfirmed: true as const,
};

test("the former paid audit offer accepts no new requests", () => {
  assert.equal(DESIGN_PARTNER_AUDIT.acceptingRequests, false);
  assert.equal(DESIGN_PARTNER_AUDIT.status, "retired");
});

test("intake requires permission and the metadata-only privacy acknowledgement", () => {
  assert.equal(auditRequestSchema.safeParse(VALID).success, true);
  assert.equal(auditRequestSchema.safeParse({ ...VALID, permissionConfirmed: false }).success, false);
  assert.equal(auditRequestSchema.safeParse({ ...VALID, metadataOnlyConfirmed: false }).success, false);
  assert.equal(auditRequestSchema.safeParse({ ...VALID, pastedCopy: "secret launch copy" }).success, false);
});

test("retired intake cannot produce a sales draft or payment request", () => {
  assert.throws(() => buildAuditRequestText(auditRequestSchema.parse(VALID)), /retired/);
  assert.throws(() => buildAuditMailto("audits@example.test", "request"), /retired/);
});
