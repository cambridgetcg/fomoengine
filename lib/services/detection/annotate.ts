/**
 * annotate() — map the flags back onto the exact text the person pasted.
 *
 * The flag list tells you WHICH tactics are present. This shows you WHERE they
 * are, inline, so the pattern becomes visible in your own words — the whole point
 * of the tool is that the more you see the tactics, the more you spot them
 * yourself. This turns a verdict into a lesson.
 *
 * Three honesty rules, mirroring the detector itself:
 *  1. We highlight ONLY spans we can actually find in the pasted text. If an
 *     AI-inferred flag has no clean span (or the span doesn't literally appear),
 *     it stays in the list but paints nothing — no invented underlines.
 *  2. Precision over coverage. Overlapping highlights are resolved in favour of
 *     the more severe tactic, and we never double-mark a character. A noisy
 *     wall of marks would teach nothing.
 *  3. Pure function, no HTML. We return plain text segments; the component renders
 *     them as React nodes, so the pasted text can never inject markup. Highlighting
 *     untrusted input is exactly where a naive innerHTML approach would be an XSS.
 *
 * Output is the input text split into ordered segments that concatenate back to
 * the original verbatim — every character preserved, some tagged with their flag.
 */
import type { Flag } from "./detection.service";
import type { Severity } from "./taxonomy";

export interface Segment {
  text: string;
  /** The tactic this span illustrates, or null for ordinary text between marks. */
  flag: Flag | null;
}

const SEVERITY_RANK: Record<Severity, number> = { danger: 0, caution: 1, info: 2 };

/**
 * Normalise a flag's evidence into something we can search for literally.
 * Regex evidence is trimmed and may carry a trailing ellipsis (see regex.service
 * trimEvidence); strip it so the surviving prefix can still be located.
 */
function searchableEvidence(evidence: string): string {
  let s = evidence.trim();
  if (s.endsWith("…")) s = s.slice(0, -1).trim();
  return s;
}

/**
 * Split `text` into ordered, non-overlapping segments, tagging the spans that a
 * flag's evidence points at. Concatenating the segments reproduces `text` exactly.
 */
export function annotate(text: string, flags: Flag[]): Segment[] {
  const haystack = text.toLowerCase();

  // 1. Resolve each flag's evidence to a concrete [start, end) range, if present.
  const ranges: { start: number; end: number; flag: Flag }[] = [];
  for (const flag of flags) {
    if (!flag.evidence) continue;
    const needle = searchableEvidence(flag.evidence);
    if (needle.length < 2) continue; // too short to be meaningful — would mark noise
    const start = haystack.indexOf(needle.toLowerCase());
    if (start === -1) continue; // span isn't literally in the text — paint nothing
    ranges.push({ start, end: start + needle.length, flag });
  }

  // 2. Greedy non-overlap: earliest span wins its territory; ties go to severity.
  ranges.sort(
    (a, b) => a.start - b.start || SEVERITY_RANK[a.flag.severity] - SEVERITY_RANK[b.flag.severity],
  );
  const accepted: typeof ranges = [];
  let lastEnd = 0;
  for (const r of ranges) {
    if (r.start >= lastEnd) {
      accepted.push(r);
      lastEnd = r.end;
    }
  }

  // 3. Stitch the segments back together, gaps included, in order.
  const segments: Segment[] = [];
  let cursor = 0;
  for (const r of accepted) {
    if (r.start > cursor) segments.push({ text: text.slice(cursor, r.start), flag: null });
    segments.push({ text: text.slice(r.start, r.end), flag: r.flag });
    cursor = r.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), flag: null });

  return segments;
}

/** Convenience for the UI: are there any spans worth showing an annotated view for? */
export function hasHighlights(segments: Segment[]): boolean {
  return segments.some((s) => s.flag !== null);
}
