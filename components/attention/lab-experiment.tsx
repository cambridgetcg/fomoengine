"use client";

import { compareRawCounts, describeDesign, formatDifference, formatRate, planReadiness } from "@/lib/attention/experiments";
import { rawCountsSchema, type RawCounts } from "@/lib/attention/workspace-schema";
import { useWorkspace } from "./workspace-provider";
import { LabField, LabSectionHeading, labInputClass } from "./lab-ui";

export function LabExperiment() {
  const { state, dispatch } = useWorkspace();
  const { generated, counts, plan } = state.draft;
  if (!generated) return null;
  const countCheck = rawCountsSchema.safeParse(counts);
  const comparison = countCheck.success ? compareRawCounts(counts) : null;
  const readiness = planReadiness(plan);
  const updateCount = (field: keyof RawCounts, value: string) => dispatch({ type: "counts", patch: { [field]: value } });

  return <section id="experiment" className="mt-14 scroll-mt-8">
    <LabSectionHeading number="03" title="Define the test before the numbers.">This is a plan and a manual record, not a traffic allocator. Your metric belongs to the generated brief, even if you later change the input form or edit the Markdown wording.</LabSectionHeading>
    <div className="mb-8 border-l-2 border-[var(--lab-accent,#ac391f)] pl-5">
      <h3 className="text-lg font-semibold">Primary metric: {generated.metric.name}</h3>
      <dl className="mt-3 space-y-3 text-sm leading-relaxed">
        <div><dt className="font-semibold">Numerator — outcomes</dt><dd>{generated.metric.numerator}</dd></div>
        <div><dt className="font-semibold">Denominator — eligible units</dt><dd>{generated.metric.denominator}</dd></div>
      </dl>
      <p className="mt-3 text-sm leading-relaxed text-[#625a50]">{generated.metric.caveat}</p>
      <p className="mt-2 text-sm font-medium">Average watch duration is a separate continuous measure, not an outcome count. Do not enter seconds, percentages, repeat-event totals or guessed exposure counts here.</p>
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      <LabField id="experiment-design" label="Comparison design">
        <select id="experiment-design" className={labInputClass} value={plan.design} onChange={(event) => dispatch({ type: "plan", patch: { design: event.target.value as typeof plan.design } })}>
          <option value="observational">Observational / descriptive</option>
          <option value="randomized">Actually randomized assignment</option>
        </select>
      </LabField>
      <p className="self-end text-sm leading-relaxed text-[#625a50]">{describeDesign(plan.design)}</p>
      <LabField id="experiment-allocation" label={plan.design === "randomized" ? "Actual random-assignment method" : "Observation cohorts & comparison context"} hint="Record what you will actually do. Separate social posts or a before/after title change are observational.">
        <textarea id="experiment-allocation" rows={3} maxLength={2000} className={labInputClass} value={plan.allocation} aria-describedby="experiment-allocation-hint" onChange={(event) => dispatch({ type: "plan", patch: { allocation: event.target.value } })} />
      </LabField>
      <LabField id="experiment-eligibility" label="Eligibility & deduplication" hint="Define one eligible unit, the inclusion rules, and how you avoid counting that unit twice.">
        <textarea id="experiment-eligibility" rows={3} maxLength={2000} className={labInputClass} value={plan.eligibility} aria-describedby="experiment-eligibility-hint" onChange={(event) => dispatch({ type: "plan", patch: { eligibility: event.target.value } })} />
      </LabField>
      <LabField id="experiment-start" label="Observation start date">
        <input id="experiment-start" type="date" className={labInputClass} value={plan.startDate} onChange={(event) => dispatch({ type: "plan", patch: { startDate: event.target.value } })} />
      </LabField>
      <LabField id="experiment-end" label="Observation end date">
        <input id="experiment-end" type="date" className={labInputClass} value={plan.endDate} onChange={(event) => dispatch({ type: "plan", patch: { endDate: event.target.value } })} />
      </LabField>
      <LabField id="experiment-stopping" label="Fixed window & stopping rule" hint="Add the shared time zone and cutoff time. Do not change the window after looking at which rate is higher.">
        <textarea id="experiment-stopping" rows={6} maxLength={2000} className={labInputClass} value={plan.stoppingRule} aria-describedby="experiment-stopping-hint" onChange={(event) => dispatch({ type: "plan", patch: { stoppingRule: event.target.value } })} />
      </LabField>
      <LabField id="experiment-guardrail-plan" label="Quality / trust check & stop condition" hint="Write the same task or feedback question for both groups, the scoring rule, and when misleading claims or harm would stop the experiment.">
        <textarea id="experiment-guardrail-plan" rows={6} maxLength={3000} className={labInputClass} value={plan.guardrailPlan} aria-describedby="experiment-guardrail-plan-hint" onChange={(event) => dispatch({ type: "plan", patch: { guardrailPlan: event.target.value } })} />
      </LabField>
    </div>
    <details className="mt-6 border-y border-[var(--lab-line,#b9b0a2)] py-4">
      <summary className="cursor-pointer text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Surface-specific guardrails & confounders</summary>
      <div className="mt-4 grid gap-6 text-sm leading-relaxed md:grid-cols-2">
        <div><h3 className="font-semibold">Quality & trust</h3><ul className="mt-2 list-disc space-y-2 pl-5">{generated.guardrails.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><h3 className="font-semibold">What else could explain a difference?</h3><ul className="mt-2 list-disc space-y-2 pl-5">{generated.confounders.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </div>
    </details>
    {readiness.length > 0 && <div className="mt-5 text-sm leading-relaxed text-[#625a50]">
      <h3 className="font-semibold text-[var(--lab-ink,#211e19)]">Before exposure, still to define</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5">{readiness.map((item) => <li key={item}>{item}</li>)}</ul>
      <p className="mt-2">You can keep incomplete working notes. A recorded rate does not make an incomplete plan a valid experiment.</p>
    </div>}
    <div className="mt-10">
      <h3 className="text-2xl [font-family:var(--font-editorial,Georgia,serif)]">Record what actually happened.</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#625a50]">Enter nonnegative whole counts from the same metric definition and window. Outcomes cannot exceed eligible units. Leave unavailable data blank; no sample results are supplied.</p>
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        {(["a", "b"] as const).map((group) => <fieldset key={group} className="min-w-0 border border-[var(--lab-line,#b9b0a2)] p-4 sm:p-5">
          <legend className="px-2 text-sm font-semibold">{group === "a" ? "A — control" : "B — treatment"}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["Outcomes", "Eligible"] as const).map((suffix) => {
              const field = `${group}${suffix}` as keyof RawCounts;
              const invalid = !countCheck.success && countCheck.error.issues.some((issue) => issue.path[0] === field);
              return <LabField key={field} id={`result-${field}`} label={`${group.toUpperCase()} ${suffix === "Outcomes" ? "outcomes" : "eligible units"}`}>
                <input id={`result-${field}`} type="text" inputMode="numeric" maxLength={32} className={labInputClass} value={counts[field]} aria-invalid={invalid || undefined} aria-describedby={invalid ? "result-errors" : undefined} onChange={(event) => updateCount(field, event.target.value)} />
              </LabField>;
            })}
          </div>
        </fieldset>)}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="mt-5 text-sm leading-relaxed">
        {!countCheck.success ? <p id="result-errors" className="font-semibold text-[#9b2f1b]">{countCheck.error.issues[0].message}</p> : comparison ? <div data-testid="comparison-results">
          <h4 className="font-semibold">Recorded comparison — descriptive only</h4>
          <dl className="mt-3 space-y-2 font-mono text-sm tabular-nums">
            <div className="flex flex-wrap gap-x-4"><dt>A rate</dt><dd>{formatRate(comparison.aRate)} ({counts.aOutcomes} / {counts.aEligible})</dd></div>
            <div className="flex flex-wrap gap-x-4"><dt>B rate</dt><dd>{formatRate(comparison.bRate)} ({counts.bOutcomes} / {counts.bEligible})</dd></div>
            <div className="flex flex-wrap gap-x-4"><dt>B − A</dt><dd>{formatDifference(comparison.percentagePointDifference, "pp")}</dd></div>
            <div className="flex flex-wrap gap-x-4"><dt>Relative lift vs A</dt><dd>{formatDifference(comparison.relativeLift === null ? null : comparison.relativeLift * 100, "%")}</dd></div>
          </dl>
          <p className="mt-3 text-[#625a50]">Zero denominator: rate and differences are N/A. Zero A baseline: relative lift is N/A. No winner, significance or causal conclusion. Read the quality / trust observations alongside these rates.</p>
        </div> : <p className="text-[#625a50]">No complete comparison yet. Supply all four counts to calculate; blank is unknown, not zero.</p>}
      </div>
      <div className="mt-6"><LabField id="experiment-guardrail-results" label="Observed quality, trust & confounders" hint="Record comprehension, promise fulfillment, complaints or refunds where relevant, and changes in distribution or audience. Keep unavailable measures explicit.">
        <textarea id="experiment-guardrail-results" rows={4} maxLength={4000} className={labInputClass} value={plan.guardrailResults} aria-describedby="experiment-guardrail-results-hint" onChange={(event) => dispatch({ type: "plan", patch: { guardrailResults: event.target.value } })} />
      </LabField></div>
    </div>
  </section>;
}
