import type { Metadata } from "next";
import { CheckClient } from "./check-client";

export const metadata: Metadata = {
  title: "Is this trying to manipulate you?",
  description:
    "Paste an ad, message, or review and see the pressure tactics, the feeling each one is poking, and the plain truth that dissolves it. Free, no login, nothing saved.",
};

const GROUNDING = ["Cialdini", "Kahneman & Tversky", "Brignull's deceptive.design", "FTC", "EU DSA"];

export default function CheckPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(16,185,129,0.10),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-14 text-center sm:pt-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm">
            <span aria-hidden>🛡️</span> Free, forever, for people · nothing saved
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl text-balance text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Is this trying to manipulate you?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-neutral-600 sm:text-lg">
            Paste anything you got — an ad, a message, a review, an email. In plain words I&apos;ll
            name each pressure tactic, the feeling it&apos;s poking, and the truth that dissolves it —
            so you decide for yourself, unhurried.
          </p>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[0.95rem] leading-relaxed text-emerald-800">
            Every trick has a truth that quietly switches it off. The truth is always on your side —
            and once you start seeing through this stuff, it&apos;s kind of a thrill. 🛡️
          </p>
        </div>
      </section>

      {/* ── The checker (the star) ───────────────────────────────────────── */}
      <section className="mx-auto -mt-6 max-w-2xl px-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl shadow-neutral-900/5 sm:p-7">
          <CheckClient />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="mx-auto mt-16 max-w-3xl px-4" aria-label="How it works">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-neutral-500">
          How it works
        </h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            {
              n: "1",
              t: "Paste what you got",
              d: "Any text. I only read the words — I never open a link or visit a site.",
            },
            {
              n: "2",
              t: "See the tactic, feeling & truth",
              d: "Each pressure move named in plain words, the feeling it pokes, and the truth that dissolves it.",
            },
            {
              n: "3",
              t: "You decide, unhurried",
              d: "I never call something a scam for certain — I show the patterns so you spot them yourself.",
            },
          ].map((s) => (
            <li key={s.n} className="rounded-xl border border-neutral-200 bg-white p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                {s.n}
              </span>
              <p className="mt-3 font-semibold text-neutral-900">{s.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── The pledge (worn proudly) ────────────────────────────────────── */}
      <section className="mx-auto mt-16 max-w-3xl px-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center sm:p-8">
          <p className="text-lg font-semibold text-emerald-900 sm:text-xl">
            Free, forever, for people. No dark patterns of our own.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-emerald-800/90">
            We read only the words you paste — never a website, no tracking, nothing stored. We name
            patterns <em>consistent with</em> manipulation; we never call a specific person or product
            fraudulent. You decide.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {GROUNDING.map((g) => (
              <span
                key={g}
                className="rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── For developers & agents ──────────────────────────────────────── */}
      <section className="mx-auto mt-16 max-w-3xl px-4" aria-label="For developers">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
          <h2 className="font-semibold text-neutral-900">Developers &amp; AI agents</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Send the same text to the API and get the same flags as JSON — no key needed to start.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-neutral-900 p-4 text-sm leading-relaxed text-neutral-100">
            <code>{`POST /api/v1/check
{ "text": "Only 2 left! Offer ends in 04:59…" }

→ { "flags": [ { "label", "principle", "lever",
                 "why", "emotion", "truth",
                 "whatToDo", "confidence",
                 "evidence", "citation" } ], … }`}</code>
          </pre>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="mx-auto mt-16 max-w-3xl px-4 pb-16">
        <div className="border-t border-neutral-200 pt-6 text-sm leading-relaxed text-neutral-500">
          <p>
            Grounded in published research — Cialdini&apos;s principles of influence, Kahneman &amp;
            Tversky on loss aversion, Brignull&apos;s deceptive.design, the FTC, and the EU&apos;s
            Digital Services Act. It will never tell you something is a scam for certain — only what to
            watch for.
          </p>
          <p className="mt-3 font-medium text-neutral-600">Free, forever, for people. 🛡️</p>
        </div>
      </footer>
    </main>
  );
}
