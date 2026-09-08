import { buildBrief } from "./brief";
import { compareRawCounts, describeDesign, planReadiness } from "./experiments";
import { renderBriefArtifactMarkdown } from "./export";
import { MECHANISMS, MECHANISM_BY_ID } from "./mechanisms";
import { PLATFORMS, PLATFORM_BY_ID } from "./platforms";
import { SOURCES } from "./sources";
import {
  attentionBriefInputSchema,
  ATTENTION_SCHEMA_VERSION, ATTENTION_ENGINE_VERSION, ATTENTION_CATALOGUE_VERSION,
  catalogueDigestSchema, catalogueContentSchema, catalogueSchema, briefArtifactSchema,
  comparisonInputSchema, comparisonArtifactSchema,
  type CatalogueContent, type Catalogue, type BriefArtifact, type ComparisonArtifact,
} from "./contract";

function versions(catalogueDigest: string) {
  return {
    schemaVersion: ATTENTION_SCHEMA_VERSION,
    engineVersion: ATTENTION_ENGINE_VERSION,
    catalogueVersion: ATTENTION_CATALOGUE_VERSION,
    catalogueDigest: catalogueDigestSchema.parse(catalogueDigest),
  };
}

export function getCatalogueContent(): CatalogueContent {
  // Zod parse 產生獨立快照；caller 改結果唔會改寫共享 registry。
  return catalogueContentSchema.parse({
    schemaVersion: ATTENTION_SCHEMA_VERSION,
    engineVersion: ATTENTION_ENGINE_VERSION,
    catalogueVersion: ATTENTION_CATALOGUE_VERSION,
    mechanisms: MECHANISMS, platforms: PLATFORMS, sources: SOURCES,
  });
}

// Digest 只涵蓋呢段 UTF-8 JSON：schema 欄位次序、原 array 次序、冇縮排／尾換行，唔含 digest 自己。
// 可以傳返保存嘅 content 重現 serialization；SHA-256 由 server/build adapter 負責。
export function serializeCatalogueContent(content: CatalogueContent = getCatalogueContent()): string {
  return JSON.stringify(catalogueContentSchema.parse(content));
}

export function createCatalogue(catalogueDigest: string): Catalogue {
  return catalogueSchema.parse({ ...getCatalogueContent(), catalogueDigest: catalogueDigestSchema.parse(catalogueDigest) });
}

export function createBriefArtifact(raw: unknown, catalogueDigest: string): BriefArtifact {
  const input = attentionBriefInputSchema.parse(raw);
  const brief = buildBrief(input);
  const mechanism = MECHANISM_BY_ID[input.mechanismId];
  const platform = PLATFORM_BY_ID[input.platformId];
  const selectedSources = new Set(brief.sourceIds);
  const sources = SOURCES.filter((source) => selectedSources.has(source.id));
  const claims = [...mechanism.claims, ...platform.signals];
  return briefArtifactSchema.parse({
    ...versions(catalogueDigest), brief,
    mechanism: { id: mechanism.id, name: mechanism.name, claimIds: mechanism.claims.map((claim) => claim.id) },
    platform: { id: platform.id, name: platform.name, claimIds: platform.signals.map((claim) => claim.id) },
    sources, claims, markdown: renderBriefArtifactMarkdown({ brief, sources }),
  });
}

export function createComparisonArtifact(raw: unknown, catalogueDigest: string): ComparisonArtifact {
  const input = comparisonInputSchema.parse(raw);
  return comparisonArtifactSchema.parse({
    ...versions(catalogueDigest), ...input,
    comparison: compareRawCounts(input.counts),
    designDescription: describeDesign(input.plan.design),
    missingRequirements: planReadiness(input.plan),
    interpretation: "只係 caller 提供嘅組別數據描述；rates 係 0–1 比例，percentagePointDifference 係 B−A 百分點，relativeLift 係相對 A 嘅比例。缺 counts 係未知，唔係零；零分母或零 baseline 冇可用數值就保留 null。唔計 winner、significance 或因果結論，亦冇驗證 metric 量度、證據真確性或 randomization。",
  });
}
