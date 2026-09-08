import Link from "next/link";
import { AtlasExplorer } from "@/components/attention/atlas-explorer";
import { pageMetadata, SITE_URL } from "@/lib/site";
import { MECHANISMS } from "@/lib/attention/mechanisms";

export const metadata = pageMetadata("Mechanism Atlas", "Explore six attention mechanisms with concrete examples, claim-level evidence, limits and honest experiments. Search by mechanism, surface or evidence type.", "/atlas");

export default function AtlasPage() {
  return (
    <main className="attention-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "Mechanism Atlas", url: `${SITE_URL}/atlas`, hasPart: MECHANISMS.map((mechanism) => ({ "@type": "Article", headline: mechanism.name, url: `${SITE_URL}/atlas/${mechanism.id}` })) }) }} />
      <div className="attention-container">
        <header className="attention-page-header"><p className="attention-kicker">01 / Understand</p><h1 className="attention-title">The mechanism <em>atlas.</em></h1><div className="attention-header-columns"><p className="attention-lead">What makes something hard to ignore? Start with a mechanism. Keep its limits in view.</p><p>These are research questions, not universal growth laws. Each entry connects an example to its evidence, a countermeasure and an experiment you can question. <Link href="/methodology">Read the methodology <span aria-hidden="true">↗</span></Link></p></div></header>
        <AtlasExplorer />
      </div>
    </main>
  );
}
