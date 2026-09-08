"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { buildBrief, PHOTOGRAPHY_SAMPLE } from "@/lib/attention/brief";
import { MECHANISMS, MECHANISM_BY_ID } from "@/lib/attention/mechanisms";
import { PLATFORMS, PLATFORM_BY_ID } from "@/lib/attention/platforms";
import { readCataloguePrefill } from "@/lib/attention/workspace";
import { MAX_MARKDOWN_LENGTH, OBJECTIVE_IDS, OBJECTIVE_LABELS, readyBriefInputSchema, type BriefInput } from "@/lib/attention/workspace-schema";
import { useWorkspace } from "@/components/attention/workspace-provider";
import { LabWorkspaceTools } from "@/components/attention/lab-workspace-tools";
import { LabExperiment } from "@/components/attention/lab-experiment";
import { LabField, LabSectionHeading, labButtonClass, labInputClass, labLinkClass, labSecondaryClass } from "@/components/attention/lab-ui";

export default function LabClient() {
  const { state, dispatch } = useWorkspace();
  const { input, generated, markdown, trendNotes } = state.draft;
  const params = useSearchParams();
  const { mechanismId, platformId } = readCataloguePrefill(params);
  const prefillKey = `${mechanismId ?? ""}/${platformId ?? ""}`;
  const [dismissedPrefill, setDismissedPrefill] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const compatible = MECHANISM_BY_ID[input.mechanismId].compatiblePlatformIds.includes(input.platformId);
  const stale = generated && JSON.stringify(input) !== JSON.stringify(generated.input);
  const pendingPrefill = state.touched && dismissedPrefill !== prefillKey && ((mechanismId && mechanismId !== input.mechanismId) || (platformId && platformId !== input.platformId));

  useEffect(() => {
    if (!state.touched && (mechanismId || platformId)) {
      dispatch({ type: "prefill", prefill: { ...(mechanismId ? { mechanismId } : {}), ...(platformId ? { platformId } : {}) } });
    }
  }, [dispatch, state.touched, mechanismId, platformId]);

  function update<K extends keyof BriefInput>(field: K, value: BriefInput[K]) {
    dispatch({ type: "input", patch: { [field]: value } });
    setErrors({});
    setStatus("");
  }
  function focusBrief() { window.requestAnimationFrame(() => document.getElementById("brief-heading")?.focus()); }
  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checked = readyBriefInputSchema.safeParse(input);
    if (!checked.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of checked.error.issues) nextErrors[String(issue.path[0])] ??= issue.message;
      setErrors(nextErrors);
      setStatus("The brief needs a few details. Check the marked fields; your existing draft is unchanged.");
      document.getElementById(`lab-${String(checked.error.issues[0].path[0])}`)?.focus();
      return;
    }
    if (generated && !window.confirm("Regenerate from the current inputs? This replaces your edited brief and clears the recorded outcome counts and quality observations. Attached trend notes and the test plan stay in place.")) return;
    dispatch({ type: "generate", brief: buildBrief(checked.data) });
    setErrors({});
    setStatus("Brief generated locally. Review the evidence requirements, edit the Markdown, and define the observation plan before use.");
    focusBrief();
  }
  function sample() {
    if (state.touched && !window.confirm("Replace the current inputs and edited brief with the illustrative photography example and clear recorded results? Your attached trend notes and test plan will stay.")) return;
    dispatch({ type: "input", patch: { ...PHOTOGRAPHY_SAMPLE } });
    dispatch({ type: "generate", brief: buildBrief({ ...PHOTOGRAPHY_SAMPLE }) });
    setErrors({});
    setStatus("Illustrative photography brief loaded. No performance data or verified demonstration is supplied; replace the example with your own evidence.");
    focusBrief();
  }
  function validation(field: keyof BriefInput) {
    return { "aria-invalid": Boolean(errors[field]) || undefined, "aria-describedby": errors[field] ? `lab-${field}-error` : `lab-${field}-hint` };
  }
  function error(field: keyof BriefInput) {
    return errors[field] && <p id={`lab-${field}-error`} className="text-sm font-semibold text-[#9b2f1b]">{errors[field]}</p>;
  }

  return <main className="attention-page bg-[var(--lab-paper,#f4efe5)] text-[var(--lab-ink,#211e19)]">
    <div className="attention-container pb-16">
      <header className="attention-page-header">
        <p className="attention-kicker">03 / Apply & test</p>
        <h1 className="attention-title">Make the promise.<br /><em>Test the difference.</em></h1>
        <div className="attention-header-columns">
          <p className="attention-lead">An editable strategy, a single changed variable, and a record of what really happened.</p>
          <p>Deterministic, research-informed templates — not AI analysis or a growth forecast. No account, provider call or publishing connection. <Link href="/methodology" className={labLinkClass}>Read the limits</Link>.</p>
        </div>
      </header>

      <div className="grid gap-5 border-y border-[var(--lab-line,#b9b0a2)] py-6 md:grid-cols-[1fr_auto] md:items-center">
        <div><p className="mb-1 font-mono text-xs uppercase tracking-widest text-[var(--lab-accent,#ac391f)]">A concrete starting point</p><h2 className="!text-xl [font-family:var(--font-editorial,Georgia,serif)]">The same photography lesson. Two honest openings.</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#625a50]">Curiosity gap × YouTube Shorts. A direct white-balance answer versus a specific question; the demonstration and CTA stay the same. Illustrative brief, not observed results.</p></div>
        <button type="button" onClick={sample} className={labSecondaryClass}>Try the photography brief <span aria-hidden="true">↗</span></button>
      </div>

      {pendingPrefill && <section aria-label="Requested catalogue selections" className="mt-6 border-l-2 border-[var(--lab-accent,#ac391f)] bg-white/40 p-5">
        <h2 className="!text-base !font-semibold !tracking-normal">Keep your work, or apply the linked selections.</h2>
        <p className="mt-2 text-sm leading-relaxed">This link requests {mechanismId ? MECHANISM_BY_ID[mechanismId].name : "your existing mechanism"} / {platformId ? PLATFORM_BY_ID[platformId].name : "a compatible surface"}. Your active draft was not replaced.</p>
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" className={labSecondaryClass} onClick={() => {
          dispatch({ type: "prefill", confirmed: true, prefill: { ...(mechanismId ? { mechanismId } : {}), ...(platformId ? { platformId } : {}) } });
          setDismissedPrefill(prefillKey);
          setStatus("Linked catalogue selections applied. Text, edited brief, notes and counts are preserved; regenerate deliberately if needed.");
        }}>Apply linked selections</button><button type="button" className={labSecondaryClass} onClick={() => setDismissedPrefill(prefillKey)}>Keep current selections</button></div>
      </section>}

      <LabWorkspaceTools />
      {trendNotes.length > 0 && <aside className="mb-8 border-l-2 border-[var(--lab-accent,#ac391f)] pl-5 text-sm leading-relaxed" aria-label="Attached research context">
        <p><strong>Manual research attached.</strong> Latest note: {trendNotes[trendNotes.length - 1].term}. Treat it as a topic hypothesis, not evidence of demand.</p>
        <div className="mt-3 flex flex-wrap items-center gap-4"><a href="#lab-trend-notes" className={labLinkClass}>Read attached notes</a><button type="button" className={labSecondaryClass} onClick={() => {
          const term = trendNotes[trendNotes.length - 1].term;
          if (input.topic && input.topic !== term && !window.confirm("Use the latest note's term as the topic? The edited brief and results remain unchanged until you regenerate.")) return;
          update("topic", term);
          document.getElementById("lab-topic")?.focus();
        }}>Use latest note as topic</button></div>
      </aside>}
      <section>
        <LabSectionHeading number="01" title="Start with what you can stand behind.">Topic, audience and an objective are required. Supply evidence or mark it missing. A source motivates a hypothesis; it does not authenticate your claims.</LabSectionHeading>
        <form onSubmit={generate} noValidate className="space-y-7">
          <div className="grid gap-6 md:grid-cols-2">
            <LabField id="lab-topic" label="Topic / offer (required)" hint="Name your lesson, product or service. Do not paste private customer records.">
              <input id="lab-topic" required className={labInputClass} value={input.topic} maxLength={200} {...validation("topic")} onChange={(event) => update("topic", event.target.value)} placeholder="e.g. Orange indoor portraits" />{error("topic")}
            </LabField>
            <LabField id="lab-audience" label="Audience (required)" hint="Describe a practical need in your own words. No inferred identity, sensitive profiling or political targeting.">
              <input id="lab-audience" required className={labInputClass} value={input.audience} maxLength={600} {...validation("audience")} onChange={(event) => update("audience", event.target.value)} placeholder="e.g. Beginners learning indoor photography" />{error("audience")}
            </LabField>
            <LabField id="lab-platformId" label="Channel / surface" hint="A surface is not interchangeable with a whole platform.">
              <select id="lab-platformId" className={labInputClass} value={input.platformId} {...validation("platformId")} onChange={(event) => update("platformId", event.target.value as BriefInput["platformId"])}>{PLATFORMS.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}{platform.kind === "strategy-channel" ? " — strategy channel" : ""}</option>)}</select>{error("platformId")}
            </LabField>
            <LabField id="lab-objective" label="Objective" hint="This changes the CTA and primary metric, including the actual denominator you need.">
              <select id="lab-objective" className={labInputClass} value={input.objective} {...validation("objective")} onChange={(event) => update("objective", event.target.value as BriefInput["objective"])}>{OBJECTIVE_IDS.map((id) => <option key={id} value={id}>{OBJECTIVE_LABELS[id]}</option>)}</select>{error("objective")}
            </LabField>
            <LabField id="lab-mechanismId" label="Mechanism" hint="Compatibility means a bounded template is available — not a proven effect on this surface.">
              <select id="lab-mechanismId" className={labInputClass} value={input.mechanismId} {...validation("mechanismId")} onChange={(event) => update("mechanismId", event.target.value as BriefInput["mechanismId"])}>{MECHANISMS.map((mechanism) => <option key={mechanism.id} value={mechanism.id}>{mechanism.name}{!mechanism.compatiblePlatformIds.includes(input.platformId) ? " — no template for this surface" : ""}</option>)}</select>{error("mechanismId")}
            </LabField>
            <div className="self-center text-sm leading-relaxed text-[#625a50]"><p>{MECHANISM_BY_ID[input.mechanismId].summary}</p><Link className={`${labLinkClass} mt-2 inline-block`} href={`/atlas/${input.mechanismId}`}>Read this mechanism&apos;s evidence & limits</Link>{!compatible && <p className="mt-2 font-semibold text-[#9b2f1b]">Choose a compatible mechanism or surface before generating. Your other inputs will stay.</p>}</div>
            <LabField id="lab-takeaway" label="Specific answer / honest promise" hint="What can you actually demonstrate? Leave blank only to keep a visible TO FILL requirement.">
              <textarea id="lab-takeaway" rows={3} className={labInputClass} value={input.takeaway} maxLength={1000} aria-describedby="lab-takeaway-hint" onChange={(event) => update("takeaway", event.target.value)} />
            </LabField>
            <LabField id="lab-action" label="Useful next action (optional)" hint="One voluntary, concrete next step. If blank, the channel supplies a planning suggestion to review.">
              <textarea id="lab-action" rows={3} className={labInputClass} value={input.action} maxLength={300} aria-describedby="lab-action-hint" onChange={(event) => update("action", event.target.value)} />
            </LabField>
          </div>
          <fieldset className="min-w-0 border border-[var(--lab-line,#b9b0a2)] p-5 sm:p-6">
            <legend className="px-2 text-base font-semibold">Evidence, not atmosphere</legend>
            <div className="grid gap-6 md:grid-cols-2">
              <LabField id="lab-evidenceStatus" label="Evidence status" hint="Supplied evidence is still your claim; this browser tool does not verify it.">
                <select id="lab-evidenceStatus" className={labInputClass} value={input.evidenceStatus} aria-describedby="lab-evidenceStatus-hint" onChange={(event) => update("evidenceStatus", event.target.value as BriefInput["evidenceStatus"])}><option value="missing">Missing — keep explicit evidence requirements</option><option value="provided">I am supplying evidence and its source</option></select>
              </LabField>
              <LabField id="lab-constraints" label="Limitations / conditions" hint="Where might the answer fail? What cannot you substantiate? Blank remains a visible requirement.">
                <textarea id="lab-constraints" rows={3} className={labInputClass} value={input.constraints} maxLength={2000} aria-describedby="lab-constraints-hint" onChange={(event) => update("constraints", event.target.value)} />
              </LabField>
              {input.evidenceStatus === "provided" && <div className="md:col-span-2"><LabField id="lab-evidence" label="Evidence & source (required when supplied)" hint="Record your demonstration, source, method, date and limits. Do not claim a sample or testimonial this tool invented.">
                <textarea id="lab-evidence" required rows={4} className={labInputClass} value={input.evidence} maxLength={4000} {...validation("evidence")} onChange={(event) => update("evidence", event.target.value)} />{error("evidence")}
              </LabField></div>}
              {input.mechanismId === "social-proof" && <div className="md:col-span-2"><LabField id="lab-verifiedProof" label="Actual experience / testimonial & permission" hint="Exact words or example, attribution, consent, date, scope and relevant limitations. Missing proof blocks the treatment; never invent it.">
                <textarea id="lab-verifiedProof" rows={4} className={labInputClass} value={input.verifiedProof} maxLength={2000} aria-describedby="lab-verifiedProof-hint" onChange={(event) => update("verifiedProof", event.target.value)} />
              </LabField></div>}
              {input.mechanismId === "scarcity" && <>
                <LabField id="lab-realLimit" label="Genuine deadline / capacity limit" hint="Supply the actual scope, date and time zone or count. No verified limit means no scarcity treatment."><textarea id="lab-realLimit" rows={3} className={labInputClass} value={input.realLimit} maxLength={500} aria-describedby="lab-realLimit-hint" onChange={(event) => update("realLimit", event.target.value)} /></LabField>
                <LabField id="lab-limitReason" label="Factual reason for this same limit" hint="The treatment adds this explanation. All material terms remain visible in both variants."><textarea id="lab-limitReason" rows={3} className={labInputClass} value={input.limitReason} maxLength={500} aria-describedby="lab-limitReason-hint" onChange={(event) => update("limitReason", event.target.value)} /></LabField>
              </>}
              {(PLATFORM_BY_ID[input.platformId].kind === "strategy-channel" || input.mechanismId === "scarcity") && <div className="md:col-span-2"><LabField id="lab-terms" label="Complete offer terms" hint="All-in price or explicit free status, inclusions, eligibility, timing, cancellation/refunds and any renewal. Missing terms stay visibly unfilled."><textarea id="lab-terms" rows={4} className={labInputClass} value={input.terms} maxLength={2000} aria-describedby="lab-terms-hint" onChange={(event) => update("terms", event.target.value)} /></LabField></div>}
            </div>
          </fieldset>
          <div><label htmlFor="lab-nonpoliticalConfirmed" className="flex max-w-3xl cursor-pointer items-start gap-3 text-sm leading-relaxed"><input id="lab-nonpoliticalConfirmed" required type="checkbox" checked={input.nonpoliticalConfirmed} onChange={(event) => update("nonpoliticalConfirmed", event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#ac391f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" aria-invalid={Boolean(errors.nonpoliticalConfirmed) || undefined} aria-describedby={errors.nonpoliticalConfirmed ? "lab-nonpoliticalConfirmed-error" : undefined} /><span>This is an educational or commercial brief, without political targeting, sensitive-identity inference, fabricated proof or manufactured urgency.</span></label>{error("nonpoliticalConfirmed")}</div>
          <div className="flex flex-wrap items-center gap-4"><button type="submit" className={labButtonClass}>{generated ? "Regenerate brief" : "Generate brief"} <span aria-hidden="true">↗</span></button><p className="text-xs text-[#625a50]">Built in your browser. Nothing is sent or published.</p></div>
          <p role="status" aria-live="polite" aria-atomic="true" className="min-h-5 text-sm leading-relaxed">{status}</p>
        </form>
      </section>

      <section id="brief" className="mt-14 scroll-mt-8">
        <LabSectionHeading number="02" title="An editable brief. Not an oracle.">The template proposes a specific comparison and its evidence boundaries. Your edits are literal text, never executed or rendered as HTML.</LabSectionHeading>
        {!generated ? <div className="border border-dashed border-[var(--lab-line,#b9b0a2)] p-8 text-sm leading-relaxed text-[#625a50]"><h3 className="mb-2 text-lg font-semibold text-[var(--lab-ink,#211e19)]">Your brief starts here.</h3><p>Complete the fields above, or try the photography example. There are no preloaded performance numbers.</p></div> : <>
          <h3 id="brief-heading" tabIndex={-1} className="mb-4 break-words text-xl font-semibold focus:outline-none">{generated.title}</h3>
          {stale && <p role="status" className="mb-5 border-l-2 border-[var(--lab-accent,#ac391f)] pl-4 text-sm leading-relaxed"><strong>Inputs changed.</strong> This edited brief and its metric still belong to the previous generated inputs. Nothing was overwritten. Regenerate deliberately to replace the brief and clear old results.</p>}
          {generated.experiment.blocked && <p className="mb-5 border border-[#ac391f] p-4 text-sm leading-relaxed"><strong>Treatment not ready.</strong> Supply the missing real proof or genuine constraint and its evidence before running or publishing this comparison. Placeholder text is not a factual claim.</p>}
          <p className="mb-3 text-sm"><strong>Changed variable:</strong> {generated.experiment.variable}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {([["A — control", generated.experiment.control], ["B — treatment", generated.experiment.treatment]] as const).map(([label, text]) => <div key={label} className="min-w-0 border border-[var(--lab-line,#b9b0a2)] bg-white/40 p-5"><h4 className="mb-3 font-mono text-xs uppercase tracking-widest text-[var(--lab-accent,#ac391f)]">{label}</h4><p className="whitespace-pre-wrap break-words text-lg leading-relaxed [font-family:var(--font-editorial,Georgia,serif)]">{text}</p></div>)}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[#625a50]">This pair is the generated reference, not a live preview of your edits. Shared body, evidence, visuals and CTA are specified in the editable brief below. Re-check the one-variable constraint after editing.</p>
          <div className="mt-6"><LabField id="lab-markdown" label="Edited brief (Markdown)" hint="Edit freely. Copy/Download Markdown includes this exact text plus the current measurement record and attached notes. JSON preserves the whole workspace."><textarea id="lab-markdown" rows={24} maxLength={MAX_MARKDOWN_LENGTH} spellCheck={false} className={`${labInputClass} font-mono text-sm`} value={markdown} aria-describedby="lab-markdown-hint" onChange={(event) => dispatch({ type: "markdown", text: event.target.value })} /></LabField></div>
        </>}
      </section>

      <LabExperiment />
      <section id="lab-trend-notes" className="mt-14 scroll-mt-8">
        <LabSectionHeading number="04" title="Demand context, with the context left in.">Manual observations travel with this active draft and its exports. They are topic hypotheses, not proof of volume, causation or a likely result.</LabSectionHeading>
        {trendNotes.length === 0 ? <p className="text-sm text-[#625a50]">No trend notes attached. <Link className={labLinkClass} href="/trends">Add a manual research note</Link> without replacing your brief.</p> : <><ul className="space-y-4">{trendNotes.map((note, index) => <li key={index} className="border border-[var(--lab-line,#b9b0a2)] p-5"><h3 className="break-words font-semibold">{note.term}</h3><p className="mt-1 text-xs text-[#625a50]">{note.geography} · {note.startDate} to {note.endDate} · {note.searchSurface}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm">{note.observation}</p><p className="mt-2 break-words text-sm text-[#625a50]">Comparison: {note.comparison}</p><a className={`${labLinkClass} mt-3 inline-block text-sm`} href={note.sourceUrl} target="_blank" rel="noopener noreferrer">Open supplied source <span className="sr-only">(new tab)</span><span aria-hidden="true">↗</span></a></li>)}</ul><Link className={`${labLinkClass} mt-4 inline-block text-sm`} href="/trends">Add or manage trend notes</Link></>}
      </section>
    </div>
  </main>;
}
