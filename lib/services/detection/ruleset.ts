/**
 * Public provenance for every checker result and business audit.
 *
 * This version identifies the detector/taxonomy snapshot. It deliberately does
 * not claim that every cited law or source is current: the taxonomy presently
 * carries human-readable source labels, not a live legal-research feed.
 */
export const RULESET_DISCLOSURE = Object.freeze({
  id: "authenticity-shield",
  version: "2026-09-02.1",
  snapshotDate: "2026-09-02",
  citationStatus: "reference-labels" as const,
  citationNotice:
    "Citations are research leads and source labels, not live legal authority. Laws and guidance can change; verify current primary sources before relying on them.",
});

export type RulesetDisclosure = typeof RULESET_DISCLOSURE;
