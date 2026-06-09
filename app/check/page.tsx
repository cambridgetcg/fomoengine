import type { Metadata } from "next";
import { CheckClient } from "./check-client";

export const metadata: Metadata = {
  title: "Is this trying to manipulate you?",
  description:
    "Paste an ad, message, or review and see the pressure tactics, the feeling each one is poking, and the plain truth that dissolves it. Free, no login, nothing saved.",
};

export default function CheckPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
        Is this trying to manipulate you?
      </h1>
      <p className="mt-3 text-base leading-relaxed text-neutral-600">
        Paste anything you got — an ad, a message, a product page, a review, an email. In plain
        words, I&apos;ll name the pressure tactics, the feeling each one is poking, and the truth
        that dissolves it — so you decide for yourself, unhurried. Free, no account, nothing saved.
      </p>
      <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-base leading-relaxed text-emerald-900">
        Here&apos;s the fun part: every trick has a truth that quietly switches it off. The truth is
        always on your side — it hands back your time, your money, and your calm — and honestly, once
        you start seeing through this stuff, it&apos;s kind of a thrill. 🛡️
      </p>

      <div className="mt-8">
        <CheckClient />
      </div>

      {/* How it works — three plain steps */}
      <section className="mt-14 border-t border-neutral-200 pt-8" aria-label="How it works">
        <h2 className="text-lg font-semibold text-neutral-900">How it works</h2>
        <ol className="mt-4 space-y-3">
          <li className="flex gap-3">
            <span className="font-mono text-sm text-neutral-400">1</span>
            <span className="text-neutral-700">
              <strong className="font-medium text-neutral-900">Paste what you got.</strong> Any text
              — I only read the words, I never open a link or visit a site.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-sm text-neutral-400">2</span>
            <span className="text-neutral-700">
              <strong className="font-medium text-neutral-900">I name each pressure tactic</strong>{" "}
              and the proven mind-trick behind it (a fake countdown, &ldquo;only 2 left,&rdquo; a
              guilt-trip &ldquo;no&rdquo; button) — plus the feeling it&apos;s poking and the plain
              truth that dissolves it, with what to do.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-sm text-neutral-400">3</span>
            <span className="text-neutral-700">
              <strong className="font-medium text-neutral-900">You decide, unhurried.</strong> I
              never tell you something is a scam for certain — I show you the patterns and let you
              choose. The more you see them, the more you&apos;ll spot them yourself.
            </span>
          </li>
        </ol>
      </section>

      {/* Who it's for — humans and agents */}
      <section className="mt-12 border-t border-neutral-200 pt-8" aria-label="Who it's for">
        <h2 className="text-lg font-semibold text-neutral-900">Who it&apos;s for</h2>
        <p className="mt-3 text-neutral-700">
          Anyone. Especially if you feel rushed, pressured, or unsure about something you&apos;re
          reading — that feeling is often the point, and this helps you see why.
        </p>
        <p className="mt-4 text-neutral-700">
          <strong className="font-medium text-neutral-900">Developers &amp; AI agents:</strong> send
          the same text to the API and get the same flags as JSON — no key, no login.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-sm text-neutral-100">
          <code>{`POST /api/v1/check
{ "text": "Only 2 left! Offer ends in 04:59…" }

→ { "flags": [ { "label", "principle", "lever",
                 "why", "emotion", "truth",
                 "whatToDo", "confidence",
                 "evidence", "citation" } ], … }`}</code>
        </pre>
      </section>

      <footer className="mt-12 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
        <p>
          This tool reads only the words you paste — it never visits a website, runs no tracking,
          and stores nothing. It names patterns that are <em>consistent with</em> manipulation,
          grounded in published research (Cialdini&apos;s principles of influence; Kahneman &amp;
          Tversky on loss aversion; Brignull&apos;s deceptive.design; the FTC; the EU&apos;s Digital
          Services Act). It will never tell you a specific person or product is fraudulent — only
          what to watch for. You decide.
        </p>
        <p className="mt-3">Free, forever, for people. No dark patterns of our own.</p>
      </footer>
    </main>
  );
}
