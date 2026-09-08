import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createBriefArtifact, createCatalogue, createComparisonArtifact, serializeCatalogueContent } from "./artifact";
import { PHOTOGRAPHY_SAMPLE } from "./brief";
import { getAttentionJsonSchemas } from "./openapi";
import { ATTENTION_SCHEMA_VERSION, type ComparisonInput } from "./contract";

const directory = new URL("../../fixtures/attention-lab/", import.meta.url);
const digest = `sha256:${createHash("sha256").update(serializeCatalogueContent(), "utf8").digest("hex")}`;
const comparisonInput: ComparisonInput = {
  counts: { aOutcomes: "10", aEligible: "100", bOutcomes: "18", bEligible: "120" },
  plan: {
    design: "observational", allocation: "兩組由 caller 手動記錄嘅合成資料，唔係隨機分流。",
    eligibility: "每位合資格參與者只計一次，兩組沿用同一規則。",
    startDate: "2026-09-01", endDate: "2026-09-07", stoppingRule: "預先固定觀察七日，唔因結果理想就提早停止。",
    guardrailPlan: "用同一條理解問題檢查承諾有冇兌現；誤導或傷害即停。", guardrailResults: "合成示範，未有真實觀察。",
  },
  metric: createBriefArtifact(PHOTOGRAPHY_SAMPLE, digest).brief.metric,
};

function golden() {
  return {
    schemaVersion: ATTENTION_SCHEMA_VERSION,
    briefInput: PHOTOGRAPHY_SAMPLE,
    comparisonInput,
    catalogue: createCatalogue(digest),
    brief: createBriefArtifact(PHOTOGRAPHY_SAMPLE, digest),
    comparison: createComparisonArtifact(comparisonInput, digest),
    blockedBriefs: {
      socialProof: createBriefArtifact({ ...PHOTOGRAPHY_SAMPLE, mechanismId: "social-proof" }, digest),
      scarcity: createBriefArtifact({ ...PHOTOGRAPHY_SAMPLE, mechanismId: "scarcity", platformId: "marketing-offer" }, digest),
    },
    incompleteComparison: createComparisonArtifact({ ...comparisonInput, counts: { ...comparisonInput.counts, bEligible: "" } }, digest),
    zeroDenominatorComparison: createComparisonArtifact({ ...comparisonInput, counts: { ...comparisonInput.counts, aOutcomes: "0", aEligible: "0" } }, digest),
    zeroBaselineComparison: createComparisonArtifact({ ...comparisonInput, counts: { ...comparisonInput.counts, aOutcomes: "0" } }, digest),
  };
}

test("權威核心可重生 SDK golden fixture 同 structural JSON Schema，唔接受手工漂移", () => {
  const expected = { "v1.json": golden(), "v1.schema.json": getAttentionJsonSchemas() };
  // 明示 UPDATE_ATTENTION_FIXTURES=1 先重生；普通 tests 只讀同反查。
  if (process.env.UPDATE_ATTENTION_FIXTURES === "1") mkdirSync(directory, { recursive: true });
  for (const [name, value] of Object.entries(expected)) {
    const path = new URL(name, directory);
    const serialized = `${JSON.stringify(value, null, 2)}\n`;
    if (process.env.UPDATE_ATTENTION_FIXTURES === "1") writeFileSync(path, serialized, "utf8");
    assert.equal(readFileSync(path, "utf8"), serialized, `${fileURLToPath(path)} 必須由權威 schema/core 重生。`);
  }
});
