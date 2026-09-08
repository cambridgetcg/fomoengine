"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GOOGLE_TRENDS_EXPLORER, MAX_TREND_NOTES, trendNoteSchema, type TrendDraft } from "@/lib/attention/trends";
import { useWorkspace } from "@/components/attention/workspace-provider";
import { LabWorkspaceTools } from "@/components/attention/lab-workspace-tools";
import { LabField, LabSectionHeading, labButtonClass, labInputClass, labLinkClass, labSecondaryClass } from "@/components/attention/lab-ui";

export default function TrendsClient() {
  const { state, dispatch } = useWorkspace();
  const { trendDraft, trendNotes } = state.draft;
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");

  function update(field: keyof TrendDraft, value: string) {
    dispatch({ type: "trend-draft", patch: { [field]: value } });
    setErrors({});
    setStatus("");
  }
  function attach(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trendNotes.length >= MAX_TREND_NOTES) {
      setStatus(`This draft already has ${MAX_TREND_NOTES} notes. Remove one before attaching another; your working note is preserved.`);
      return;
    }
    const checked = trendNoteSchema.safeParse(trendDraft);
    if (!checked.success) {
      const next: Record<string, string> = {};
      for (const issue of checked.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      setStatus("Check the marked fields. The note was not attached and your active brief is unchanged.");
      document.getElementById(`trend-${String(checked.error.issues[0].path[0])}`)?.focus();
      return;
    }
    dispatch({ type: "attach-trend", note: checked.data });
    router.push("/lab");
  }
  function applyTopic(term: string) {
    if (state.draft.input.topic && state.draft.input.topic !== term && !window.confirm("Use this note's term as the Lab topic? The existing edited brief and results will stay until you explicitly regenerate.")) return;
    dispatch({ type: "input", patch: { topic: term } });
    router.push("/lab");
  }
  function fieldError(field: keyof TrendDraft) { return errors[field] && <p id={`trend-${field}-error`} className="text-sm font-semibold text-[#9b2f1b]">{errors[field]}</p>; }
  function validation(field: keyof TrendDraft) { return { "aria-invalid": Boolean(errors[field]) || undefined, "aria-describedby": errors[field] ? `trend-${field}-error` : `trend-${field}-hint` }; }

  return <main className="attention-page bg-[var(--lab-paper,#f4efe5)] text-[var(--lab-ink,#211e19)]">
    <div className="attention-container pb-16">
      <header className="attention-page-header">
        <p className="attention-kicker">04 / Observe demand</p>
        <h1 className="attention-title">A trend is a question.<br /><em>Keep the context.</em></h1>
        <div className="attention-header-columns">
          <p className="attention-lead">A manual research notebook for the observations that might change what you make next.</p>
          <p>No live feed, crawler, connector or volume estimate. Record what you actually saw, where you saw it and what you compared. Bring that bounded hypothesis into the <Link href="/lab" className={labLinkClass}>same Lab draft</Link>.</p>
        </div>
      </header>

      <section aria-labelledby="trends-reading-title" className="grid gap-6 border-y border-[var(--lab-ink,#211e19)] py-6 lg:grid-cols-[1.2fr_1fr]">
        <div><p className="mb-2 font-mono text-xs uppercase tracking-widest text-[var(--lab-accent,#ac391f)]">Before you read the spike</p><h2 id="trends-reading-title" className="text-2xl [font-family:var(--font-editorial,Georgia,serif)]">Relative interest is not search volume.</h2><p className="mt-3 text-sm leading-relaxed">Google Trends uses sampled data normalized to a 0–100 scale within the selected request. 100 is a relative peak, not a count of searches or a percentage of everyone. A zero may reflect insufficient data; it does not prove no interest.</p><p className="mt-3 text-sm leading-relaxed text-[#625a50]">Do not calculate lift across incompatible exports. Region, time window, category, term versus topic, search type and comparison set matter. A spike does not identify its cause or predict a commercial outcome.</p></div>
        <div className="flex flex-col items-start justify-between gap-4 border-l-2 border-[var(--lab-accent,#ac391f)] pl-5"><p className="text-sm leading-relaxed">Open the explorer only when you choose. It is an external service with its own privacy policy. This app does not fetch results or send your note or brief to Google.</p><a href={GOOGLE_TRENDS_EXPLORER} target="_blank" rel="noopener noreferrer" className={labSecondaryClass}>Open Google Trends explorer <span aria-hidden="true">↗</span><span className="sr-only"> (external, new tab)</span></a><Link href="/sources#google-trends-faq" className={`${labLinkClass} text-sm`}>Read the source & access limits</Link></div>
      </section>

      <LabWorkspaceTools />
      <section>
        <LabSectionHeading number="01" title="Write a reproducible observation.">All fields are required for attachment. Record metadata and your observation, not private records. The unfinished form stays in session memory when you navigate between Lab and Trends.</LabSectionHeading>
        <form onSubmit={attach} noValidate className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2"><LabField id="trend-sourceUrl" label="Source URL (required)" hint="A complete http:// or https:// link without embedded login credentials. A link is context, not independent verification.">
              <input id="trend-sourceUrl" type="url" maxLength={2048} required className={labInputClass} value={trendDraft.sourceUrl} placeholder="https://trends.google.com/trends/explore" {...validation("sourceUrl")} onChange={(event) => update("sourceUrl", event.target.value)} />{fieldError("sourceUrl")}
            </LabField></div>
            <LabField id="trend-term" label="Term / topic (required)" hint="State whether you selected an exact search term or a Google Trends topic.">
              <input id="trend-term" maxLength={200} required className={labInputClass} value={trendDraft.term} {...validation("term")} onChange={(event) => update("term", event.target.value)} placeholder="e.g. indoor portrait photography — search term" />{fieldError("term")}
            </LabField>
            <LabField id="trend-geography" label="Geography (required)" hint="Use the actual selected country, region or Worldwide; do not infer who searched.">
              <input id="trend-geography" maxLength={120} required className={labInputClass} value={trendDraft.geography} {...validation("geography")} onChange={(event) => update("geography", event.target.value)} placeholder="e.g. United Kingdom" />{fieldError("geography")}
            </LabField>
            <LabField id="trend-startDate" label="Date range — start (required)" hint="The source's selected observation range, not a forecast.">
              <input id="trend-startDate" type="date" required className={labInputClass} value={trendDraft.startDate} {...validation("startDate")} onChange={(event) => update("startDate", event.target.value)} />{fieldError("startDate")}
            </LabField>
            <LabField id="trend-endDate" label="Date range — end (required)" hint="Must be a real date on or after the start.">
              <input id="trend-endDate" type="date" required className={labInputClass} value={trendDraft.endDate} {...validation("endDate")} onChange={(event) => update("endDate", event.target.value)} />{fieldError("endDate")}
            </LabField>
            <LabField id="trend-searchSurface" label="Search surface / type (required)" hint="For example Web Search, YouTube Search or News Search. These are different scopes.">
              <input id="trend-searchSurface" maxLength={120} required className={labInputClass} value={trendDraft.searchSurface} {...validation("searchSurface")} onChange={(event) => update("searchSurface", event.target.value)} placeholder="e.g. YouTube Search" />{fieldError("searchSurface")}
            </LabField>
            <LabField id="trend-comparison" label="Comparison context (required)" hint="Other terms, category, same-request scope, and when you inspected it. If there is no comparator, say so.">
              <textarea id="trend-comparison" rows={3} maxLength={1200} required className={labInputClass} value={trendDraft.comparison} {...validation("comparison")} onChange={(event) => update("comparison", event.target.value)} />{fieldError("comparison")}
            </LabField>
            <div className="md:col-span-2"><LabField id="trend-observation" label="What you observed & what remains unknown (required)" hint="Separate the visible pattern from a possible explanation. Record no observation you did not actually make.">
              <textarea id="trend-observation" rows={5} maxLength={3000} required className={labInputClass} value={trendDraft.observation} {...validation("observation")} onChange={(event) => update("observation", event.target.value)} />{fieldError("observation")}
            </LabField></div>
          </div>
          <div className="flex flex-wrap items-center gap-4"><button type="submit" className={labButtonClass}>Attach note & open Lab <span aria-hidden="true">↗</span></button><p className="max-w-lg text-xs leading-relaxed text-[#625a50]">Attaches to the same draft without replacing your topic, edited brief or results. No automatic device save.</p></div>
          <p role="status" aria-live="polite" aria-atomic="true" className="min-h-5 text-sm leading-relaxed">{status}</p>
        </form>
      </section>

      <section className="mt-12">
        <LabSectionHeading number="02" title="Attached to this draft.">Up to {MAX_TREND_NOTES} notes, kept with the editable brief and included in its exports. Active topic: {state.draft.input.topic || "not chosen yet"}.</LabSectionHeading>
        {trendNotes.length === 0 ? <div className="border border-dashed border-[var(--lab-line,#b9b0a2)] p-8 text-sm text-[#625a50]">No notes attached yet. There is no simulated trend feed — your first observation goes here.</div> : <ol className="space-y-5">{trendNotes.map((note, index) => <li key={index} className="border border-[var(--lab-line,#b9b0a2)] bg-white/30 p-5 sm:p-6">
          <p className="font-mono text-xs text-[var(--lab-accent,#ac391f)]">Note {String(index + 1).padStart(2, "0")} / user supplied</p><h3 className="mt-2 break-words text-xl [font-family:var(--font-editorial,Georgia,serif)]">{note.term}</h3>
          <p className="mt-2 text-sm text-[#625a50]">{note.geography} · {note.startDate} to {note.endDate} · {note.searchSurface}</p>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">{note.observation}</p>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#625a50]">Comparison: {note.comparison}</p>
          <a href={note.sourceUrl} target="_blank" rel="noopener noreferrer" className={`${labLinkClass} mt-3 inline-block break-all text-sm`}>{note.sourceUrl}<span className="sr-only"> (external, new tab)</span></a>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" className={labSecondaryClass} onClick={() => applyTopic(note.term)}>Use this term as Lab topic</button><button type="button" className={labSecondaryClass} aria-label={`Remove note ${index + 1}: ${note.term}`} onClick={() => {
            if (!window.confirm("Remove this note from the active draft? Any saved device copy is unchanged until you save again.")) return;
            dispatch({ type: "remove-trend", index });
            setStatus("Note removed from the active draft. No saved device copy was changed.");
          }}>Remove note</button></div>
        </li>)}</ol>}
      </section>
    </div>
  </main>;
}
