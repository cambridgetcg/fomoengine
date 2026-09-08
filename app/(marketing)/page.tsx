import Link from "next/link";
import { MECHANISMS } from "@/lib/attention/mechanisms";
import { EvidenceLabel } from "@/components/attention/evidence-label";
import { pageMetadata, SITE_URL } from "@/lib/site";

export const metadata = pageMetadata(
  "The Attention Lab",
  "Understand attention, decode pressure and build an honest strategy. A research atlas, platform field guides and a local experiment workspace — free, no account needed.",
  "/",
);

export default function Home() {
  return (
    <main className="attention-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "FOMOengine", alternateName: "The Attention Lab", url: SITE_URL, description: "A research atlas and local workspace for understanding attention and designing honest experiments." }) }} />
      <div className="attention-container">
        <div className="attention-mastline attention-kicker"><span>Research / Creative practice / Informed choice</span><span>No secret formula. A better set of questions.</span></div>
        <section className="attention-hero" aria-labelledby="home-title">
          <div className="attention-hero-copy">
            <p className="attention-kicker"><span className="attention-signal" aria-hidden="true" /> The Attention Lab</p>
            <h1 id="home-title">Attention isn’t<br />an <em>accident.</em></h1>
            <p className="attention-hero-description">Learn how emotion, platforms and creative choices compete for it. Then design something worth paying attention to.</p>
            <div className="attention-actions">
              <Link className="attention-button is-primary" href="/atlas">Explore the atlas <span aria-hidden="true">↗</span></Link>
              <Link className="attention-text-link" href="/lab">Build an experiment <span aria-hidden="true">→</span></Link>
            </div>
            <p className="attention-hero-footnote">Research-informed. Open to being wrong.<br />Free tools, without an account.</p>
          </div>
          <figure className="attention-specimen" aria-labelledby="specimen-caption">
            <figcaption className="attention-specimen-caption attention-kicker" id="specimen-caption"><span>Specimen 01 / The opening line</span><span>Illustrative example</span></figcaption>
            <div className="attention-specimen-paper">
              <span className="attention-specimen-corner" aria-hidden="true">+</span>
              <p className="attention-kicker attention-specimen-tag">A photography lesson</p>
              <blockquote>“Why do indoor<br />portraits look<br /><span className="attention-specimen-underline">orange?</span>”</blockquote>
              <div className="attention-specimen-annotation"><span aria-hidden="true">↳</span><p><strong>A specific missing answer.</strong><br />Not “one secret nobody wants you to know.”</p></div>
              <div className="attention-specimen-contract"><span className="attention-kicker">The promise</span><p>Show the white-balance setting.<br />Let the lesson deliver the answer.</p></div>
            </div>
            <div className="attention-specimen-slip">
              <span className="attention-kicker">What would you test?</span>
              <p>Direct answer <span aria-hidden="true">↔</span> specific question</p>
              <span>Same lesson. Same CTA. Change only the opening.</span>
            </div>
            <Link href="/lab?mechanism=curiosity-gap&platform=youtube-shorts" className="attention-specimen-link">Try this with your own topic <span aria-hidden="true">↗</span></Link>
          </figure>
        </section>
        <section className="attention-workflow" aria-label="How to use the Attention Lab">
          {[
            { number: "01", title: "Understand", text: "Read the mechanism, the evidence and the limits of what it can tell you.", href: "/atlas", action: "Mechanism atlas" },
            { number: "02", title: "Decode", text: "Spot pressure in a message. A pattern is a reason to look closer, not a verdict.", href: "/check", action: "Free checker" },
            { number: "03", title: "Apply & test", text: "Make a brief, change one variable and record what happened. A null result counts.", href: "/lab", action: "Strategy lab" },
          ].map((step) => <article key={step.number}><span className="attention-kicker attention-step-number">{step.number} /</span><h2>{step.title}</h2><p>{step.text}</p><Link className="attention-text-link" href={step.href}>{step.action} <span aria-hidden="true">↗</span></Link></article>)}
        </section>
        <section className="attention-section" aria-labelledby="mechanisms-title">
          <div className="attention-section-heading">
            <div><p className="attention-kicker">Inside the atlas</p><h2 id="mechanisms-title">Name the pull.<br /><em>Question the promise.</em></h2></div>
            <div className="attention-section-intro"><p>Six starting points for reading attention. Not six proven growth levers. Every entry keeps its evidence and uncertainty attached.</p><Link className="attention-text-link" href="/atlas">Browse the complete atlas <span aria-hidden="true">↗</span></Link></div>
          </div>
          <div className="attention-home-index">
            {MECHANISMS.map((mechanism, index) => <article className="attention-home-index-row" key={mechanism.id}><span className="attention-kicker">{String(index + 1).padStart(2, "0")}</span><h3><Link href={`/atlas/${mechanism.id}`}>{mechanism.name}<span aria-hidden="true">↗</span></Link></h3><p>{mechanism.summary}</p><EvidenceLabel kind={mechanism.claims[0].kind} /></article>)}
          </div>
        </section>
        <section className="attention-field-section" aria-labelledby="field-title">
          <div className="attention-field-copy"><p className="attention-kicker">Read the room, not “the algorithm”</p><h2 id="field-title">Same person.<br /><em>Different surface.</em></h2><p>A swipeable feed, a search result and an email are not the same decision. Separate what a platform discloses from what you can choose, measure and test.</p><Link href="/platforms" className="attention-button">Open the platform field guide <span aria-hidden="true">↗</span></Link></div>
          <div className="attention-surface-index">
            <Link href="/platforms#youtube-shorts"><span className="attention-kicker">Social / YouTube Shorts</span><strong>Will I choose to watch?</strong><span>Selection ≠ completion ≠ satisfaction <span aria-hidden="true">↗</span></span></Link>
            <Link href="/platforms#google-search"><span className="attention-kicker">Search / Google</span><strong>Does this answer my question?</strong><span>Useful evidence, not invented keyword volume <span aria-hidden="true">↗</span></span></Link>
            <Link href="/platforms#marketing-offer"><span className="attention-kicker">Marketing / Offer page</span><strong>Is this actually right for me?</strong><span>Real proof. Clear terms. Room to decline. <span aria-hidden="true">↗</span></span></Link>
          </div>
        </section>
        <section className="attention-closing attention-section" aria-labelledby="closing-title">
          <p className="attention-kicker">A notebook, not an autopilot</p>
          <h2 id="closing-title">Keep your curiosity.<br /><em>Bring your own evidence.</em></h2>
          <p>The Lab makes editable, deterministic briefs — not AI predictions. Add a manual trend observation, export your experiment and keep the decision yours.</p>
          <div className="attention-actions"><Link href="/lab" className="attention-button is-primary">Start a brief <span aria-hidden="true">↗</span></Link><Link href="/trends" className="attention-text-link">Keep a trend note <span aria-hidden="true">→</span></Link></div>
          <Link href="/methodology" className="attention-closing-note">How we separate evidence from a useful hypothesis</Link>
        </section>
      </div>
    </main>
  );
}
