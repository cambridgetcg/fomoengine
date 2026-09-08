import Link from "next/link";
import { SOURCE_BY_ID } from "@/lib/attention/sources";
import type { SourceId } from "@/lib/attention/schema";

export function EvidenceCitations({ ids }: { ids: readonly SourceId[] }) {
  return (
    <ul className="evidence-citations" aria-label="Supporting sources">
      {ids.map((id) => (
        <li key={id}><Link href={`/sources#${id}`}>{SOURCE_BY_ID[id].publisher}{SOURCE_BY_ID[id].publishedAt ? ` (${SOURCE_BY_ID[id].publishedAt})` : ""} <span aria-hidden="true">↗</span></Link></li>
      ))}
    </ul>
  );
}

export function EvidenceSources({ ids }: { ids: readonly SourceId[] }) {
  return (
    <ol className="evidence-source-list">
      {ids.map((id) => {
        const source = SOURCE_BY_ID[id];
        return (
          <li key={id} id={`reference-${id}`}>
            <p className="attention-kicker">{source.publisher}</p>
            <a className="evidence-source-title" href={source.url} target="_blank" rel="noopener noreferrer">{source.title} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
            <p className="evidence-dates">Published: {source.publishedAt ?? "date not established"} · Editorial review: {source.reviewedAt}</p>
            <p>{source.context}</p>
            <p className="evidence-retrieval"><strong>Access & limits.</strong> {source.retrievalLimitations}</p>
          </li>
        );
      })}
    </ol>
  );
}
