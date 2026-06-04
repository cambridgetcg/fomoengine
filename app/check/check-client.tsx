"use client";

import { useState } from "react";
import type { AnalysisResult, Flag } from "@/lib/services/detection/detection.service";

/** Severity shown so it's perceivable WITHOUT color (mark + word), not by color alone. */
const SEV = {
  danger: { word: "Scam pattern", mark: "⚠", cls: "border-red-600 bg-red-50" },
  caution: { word: "Pressure tactic", mark: "▲", cls: "border-amber-500 bg-amber-50" },
  info: { word: "Worth noticing", mark: "•", cls: "border-neutral-400 bg-neutral-50" },
} as const;

/** One-click examples so anyone can see what the tool does, instantly — no need to go find text. */
const EXAMPLES: { label: string; text: string }[] = [
  {
    label: "A pushy ad",
    text: "🔥 FLASH SALE — Only 2 left in stock! Offer ends in 04:59. 3 people are viewing this right now. Join 50,000+ happy customers. No thanks, I'd rather pay full price.",
  },
  {
    label: "A scam text",
    text: "URGENT: Your account has been suspended due to suspicious activity. Verify your identity now or it will be permanently closed within 24 hours. Call 1-800-555-0142 immediately. Do not share this with anyone.",
  },
  {
    label: "A subscription trap",
    text: "Start your FREE trial today — cancel anytime! (You'll then be billed $49/month, auto-renews. Taxes and service fees calculated at checkout.)",
  },
];

export function CheckClient() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check(input?: string) {
    const body = (input ?? text).trim();
    if (!body || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/v1/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body }),
      });
      const json = await res.json();
      if (!json.success) setError(json.error?.message ?? "Something went wrong.");
      else setResult(json.data as AnalysisResult);
    } catch {
      setError("Couldn't reach the checker. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function runExample(ex: { text: string }) {
    setText(ex.text);
    check(ex.text);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") check();
  }

  return (
    <div>
      <label htmlFor="paste" className="block text-base font-medium text-neutral-800">
        Paste anything you got — an ad, a message, a product page, a review, an email.
      </label>
      <textarea
        id="paste"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={7}
        placeholder="Paste it here…"
        className="mt-2 w-full rounded-lg border border-neutral-300 p-3 text-base leading-relaxed focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800/20"
        aria-describedby="paste-help"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => check()}
          disabled={loading || !text.trim()}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-base font-medium text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Reading…" : "Check it"}
        </button>
        <p id="paste-help" className="text-sm text-neutral-500">
          Press {modifierLabel()}+Enter. Nothing you paste is saved.
        </p>
      </div>

      {/* Friction-free: try it without finding your own text */}
      <div className="mt-4">
        <span className="text-sm text-neutral-500">Or try an example: </span>
        <span className="inline-flex flex-wrap gap-2 align-middle">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => runExample(ex)}
              disabled={loading}
              className="rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-700 hover:border-neutral-800 hover:text-neutral-900 disabled:opacity-40"
            >
              {ex.label}
            </button>
          ))}
        </span>
      </div>

      {/* Results announced to assistive tech — assertive only for genuine danger. */}
      <div aria-live={result?.scamWarning ? "assertive" : "polite"} aria-atomic="true" className="mt-8">
        {error && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">
            {error}
          </p>
        )}
        {result && <Results result={result} />}
      </div>
    </div>
  );
}

function Results({ result }: { result: AnalysisResult }) {
  return (
    <section aria-label="What I found">
      <h2 className={`text-lg font-semibold ${result.scamWarning ? "text-red-700" : "text-neutral-900"}`}>
        {result.summary}
      </h2>

      {result.flags.length > 0 && (
        <ul className="mt-4 space-y-3">
          {result.flags.map((f) => (
            <FlagCard key={f.categoryId} flag={f} />
          ))}
        </ul>
      )}

      <div className="mt-6 space-y-1 border-t border-neutral-200 pt-4 text-sm text-neutral-500">
        <p>{result.checkedBy}</p>
        <p>{result.disclaimer}</p>
      </div>
    </section>
  );
}

function FlagCard({ flag }: { flag: Flag }) {
  const s = SEV[flag.severity];
  return (
    <li className={`rounded-lg border-l-4 p-4 ${s.cls}`}>
      <p className="flex flex-wrap items-baseline gap-x-2 text-neutral-900">
        <span aria-hidden="true">{s.mark}</span>
        <strong className="text-base">{flag.label}</strong>
        <span className="text-sm text-neutral-600">· {s.word}</span>
        <span className="text-sm text-neutral-500">· {flag.confidence}</span>
        <span className="rounded bg-neutral-200/70 px-1.5 py-0.5 text-xs text-neutral-700">
          lever: {flag.principle}
        </span>
      </p>
      <p className="mt-1.5 text-neutral-800">{flag.why}</p>
      <p className="mt-1 text-xs italic text-neutral-500">Why it works on the mind: {flag.lever}</p>
      {flag.evidence && (
        <p className="mt-1.5 text-sm text-neutral-600">
          Found: <q className="italic">{flag.evidence}</q>
        </p>
      )}
      <p className="mt-1.5 text-neutral-800">
        <strong className="font-medium">What to do:</strong> {flag.whatToDo}
      </p>
      <p className="mt-1.5 text-xs text-neutral-500">Basis: {flag.citation}</p>
    </li>
  );
}

function modifierLabel(): string {
  if (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)) return "⌘";
  return "Ctrl";
}
