import test from "node:test";
import assert from "node:assert/strict";
import { buildBrief, PHOTOGRAPHY_SAMPLE } from "./brief";
import { renderBriefMarkdown } from "./export";
import { createEmptyDraft } from "./workspace";
import { generatedBriefSchema, rawCountsSchema, workspaceDraftSchema, workspaceEnvelopeSchema, WORKSPACE_FORMAT, WORKSPACE_VERSION } from "./workspace-schema";

test("blank in-progress draft is valid but generated snapshots must be ready", () => {
  const draft = createEmptyDraft();
  assert.equal(workspaceDraftSchema.safeParse(draft).success, true);
  const generated = buildBrief(PHOTOGRAPHY_SAMPLE);
  assert.equal(generatedBriefSchema.safeParse({ ...generated, input: draft.input }).success, false);
  assert.equal(workspaceDraftSchema.safeParse({ ...draft, generated, markdown: renderBriefMarkdown(generated) }).success, true);
});

test("envelope, nested objects, enums and version are strict", () => {
  const envelope = { format: WORKSPACE_FORMAT, version: WORKSPACE_VERSION, draft: createEmptyDraft() };
  assert.equal(workspaceEnvelopeSchema.safeParse(envelope).success, true);
  assert.equal(workspaceEnvelopeSchema.safeParse({ ...envelope, version: 2 }).success, false);
  assert.equal(workspaceEnvelopeSchema.safeParse({ ...envelope, unknown: true }).success, false);
  assert.equal(workspaceEnvelopeSchema.safeParse({ ...envelope, draft: { ...envelope.draft, input: { ...envelope.draft.input, platformId: "unknown" } } }).success, false);
  assert.equal(workspaceDraftSchema.safeParse({ ...envelope.draft, plan: { ...envelope.draft.plan, unknown: true } }).success, false);
});

test("bounds reject oversized text and malformed saved count records", () => {
  const draft = createEmptyDraft();
  assert.equal(workspaceDraftSchema.safeParse({ ...draft, input: { ...draft.input, topic: "x".repeat(201) } }).success, false);
  assert.equal(workspaceDraftSchema.safeParse({ ...draft, markdown: "x".repeat(90001) }).success, false);
  assert.equal(rawCountsSchema.safeParse({ aOutcomes: "2", aEligible: "1", bOutcomes: "", bEligible: "" }).success, false);
  assert.equal(rawCountsSchema.safeParse({ aOutcomes: 1, aEligible: 2, bOutcomes: "", bEligible: "" }).success, false);
});
