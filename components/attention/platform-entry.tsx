import Link from "next/link";
import type { Platform } from "@/lib/attention/schema";
import { EvidenceClaim } from "./evidence-claim";
import { EvidenceSources } from "./evidence-sources";

export function PlatformEntry({ platform, number }: { platform: Platform; number: number }) {
  const strategy = platform.kind === "strategy-channel";
  return (
    <article className="platform-entry" id={platform.id}>
      <header className="platform-entry-heading"><span className="attention-kicker platform-entry-number">{String(number).padStart(2, "0")} /</span><div><p className="attention-kicker">{strategy ? "Strategy channel · not a ranking system" : "Platform × surface"}</p><h2>{platform.name}</h2><p className="platform-surface-name">{platform.surface}</p></div><Link href={`/lab?platform=${platform.id}`} className="attention-button">Use in Lab <span aria-hidden="true">↗</span></Link></header>
      <div className="platform-entry-body">
        <p className="attention-lead">{platform.summary}</p>
        <div className="attention-note"><strong>{strategy ? "Channel boundary." : "Disclosure boundary."}</strong> {platform.rankingDisclosure}</div>
        <details className="platform-dossier">
          <summary><span>{strategy ? "Read the strategy hypotheses" : "Read the disclosed signals & their limits"}</span><span className="platform-details-toggle" aria-hidden="true">+</span></summary>
          <div className="evidence-claims">{platform.signals.map((claim) => <EvidenceClaim key={claim.id} claim={claim} />)}</div>
        </details>
        <div className="platform-practice-grid">
          <section><p className="attention-kicker">Your choices / Not algorithm instructions</p><h3>What to make</h3><ul className="attention-list">{platform.practicalChoices.map((choice) => <li key={choice}>{choice}</li>)}</ul></section>
          <section className="platform-metric"><p className="attention-kicker">An outcome to define / Not a score</p><h3>{platform.metric.name}</h3><dl><dt>Count this outcome</dt><dd>{platform.metric.numerator}</dd><dt>Out of this eligible group</dt><dd>{platform.metric.denominator}</dd></dl><p className="platform-metric-caveat">{platform.metric.caveat}</p></section>
        </div>
        <div className="platform-practice-grid platform-guardrails"><section><p className="attention-kicker">Quality & trust</p><h3>What must not get worse</h3><ul className="attention-list">{platform.qualityGuardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}</ul></section><section><p className="attention-kicker">Confounders</p><h3>What else might explain it</h3><ul className="attention-list">{platform.confounders.map((confounder) => <li key={confounder}>{confounder}</li>)}</ul></section></div>
        <details className="platform-dossier platform-references"><summary><span>Source dates, access & references</span><span className="platform-details-toggle" aria-hidden="true">+</span></summary><EvidenceSources ids={platform.sourceIds} /></details>
      </div>
    </article>
  );
}
