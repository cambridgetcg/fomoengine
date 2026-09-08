import test from "node:test";
import assert from "node:assert/strict";
import { emptyTrendDraft, GOOGLE_TRENDS_EXPLORER, isCalendarDate, publicUrlSchema, trendContext, trendNoteSchema } from "./trends";

const note = { sourceUrl: "https://trends.google.com/trends/explore", term: "indoor portraits", geography: "United Kingdom", startDate: "2026-01-01", endDate: "2026-08-31", searchSurface: "Web Search", comparison: "Same request and region, compared with outdoor portraits", observation: "Manual observation only: interest varies within this selected window." };

test("manual note requires every source and comparison field", () => {
  assert.equal(trendNoteSchema.safeParse(note).success, true);
  assert.equal(trendNoteSchema.safeParse(emptyTrendDraft()).success, false);
  for (const field of Object.keys(note)) assert.equal(trendNoteSchema.safeParse({ ...note, [field]: "" }).success, false, field);
  assert.equal(trendNoteSchema.safeParse({ ...note, automaticTrendScore: 99 }).success, false);
});

test("URLs admit only complete http(s) without embedded credentials", () => {
  for (const url of ["https://example.org/path?q=a", "http://example.org/"]) assert.equal(publicUrlSchema.safeParse(url).success, true);
  for (const url of ["javascript:alert(1)", "data:text/html,test", "file:///tmp/a", "//example.org", "/local", "http:example.org/report", "https:example.org/report", "http:/example.org", "https://user:secret@example.org", "not a url"]) assert.equal(publicUrlSchema.safeParse(url).success, false, url);
  assert.equal(GOOGLE_TRENDS_EXPLORER, "https://trends.google.com/trends/explore");
});

test("real calendar dates, leap days and inclusive ordered windows are validated", () => {
  assert.equal(isCalendarDate("2024-02-29"), true);
  for (const date of ["2026-02-29", "2026-02-30", "2026-13-01", "2026-1-1", "2026-09-08T00:00:00Z"]) assert.equal(isCalendarDate(date), false);
  assert.equal(trendNoteSchema.safeParse({ ...note, startDate: "2026-09-01" }).success, false);
  assert.equal(trendNoteSchema.safeParse({ ...note, startDate: note.endDate }).success, true);
});

test("note text stays literal and is labeled a user-supplied hypothesis", () => {
  const payload = "<script>alert('literal')</script>";
  const parsed = trendNoteSchema.parse({ ...note, observation: payload });
  const context = trendContext(parsed);
  assert.ok(context.includes(payload));
  assert.match(context, /not verified/);
  assert.match(context, /not evidence of demand volume/);
});
