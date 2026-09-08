import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { PHOTOGRAPHY_SAMPLE, buildBrief } from "./brief";
import { createBriefArtifact, createCatalogue, createComparisonArtifact, getCatalogueContent, serializeCatalogueContent } from "./artifact";
import {
  attentionBriefInputSchema, attentionExperimentPlanSchema, attentionMetricSchema,
  briefArtifactSchema, briefSnapshotSchema, catalogueContentSchema, catalogueSchema,
  claimSnapshotSchema, comparisonArtifactSchema, comparisonInputSchema,
  mechanismSnapshotSchema, platformSnapshotSchema, sourceSnapshotSchema,
  type ComparisonInput,
} from "./contract";
import { attentionErrorResponseSchema, getAttentionJsonSchemas } from "./openapi";
import { readyBriefInputSchema, metricSchema, experimentPlanSchema, workspaceDraftSchema } from "./workspace-schema";
import { createEmptyDraft } from "./workspace";
import { renderBriefMarkdown } from "./export";

const digest = `sha256:${"0".repeat(64)}`;
const comparisonInput: ComparisonInput = {
  counts: { aOutcomes: "10", aEligible: "100", bOutcomes: "18", bEligible: "120" },
  plan: { design: "observational", allocation: "", eligibility: "", startDate: "", endDate: "", stoppingRule: "", guardrailPlan: "", guardrailResults: "" },
  metric: buildBrief(PHOTOGRAPHY_SAMPLE).metric,
};
const malformed = ["\ud800", "\udfff", "\ud800A", "\udc00\ud800", "\ud800\ud800", "\udc00\udc00"];
const astral = String.fromCodePoint(0x1f4f7);

test("新 brief API ready schema 重用舊 readiness，但會喺入核心前拒絕所有 malformed surrogate", () => {
  for (const suffix of malformed) {
    const input = { ...PHOTOGRAPHY_SAMPLE, topic: `sample${suffix}` };
    assert.equal(readyBriefInputSchema.safeParse(input).success, true);
    const parsed = attentionBriefInputSchema.safeParse(input);
    assert.equal(parsed.success, false);
    if (!parsed.success) assert.ok(parsed.error.issues.some((issue) => issue.path.join(".") === "topic" && issue.message.includes("Unicode")));
    assert.throws(() => createBriefArtifact(input, digest), z.ZodError);
  }
  for (const [field, schema] of Object.entries(readyBriefInputSchema.shape)) {
    if (schema instanceof z.ZodString) {
      assert.equal(attentionBriefInputSchema.safeParse({ ...PHOTOGRAPHY_SAMPLE, [field]: "sample\ud800" }).success, false, field);
    }
  }
  const escaped = JSON.parse(String.raw`{"topic":"sample\ud800"}`);
  assert.equal(attentionBriefInputSchema.safeParse({ ...PHOTOGRAPHY_SAMPLE, ...escaped }).success, false);
});

test("comparison metric／plan 入口一致拒絕 malformed Unicode，唔生成 SDK 讀唔到嘅成功 artifact", () => {
  for (const suffix of malformed) {
    const input = { ...comparisonInput, metric: { ...comparisonInput.metric, name: `sample${suffix}` } };
    assert.equal(metricSchema.safeParse(input.metric).success, true);
    assert.equal(attentionMetricSchema.safeParse(input.metric).success, false);
    const parsed = comparisonInputSchema.safeParse(input);
    assert.equal(parsed.success, false);
    if (!parsed.success) assert.ok(parsed.error.issues.some((issue) => issue.path.join(".") === "metric.name" && issue.message.includes("Unicode")));
    assert.throws(() => createComparisonArtifact(input, digest), z.ZodError);
  }
  for (const field of Object.keys(comparisonInput.metric)) {
    assert.equal(comparisonInputSchema.safeParse({ ...comparisonInput, metric: { ...comparisonInput.metric, [field]: "sample\udc00" } }).success, false, field);
  }
  for (const field of ["allocation", "eligibility", "stoppingRule", "guardrailPlan", "guardrailResults"]) {
    const plan = { ...comparisonInput.plan, [field]: "sample\ud800" };
    assert.equal(experimentPlanSchema.safeParse(plan).success, true);
    assert.equal(attentionExperimentPlanSchema.safeParse(plan).success, false, field);
    assert.equal(comparisonInputSchema.safeParse({ ...comparisonInput, plan }).success, false, field);
  }
});

function stringPaths(value: unknown, path: (string | number)[] = []): (string | number)[][] {
  if (typeof value === "string") return [path];
  if (Array.isArray(value)) return value.flatMap((child, index) => stringPaths(child, [...path, index]));
  if (value !== null && typeof value === "object") return Object.entries(value).flatMap(([key, child]) => stringPaths(child, [...path, key]));
  return [];
}
function rejectsEveryString(schema: z.ZodType, sample: unknown) {
  assert.equal(schema.safeParse(sample).success, true);
  for (const path of stringPaths(sample)) {
    const mutated = structuredClone(sample);
    let parent = mutated as Record<string | number, unknown>;
    for (const key of path.slice(0, -1)) parent = parent[key] as Record<string | number, unknown>;
    const key = path[path.length - 1];
    parent[key] = `${parent[key]}\ud800`;
    assert.equal(schema.safeParse(mutated).success, false, path.join("."));
  }
}

test("所有歷史 artifact／來源／claims／catalogue metadata 字串都拒絕未成對 surrogate", () => {
  const catalogue = createCatalogue(digest);
  const brief = createBriefArtifact(PHOTOGRAPHY_SAMPLE, digest);
  const comparison = createComparisonArtifact(comparisonInput, digest);
  rejectsEveryString(catalogueSchema, catalogue);
  rejectsEveryString(catalogueContentSchema, getCatalogueContent());
  rejectsEveryString(briefArtifactSchema, brief);
  rejectsEveryString(briefSnapshotSchema, brief.brief);
  rejectsEveryString(comparisonArtifactSchema, comparison);
  rejectsEveryString(sourceSnapshotSchema, catalogue.sources[0]);
  rejectsEveryString(claimSnapshotSchema, catalogue.mechanisms[0].claims[0]);
  rejectsEveryString(mechanismSnapshotSchema, catalogue.mechanisms[0]);
  rejectsEveryString(platformSnapshotSchema, catalogue.platforms[0]);
  rejectsEveryString(attentionErrorResponseSchema, { success: false, error: { code: "INVALID_INPUT", message: "欄位無效。" } });
  const content = getCatalogueContent();
  content.sources[0].context += "\udc00";
  assert.throws(() => serializeCatalogueContent(content), z.ZodError);
});

test("合法 raw／escaped astral pairs 原樣通過，UTF-16 長度上限冇放寬或 normalize", () => {
  const escapedAstral = JSON.parse('"\\ud83d\\udcf7"');
  assert.equal(escapedAstral, astral);
  for (const value of [astral, escapedAstral]) {
    const input = { ...PHOTOGRAPHY_SAMPLE, topic: `sample${value}` };
    const brief = createBriefArtifact(input, digest);
    assert.equal(brief.brief.input.topic, input.topic);
    assert.ok(brief.markdown.includes(value));
    const comparison = createComparisonArtifact({ ...comparisonInput, metric: { ...comparisonInput.metric, name: `sample${value}` }, plan: { ...comparisonInput.plan, allocation: value } }, digest);
    assert.equal(comparison.metric.name, `sample${value}`);
    assert.equal(comparison.plan.allocation, value);
    const source = { ...getCatalogueContent().sources[0], publisher: value, context: value, retrievalLimitations: value };
    assert.deepEqual(sourceSnapshotSchema.parse(source), source);
  }
  assert.equal(attentionBriefInputSchema.safeParse({ ...PHOTOGRAPHY_SAMPLE, topic: astral.repeat(100) }).success, true);
  assert.equal(attentionBriefInputSchema.safeParse({ ...PHOTOGRAPHY_SAMPLE, topic: astral.repeat(101) }).success, false);
  assert.equal(attentionMetricSchema.safeParse({ ...comparisonInput.metric, name: astral.repeat(150) }).success, true);
  assert.equal(attentionMetricSchema.safeParse({ ...comparisonInput.metric, name: astral.repeat(151) }).success, false);
});

test("舊 workspace v1 保留原本 Unicode 接受行為，新 API refinement 有機器可讀說明", () => {
  const draft = createEmptyDraft();
  draft.input = { ...PHOTOGRAPHY_SAMPLE, topic: "sample\ud800" };
  draft.generated = buildBrief(draft.input);
  draft.markdown = renderBriefMarkdown(draft.generated);
  assert.equal(workspaceDraftSchema.safeParse(draft).success, true);
  const explanation = getAttentionJsonSchemas()["x-semantic-refinements"].Unicode.join(" ");
  assert.match(explanation, /Unicode scalar/);
  assert.match(explanation, /JSON escaped surrogate/);
  assert.match(explanation, /UTF-16/);
});
