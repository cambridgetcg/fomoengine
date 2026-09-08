import Link from "next/link";
import { PLATFORMS } from "@/lib/attention/platforms";
import { PlatformEntry } from "@/components/attention/platform-entry";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Platform Field Guide", "Read Instagram Feed, TikTok, YouTube and Google Search by surface. Separate official disclosures, creative choices, metrics and confounders from email and offer strategy.", "/platforms");

export default function PlatformsPage() {
  return (
    <main className="attention-page"><div className="attention-container">
      <header className="attention-page-header"><p className="attention-kicker">02 / Read the surface</p><h1 className="attention-title">The platform<br /><em>field guide.</em></h1><div className="attention-header-columns"><p className="attention-lead">There is no single “algorithm.” There are different surfaces, different decisions and different things you can actually know.</p><p>Start with the exact context. Read the disclosure, choose something you control, and define an outcome before interpreting a change. No secret weights, live analytics or guaranteed reach.</p></div></header>
      <nav className="platform-index" aria-label="Choose a platform or channel">{PLATFORMS.map((platform, index) => <a key={platform.id} href={`#${platform.id}`}><span className="attention-kicker">{String(index + 1).padStart(2, "0")}</span>{platform.name}<span aria-hidden="true">↓</span></a>)}</nav>
      <section className="platform-reading-key" aria-labelledby="reading-key-title"><p className="attention-kicker">Before the field notes</p><h2 id="reading-key-title">Don’t collapse the stages.</h2><div className="attention-three-column"><div><h3>Selection & eligibility</h3><p>What can appear at all? We describe candidate selection only where a source supports it. Missing pipeline details remain unknown.</p></div><div><h3>Predictions & ranking</h3><p>A disclosed signal is not a public weight or an instruction to creators. Feed guidance does not automatically apply to Search or Shorts.</p></div><div><h3>Feedback & your readout</h3><p>Internal predictions and creator analytics are different things. A click, a completed view and a satisfied person are not interchangeable.</p></div></div><p className="attention-note">Email and offer pages appear as strategy channels, not official ranking systems. Their suggested choices are hypotheses. <Link href="/methodology#hypothesis">How evidence labels work <span aria-hidden="true">↗</span></Link></p></section>
      <div className="platform-entries">{PLATFORMS.map((platform, index) => <PlatformEntry key={platform.id} platform={platform} number={index + 1} />)}</div>
      <section className="attention-closing attention-section"><p className="attention-kicker">From field note to experiment</p><h2>Pick a surface.<br /><em>Ask a smaller question.</em></h2><p>A useful brief connects your topic, one variable, an eligible denominator and a reason to stop. It does not promise to reverse-engineer a platform.</p><Link href="/lab" className="attention-button is-primary">Open the strategy lab <span aria-hidden="true">↗</span></Link></section>
    </div></main>
  );
}
