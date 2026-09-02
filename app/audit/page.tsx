import type { Metadata } from "next";
import Link from "next/link";
import { AuditRequestForm } from "./audit-request-form";
import { DESIGN_PARTNER_AUDIT } from "@/lib/services/audit/offer";
import { RULESET_DISCLOSURE } from "@/lib/services/detection/ruleset";

export const metadata: Metadata = {
  title: "Copy Pressure Audit for businesses",
  description:
    "A bounded, versioned self-audit for organizations checking copy they control. $99 USD design-partner price; not legal certification.",
  alternates: { canonical: "/audit" },
};

function configuredContactEmail(): string | null {
  const value = process.env.NEXT_PUBLIC_AUDIT_CONTACT_EMAIL?.trim();
  if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return value;

  // Public operator inbox, already declared on cambridgetcg.com/manifest.
  // Keeping a working fallback avoids publishing a dead intake surface when a
  // hosting environment has not yet received the optional override.
  return "contact@cambridgetcg.com";
}

export default function AuditPage() {
  const contactEmail = configuredContactEmail();

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/check" className="font-semibold text-neutral-900 hover:text-neutral-600">
            <span aria-hidden>🛡️</span> the authenticity shield
          </Link>
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Business self-audit</span>
        </div>
      </header>

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Design-partner offer</p>
          <div className="mt-3 grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <h1 className="max-w-2xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
                Find pressure in your own copy before your customers have to.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-neutral-600">
                The {DESIGN_PARTNER_AUDIT.name} marks exact passages, explains the signal and its evidence,
                and proposes a clear, neutral alternative. It is a review artifact for copy you control—not a
                verdict about a person or competitor.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 md:min-w-52">
              <p className="text-3xl font-bold">{DESIGN_PARTNER_AUDIT.priceLabel}</p>
              <p className="mt-1 text-sm text-neutral-600">Flat, one-time design-partner price</p>
              <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                No checkout here. Scope, timing and a verified payment route are confirmed before you pay.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-6 px-4 py-12 md:grid-cols-2" aria-label="Audit scope">
        <article className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold">What the report includes</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700">
            <li>Up to {DESIGN_PARTNER_AUDIT.maximumSurfaces} surfaces and {DESIGN_PARTNER_AUDIT.maximumWords.toLocaleString()} words combined.</li>
            <li>Exact marked spans, named pressure signals, confidence band and detection source.</li>
            <li>A timestamped ruleset version plus each citation label and its stated evidence status.</li>
            <li>Neutral rewrite options that preserve the factual offer without engineered pressure.</li>
            <li>One correction/challenge pass and one re-check requested within {DESIGN_PARTNER_AUDIT.recheckDays} days.</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold">What it does not claim</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700">
            <li>It is not legal advice, regulatory certification, accessibility certification or a guarantee of compliance.</li>
            <li>It does not declare a person, organization, product, claim or review fraudulent.</li>
            <li>It does not promise a conversion-rate lift or optimize copy for maximum psychological pressure.</li>
            <li>It does not include competitor surveillance, authenticated crawling or hidden-interface access.</li>
          </ul>
        </article>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6">
          <h2 className="font-semibold text-amber-950">Evidence state, stated plainly</h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
            Current snapshot: <strong>{RULESET_DISCLOSURE.id}/{RULESET_DISCLOSURE.version}</strong>, dated {RULESET_DISCLOSURE.snapshotDate}.
            {" "}{RULESET_DISCLOSURE.citationNotice} The report therefore identifies possible pressure patterns and review questions;
            it does not certify legal conclusions.
          </p>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="text-2xl font-semibold">A request is not a purchase</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["1", "Prepare a metadata-only request", "Name the public pages or surfaces. Do not paste private copy, credentials or customer records."],
              ["2", "Confirm scope and handling", "We confirm fit, delivery timing, any safer transfer route and the exact report boundary in writing."],
              ["3", "Choose whether to proceed", "Only then do you receive a verified $99 payment route. You can decline without penalty."],
            ].map(([number, title, description]) => (
              <li key={number} className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                  {number}
                </span>
                <p className="mt-3 font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14" aria-labelledby="request-heading">
        <h2 id="request-heading" className="text-3xl font-bold tracking-tight">Request a design-partner audit</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
          This form runs locally in your browser. It creates a draft you can inspect and then opens your own email app;
          the site has no intake database, upload endpoint or tracking event.
        </p>
        {!contactEmail && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Email intake is not configured in this environment. You can still prepare and copy the request, but this page cannot deliver it yet.
          </p>
        )}
        <div className="mt-7 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
          <AuditRequestForm contactEmail={contactEmail} />
        </div>
      </section>

      <footer className="mx-auto max-w-4xl px-4 pb-14 text-sm text-neutral-500">
        <div className="border-t border-neutral-200 pt-6">
          The consumer <Link href="/check" className="font-medium text-neutral-700 underline underline-offset-2">authenticity shield</Link> remains free,
          unmetered and ungated. Businesses pay for bounded human review, a versioned artifact and re-check—not for anyone&apos;s safety result.
          <p className="mt-3">Operator: Yu · contact@cambridgetcg.com · Cambridge, UK.</p>
        </div>
      </footer>
    </main>
  );
}
