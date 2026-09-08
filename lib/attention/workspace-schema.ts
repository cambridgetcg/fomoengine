import { z } from "zod";
import { MECHANISM_IDS, PLATFORM_IDS, SOURCE_IDS } from "./schema";
import { getMechanism } from "./mechanisms";
import { MAX_TREND_NOTES, optionalDateSchema, trendDraftSchema, trendNoteSchema } from "./trends";

export const WORKSPACE_VERSION = 1 as const;
export const WORKSPACE_FORMAT = "fomoengine-attention-workspace" as const;
export const MAX_WORKSPACE_BYTES = 256 * 1024;
export const MAX_MARKDOWN_LENGTH = 90000;
export const OBJECTIVE_IDS = ["surface-response", "useful-action", "understanding"] as const;
export type ObjectiveId = (typeof OBJECTIVE_IDS)[number];
export const OBJECTIVE_LABELS: Record<ObjectiveId, string> = {
  "surface-response": "Improve the surface's measurable response",
  "useful-action": "Support one useful next action",
  understanding: "Help people understand the answer or offer",
};

export const briefInputSchema = z.object({
  topic: z.string().max(200),
  audience: z.string().max(600),
  platformId: z.enum(PLATFORM_IDS),
  objective: z.enum(OBJECTIVE_IDS),
  mechanismId: z.enum(MECHANISM_IDS),
  takeaway: z.string().max(1000),
  action: z.string().max(300),
  evidenceStatus: z.enum(["missing", "provided"]),
  evidence: z.string().max(4000),
  constraints: z.string().max(2000),
  verifiedProof: z.string().max(2000),
  realLimit: z.string().max(500),
  limitReason: z.string().max(500),
  terms: z.string().max(2000),
  nonpoliticalConfirmed: z.boolean(),
}).strict();
export type BriefInput = z.infer<typeof briefInputSchema>;

export const readyBriefInputSchema = briefInputSchema.superRefine((input, ctx) => {
  for (const field of ["topic", "audience"] as const) {
    if (!input[field].trim()) ctx.addIssue({ code: "custom", path: [field], message: `${field === "topic" ? "Topic / offer" : "Audience"} is required.` });
  }
  if (input.evidenceStatus === "provided" && !input.evidence.trim()) {
    ctx.addIssue({ code: "custom", path: ["evidence"], message: "Supply evidence and its source, or explicitly mark it as missing." });
  }
  if (!input.nonpoliticalConfirmed) {
    ctx.addIssue({ code: "custom", path: ["nonpoliticalConfirmed"], message: "Confirm an educational or commercial brief, without political targeting or sensitive-identity inference." });
  }
  if (!getMechanism(input.mechanismId)?.compatiblePlatformIds.includes(input.platformId)) {
    ctx.addIssue({ code: "custom", path: ["mechanismId"], message: "This mechanism has no application template for the selected surface. Choose a compatible combination." });
  }
});

const longText = z.string().max(12000);
export const metricSchema = z.object({
  name: z.string().max(300), numerator: z.string().max(1600), denominator: z.string().max(1600), caveat: z.string().max(3000),
}).strict();

export const generatedBriefSchema = z.object({
  input: readyBriefInputSchema,
  title: z.string().max(500),
  sections: z.array(z.object({ heading: z.string().max(200), body: longText }).strict()).max(20),
  experiment: z.object({
    question: longText,
    variable: z.string().max(500),
    control: longText,
    treatment: longText,
    shared: z.array(longText).max(20),
    blocked: z.boolean(),
    limitations: z.array(longText).max(30),
  }).strict(),
  metric: metricSchema,
  guardrails: z.array(longText).max(20),
  confounders: z.array(longText).max(20),
  sourceIds: z.array(z.enum(SOURCE_IDS)).max(20),
}).strict();
export type GeneratedBrief = z.infer<typeof generatedBriefSchema>;

export const rawCountsSchema = z.object({
  aOutcomes: z.string().max(32), aEligible: z.string().max(32),
  bOutcomes: z.string().max(32), bEligible: z.string().max(32),
}).strict().superRefine((counts, ctx) => {
  for (const [key, value] of Object.entries(counts)) {
    if (value !== "" && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
      ctx.addIssue({ code: "custom", path: [key], message: "Counts must be nonnegative safe whole numbers, or blank if unavailable." });
    }
  }
  for (const group of ["a", "b"] as const) {
    const outcomes = counts[`${group}Outcomes`];
    const eligible = counts[`${group}Eligible`];
    if (outcomes !== "" && eligible !== "" && Number(outcomes) > Number(eligible)) {
      ctx.addIssue({ code: "custom", path: [`${group}Outcomes`], message: "Outcomes cannot exceed eligible units." });
    }
  }
});
export type RawCounts = z.infer<typeof rawCountsSchema>;

export const experimentPlanSchema = z.object({
  design: z.enum(["observational", "randomized"]),
  allocation: z.string().max(2000),
  eligibility: z.string().max(2000),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  stoppingRule: z.string().max(2000),
  guardrailPlan: z.string().max(3000),
  guardrailResults: z.string().max(4000),
}).strict().refine((plan) => !plan.startDate || !plan.endDate || plan.startDate <= plan.endDate, {
  path: ["endDate"], message: "Observation end must be on or after the start date.",
});
export type ExperimentPlan = z.infer<typeof experimentPlanSchema>;

export const workspaceDraftSchema = z.object({
  input: briefInputSchema,
  generated: generatedBriefSchema.nullable(),
  markdown: z.string().max(MAX_MARKDOWN_LENGTH),
  counts: rawCountsSchema,
  plan: experimentPlanSchema,
  trendDraft: trendDraftSchema,
  trendNotes: z.array(trendNoteSchema).max(MAX_TREND_NOTES),
}).strict();
export type WorkspaceDraft = z.infer<typeof workspaceDraftSchema>;

export const workspaceEnvelopeSchema = z.object({
  format: z.literal(WORKSPACE_FORMAT),
  version: z.literal(WORKSPACE_VERSION),
  draft: workspaceDraftSchema,
}).strict();

export function firstValidationError(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue ? `${issue.path.join(".") || "Draft"}: ${issue.message}` : "Invalid draft.";
}
