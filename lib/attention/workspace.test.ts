import test from "node:test";
import assert from "node:assert/strict";
import { buildBrief, PHOTOGRAPHY_SAMPLE } from "./brief";
import { parseWorkspace, serializeWorkspace } from "./export";
import { applyCataloguePrefill, createEmptyDraft, createWorkspaceState, deleteWorkspace, loadWorkspace, readCataloguePrefill, saveWorkspace, WORKSPACE_STORAGE_KEY, workspaceReducer, type StorageLike } from "./workspace";
import { MAX_TREND_NOTES } from "./trends";

function memoryStorage() {
  const entries = new Map<string, string>([["other-app", "leave alone"]]);
  const calls: string[] = [];
  const storage: StorageLike = {
    getItem: (key) => { calls.push(`get:${key}`); return entries.get(key) ?? null; },
    setItem: (key, value) => { calls.push(`set:${key}`); entries.set(key, value); },
    removeItem: (key) => { calls.push(`remove:${key}`); entries.delete(key); },
  };
  return { entries, calls, access: () => storage };
}
const note = { sourceUrl: "https://example.org/research", term: "portraits", geography: "UK", startDate: "2026-01-01", endDate: "2026-02-01", searchSurface: "Web", comparison: "Same scope and export", observation: "User observed a change; cause is unknown" };

test("fresh workspace has no saved state or storage side effect", () => {
  const store = memoryStorage();
  const state = createWorkspaceState();
  assert.equal(state.touched, false);
  assert.equal(state.draft.input.topic, "");
  assert.deepEqual(store.calls, []);
});

test("save/load/delete use one versioned namespace and leave other keys untouched", () => {
  const store = memoryStorage();
  const draft = createEmptyDraft();
  draft.input.topic = "A private local-only draft";
  assert.equal(saveWorkspace(store.access, draft).ok, true);
  assert.deepEqual(store.calls, [`set:${WORKSPACE_STORAGE_KEY}`]);
  const loaded = loadWorkspace(store.access);
  assert.equal(loaded.ok, true);
  if (loaded.ok) assert.deepEqual(loaded.value, draft);
  assert.equal(deleteWorkspace(store.access).ok, true);
  assert.equal(store.entries.get("other-app"), "leave alone");
  assert.equal(loadWorkspace(store.access).ok, false);
  assert.equal(draft.input.topic, "A private local-only draft");
});

test("corrupt, unsupported and oversized storage never replaces an active draft", () => {
  const store = memoryStorage();
  for (const text of ["{broken", '{"version":99}', "x".repeat(256 * 1024 + 1)]) {
    store.entries.set(WORKSPACE_STORAGE_KEY, text);
    assert.equal(loadWorkspace(store.access).ok, false);
    assert.equal(store.entries.get(WORKSPACE_STORAGE_KEY), text);
  }
});

test("storage getter failures, quota and unavailable operations are handled", () => {
  const unavailable = () => { throw new Error("SecurityError"); };
  assert.equal(saveWorkspace(unavailable, createEmptyDraft()).ok, false);
  assert.equal(loadWorkspace(unavailable).ok, false);
  assert.equal(deleteWorkspace(unavailable).ok, false);
  const store = memoryStorage();
  store.entries.set(WORKSPACE_STORAGE_KEY, "old value");
  const quota: StorageLike = { ...store.access(), setItem: () => { throw new Error("QuotaExceededError"); } };
  assert.equal(saveWorkspace(() => quota, createEmptyDraft()).ok, false);
  assert.equal(store.entries.get(WORKSPACE_STORAGE_KEY), "old value");
});

test("invalid draft is checked before attempting storage and old saved data survives", () => {
  const store = memoryStorage();
  const draft = createEmptyDraft();
  draft.counts.aOutcomes = "-2";
  assert.equal(saveWorkspace(store.access, draft).ok, false);
  assert.deepEqual(store.calls, []);
});

test("only catalogue IDs prefill; text, unknown keys and prototype properties are ignored", () => {
  assert.deepEqual(readCataloguePrefill(new URLSearchParams("mechanism=curiosity-gap&platform=youtube-shorts&topic=secret&audience=secret&objective=understanding")), { mechanismId: "curiosity-gap", platformId: "youtube-shorts" });
  for (const id of ["__proto__", "constructor", "made-up", "<script>"]) assert.deepEqual(readCataloguePrefill(new URLSearchParams({ mechanism: id, platform: id })), {});
  assert.deepEqual(readCataloguePrefill(new URLSearchParams("text=private")), {});
  assert.equal(applyCataloguePrefill(createEmptyDraft().input, { mechanismId: "scarcity" }).platformId, "instagram-feed");
});

test("prefill never silently overwrites active edits and explicit apply preserves text and results", () => {
  const initial = createWorkspaceState();
  const first = workspaceReducer(initial, { type: "prefill", prefill: { mechanismId: "negative-framing" } });
  assert.equal(first.draft.input.mechanismId, "negative-framing");
  const edited = workspaceReducer(first, { type: "input", patch: { topic: "My unsaved topic" } });
  const action = { type: "prefill" as const, prefill: { platformId: "google-search" as const } };
  assert.equal(workspaceReducer(edited, action), edited);
  const applied = workspaceReducer(edited, { ...action, confirmed: true });
  assert.equal(applied.draft.input.topic, "My unsaved topic");
  assert.equal(applied.draft.input.platformId, "google-search");
});

test("editing selections does not rebind old counts to a new metric; generation clears only old result records", () => {
  let state = workspaceReducer(createWorkspaceState(), { type: "input", patch: PHOTOGRAPHY_SAMPLE });
  state = workspaceReducer(state, { type: "generate", brief: buildBrief(PHOTOGRAPHY_SAMPLE) });
  state = workspaceReducer(state, { type: "counts", patch: { aOutcomes: "10", aEligible: "100" } });
  state = workspaceReducer(state, { type: "markdown", text: "My edited brief" });
  state = workspaceReducer(state, { type: "input", patch: { platformId: "google-search" } });
  assert.match(state.draft.generated!.metric.name, /Chose-to-view/);
  assert.equal(state.draft.markdown, "My edited brief");
  assert.equal(state.draft.counts.aOutcomes, "10");
  state = workspaceReducer(state, { type: "generate", brief: buildBrief(state.draft.input) });
  assert.equal(state.draft.counts.aOutcomes, "");
  assert.match(state.draft.generated!.metric.name, /Search click-through/);
});

test("trend drafts and attached notes persist in reducer and bounded JSON round trip", () => {
  let state = workspaceReducer(createWorkspaceState(), { type: "trend-draft", patch: { term: "Pending term" } });
  assert.equal(state.draft.trendDraft.term, "Pending term");
  state = workspaceReducer(state, { type: "attach-trend", note });
  assert.equal(state.draft.trendDraft.term, "");
  assert.equal(state.draft.trendNotes.length, 1);
  const invalid = workspaceReducer(state, { type: "attach-trend", note: { ...note, sourceUrl: "javascript:alert(1)" } });
  assert.equal(invalid, state);
  for (let i = 1; i < MAX_TREND_NOTES; i++) state = workspaceReducer(state, { type: "attach-trend", note });
  assert.equal(workspaceReducer(state, { type: "attach-trend", note }), state);
  const serialized = serializeWorkspace(state.draft);
  assert.equal(serialized.ok, true);
  if (serialized.ok) assert.equal(parseWorkspace(serialized.value).ok, true);
  state = workspaceReducer(state, { type: "remove-trend", index: 0 });
  assert.equal(state.draft.trendNotes.length, MAX_TREND_NOTES - 1);
});
