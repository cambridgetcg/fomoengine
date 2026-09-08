"use client";

import { useState } from "react";
import Link from "next/link";
import { MECHANISMS } from "@/lib/attention/mechanisms";
import { PLATFORMS } from "@/lib/attention/platforms";
import { EVIDENCE_KINDS, EVIDENCE_LABELS } from "@/lib/attention/schema";
import { EvidenceLabel } from "./evidence-label";

export function AtlasExplorer() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("");
  const [evidence, setEvidence] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("en");
  const filtered = MECHANISMS.filter((mechanism) =>
    (!normalizedQuery || [mechanism.name, mechanism.summary, mechanism.emotion, ...mechanism.howItWorks].join(" ").toLocaleLowerCase("en").includes(normalizedQuery)) &&
    (!platform || mechanism.compatiblePlatformIds.some((id) => id === platform)) &&
    (!evidence || mechanism.claims.some((claim) => claim.kind === evidence)),
  );
  const hasFilters = Boolean(query || platform || evidence);

  function reset() {
    setQuery("");
    setPlatform("");
    setEvidence("");
  }

  return (
    <div className="atlas-explorer">
      <div className="atlas-filters" role="search" aria-label="Search mechanism atlas">
        <div className="attention-field atlas-search"><label htmlFor="atlas-search">Find a mechanism</label><input type="search" id="atlas-search" placeholder="Try curiosity, urgency, belonging…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="attention-field"><label htmlFor="atlas-platform">Surface or channel</label><select id="atlas-platform" value={platform} onChange={(event) => setPlatform(event.target.value)}><option value="">All surfaces & channels</option>{PLATFORMS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        <div className="attention-field"><label htmlFor="atlas-evidence">Contains evidence type</label><select id="atlas-evidence" value={evidence} onChange={(event) => setEvidence(event.target.value)}><option value="">All evidence types</option>{EVIDENCE_KINDS.map((kind) => <option key={kind} value={kind}>{EVIDENCE_LABELS[kind]}</option>)}</select></div>
      </div>
      <div className="atlas-result-line"><p className="attention-kicker" role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? "mechanism" : "mechanisms"}{hasFilters ? " matching your filters" : " / Research index"}</p>{hasFilters && <button type="button" className="attention-text-link" onClick={reset}>Clear filters</button>}</div>
      {filtered.length ? <div className="atlas-grid">{filtered.map((mechanism) => {
        const index = MECHANISMS.findIndex((item) => item.id === mechanism.id);
        const kinds = [...new Set(mechanism.claims.map((claim) => claim.kind))];
        return (
          <article className="atlas-card" key={mechanism.id}>
            <div className="atlas-card-top"><span className="attention-kicker">Mechanism / {String(index + 1).padStart(2, "0")}</span><span className={`atlas-mark atlas-mark-${mechanism.id}`} aria-hidden="true"><i /><i /><i /></span></div>
            <h2><Link href={`/atlas/${mechanism.id}`}>{mechanism.name} <span aria-hidden="true">↗</span></Link></h2>
            <p>{mechanism.summary}</p>
            <div className="atlas-card-evidence">{kinds.map((kind) => <EvidenceLabel key={kind} kind={kind} />)}</div>
            <div className="atlas-card-footer"><Link href={`/atlas/${mechanism.id}`} className="attention-text-link">Read the entry <span aria-hidden="true">→</span></Link><Link href={`/lab?mechanism=${mechanism.id}${platform ? `&platform=${platform}` : ""}`} className="attention-text-link">Try in Lab <span aria-hidden="true">↗</span></Link></div>
          </article>
        );
      })}</div> : <div className="atlas-empty attention-panel"><h2>No matching mechanism.</h2><p>Try a broader phrase or another surface. The atlas is a small, sourced starting set — not an exhaustive psychology index.</p><button className="attention-button" onClick={reset} type="button">Reset search & filters</button></div>}
      <p className="attention-note">A surface match means there is a plausible experiment to design, not evidence that the mechanism has been proven to work on that platform. Evidence filters match individual claims inside an entry.</p>
    </div>
  );
}
