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

test("the design-partner offer has one explicit, bounded price and scope", () => {
  assert.equal(DESIGN_PARTNER_AUDIT.priceUsd, 99);
  assert.equal(DESIGN_PARTNER_AUDIT.priceLabel, "$99 USD");
  assert.equal(DESIGN_PARTNER_AUDIT.maximumSurfaces, 3);
  assert.equal(DESIGN_PARTNER_AUDIT.maximumWords, 5000);
});

test("intake requires permission and the metadata-only privacy acknowledgement", () => {
  assert.equal(auditRequestSchema.safeParse(VALID).success, true);
  assert.equal(auditRequestSchema.safeParse({ ...VALID, permissionConfirmed: false }).success, false);
  assert.equal(auditRequestSchema.safeParse({ ...VALID, metadataOnlyConfirmed: false }).success, false);
  assert.equal(auditRequestSchema.safeParse({ ...VALID, pastedCopy: "secret launch copy" }).success, false);
});

test("request draft discloses price, payment state, ruleset snapshot, and privacy boundary", () => {
  const parsed = auditRequestSchema.parse(VALID);
  const draft = buildAuditRequestText(parsed);
  assert.match(draft, /\$99 USD/);
  assert.match(draft, /no payment has been taken/i);
  assert.match(draft, /Ruleset snapshot: authenticity-shield\/\d{4}-\d{2}-\d{2}\.\d+/);
  assert.match(draft, /no private copy, credentials, customer records, or other personal data/i);
});

test("mailto uses fixed headers and encodes request data in the body", () => {
  const draft = buildAuditRequestText(auditRequestSchema.parse(VALID));
  const url = buildAuditMailto("audits@example.test", draft);
  assert.match(url, /^mailto:audits%40example\.test\?/);
  assert.match(url, /subject=Copy\+Pressure\+Audit/);
  assert.ok(!url.includes("https://example.test/pricing"), "request body must be URL-encoded");
});
