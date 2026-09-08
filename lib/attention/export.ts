import { SOURCE_BY_ID } from "./sources";
import { compareRawCounts, describeDesign, formatDifference, formatRate } from "./experiments";
import { trendContext } from "./trends";
import { MAX_WORKSPACE_BYTES, WORKSPACE_FORMAT, WORKSPACE_VERSION, firstValidationError, workspaceDraftSchema, workspaceEnvelopeSchema, type GeneratedBrief, type WorkspaceDraft } from "./workspace-schema";

export type WorkspaceResult<T> = { ok: true; value: T } | { ok: false; error: string };
export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

export function serializeWorkspace(draft: WorkspaceDraft): WorkspaceResult<string> {
  const checked = workspaceDraftSchema.safeParse(draft);
  if (!checked.success) return { ok: false, error: firstValidationError(checked.error) };
  const value = JSON.stringify({ format: WORKSPACE_FORMAT, version: WORKSPACE_VERSION, draft: checked.data }, null, 2);
  if (utf8Bytes(value) > MAX_WORKSPACE_BYTES) return { ok: false, error: "Draft exceeds the 256 KiB limit. Shorten the brief or remove some notes before saving or exporting." };
  return { ok: true, value };
}

export function parseWorkspace(text: string): WorkspaceResult<WorkspaceDraft> {
  if (utf8Bytes(text) > MAX_WORKSPACE_BYTES) return { ok: false, error: "File exceeds the 256 KiB import limit. Your current draft has not changed." };
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: "This is not valid JSON. Your current draft has not changed." }; }
  const parsed = workspaceEnvelopeSchema.safeParse(raw);
  if (!parsed.success) {
    const envelope = raw && typeof raw === "object" ? raw as Record<string, unknown> : null;
    if (envelope && (envelope.version !== WORKSPACE_VERSION || envelope.format !== WORKSPACE_FORMAT)) {
      return { ok: false, error: "Unsupported workspace format or version. Expected fomoengine-attention-workspace version 1; no data was replaced." };
    }
    return { ok: false, error: `Invalid workspace. ${firstValidationError(parsed.error)} Your current draft has not changed.` };
  }
  return { ok: true, value: parsed.data.draft };
}

// Markdown 只係可編輯純文字，唔喺網頁轉 HTML；亦唔自動打開用戶寫入嘅連結。
export function renderBriefMarkdown(brief: GeneratedBrief): string {
  return [
    `# ${brief.title}`,
    "Deterministic, research-informed planning template. Not AI analysis, verified evidence, a prediction or publication-ready copy.",
    ...brief.sections.map((section) => `## ${section.heading}\n${section.body}`),
    "## One-variable comparison",
    `Question: ${brief.experiment.question}\nChanged variable: ${brief.experiment.variable}`,
    brief.experiment.blocked ? "NOT READY: the selected evidence-dependent treatment requires missing, verifiable facts. Do not run or publish it." : "Readiness: verify evidence and fill every missing requirement before use.",
    `### A — control\n${brief.experiment.control}`,
    `### B — treatment\n${brief.experiment.treatment}`,
    `### Shared in both variants\n${brief.experiment.shared.map((line) => `- ${line}`).join("\n")}`,
    `## Primary metric\n${brief.metric.name}\nNumerator: ${brief.metric.numerator}\nDenominator: ${brief.metric.denominator}\nCaveat: ${brief.metric.caveat}`,
    `## Quality / trust guardrails\n${brief.guardrails.map((line) => `- ${line}`).join("\n")}`,
    `## Confounders\n${brief.confounders.map((line) => `- ${line}`).join("\n")}`,
    `## Experiment limits\n${brief.experiment.limitations.map((line) => `- ${line}`).join("\n")}`,
    `## Research references\n${brief.sourceIds.map((id) => {
      const source = SOURCE_BY_ID[id];
      return `- ${source.title} — ${source.url}\n  Published: ${source.publishedAt ?? "not stated"}; editorial review: ${source.reviewedAt}. ${source.retrievalLimitations}`;
    }).join("\n")}`,
  ].join("\n\n");
}

export function exportMarkdown(draft: WorkspaceDraft): WorkspaceResult<string> {
  const checked = workspaceDraftSchema.safeParse(draft);
  if (!checked.success) return { ok: false, error: firstValidationError(checked.error) };
  if (!draft.generated || !draft.markdown.trim()) return { ok: false, error: "Generate a brief before copying or exporting Markdown." };
  const { plan } = draft;
  const comparison = compareRawCounts(draft.counts);
  const result = comparison ? [
    `A: ${draft.counts.aOutcomes} / ${draft.counts.aEligible} = ${formatRate(comparison.aRate)}`,
    `B: ${draft.counts.bOutcomes} / ${draft.counts.bEligible} = ${formatRate(comparison.bRate)}`,
    `B − A: ${formatDifference(comparison.percentagePointDifference, "pp")}`,
    `Relative lift vs A: ${formatDifference(comparison.relativeLift === null ? null : comparison.relativeLift * 100, "%")}`,
    "N/A means a zero denominator or (for relative lift) a zero baseline. No winner, significance or causal conclusion is calculated.",
  ].join("\n") : `No complete comparison recorded. Missing counts are unknown, not zero.\nA outcomes / eligible: ${draft.counts.aOutcomes || "not supplied"} / ${draft.counts.aEligible || "not supplied"}\nB outcomes / eligible: ${draft.counts.bOutcomes || "not supplied"} / ${draft.counts.bEligible || "not supplied"}`;
  return { ok: true, value: [
    draft.markdown,
    JSON.stringify(draft.input) !== JSON.stringify(draft.generated.input) ? "INPUT CHANGED: the edited brief and recorded metric still belong to the previous generated input. Regenerate deliberately to start a new comparison." : "",
    "## Measurement record (workspace fields)",
    `Primary metric bound to generated brief: ${draft.generated.metric.name}\nNumerator: ${draft.generated.metric.numerator}\nDenominator: ${draft.generated.metric.denominator}\n${draft.generated.metric.caveat}`,
    describeDesign(plan.design),
    `Allocation / cohorts: ${plan.allocation || "[TO FILL]"}\nEligibility / deduplication: ${plan.eligibility || "[TO FILL]"}\nFixed window: ${plan.startDate || "[TO FILL]"} to ${plan.endDate || "[TO FILL]"}\nStopping plan: ${plan.stoppingRule || "[TO FILL]"}\nQuality / trust check: ${plan.guardrailPlan || "[TO FILL]"}`,
    `### Recorded results\n${result}\nQuality / trust observations: ${plan.guardrailResults || "Not supplied; a rate difference alone is insufficient."}`,
    "## Manual trend context",
    draft.trendNotes.length ? draft.trendNotes.map(trendContext).join("\n\n") : "No trend notes attached. No demand data fetched.",
    "Google Trends interest is sampled and normalized within its request (0–100), not search volume. Do not compare incompatible exports or infer a spike's cause.",
  ].filter(Boolean).join("\n\n") };
}
