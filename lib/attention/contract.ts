import { z } from "zod";
import { EVIDENCE_KINDS } from "./schema";
import { isCalendarDate } from "./trends";
import {
  briefInputSchema, readyBriefInputSchema, generatedBriefSchema,
  metricSchema, rawCountsSchema, experimentPlanSchema, MAX_MARKDOWN_LENGTH,
} from "./workspace-schema";

// 呢三個版本各自獨立；唔借 workspace version，亦唔當真確性或 randomization 證明。
export const ATTENTION_SCHEMA_VERSION = 1 as const;
export const ATTENTION_ENGINE_VERSION = "1.0.0";
export const ATTENTION_CATALOGUE_VERSION = "2026-09-08.1";
export const MAX_ATTENTION_RESPONSE_BYTES = 512 * 1024;

// Unicode mode 會將合法 surrogate pair 視為一個 code point；剩低 surrogate 就一定未成對。
// 只拒絕，唔 normalize／代換字元；既有 UTF-16 長度上限同 workspace v1 保持原樣。
const isUnicodeScalarString = (value: string) => !/[\uD800-\uDFFF]/u.test(value);
const unicodeMessage = "新 API 字串必須係完整 Unicode scalar sequence，唔接受未成對 surrogate。";
function unicodeString() {
  return z.string().refine(isUnicodeScalarString, unicodeMessage);
}

// 對重用嘅舊 schema 加新 API 邊界，唔改動舊 schema 本身。
export function attentionUnicodeRefinement(value: unknown, ctx: z.RefinementCtx): void {
  const visit = (entry: unknown, path: (string | number)[]): void => {
    if (typeof entry === "string") {
      if (!isUnicodeScalarString(entry)) ctx.addIssue({ code: "custom", path, message: unicodeMessage });
    } else if (Array.isArray(entry)) {
      entry.forEach((child, index) => visit(child, [...path, index]));
    } else if (entry !== null && typeof entry === "object") {
      Object.entries(entry).forEach(([key, child]) => visit(child, [...path, key]));
    }
  };
  visit(value, []);
}
export const attentionMetricSchema = metricSchema.superRefine(attentionUnicodeRefinement);

const identifier = unicodeString().min(1).max(128).regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/);
const version = unicodeString().min(1).max(64).regex(/^[a-zA-Z0-9][a-zA-Z0-9._+-]*$/);
const text = unicodeString().min(1).max(4000);
const lines = z.array(text).max(30);
const ids = z.array(identifier).max(64);
const date = unicodeString().length(10).regex(/^\d{4}-\d{2}-\d{2}$/).refine(isCalendarDate, "日期必須係真實 YYYY-MM-DD。");
const optionalDate = z.union([z.literal(""), date]);
export const catalogueDigestSchema = unicodeString().regex(/^sha256:[0-9a-f]{64}$/).length(71);
const contentVersionFields = {
  schemaVersion: z.literal(ATTENTION_SCHEMA_VERSION), engineVersion: version, catalogueVersion: version,
};
const artifactVersionFields = { ...contentVersionFields, catalogueDigest: catalogueDigestSchema };

export const sourceSnapshotSchema = z.object({
  id: identifier,
  title: unicodeString().min(1).max(1000),
  url: unicodeString().min(1).max(2048).regex(/^https?:\/\//).refine((value) => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
    } catch { return false; }
  }, "來源 URL 必須係冇登入資料嘅完整 HTTP(S) URL；唔會自動抓取。"),
  publisher: unicodeString().min(1).max(1000),
  publishedAt: unicodeString().min(4).max(10).regex(/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/).refine((value) => {
    return isCalendarDate(value.length === 4 ? `${value}-01-01` : value.length === 7 ? `${value}-01` : value);
  }, "出版日期只接受真實 YYYY、YYYY-MM 或 YYYY-MM-DD。").nullable(),
  reviewedAt: date,
  context: text,
  retrievalLimitations: text,
}).strict();
export type SourceSnapshot = z.infer<typeof sourceSnapshotSchema>;

export const claimSnapshotSchema = z.object({
  id: identifier, text, kind: z.enum(EVIDENCE_KINDS), sourceIds: ids.min(1), context: text, limitations: lines.min(1),
}).strict();
export type ClaimSnapshot = z.infer<typeof claimSnapshotSchema>;

export const mechanismSnapshotSchema = z.object({
  id: identifier, name: unicodeString().min(1).max(300), summary: text, emotion: text, howItWorks: lines,
  example: z.object({ honest: text, pressure: text, distinction: text }).strict(),
  claims: z.array(claimSnapshotSchema).min(1).max(30), honestUse: lines, countermeasure: text, tradeoffs: lines,
  experiment: z.object({
    question: text, variable: text, control: text, treatment: text, holdConstant: lines, readout: text, limitations: text,
  }).strict(),
  compatiblePlatformIds: ids.min(1), sourceIds: ids.min(1),
}).strict();
export const platformSnapshotSchema = z.object({
  id: identifier, name: unicodeString().min(1).max(300), channel: z.enum(["social", "search", "email", "offer"]),
  surface: unicodeString().min(1).max(300), kind: z.enum(["ranked-surface", "strategy-channel"]),
  summary: text, rankingDisclosure: text, signals: z.array(claimSnapshotSchema).min(1).max(30),
  practicalChoices: lines, metric: attentionMetricSchema, qualityGuardrails: lines, confounders: lines, sourceIds: ids.min(1),
}).strict();

function issue(ctx: z.RefinementCtx, path: (string | number)[], message: string) {
  ctx.addIssue({ code: "custom", path, message });
}
function unique(values: readonly string[], ctx: z.RefinementCtx, path: (string | number)[]): Set<string> {
  const set = new Set(values);
  if (set.size !== values.length) issue(ctx, path, "快照 ID 唔可以重複。");
  return set;
}
function references(values: readonly string[], known: ReadonlySet<string>, ctx: z.RefinementCtx, path: (string | number)[]) {
  unique(values, ctx, path);
  values.forEach((id, index) => { if (!known.has(id)) issue(ctx, [...path, index], "引用必須喺同一快照入面存在。"); });
}
function claimsClosed(claims: readonly ClaimSnapshot[], sourceIds: ReadonlySet<string>, ctx: z.RefinementCtx, path: (string | number)[]) {
  unique(claims.map((claim) => claim.id), ctx, path);
  claims.forEach((claim, index) => references(claim.sourceIds, sourceIds, ctx, [...path, index, "sourceIds"]));
}
function responseBudget(value: unknown, ctx: z.RefinementCtx) {
  // 連 success envelope 一齊計實際 UTF-8；transport 仍要獨立檢查輸入／輸出 bytes。
  if (new TextEncoder().encode(JSON.stringify({ success: true, data: value })).byteLength > MAX_ATTENTION_RESPONSE_BYTES) {
    issue(ctx, [], "結果連 envelope 超過 512 KiB；唔會截短快照扮成功。");
  }
}
const catalogueFields = {
  ...contentVersionFields,
  mechanisms: z.array(mechanismSnapshotSchema).min(1).max(32),
  platforms: z.array(platformSnapshotSchema).min(1).max(32),
  sources: z.array(sourceSnapshotSchema).min(1).max(64),
};
type CatalogueStructure = {
  mechanisms: z.infer<typeof mechanismSnapshotSchema>[];
  platforms: z.infer<typeof platformSnapshotSchema>[];
  sources: SourceSnapshot[];
};
function catalogueClosed(value: CatalogueStructure, ctx: z.RefinementCtx) {
  const sourceIds = unique(value.sources.map((source) => source.id), ctx, ["sources"]);
  const platformIds = unique(value.platforms.map((platform) => platform.id), ctx, ["platforms"]);
  unique(value.mechanisms.map((mechanism) => mechanism.id), ctx, ["mechanisms"]);
  unique([...value.mechanisms.flatMap((entry) => entry.claims), ...value.platforms.flatMap((entry) => entry.signals)].map((claim) => claim.id), ctx, ["claims"]);
  value.mechanisms.forEach((entry, index) => {
    references(entry.compatiblePlatformIds, platformIds, ctx, ["mechanisms", index, "compatiblePlatformIds"]);
    references(entry.sourceIds, sourceIds, ctx, ["mechanisms", index, "sourceIds"]);
    claimsClosed(entry.claims, new Set(entry.sourceIds), ctx, ["mechanisms", index, "claims"]);
  });
  value.platforms.forEach((entry, index) => {
    references(entry.sourceIds, sourceIds, ctx, ["platforms", index, "sourceIds"]);
    claimsClosed(entry.signals, new Set(entry.sourceIds), ctx, ["platforms", index, "signals"]);
  });
}
export const catalogueContentSchema = z.object(catalogueFields).strict().superRefine(catalogueClosed);
export const catalogueSchema = z.object({ ...catalogueFields, catalogueDigest: catalogueDigestSchema }).strict()
  .superRefine(catalogueClosed).superRefine(responseBudget);
export type CatalogueContent = z.infer<typeof catalogueContentSchema>;
export type Catalogue = z.infer<typeof catalogueSchema>;

export const attentionBriefInputSchema = readyBriefInputSchema.superRefine(attentionUnicodeRefinement);
// 歷史格式沿用欄位／上限，但 ID 同 compatibility 唔可以借當前 catalogue 裁定。
const historicalBriefInputSchema = briefInputSchema.extend({ mechanismId: identifier, platformId: identifier }).superRefine((input, ctx) => {
  for (const key of ["topic", "audience"] as const) {
    if (!input[key].trim()) issue(ctx, [key], "Brief 必須有主題同受眾。");
  }
  if (input.evidenceStatus === "provided" && !input.evidence.trim()) issue(ctx, ["evidence"], "標示已提供證據就必須保存原文。");
  if (!input.nonpoliticalConfirmed) issue(ctx, ["nonpoliticalConfirmed"], "必須保留 caller 嘅非政治用途確認；唔等於獨立驗證。");
});
export const briefSnapshotSchema = generatedBriefSchema.extend({ input: historicalBriefInputSchema, sourceIds: ids.min(1) })
  .superRefine(attentionUnicodeRefinement);
const selectedEntrySchema = z.object({ id: identifier, name: unicodeString().min(1).max(300), claimIds: ids.min(1) }).strict();
export const briefArtifactSchema = z.object({
  ...artifactVersionFields,
  brief: briefSnapshotSchema,
  mechanism: selectedEntrySchema,
  platform: selectedEntrySchema,
  sources: z.array(sourceSnapshotSchema).min(1).max(64),
  claims: z.array(claimSnapshotSchema).min(1).max(60),
  markdown: unicodeString().min(1).max(MAX_MARKDOWN_LENGTH),
}).strict().superRefine((value, ctx) => {
  const sourceIds = unique(value.sources.map((source) => source.id), ctx, ["sources"]);
  references(value.brief.sourceIds, sourceIds, ctx, ["brief", "sourceIds"]);
  references(value.sources.map((source) => source.id), new Set(value.brief.sourceIds), ctx, ["sources"]);
  claimsClosed(value.claims, sourceIds, ctx, ["claims"]);
  const claimIds = new Set(value.claims.map((claim) => claim.id));
  references(value.mechanism.claimIds, claimIds, ctx, ["mechanism", "claimIds"]);
  references(value.platform.claimIds, claimIds, ctx, ["platform", "claimIds"]);
  const selected = new Set([...value.mechanism.claimIds, ...value.platform.claimIds]);
  references(value.claims.map((claim) => claim.id), selected, ctx, ["claims"]);
  if (value.brief.input.mechanismId !== value.mechanism.id) issue(ctx, ["mechanism", "id"], "Mechanism 必須對應保存嘅 input。");
  if (value.brief.input.platformId !== value.platform.id) issue(ctx, ["platform", "id"], "Platform 必須對應保存嘅 input。");
}).superRefine(responseBudget);
export type BriefArtifact = z.infer<typeof briefArtifactSchema>;

// safeExtend 保留現有日期先後 refinement，同時補上 transport schema 嘅字串長度界線。
export const attentionExperimentPlanSchema = experimentPlanSchema.safeExtend({ startDate: optionalDate, endDate: optionalDate })
  .superRefine(attentionUnicodeRefinement);
export const comparisonInputSchema = z.object({ counts: rawCountsSchema, plan: attentionExperimentPlanSchema, metric: attentionMetricSchema }).strict();
export type ComparisonInput = z.infer<typeof comparisonInputSchema>;
export const comparisonSchema = z.object({
  aRate: z.number().min(0).max(1).nullable(),
  bRate: z.number().min(0).max(1).nullable(),
  percentagePointDifference: z.number().min(-100).max(100).nullable(),
  relativeLift: z.number().min(-1).max(Number.MAX_SAFE_INTEGER).nullable(),
}).strict();
export const comparisonArtifactSchema = z.object({
  ...artifactVersionFields, ...comparisonInputSchema.shape,
  comparison: comparisonSchema.nullable(),
  designDescription: text, missingRequirements: z.array(text).max(20), interpretation: text,
}).strict().superRefine((value, ctx) => {
  // 只驗 v1 嘅 unknown/null 語義，唔重新套用當前 engine 計數值或聲稱驗證量度。
  const incomplete = Object.values(value.counts).some((count) => count === "");
  if (incomplete !== (value.comparison === null)) issue(ctx, ["comparison"], "缺 counts 時整個 comparison 必須係 null；完整 counts 就必須有結果。");
  if (value.comparison && !incomplete) {
    const aUnknown = Number(value.counts.aEligible) === 0;
    const bUnknown = Number(value.counts.bEligible) === 0;
    const baselineZero = Number(value.counts.aOutcomes) === 0;
    const expectedNull = { aRate: aUnknown, bRate: bUnknown, percentagePointDifference: aUnknown || bUnknown, relativeLift: aUnknown || bUnknown || baselineZero };
    for (const key of Object.keys(expectedNull) as (keyof typeof expectedNull)[]) {
      if ((value.comparison[key] === null) !== expectedNull[key]) issue(ctx, ["comparison", key], "Null 必須對應零分母或零 baseline；未知唔可以改成零。");
    }
  }
}).superRefine(responseBudget);
export type ComparisonArtifact = z.infer<typeof comparisonArtifactSchema>;

// JSON Schema 只表達結構；呢度明列 Zod 額外執行、consumer 要另外處理嘅語義。
export const ATTENTION_SEMANTIC_REFINEMENTS = {
  Unicode: ["所有新 API request／response／歷史 artifact 字串，包括 input、metric、plan、Markdown、sources、claims 同 metadata，都必須係完整 Unicode scalar sequence；拒絕未成對 high 或 low surrogate，包括 JSON escaped surrogate。", "合法 astral surrogate pairs 原樣接受，唔 normalize、代換字元或改動 JavaScript UTF-16 unit 長度上限；舊 workspace v1 schema 唔受呢條新 API 邊界影響。"],
  BriefInput: ["topic/audience 唔可以全空白；provided evidence 唔可以空白。", "nonpoliticalConfirmed 必須 true，只係 caller attestation。", "mechanismId/platformId 必須係當前 catalogue 嘅兼容組合。"],
  RawCounts: ["只接受空字串（未知）或十進位數字字串；值必須係非負 safe integer。", "每組 outcomes 唔可以大過 eligible；空白未知唔當零。"],
  ExperimentPlan: ["非空日期必須係真實曆日；endDate 唔早過 startDate。", "randomized 只記 caller 聲稱，唔係流量分配或 randomization 證明。"],
  Catalogue: ["同類 ID 唔可重複，claim ID 全域唯一；source/platform/claim references 必須喺快照內閉合。", "每個 claim 嘅 sourceIds 必須包含喺所屬 entry 嘅 sourceIds。", "URL 必須係有 hostname、冇 userinfo 嘅 HTTP(S) URL；日期必須真實。", "digest 係固定 catalogue content serialization 嘅 SHA-256，格式驗證唔等於核對 digest、簽名或研究真確性。"],
  BriefArtifact: ["只按快照 ID 驗歷史 artifact，唔查當前 ID enums 或 compatibility。", "保留 topic/audience/evidence 同 caller attestation；來源、claims、selected claimIds 唔可重複或懸空。", "brief.sourceIds 必須同 sources ID 集合相等；claims 必須同 mechanism/platform claimIds 聯集相等。", "input mechanism/platform ID 必須對應 selected entry；URL/日期沿用來源語義。", "markdown 係保存嘅純文字；schema 唔驗全文等於 renderer 產物，亦唔執行／抓取任何連結。"],
  ComparisonArtifact: ["沿用 RawCounts/ExperimentPlan refinements；缺任何 count 時 comparison 係 null。", "零分母嘅 rate 同 difference 係 null；relative lift 遇零分母或零 baseline 係 null。", "只驗结构、範圍同 null 語義，唔靠當前 engine 重算歷史數值，亦唔驗 caller 量度。"],
  Results: ["所有結果連 success envelope 嘅 JSON UTF-8 必須唔超過 512 KiB；字串上限按 JavaScript UTF-16 units，JSON Schema maxLength 按 Unicode code points，唔宣稱完全等價。", "版本同 digest 只辨認格式／內容，唔係來源真確性、因果性或 randomization 證明。"],
} as const;
