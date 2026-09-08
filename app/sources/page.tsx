import Link from "next/link";
import { SOURCES } from "@/lib/attention/sources";
import { MECHANISMS } from "@/lib/attention/mechanisms";
import { PLATFORMS } from "@/lib/attention/platforms";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Source Register", "Primary research and official platform references behind the Attention Lab, with publication dates, editorial review dates, context and truthful retrieval limitations.", "/sources");

export default function SourcesPage() {
  return (
    <main className="attention-page"><div className="attention-container">
      <header className="attention-page-header"><p className="attention-kicker">The reference desk</p><h1 className="attention-title">Follow the <em>source.</em></h1><p className="attention-lead">An idea should travel with its evidence — and the limits of that evidence.</p></header>
      <div className="attention-reading-layout">
        <aside className="attention-reading-aside"><p className="attention-kicker">Read this register</p><p>Publication date and editorial review date mean different things. A review is not proof of a fresh full-text retrieval.</p><Link className="attention-text-link" href="/methodology">Our methodology <span aria-hidden="true">↗</span></Link><nav aria-label="Source register index">{SOURCES.map((source, index) => <a href={`#${source.id}`} key={source.id}>{String(index + 1).padStart(2, "0")} / {source.publisher.split(" · ")[0]}</a>)}</nav></aside>
        <div className="attention-reading-body">
          <div className="attention-note"><strong>A bounded editorial record, not live verification.</strong> This register uses the references in the approved research. The source pages were not newly fetched on the editorial review date. TikTok is based on official index information with article-body access restricted; Meta Feed is a historical disclosure. Living documents may have changed.</div>
          <ol className="sources-register">{SOURCES.map((source, index) => {
            const mechanisms = MECHANISMS.filter((mechanism) => mechanism.sourceIds.includes(source.id));
            const platforms = PLATFORMS.filter((platform) => platform.sourceIds.includes(source.id));
            return <li key={source.id} id={source.id}><p className="attention-kicker">Reference {String(index + 1).padStart(2, "0")} / {source.publisher}</p><h2><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a></h2><dl className="source-date-pair"><div><dt>Published</dt><dd>{source.publishedAt ?? "Date not established"}</dd></div><div><dt>Editorial review</dt><dd>{source.reviewedAt}</dd></div></dl><p>{source.context}</p><div className="evidence-limits"><h3 className="attention-kicker">Access & interpretation limits</h3><p>{source.retrievalLimitations}</p></div><div className="source-used-in"><p className="attention-kicker">Used in</p>{mechanisms.map((mechanism) => <Link key={mechanism.id} href={`/atlas/${mechanism.id}`}>{mechanism.name} <span aria-hidden="true">↗</span></Link>)}{platforms.map((platform) => <Link key={platform.id} href={`/platforms#${platform.id}`}>{platform.name} <span aria-hidden="true">↗</span></Link>)}{source.id === "google-trends-faq" && <Link href="/trends">Trend notebook <span aria-hidden="true">↗</span></Link>}</div></li>;
          })}</ol>
          <section className="attention-reading-section"><h2>A separate register from the checker.</h2><p>The older checker uses reference labels attached to detector categories. Those labels are not this claim-level catalogue and should not be read as evidence that a phrase proves manipulation, identifies an emotion or predicts an outcome.</p><Link className="attention-text-link" href="/methodology#checker">Read the checker boundary <span aria-hidden="true">↗</span></Link></section>
        </div>
      </div>
    </div></main>
  );
}
