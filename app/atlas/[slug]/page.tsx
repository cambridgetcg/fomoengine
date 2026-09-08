import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MECHANISMS, getMechanism } from "@/lib/attention/mechanisms";
import { PLATFORM_BY_ID } from "@/lib/attention/platforms";
import { EvidenceClaim } from "@/components/attention/evidence-claim";
import { EvidenceLabel } from "@/components/attention/evidence-label";
import { EvidenceSources } from "@/components/attention/evidence-sources";
import { pageMetadata, SITE_URL } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return MECHANISMS.map((mechanism) => ({ slug: mechanism.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const mechanism = getMechanism((await params).slug);
  if (!mechanism) notFound();
  return pageMetadata(mechanism.name, mechanism.summary, `/atlas/${mechanism.id}`);
}

export default async function MechanismPage({ params }: PageProps) {
  const mechanism = getMechanism((await params).slug);
  if (!mechanism) notFound();
  const index = MECHANISMS.findIndex((item) => item.id === mechanism.id);
  const kinds = [...new Set(mechanism.claims.map((claim) => claim.kind))];
  const experiment = mechanism.experiment;

  return (
    <main className="attention-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: mechanism.name, description: mechanism.summary, url: `${SITE_URL}/atlas/${mechanism.id}`, isPartOf: { "@type": "CollectionPage", name: "Mechanism Atlas", url: `${SITE_URL}/atlas` } }) }} />
      <div className="attention-container">
        <header className="attention-page-header atlas-detail-header">
          <Link className="attention-kicker attention-back-link" href="/atlas">← Mechanism atlas / {String(index + 1).padStart(2, "0")}</Link>
          <h1 className="attention-title">{mechanism.name}<span className="attention-accent">.</span></h1>
          <p className="attention-lead">{mechanism.summary}</p>
          <div className="attention-actions">{kinds.map((kind) => <EvidenceLabel key={kind} kind={kind} />)}<Link className="attention-button is-primary" href={`/lab?mechanism=${mechanism.id}`}>Build an experiment <span aria-hidden="true">↗</span></Link></div>
        </header>
        <div className="attention-reading-layout">
          <aside className="attention-reading-aside"><nav aria-label="In this entry"><p className="attention-kicker">In this entry</p><a href="#mechanism">01 / The mechanism</a><a href="#example">02 / Read an example</a><a href="#evidence">03 / Known & unknown</a><a href="#practice">04 / Honest practice</a><a href="#platforms">05 / Platform context</a><a href="#experiment">06 / A testable question</a><a href="#sources">07 / Sources</a></nav><p>This entry is a research guide, not a diagnosis of an individual’s feelings or intent.</p></aside>
          <div className="attention-reading-body">
            <section id="mechanism" className="attention-reading-section"><p className="attention-kicker">01 / The mechanism</p><h2>How the pull can work</h2><ol className="attention-numbered-list">{mechanism.howItWorks.map((step) => <li key={step}>{step}</li>)}</ol><div className="attention-note"><strong>Possible emotional response.</strong> {mechanism.emotion}</div></section>
            <section id="example" className="attention-reading-section"><p className="attention-kicker">02 / Illustrative copy, not measured results</p><h2>Same attention. Different contract.</h2><div className="atlas-example-pair"><div><p className="attention-kicker">An honest starting point</p><blockquote>{mechanism.example.honest}</blockquote></div><div className="atlas-pressure-example"><p className="attention-kicker">Pressure to recognize — not a template</p><blockquote>{mechanism.example.pressure}</blockquote></div></div><p>{mechanism.example.distinction}</p></section>
            <section id="evidence" className="attention-reading-section"><p className="attention-kicker">03 / Known & unknown</p><h2>The evidence, with its edges.</h2><p>A source can support a narrow finding without validating a creative template. Read the claim and the limitation together.</p><div className="evidence-claims">{mechanism.claims.map((claim) => <EvidenceClaim key={claim.id} claim={claim} />)}</div></section>
            <section id="practice" className="attention-reading-section"><p className="attention-kicker">04 / Honest practice</p><h2>Use it without the trap.</h2><ul className="attention-list">{mechanism.honestUse.map((use) => <li key={use}>{use}</li>)}</ul><div className="atlas-countermeasure"><p className="attention-kicker">If you are on the receiving end</p><h3>Keep your own judgment.</h3><p>{mechanism.countermeasure}</p><Link href="/check" className="attention-text-link">Decode a message with the checker <span aria-hidden="true">↗</span></Link></div><h3>What could go wrong?</h3><ul className="attention-list">{mechanism.tradeoffs.map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)}</ul></section>
            <section id="platforms" className="attention-reading-section"><p className="attention-kicker">05 / Platform context</p><h2>Put the question on a surface.</h2><p>These are compatible planning contexts, not proven effects. The field guide separates published platform signals from your own creative hypotheses.</p><div className="atlas-platform-links">{mechanism.compatiblePlatformIds.map((id) => <Link key={id} href={`/platforms#${id}`}>{PLATFORM_BY_ID[id].name} <span aria-hidden="true">↗</span></Link>)}</div></section>
            <section id="experiment" className="attention-reading-section"><p className="attention-kicker">06 / Proposed experiment — not a result</p><h2>{experiment.question}</h2><div className="attention-note"><strong>Change one variable.</strong> {experiment.variable}</div><div className="atlas-experiment-pair"><div><p className="attention-kicker">A / Control</p><p>{experiment.control}</p></div><div><p className="attention-kicker">B / Treatment</p><p>{experiment.treatment}</p></div></div><h3>Hold constant</h3><ul className="attention-list">{experiment.holdConstant.map((item) => <li key={item}>{item}</li>)}</ul><h3>Read the outcome carefully</h3><p>{experiment.readout}</p><p className="attention-note">{experiment.limitations}</p><Link className="attention-button is-primary" href={`/lab?mechanism=${mechanism.id}`}>Make this experiment yours <span aria-hidden="true">↗</span></Link></section>
            <section id="sources" className="attention-reading-section"><p className="attention-kicker">07 / Source notes</p><h2>Follow the references.</h2><p>Review dates describe our editorial record, not a fresh retrieval of the source or a claim that a platform’s system is unchanged.</p><EvidenceSources ids={mechanism.sourceIds} /><Link href="/sources" className="attention-text-link">Full source register <span aria-hidden="true">↗</span></Link></section>
          </div>
        </div>
        <nav className="atlas-next-entry" aria-label="More from the atlas"><Link className="attention-text-link" href="/atlas">← Back to the atlas</Link><Link className="attention-text-link" href={`/atlas/${MECHANISMS[(index + 1) % MECHANISMS.length].id}`}>Next: {MECHANISMS[(index + 1) % MECHANISMS.length].name} <span aria-hidden="true">→</span></Link></nav>
      </div>
    </main>
  );
}
