import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import {
  catalogueSchema, briefArtifactSchema, comparisonArtifactSchema,
  MAX_ATTENTION_RESPONSE_BYTES, ATTENTION_SEMANTIC_REFINEMENTS,
} from "./contract";
import { createCatalogue, createBriefArtifact, createComparisonArtifact } from "./artifact";
import { PHOTOGRAPHY_SAMPLE } from "./brief";
import { renderBriefArtifactMarkdown, utf8Bytes } from "./export";
import { MECHANISMS } from "./mechanisms";
import { getAttentionJsonSchemas, getAttentionOpenApi } from "./openapi";
import { briefInputSchema, metricSchema, experimentPlanSchema, OBJECTIVE_IDS, type BriefInput } from "./workspace-schema";

const digest = `sha256:${"0".repeat(64)}`;

test("catalogue 冇懸空 source／platform／claim references，ID 唔可以重複", () => {
  const original = createCatalogue(digest);
  const mutate = (change: (value: typeof original) => void) => {
    const value = structuredClone(original);
    change(value);
    assert.equal(catalogueSchema.safeParse(value).success, false);
  };
  mutate((value) => { value.sources.shift(); });
  mutate((value) => { value.platforms.shift(); });
  mutate((value) => { value.sources.push(value.sources[0]); });
  mutate((value) => { value.mechanisms.push(value.mechanisms[0]); });
  mutate((value) => { value.platforms.push(value.platforms[0]); });
  mutate((value) => { value.mechanisms[0].claims[0].sourceIds = ["invented-source"]; });
  mutate((value) => { value.mechanisms[0].claims[0].sourceIds = [value.sources[1].id]; });
  mutate((value) => { value.platforms[0].signals[0].sourceIds = [value.sources[1].id]; });
  mutate((value) => { value.platforms[0].signals[0].id = value.mechanisms[0].claims[0].id; });
  mutate((value) => { value.mechanisms[0].compatiblePlatformIds.push(value.platforms[0].id); });
  mutate((value) => { value.sources[0].url = "javascript:alert(1)"; });
  mutate((value) => { value.sources[0].url = "https://user:password@example.org/"; });
  mutate((value) => { value.sources[0].publishedAt = "2025-02-29"; });
  mutate((value) => { value.sources[0].reviewedAt = "2026-09-31"; });
  mutate((value) => { Object.assign(value.mechanisms[0].claims[0], { surprise: true }); });
});

test("brief sources／claims／selected entries 雙向閉合，完整 claims 嘅 source references 都要驗", () => {
  const original = createBriefArtifact(PHOTOGRAPHY_SAMPLE, digest);
  const mutate = (change: (value: typeof original) => void) => {
    const value = structuredClone(original);
    change(value);
    assert.equal(briefArtifactSchema.safeParse(value).success, false);
  };
  mutate((value) => { value.sources.pop(); });
  mutate((value) => { value.sources.push(value.sources[0]); });
  mutate((value) => { value.sources.push({ ...value.sources[0], id: "unreferenced-source" }); });
  mutate((value) => { value.brief.sourceIds.push("missing-source"); });
  mutate((value) => { value.claims[0].sourceIds = ["missing-source"]; });
  mutate((value) => { value.claims[0].sourceIds.push(value.claims[0].sourceIds[0]); });
  mutate((value) => { value.claims.pop(); });
  mutate((value) => { value.claims.push(value.claims[0]); });
  mutate((value) => { value.claims.push({ ...value.claims[0], id: "orphan-claim" }); });
  mutate((value) => { value.mechanism.claimIds.push("missing-claim"); });
  mutate((value) => { value.platform.claimIds.push(value.platform.claimIds[0]); });
  mutate((value) => { value.mechanism.id = "different-mechanism"; });
  mutate((value) => { value.platform.id = "different-platform"; });
  mutate((value) => { Object.assign(value.sources[0], { hidden: true }); });
  assert.throws(() => renderBriefArtifactMarkdown({ ...original, sources: [] }));
  assert.throws(() => renderBriefArtifactMarkdown({ ...original, sources: [...original.sources, original.sources[0]] }));
});

test("structural JSON Schema 由權威 Zod 產生，strict objects／bounded arrays同strings冇遺漏", () => {
  const document = getAttentionJsonSchemas();
  assert.deepEqual(document["x-semantic-refinements"], ATTENTION_SEMANTIC_REFINEMENTS);
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    const value = node as Record<string, unknown>;
    if (value.type === "object") assert.equal(value.additionalProperties, false);
    if (value.type === "array") assert.equal(typeof value.maxItems, "number");
    if (value.type === "string") assert.ok(typeof value.maxLength === "number" || Array.isArray(value.enum) || typeof value.const === "string");
    Object.values(value).forEach(walk);
  };
  walk(document.$defs);
  assert.equal(document.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.ok(document.$defs.BriefArtifact);
  assert.ok(document.$defs.ErrorResponse);
  assert.match(JSON.stringify(document["x-semantic-refinements"]), /唔宣稱完全等價/);
});

test("OpenAPI 3.1 提供三 operation 同 raw schema document，公開無 auth", () => {
  const document = getAttentionOpenApi();
  assert.equal(document.openapi, "3.1.0");
  assert.deepEqual(document.security, []);
  assert.equal(Object.keys(document.paths).length, 4);
  assert.equal(document.paths["/api/v1/attention-lab/briefs"].post.requestBody.content["application/json"].schema.$ref, "#/components/schemas/BriefInput");
  assert.equal(document.paths["/api/v1/attention-lab/comparisons"].post.responses["200"].content["application/json"].schema.$ref, "#/components/schemas/ComparisonResponse");
  assert.equal(document.paths["/api/v1/attention-lab/openapi.json"].get.responses["200"].content["application/json"].schema.type, "object");
  assert.deepEqual(document.components.schemas, getAttentionJsonSchemas().$defs);
  assert.ok(utf8Bytes(JSON.stringify(document)) < MAX_ATTENTION_RESPONSE_BYTES);
});

function fillMaximum<T extends Record<string, unknown>>(value: T, shape: Record<string, z.ZodType>): T {
  const result: Record<string, unknown> = { ...value };
  for (const [key, schema] of Object.entries(shape)) {
    if (schema instanceof z.ZodString && schema.maxLength !== null) result[key] = String.fromCharCode(0).repeat(schema.maxLength);
  }
  return result as T;
}

test("所有合法 mechanism／surface／objective 配最大字串及最壞 JSON escaping，完整 response 仍細過 512 KiB", (ctx) => {
  let largest = 0;
  let largestCase = "";
  let cases = 0;
  const maximal = fillMaximum<BriefInput>({ ...PHOTOGRAPHY_SAMPLE, evidenceStatus: "provided" }, briefInputSchema.shape);
  // 每個 UTF-16 unit 最多會展開成六個 JSON bytes；NUL 唔會畀 trim 當空白刪走。
  for (const mechanism of MECHANISMS) for (const platformId of mechanism.compatiblePlatformIds) for (const objective of OBJECTIVE_IDS) {
    const artifact = createBriefArtifact({ ...maximal, mechanismId: mechanism.id, platformId, objective }, digest);
    const bytes = utf8Bytes(JSON.stringify({ success: true, data: artifact }));
    assert.ok(bytes < MAX_ATTENTION_RESPONSE_BYTES, `${mechanism.id}/${platformId}/${objective}: ${bytes}`);
    if (bytes > largest) { largest = bytes; largestCase = `${mechanism.id}/${platformId}/${objective}`; }
    cases++;
  }
  ctx.diagnostic(`${cases} 種最大輸入；最大 ${largest} bytes (${largestCase})，上限 ${MAX_ATTENTION_RESPONSE_BYTES}。`);
  assert.ok(utf8Bytes(JSON.stringify({ success: true, data: createCatalogue(digest) })) < MAX_ATTENTION_RESPONSE_BYTES);
  const plan = fillMaximum({ design: "randomized" as const, allocation: "", eligibility: "", startDate: "2026-09-01", endDate: "2026-09-08", stoppingRule: "", guardrailPlan: "", guardrailResults: "" }, experimentPlanSchema.shape);
  const metric = fillMaximum({ name: "", numerator: "", denominator: "", caveat: "" }, metricSchema.shape);
  const count = String(Number.MAX_SAFE_INTEGER).padStart(32, "0");
  const comparison = createComparisonArtifact({ counts: { aOutcomes: count, aEligible: count, bOutcomes: count, bEligible: count }, plan, metric }, digest);
  assert.ok(utf8Bytes(JSON.stringify({ success: true, data: comparison })) < MAX_ATTENTION_RESPONSE_BYTES);
  assert.equal(comparisonArtifactSchema.safeParse(comparison).success, true);
});

test("歷史 artifact 總 bytes 超界會拒絕，唔靠每欄 maxLength 假裝有 response budget", () => {
  const artifact = createBriefArtifact(PHOTOGRAPHY_SAMPLE, digest);
  artifact.markdown = String.fromCharCode(0).repeat(90000);
  const parsed = briefArtifactSchema.safeParse(artifact);
  assert.equal(parsed.success, false);
  if (!parsed.success) assert.ok(parsed.error.issues.some((issue) => issue.message.includes("512 KiB")));
});
