import Link from "next/link";
import { EVIDENCE_LABELS, type EvidenceKind } from "@/lib/attention/schema";

export function EvidenceLabel({ kind }: { kind: EvidenceKind }) {
  return (
    <Link href={`/methodology#${kind}`} className={`evidence-label evidence-${kind}`}>
      <span aria-hidden="true" className="evidence-symbol">{kind === "hypothesis" ? "?" : kind === "observational" ? "○" : kind === "experimental" ? "◇" : "□"}</span>
      {EVIDENCE_LABELS[kind]}
    </Link>
  );
}
