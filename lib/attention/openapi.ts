import { z } from "zod";
import {
  ATTENTION_ENGINE_VERSION, ATTENTION_SEMANTIC_REFINEMENTS, attentionBriefInputSchema,
  attentionExperimentPlanSchema, catalogueSchema, briefArtifactSchema, comparisonInputSchema,
  comparisonArtifactSchema, sourceSnapshotSchema, claimSnapshotSchema, attentionMetricSchema, attentionUnicodeRefinement,
} from "./contract";
import { rawCountsSchema } from "./workspace-schema";

export const attentionErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.enum(["INVALID_JSON", "INVALID_INPUT", "PAYLOAD_TOO_LARGE", "UNSUPPORTED_MEDIA_TYPE", "RATE_LIMITED", "SERVICE_UNAVAILABLE", "METHOD_NOT_ALLOWED", "REQUEST_TIMEOUT", "CORS_NOT_ALLOWED"]),
    message: z.string().min(1).max(500),
  }).strict(),
}).strict().superRefine(attentionUnicodeRefinement);

const namedSchemas = {
  BriefInput: attentionBriefInputSchema,
  ComparisonInput: comparisonInputSchema,
  Catalogue: catalogueSchema,
  BriefArtifact: briefArtifactSchema,
  ComparisonArtifact: comparisonArtifactSchema,
  RawCounts: rawCountsSchema,
  ExperimentPlan: attentionExperimentPlanSchema,
  Metric: attentionMetricSchema,
  Source: sourceSnapshotSchema,
  Claim: claimSnapshotSchema,
  CatalogueResponse: z.object({ success: z.literal(true), data: catalogueSchema }).strict(),
  BriefResponse: z.object({ success: z.literal(true), data: briefArtifactSchema }).strict(),
  ComparisonResponse: z.object({ success: z.literal(true), data: comparisonArtifactSchema }).strict(),
  ErrorResponse: attentionErrorResponseSchema,
};

export function getAttentionJsonSchemas() {
  const definitions = Object.fromEntries(Object.entries(namedSchemas).map(([name, schema]) => {
    // Zod 係唯一結構來源；唔手寫第二套 schema，custom refinements 另外明列。
    const generated = z.toJSONSchema(schema, { target: "draft-2020-12", io: "input" });
    const { $schema: dialect, ...structural } = generated;
    void dialect;
    return [name, structural];
  }));
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $defs: definitions,
    "x-semantic-refinements": ATTENTION_SEMANTIC_REFINEMENTS,
  };
}

const errorResponses = {
  "400": "JSON 或 UTF-8 無效。",
  "403": "Preflight method 或 headers 唔喺 CORS 許可範圍。",
  "405": "唔支援呢個 HTTP method。",
  "408": "讀取 request body 超時。",
  "413": "Request body 超過 64 KiB。",
  "415": "只接受 JSON 同 identity Content-Encoding。",
  "422": "Request 唔符合 schema 或 semantic refinements。",
  "429": "獨立限速暫時拒絕 request。",
  "503": "服務、限速器或完整結果暫時不可用。",
} as const;

export function getAttentionOpenApi() {
  const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
  const response = (name: string) => ({ description: "成功；data 係完整 versioned 快照。", content: { "application/json": { schema: ref(name) } } });
  const failures = Object.fromEntries(Object.entries(errorResponses).map(([status, description]) => [status, {
    description, content: { "application/json": { schema: ref("ErrorResponse") } },
  }]));
  const post = (operationId: string, input: string, result: string) => ({
    operationId,
    requestBody: { required: true, content: { "application/json": { schema: ref(input) } } },
    responses: { "200": response(result), ...failures },
  });
  return {
    openapi: "3.1.0",
    jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
    info: {
      title: "FOMOengine Attention Lab", version: ATTENTION_ENGINE_VERSION,
      description: "無狀態、毋須帳號嘅確定性研究規劃核心。Zod 係 runtime authority；呢份只係由同一 schemas 產生嘅 structural JSON Schema，額外語義見 x-semantic-refinements，唔宣稱完全等價。版本同 digest 唔係簽名、研究真確性或 randomization 證明。",
    },
    servers: [{ url: "https://fomoengine.io" }],
    security: [],
    paths: {
      "/api/v1/attention-lab/catalogue": { get: { operationId: "attentionCatalogue", responses: { "200": response("CatalogueResponse"), ...failures } } },
      "/api/v1/attention-lab/briefs": { post: post("attentionBrief", "BriefInput", "BriefResponse") },
      "/api/v1/attention-lab/comparisons": { post: post("attentionComparison", "ComparisonInput", "ComparisonResponse") },
      "/api/v1/attention-lab/openapi.json": { get: { operationId: "attentionOpenApi", responses: { "200": { description: "呢份 OpenAPI 3.1 structural contract。", content: { "application/json": { schema: { type: "object" } } } }, ...failures } } },
    },
    components: { schemas: getAttentionJsonSchemas().$defs },
    "x-semantic-refinements": ATTENTION_SEMANTIC_REFINEMENTS,
    "x-transport-limits": { requestBytes: 64 * 1024, responseBytes: 512 * 1024 },
    "x-catalogue-digest": "sha256:<64 lowercase hex>；輸入係 serializeCatalogueContent() 嘅 UTF-8 JSON，欄位依 catalogueContentSchema 次序、arrays 保留快照次序、冇縮排或尾換行，唔含 catalogueDigest 自己。只辨认內容，唔係簽名。",
  };
}
