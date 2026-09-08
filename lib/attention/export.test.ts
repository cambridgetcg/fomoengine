import test from "node:test";
import assert from "node:assert/strict";
import { buildBrief, PHOTOGRAPHY_SAMPLE } from "./brief";
import { exportMarkdown, parseWorkspace, renderBriefMarkdown, serializeWorkspace, utf8Bytes } from "./export";
import { createEmptyDraft } from "./workspace";
import { MAX_WORKSPACE_BYTES, WORKSPACE_FORMAT, WORKSPACE_VERSION } from "./workspace-schema";

function populated() {
  const draft = createEmptyDraft();
  draft.input = { ...PHOTOGRAPHY_SAMPLE };
  draft.generated = buildBrief(draft.input);
  draft.markdown = `${renderBriefMarkdown(draft.generated)}\n\nMy literal edit: <script>no execution</script>\n  Preserve spacing.  `;
  draft.counts = { aOutcomes: "10", aEligible: "100", bOutcomes: "15", bEligible: "100" };
  draft.plan.guardrailResults = "No conclusions: manually supplied observations only";
  draft.plan.startDate = "2026-10-01";
  draft.plan.endDate = "2026-10-08";
  draft.trendNotes = [{ sourceUrl: "https://example.org/notes", term: "portraits", geography: "UK", startDate: "2026-01-01", endDate: "2026-08-01", searchSurface: "Web Search", comparison: "Same request", observation: "No causal inference" }];
  draft.trendDraft.term = "A second unfinished note";
  return draft;
}

test("versioned JSON round trip preserves edited brief, metrics, counts, plans and pending notes exactly", () => {
  const draft = populated();
  const serialized = serializeWorkspace(draft);
  assert.equal(serialized.ok, true);
  if (!serialized.ok) return;
  const envelope = JSON.parse(serialized.value);
  assert.equal(envelope.format, WORKSPACE_FORMAT);
  assert.equal(envelope.version, WORKSPACE_VERSION);
  const parsed = parseWorkspace(serialized.value);
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.deepEqual(parsed.value, draft);
});

test("imports reject invalid JSON, version, unknown keys, source URL, metrics and counts", () => {
  assert.equal(parseWorkspace("not JSON").ok, false);
  const envelope = { format: WORKSPACE_FORMAT, version: WORKSPACE_VERSION, draft: populated() };
  for (const raw of [
    { ...envelope, version: 0 }, { ...envelope, extra: true },
    { ...envelope, draft: { ...envelope.draft, counts: { ...envelope.draft.counts, bOutcomes: "101" } } },
    { ...envelope, draft: { ...envelope.draft, generated: { ...envelope.draft.generated, metric: { name: "incomplete" } } } },
    { ...envelope, draft: { ...envelope.draft, trendNotes: [{ ...envelope.draft.trendNotes[0], sourceUrl: "javascript:alert(1)" }] } },
  ]) assert.equal(parseWorkspace(JSON.stringify(raw)).ok, false);
});

test("UTF-8 bytes, not character count, bound file imports and local exports", () => {
  assert.equal(utf8Bytes("攝影"), 6);
  assert.equal(parseWorkspace(" ".repeat(MAX_WORKSPACE_BYTES + 1)).ok, false);
  const draft = createEmptyDraft();
  draft.markdown = "攝".repeat(89000);
  assert.ok(draft.markdown.length < 90000);
  assert.equal(serializeWorkspace(draft).ok, false);
});

test("Markdown includes edits, denominators, actual results, notes and source limits", () => {
  const result = exportMarkdown(populated());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.match(result.value, /My literal edit: <script>no execution<\/script>/);
  assert.match(result.value, /A: 10 \/ 100 = 10.00%/);
  assert.match(result.value, /B − A: \+5.00 pp/);
  assert.match(result.value, /Relative lift vs A: \+50.00%/);
  assert.match(result.value, /Eligible Shorts-feed presentations/);
  assert.match(result.value, /Sampled|sampled/);
  assert.match(result.value, /Editorial review|editorial review/);
  assert.match(result.value, /No causal inference/);
  assert.match(result.value, /Observational comparison/);
});

test("empty and zero counts stay distinct, and stale inputs are disclosed", () => {
  const draft = populated();
  draft.input.platformId = "google-search";
  draft.counts.aOutcomes = "0";
  draft.counts.aEligible = "0";
  let result = exportMarkdown(draft);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.match(result.value, /INPUT CHANGED/);
    assert.match(result.value, /A: 0 \/ 0 = N\/A/);
    assert.match(result.value, /Relative lift vs A: N\/A/);
  }
  draft.counts.bEligible = "";
  result = exportMarkdown(draft);
  if (result.ok) assert.match(result.value, /Missing counts are unknown, not zero/);
  assert.equal(exportMarkdown(createEmptyDraft()).ok, false);
});
