import type { Metadata } from "next";
import { CheckClient } from "./check-client";

export const metadata: Metadata = {
  title: "Is this trying to manipulate you?",
  description:
    "Paste an ad, message, product page, or review and get a plain-language read on the pressure tactics it uses. Free, no login, nothing saved.",
};

export default function CheckPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
        Is this trying to manipulate you?
      </h1>
      <p className="mt-3 text-base leading-relaxed text-neutral-600">
        Paste anything you received — an ad, a message, a product page, a review section, an email —
        and I&apos;ll name the pressure tactics in plain words, so you can decide for yourself,
        unhurried. Free, no account, and I don&apos;t save what you paste.
      </p>

      <div className="mt-8">
        <CheckClient />
      </div>

      <footer className="mt-12 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
        <p>
          This tool reads only the words you paste — it never visits a website, runs no tracking,
          and stores nothing. It names patterns that are <em>consistent with</em> manipulation,
          grounded in published research (Brignull&apos;s deceptive.design, Princeton&apos;s
          &ldquo;Dark Patterns at Scale,&rdquo; the FTC, the EU&apos;s Digital Services Act). It
          will never tell you a specific person or product is fraudulent — only what to watch for.
          You decide.
        </p>
        <p className="mt-3">Free, forever, for people. No dark patterns of our own.</p>
      </footer>
    </main>
  );
}
