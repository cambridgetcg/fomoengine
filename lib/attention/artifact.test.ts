import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { z } from "zod";
import { buildBrief, PHOTOGRAPHY_SAMPLE } from "./brief";
import { createCatalogue, createBriefArtifact, createComparisonArtifact, getCatalogueContent, serializeCatalogueContent } from "./artifact";
import {
  catalogueSchema, briefArtifactSchema, comparisonArtifactSchema, comparisonInputSchema,
  ATTENTION_SCHEMA_VERSION, ATTENTION_ENGINE_VERSION, ATTENTION_CATALOGUE_VERSION, type ComparisonInput,
} from "./contract";
import { compareRawCounts, describeDesign, planReadiness } from "./experiments";
import { renderBriefArtifactMarkdown, renderBriefMarkdown } from "./export";
import { MECHANISMS } from "./mechanisms";
import { PLATFORMS } from "./platforms";
import { SOURCES, SOURCE_BY_ID } from "./sources";
import { WORKSPACE_VERSION } from "./workspace-schema";

const hash = (text: string) => `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
const digest = hash(serializeCatalogueContent());
const input: ComparisonInput = {
  counts: { aOutcomes: "10", aEligible: "100", bOutcomes: "18", bEligible: "120" },
  plan: { design: "observational", allocation: "", eligibility: "", startDate: "", endDate: "", stoppingRule: "", guardrailPlan: "", guardrailResults: "" },
  metric: buildBrief(PHOTOGRAPHY_SAMPLE).metric,
};

test("catalogue 保存 6/8/13 完整 registry，serialization 固定而 digest 唔包含自己", () => {
  const content = getCatalogueContent();
  assert.deepEqual([content.mechanisms.length, content.platforms.length, content.sources.length], [6, 8, 13]);
  assert.deepEqual(content.mechanisms, MECHANISMS);
  assert.deepEqual(content.platforms, PLATFORMS);
  assert.deepEqual(content.sources, SOURCES);
  assert.equal(Object.hasOwn(content, "claims"), false);
  assert.equal(Object.hasOwn(content, "catalogueDigest"), false);
  const serialized = serializeCatalogueContent();
  assert.equal(serialized, JSON.stringify(content));
  assert.equal(serialized, serializeCatalogueContent(Object.fromEntries(Object.entries(content).reverse()) as typeof content));
  assert.ok(!serialized.endsWith("\n"));
  const catalogue = createCatalogue(digest);
  assert.equal(catalogue.catalogueDigest, digest);
  assert.deepEqual(catalogueSchema.parse(catalogue), catalogue);
  const changed = getCatalogueContent();
  changed.sources[0].title = "修改獨立快照";
  assert.notEqual(hash(serializeCatalogueContent(changed)), digest);
  assert.equal(hash(serializeCatalogueContent()), digest);
});

test("新結果有四種版本資訊，唔借 workspace v1 或把 digest 當證據驗證", () => {
  for (const result of [createCatalogue(digest), createBriefArtifact(PHOTOGRAPHY_SAMPLE, digest), createComparisonArtifact(input, digest)]) {
    assert.equal(result.schemaVersion, ATTENTION_SCHEMA_VERSION);
    assert.equal(result.engineVersion, ATTENTION_ENGINE_VERSION);
    assert.equal(result.catalogueVersion, ATTENTION_CATALOGUE_VERSION);
    assert.equal(result.catalogueDigest, digest);
  }
  assert.equal(WORKSPACE_VERSION, 1);
  for (const malformed of ["", "a".repeat(64), `sha256:${"A".repeat(64)}`, `sha256:${"0".repeat(63)}`]) {
    assert.throws(() => createCatalogue(malformed), z.ZodError);
    assert.throws(() => createBriefArtifact(PHOTOGRAPHY_SAMPLE, malformed), z.ZodError);
    assert.throws(() => createComparisonArtifact(input, malformed), z.ZodError);
  }
  assert.ok(catalogueSchema.safeParse({ ...createCatalogue(digest), catalogueDigest: `sha256:${"0".repeat(64)}` }).success);
});

test("brief reuse buildBrief，claims/source 全文快照同舊 Markdown 完全保留", () => {
  const artifact = createBriefArtifact(PHOTOGRAPHY_SAMPLE, digest);
  assert.deepEqual(artifact.brief, buildBrief(PHOTOGRAPHY_SAMPLE));
  assert.deepEqual(artifact.sources, SOURCES.filter((source) => artifact.brief.sourceIds.includes(source.id)));
  const mechanism = MECHANISMS.find((entry) => entry.id === PHOTOGRAPHY_SAMPLE.mechanismId)!;
  const platform = PLATFORMS.find((entry) => entry.id === PHOTOGRAPHY_SAMPLE.platformId)!;
  assert.deepEqual(artifact.claims, [...mechanism.claims, ...platform.signals]);
  assert.deepEqual(artifact.mechanism.claimIds, mechanism.claims.map((claim) => claim.id));
  assert.deepEqual(artifact.platform.claimIds, platform.signals.map((claim) => claim.id));
  assert.equal(artifact.markdown, renderBriefMarkdown(buildBrief(PHOTOGRAPHY_SAMPLE)));
  assert.equal(artifact.markdown, renderBriefArtifactMarkdown(artifact));
  assert.match(artifact.markdown, /not freshly|not re-retrieved|not freshly fetched|not a freshly/i);
  assert.match(artifact.markdown, /Denominator:/);
});

test("舊 workspace 可以重複列 sourceIds，兼容 renderer 唔新增拒絕規則", () => {
  const brief = buildBrief(PHOTOGRAPHY_SAMPLE);
  const id = brief.sourceIds[0];
  brief.sourceIds = [id, id];
  const markdown = renderBriefMarkdown(brief);
  assert.equal(markdown.split(SOURCE_BY_ID[id].url).length - 1, 2);
});

test("新 request 嚴驗當前 IDs／compatibility／attestation，同時唔捏造 missing proof", () => {
  for (const invalid of [
    { ...PHOTOGRAPHY_SAMPLE, mechanismId: "historical-mechanism" },
    { ...PHOTOGRAPHY_SAMPLE, platformId: "historical-platform" },
    { ...PHOTOGRAPHY_SAMPLE, mechanismId: "scarcity", platformId: "google-search" },
    { ...PHOTOGRAPHY_SAMPLE, sourceIds: ["invented-source"] },
    { ...PHOTOGRAPHY_SAMPLE, nonpoliticalConfirmed: false },
    { ...PHOTOGRAPHY_SAMPLE, topic: "  " },
    { ...PHOTOGRAPHY_SAMPLE, audience: "\n" },
    { ...PHOTOGRAPHY_SAMPLE, evidenceStatus: "provided", evidence: "  " },
  ]) assert.throws(() => createBriefArtifact(invalid, digest), z.ZodError);
  for (const mechanismId of ["social-proof", "scarcity"] as const) {
    const raw = { ...PHOTOGRAPHY_SAMPLE, mechanismId, platformId: "marketing-offer" };
    assert.equal(createBriefArtifact(raw, digest).brief.experiment.blocked, true);
    assert.equal(createBriefArtifact({ ...raw, verifiedProof: "未有證據正文", realLimit: "未驗期限", limitReason: "未驗原因" }, digest).brief.experiment.blocked, true);
    const ready = createBriefArtifact({ ...raw, evidenceStatus: "provided", evidence: "caller 提供嘅來源，未獨立驗證。", verifiedProof: "有署名、日期同限制嘅經驗。", realLimit: "實際容量五人。", limitReason: "同一工作室只容五人。" }, digest);
    assert.equal(ready.brief.experiment.blocked, false);
    assert.match(ready.markdown, /not independently verified/);
  }
});

test("歷史 ID 唔受目前 enums／compatibility 約束，schema version 未支援會拒絕", () => {
  const historical = createBriefArtifact(PHOTOGRAPHY_SAMPLE, digest);
  historical.engineVersion = "0.8.0";
  historical.catalogueVersion = "2025-01-01.1";
  historical.mechanism.id = historical.brief.input.mechanismId = "retired-mechanism";
  historical.platform.id = historical.brief.input.platformId = "retired-platform";
  const originalSourceId = historical.sources[0].id;
  historical.sources[0].id = "retired-source";
  historical.sources[0].reviewedAt = "2025-01-01";
  historical.brief.sourceIds = historical.brief.sourceIds.map((id) => id === originalSourceId ? "retired-source" : id);
  historical.claims.forEach((claim) => { claim.sourceIds = claim.sourceIds.map((id) => id === originalSourceId ? "retired-source" : id); });
  assert.equal(briefArtifactSchema.safeParse(historical).success, true);
  assert.doesNotThrow(() => renderBriefArtifactMarkdown(historical));
  assert.equal(briefArtifactSchema.safeParse({ ...historical, schemaVersion: 2 }).success, false);
  assert.equal(catalogueSchema.safeParse({ ...createCatalogue(digest), schemaVersion: 2 }).success, false);
  assert.equal(comparisonArtifactSchema.safeParse({ ...createComparisonArtifact(input, digest), schemaVersion: 2 }).success, false);
});

test("catalogue metadata 改名／改 review date／移除來源都唔改寫歷史 validation 同 Markdown", () => {
  const artifact = createBriefArtifact(PHOTOGRAPHY_SAMPLE, digest);
  const originalMarkdown = artifact.markdown;
  const id = artifact.sources[0].id as keyof typeof SOURCE_BY_ID;
  const registry = SOURCE_BY_ID as Record<string, { title: string; reviewedAt: string }>;
  const original = registry[id];
  const metadata = { title: original.title, reviewedAt: original.reviewedAt };
  try {
    original.title = "已改名嘅目前來源";
    original.reviewedAt = "2030-01-01";
    assert.deepEqual(briefArtifactSchema.parse(artifact), artifact);
    assert.equal(renderBriefArtifactMarkdown(artifact), originalMarkdown);
    delete registry[id];
    assert.deepEqual(briefArtifactSchema.parse(artifact), artifact);
    assert.equal(renderBriefArtifactMarkdown(artifact), originalMarkdown);
  } finally {
    Object.assign(original, metadata);
    registry[id] = original;
  }
});

test("comparison 完全重用既有計算、設計描述同 readiness；10/100 對 18/120 約 +5 pp", () => {
  const artifact = createComparisonArtifact(input, digest);
  assert.deepEqual(artifact.counts, input.counts);
  assert.deepEqual(artifact.plan, input.plan);
  assert.deepEqual(artifact.metric, input.metric);
  assert.deepEqual(artifact.comparison, compareRawCounts(input.counts));
  assert.equal(artifact.designDescription, describeDesign(input.plan.design));
  assert.deepEqual(artifact.missingRequirements, planReadiness(input.plan));
  assert.equal(artifact.comparison!.aRate, 0.1);
  assert.equal(artifact.comparison!.bRate, 0.15);
  assert.ok(Math.abs(artifact.comparison!.percentagePointDifference! - 5) < 1e-12);
  assert.ok(Math.abs(artifact.comparison!.relativeLift! - 0.5) < 1e-12);
  assert.equal(Object.hasOwn(artifact, "winner"), false);
  const randomized = createComparisonArtifact({ ...input, plan: { ...input.plan, design: "randomized" } }, digest);
  assert.match(randomized.designDescription, /does not allocate traffic or verify randomization/);
  assert.match(randomized.interpretation, /唔計 winner、significance 或因果/);
});

test("未知 count／零分母／零 baseline 保留 null，唔推測缺失資料", () => {
  assert.equal(createComparisonArtifact({ ...input, counts: { ...input.counts, aEligible: "" } }, digest).comparison, null);
  const zeroDenominator = createComparisonArtifact({ ...input, counts: { ...input.counts, aOutcomes: "0", aEligible: "0" } }, digest);
  assert.deepEqual(zeroDenominator.comparison, { aRate: null, bRate: 0.15, percentagePointDifference: null, relativeLift: null });
  const zeroBaseline = createComparisonArtifact({ ...input, counts: { ...input.counts, aOutcomes: "0" } }, digest);
  assert.deepEqual(zeroBaseline.comparison, { aRate: 0, bRate: 0.15, percentagePointDifference: 15, relativeLift: null });
  assert.equal(comparisonArtifactSchema.safeParse({ ...zeroDenominator, comparison: { ...zeroDenominator.comparison, aRate: 0 } }).success, false);
  assert.equal(comparisonArtifactSchema.safeParse({ ...zeroBaseline, comparison: { ...zeroBaseline.comparison, relativeLift: 0 } }).success, false);
});

test("comparison 嚴格拒絕非十進位 safe whole counts、越界 outcomes、錯日期同多餘欄位", () => {
  for (const count of ["9007199254740992", "-1", "1.2", "1e2", " ", "１２", 10]) {
    assert.equal(comparisonInputSchema.safeParse({ ...input, counts: { ...input.counts, aOutcomes: count } }).success, false);
  }
  for (const raw of [
    { ...input, counts: { ...input.counts, aOutcomes: "101" } },
    { ...input, counts: { ...input.counts, secret: "冇授權欄位" } },
    { ...input, plan: { ...input.plan, startDate: "2026-02-30" } },
    { ...input, plan: { ...input.plan, startDate: "2026-09-08", endDate: "2026-09-07" } },
    { ...input, metric: { ...input.metric, extra: true } },
    { ...input, extra: true },
  ]) assert.throws(() => createComparisonArtifact(raw, digest), z.ZodError);
  assert.equal(comparisonInputSchema.safeParse({ ...input, counts: { ...input.counts, aOutcomes: "00010" } }).success, true);
  assert.equal(comparisonInputSchema.safeParse({ ...input, plan: { ...input.plan, startDate: "2024-02-29" } }).success, true);
});
