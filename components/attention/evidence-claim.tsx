import type { Claim } from "@/lib/attention/schema";
import { EvidenceLabel } from "./evidence-label";
import { EvidenceCitations } from "./evidence-sources";

export function EvidenceClaim({ claim }: { claim: Claim }) {
  return (
    <article className="evidence-claim" id={claim.id}>
      <EvidenceLabel kind={claim.kind} />
      <h3>{claim.text}</h3>
      <p className="evidence-context"><strong>Context.</strong> {claim.context}</p>
      <div className="evidence-limits">
        <h4 className="attention-kicker">What this does not establish</h4>
        <ul className="attention-list">{claim.limitations.map((limit) => <li key={limit}>{limit}</li>)}</ul>
      </div>
      <EvidenceCitations ids={claim.sourceIds} />
    </article>
  );
}
