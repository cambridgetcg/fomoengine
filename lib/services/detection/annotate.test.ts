import test from "node:test";
import assert from "node:assert/strict";
import { annotate, hasHighlights } from "./annotate";
import type { Flag } from "./detection.service";
import type { CategoryId, Severity } from "./taxonomy";

/** Minimal Flag builder — only the fields annotate() actually reads carry meaning. */
function flag(evidence: string | null, severity: Severity = "caution", categoryId: CategoryId = "fake_scarcity"): Flag {
  return {
    categoryId,
    label: "test",
    principle: "Scarcity",
    lever: "",
    why: "",
    whatToDo: "",
    emotion: "",
    truth: "",
    citation: "",
    severity,
    evidence,
    confidence: "likely",
    source: "rules",
  };
}

/** The core invariant: segments must reconstruct the original text verbatim. */
function reassemble(text: string, flags: Flag[]): string {
  return annotate(text, flags).map((s) => s.text).join("");
}

test("segments always reconstruct the original text exactly", () => {
  const text = "Only 2 left in stock! Offer ends soon. Join 50,000+ happy customers.";
  const flags = [flag("Only 2 left"), flag("Offer ends soon"), flag("50,000+ happy customers")];
  assert.equal(reassemble(text, flags), text);
});

test("a found span is tagged with its flag; surrounding text is not", () => {
  const segments = annotate("buy now: only 2 left, hurry", [flag("only 2 left")]);
  const marked = segments.filter((s) => s.flag);
  assert.equal(marked.length, 1);
  assert.equal(marked[0].text, "only 2 left");
  assert.ok(segments.every((s) => (s.flag ? true : !s.text.includes("only 2 left"))));
});

test("matching is case-insensitive but preserves the original casing in the segment", () => {
  const segments = annotate("LAST CHANCE today", [flag("last chance")]);
  const marked = segments.find((s) => s.flag);
  assert.equal(marked?.text, "LAST CHANCE"); // original casing kept, not the needle's
});

test("evidence not present in the text paints nothing (no invented underlines)", () => {
  const segments = annotate("a perfectly calm sentence", [flag("act now or lose everything")]);
  assert.equal(hasHighlights(segments), false);
  assert.equal(segments.length, 1);
  assert.equal(segments[0].flag, null);
});

test("trailing ellipsis on regex evidence is stripped before searching", () => {
  // regex.service trimEvidence truncates long spans with a trailing "…".
  const text = "this is a very long urgency phrase that got truncated in evidence";
  const segments = annotate(text, [flag("this is a very long urgency phrase…")]);
  const marked = segments.find((s) => s.flag);
  assert.equal(marked?.text, "this is a very long urgency phrase");
});

test("null evidence and sub-2-char evidence are ignored", () => {
  assert.equal(hasHighlights(annotate("hello world", [flag(null)])), false);
  assert.equal(hasHighlights(annotate("a b c", [flag("a")])), false);
});

test("overlapping spans resolve to the more severe tactic, never double-marking", () => {
  // Two flags claim overlapping evidence; danger must win the shared region.
  const text = "verify your account now immediately";
  const danger = flag("verify your account now", "danger", "scam_composite");
  const caution = flag("account now immediately", "caution", "manufactured_urgency");
  const segments = annotate(text, [caution, danger]); // order shouldn't matter
  assert.equal(reassemble(text, [caution, danger]), text);
  const marked = segments.filter((s) => s.flag);
  assert.equal(marked.length, 1);
  assert.equal(marked[0].flag?.severity, "danger");
  // No character is covered by two segments: cursor is monotonic by construction,
  // so reassembly equality above already proves non-overlap.
});

test("empty flag list yields a single plain segment", () => {
  const segments = annotate("nothing to see", []);
  assert.equal(segments.length, 1);
  assert.equal(segments[0].flag, null);
  assert.equal(hasHighlights(segments), false);
});

test("empty text yields no segments and no highlights", () => {
  const segments = annotate("", [flag("anything")]);
  assert.equal(hasHighlights(segments), false);
});
