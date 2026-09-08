import { getMechanism } from "./mechanisms";
import { getPlatform } from "./platforms";
import type { MechanismId, PlatformId } from "./schema";
import { parseWorkspace, renderBriefMarkdown, serializeWorkspace, type WorkspaceResult } from "./export";
import { emptyTrendDraft, MAX_TREND_NOTES, trendNoteSchema, type TrendDraft, type TrendNote } from "./trends";
import type { BriefInput, ExperimentPlan, GeneratedBrief, RawCounts, WorkspaceDraft } from "./workspace-schema";

export const WORKSPACE_STORAGE_KEY = "fomoengine:attention-lab:workspace:v1";
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export type StorageAccess = () => StorageLike;

export function emptyCounts(): RawCounts {
  return { aOutcomes: "", aEligible: "", bOutcomes: "", bEligible: "" };
}

export function createEmptyDraft(): WorkspaceDraft {
  return {
    input: {
      topic: "", audience: "", platformId: "youtube-shorts", objective: "surface-response", mechanismId: "curiosity-gap",
      takeaway: "", action: "", evidenceStatus: "missing", evidence: "", constraints: "", verifiedProof: "", realLimit: "", limitReason: "", terms: "", nonpoliticalConfirmed: false,
    },
    generated: null, markdown: "", counts: emptyCounts(),
    plan: {
      design: "observational", allocation: "", eligibility: "", startDate: "", endDate: "",
      stoppingRule: "Observe both variants for the full predefined window. Do not stop early or extend the window because one rate looks better. Stop for participant harm, misleading claims or consent issues, record the reason, and do not call the interrupted comparison a winner.",
      guardrailPlan: "", guardrailResults: "",
    },
    trendDraft: emptyTrendDraft(), trendNotes: [],
  };
}

export interface WorkspaceState { draft: WorkspaceDraft; touched: boolean }
export function createWorkspaceState(): WorkspaceState { return { draft: createEmptyDraft(), touched: false }; }
export type CataloguePrefill = { mechanismId?: MechanismId; platformId?: PlatformId };

export function readCataloguePrefill(params: Pick<URLSearchParams, "get">): CataloguePrefill {
  const mechanism = getMechanism(params.get("mechanism") ?? "");
  const platform = getPlatform(params.get("platform") ?? "");
  return { ...(mechanism ? { mechanismId: mechanism.id } : {}), ...(platform ? { platformId: platform.id } : {}) };
}

export function applyCataloguePrefill(input: BriefInput, prefill: CataloguePrefill): BriefInput {
  const next = { ...input, ...prefill };
  if (prefill.mechanismId && !prefill.platformId && !getMechanism(prefill.mechanismId)?.compatiblePlatformIds.includes(next.platformId)) {
    next.platformId = getMechanism(prefill.mechanismId)!.compatiblePlatformIds[0];
  }
  if (prefill.platformId && !prefill.mechanismId && !getMechanism(next.mechanismId)?.compatiblePlatformIds.includes(prefill.platformId)) {
    next.mechanismId = "curiosity-gap";
  }
  return next;
}

export type WorkspaceAction =
  | { type: "input"; patch: Partial<BriefInput> }
  | { type: "generate"; brief: GeneratedBrief }
  | { type: "markdown"; text: string }
  | { type: "counts"; patch: Partial<RawCounts> }
  | { type: "plan"; patch: Partial<ExperimentPlan> }
  | { type: "trend-draft"; patch: Partial<TrendDraft> }
  | { type: "attach-trend"; note: TrendNote }
  | { type: "remove-trend"; index: number }
  | { type: "replace"; draft: WorkspaceDraft }
  | { type: "prefill"; prefill: CataloguePrefill; confirmed?: boolean };

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  const draft = state.draft;
  switch (action.type) {
    case "input": return { touched: true, draft: { ...draft, input: { ...draft.input, ...action.patch } } };
    case "generate": return { touched: true, draft: { ...draft, generated: action.brief, markdown: renderBriefMarkdown(action.brief), counts: emptyCounts(), plan: { ...draft.plan, guardrailResults: "" } } };
    case "markdown": return { touched: true, draft: { ...draft, markdown: action.text } };
    case "counts": return { touched: true, draft: { ...draft, counts: { ...draft.counts, ...action.patch } } };
    case "plan": return { touched: true, draft: { ...draft, plan: { ...draft.plan, ...action.patch } } };
    case "trend-draft": return { touched: true, draft: { ...draft, trendDraft: { ...draft.trendDraft, ...action.patch } } };
    case "attach-trend": {
      const checked = trendNoteSchema.safeParse(action.note);
      if (!checked.success || draft.trendNotes.length >= MAX_TREND_NOTES) return state;
      return { touched: true, draft: { ...draft, trendNotes: [...draft.trendNotes, checked.data], trendDraft: emptyTrendDraft() } };
    }
    case "remove-trend": return { touched: true, draft: { ...draft, trendNotes: draft.trendNotes.filter((_, index) => index !== action.index) } };
    case "replace": return { touched: true, draft: action.draft };
    case "prefill":
      if ((state.touched && !action.confirmed) || Object.keys(action.prefill).length === 0) return state;
      return { touched: true, draft: { ...draft, input: applyCataloguePrefill(draft.input, action.prefill) } };
  }
}

export function saveWorkspace(access: StorageAccess, draft: WorkspaceDraft): WorkspaceResult<null> {
  const serialized = serializeWorkspace(draft);
  if (!serialized.ok) return serialized;
  try { access().setItem(WORKSPACE_STORAGE_KEY, serialized.value); return { ok: true, value: null }; }
  catch { return { ok: false, error: "Could not save on this device: storage is unavailable or full. Your active draft is unchanged; try exporting JSON instead." }; }
}

export function loadWorkspace(access: StorageAccess): WorkspaceResult<WorkspaceDraft> {
  try {
    const text = access().getItem(WORKSPACE_STORAGE_KEY);
    if (text === null) return { ok: false, error: "No saved Attention Lab draft on this device. Your active draft has not changed." };
    return parseWorkspace(text);
  } catch { return { ok: false, error: "Could not read device storage. Your active draft has not changed." }; }
}

export function deleteWorkspace(access: StorageAccess): WorkspaceResult<null> {
  try { access().removeItem(WORKSPACE_STORAGE_KEY); return { ok: true, value: null }; }
  catch { return { ok: false, error: "Could not delete the saved draft because device storage is unavailable. Nothing in your active draft has changed." }; }
}
