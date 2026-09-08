import { PLATFORM_BY_ID } from "./platforms";
import { MECHANISM_BY_ID } from "./mechanisms";
import { EVIDENCE_LABELS, type MetricDefinition, type PlatformId } from "./schema";
import { OBJECTIVE_LABELS, readyBriefInputSchema, type BriefInput, type GeneratedBrief } from "./workspace-schema";

const missing = (what: string) => `[TO FILL — ${what}; do not publish this placeholder]`;

export function metricForInput(input: BriefInput): MetricDefinition {
  const platform = PLATFORM_BY_ID[input.platformId];
  if (input.objective === "surface-response") return { ...platform.metric };
  if (input.objective === "understanding") return {
    name: "Correct task-response rate",
    numerator: "Assessed participants correctly answering the predefined comprehension question, counted once",
    denominator: "All participants assessed with the same question and scoring rule in this variant and window",
    caveat: "Write the question and correct-answer rule before exposure. This is a task study, not native platform analytics. Report recruitment and nonresponse separately; self-selected respondents do not represent all viewers or establish persuasion.",
  };
  const action = input.action.trim() || defaultAction(input.platformId);
  return {
    name: "Useful-action completion rate",
    numerator: `Eligible exposed participants completing this predefined action at least once: ${action}`,
    denominator: "All eligible participants assigned and exposed to this variant, with the same follow-up window and deduplication unit",
    caveat: "Use a controlled task or your own consented measurement setup that can link an exposed unit to the action. Do not divide external conversions by unrelated reach, total views or sessions. If linked eligible counts are unavailable, leave results blank.",
  };
}

function defaultAction(id: PlatformId): string {
  if (id === "marketing-email") return "Open the linked guide and complete its stated task";
  if (id === "marketing-offer") return "Complete the clearly described booking or purchase after reviewing all terms";
  if (id === "google-search" || id === "tiktok-search") return "Use the answer to complete the original search task";
  return "Try the demonstrated task using the supplied reference";
}

function objectiveCta(input: BriefInput): string {
  if (input.objective === "understanding") return "Optional: explain the main answer and one limitation in your own words. Use the same prewritten scoring question for both variants.";
  if (input.objective === "useful-action") return `Optional next step: ${input.action.trim() || defaultAction(input.platformId)}.`;
  const ctas: Record<PlatformId, string> = {
    "instagram-feed": "Save this reference if it will help you try the task later. No demand to comment or tag someone.",
    "tiktok-for-you": "Try the demonstrated step if useful; the complete answer is in this video, not a forced loop.",
    "tiktok-search": "Use the demonstrated answer for your original question; review the stated limitations before trying it.",
    "youtube-home": "Try the demonstrated step; the full instructions and limitations are available without a second video.",
    "youtube-shorts": "Try this check on your next photo or task. The lesson ends with the answer, not a withheld reveal.",
    "google-search": "Use the answer or referenced checklist to finish your task; no forced signup to reveal the basic answer.",
    "marketing-email": "Read the full guide or offer at [TO FILL — accurate CTA destination]. Unsubscribe freely.",
    "marketing-offer": "Review the full price and terms, then choose whether to book or buy at [TO FILL — destination]. Declining is fine.",
  };
  return input.action.trim() ? `Optional next step: ${input.action.trim()}.` : ctas[input.platformId];
}

export function buildBrief(raw: BriefInput): GeneratedBrief {
  const input = readyBriefInputSchema.parse(raw);
  const platform = PLATFORM_BY_ID[input.platformId];
  const mechanism = MECHANISM_BY_ID[input.mechanismId];
  const topic = input.topic.trim();
  const answer = input.takeaway.trim() || missing("the specific answer or benefit you can actually demonstrate");
  const evidence = input.evidenceStatus === "provided" ? `User-supplied, not independently verified:\n${input.evidence.trim()}` : missing("supporting evidence, source and limits are explicitly missing");
  const constraints = input.constraints.trim() || missing("conditions where the answer does not apply");
  const terms = input.terms.trim() || missing("all-in price or explicit free status, inclusions, eligibility, timing, cancellation and renewal terms");
  const cta = objectiveCta(input);
  const proofReady = input.evidenceStatus === "provided" && Boolean(input.verifiedProof.trim());
  const limitReady = input.evidenceStatus === "provided" && Boolean(input.realLimit.trim()) && Boolean(input.limitReason.trim());
  const proof = proofReady ? `Exact user-supplied proof (check permission, attribution, date and scope): ${input.verifiedProof.trim()}` : missing("a real, relevant experience with attribution, permission, date and limitations");
  const limit = limitReady ? input.realLimit.trim() : missing("the actual documented deadline with time zone or capacity limit");
  const reason = limitReady ? input.limitReason.trim() : missing("the factual reason for that same limit");
  const openingLabel = platform.channel === "email" ? "Subject line" : platform.channel === "offer" ? "Hero opening" : platform.channel === "search" ? "Search title" : input.platformId === "youtube-home" ? "Video title" : "Opening line";
  let control = `${topic}: ${answer}`;
  let treatment = `What should you check first for ${topic}?`;
  let variable = `${openingLabel}: direct answer versus specific question`;
  let blocked = false;
  const shared = [
    `Audience: ${input.audience.trim()}; same eligibility, recruitment and observation window where controllable.`,
    `Same topic, factual answer and limits: ${topic}. ${answer}\n${constraints}`,
    "Same content after the changed element, visuals, captions, duration, audio, destination and offer. Do not change title and thumbnail together.",
    `Same CTA: ${cta}`,
    `Same evidence: ${evidence}`,
  ];

  switch (input.mechanismId) {
    case "social-proof":
      variable = "Placement of the same verified evidence block";
      control = `Keep this exact block after the explanation:\n${proof}`;
      treatment = `Move this exact block immediately after the opening:\n${proof}`;
      shared.push(`The opening stays identical: ${topic}: ${answer}`, "Keep attribution and limitations with the proof in both placements. Do not duplicate, rewrite or invent the quote.");
      blocked = !proofReady;
      break;
    case "scarcity":
      variable = "One explanatory sentence about the same genuine limit";
      control = `State the verified limit plainly: ${limit}`;
      treatment = `State the same limit: ${limit}\nAdd only this factual explanation: ${reason}`;
      shared.push(`Disclose the same material terms and limit in both variants: ${terms}\n${limit}`, "Any reason material to an informed decision must already appear in the shared terms. Never omit required information from the control.");
      blocked = !limitReady;
      break;
    case "negative-framing":
      variable = `${openingLabel}: solution-first versus bounded problem-first`;
      control = `${topic}: a practical way forward. ${answer}`;
      treatment = `${topic}: what to check when it is not working. ${answer}`;
      break;
    case "arousal":
      variable = `${openingLabel}: calm versus energetic invitation`;
      control = `An optional exercise in ${topic}: ${answer}`;
      treatment = `Try this ${topic} exercise! ${answer}`;
      break;
    case "moral-emotion":
      variable = `${openingLabel}: factual update versus practical-value frame`;
      control = `${topic} — the update: ${answer}`;
      treatment = `${topic} — what this helps you do: ${answer}`;
      shared.push("General nonpolitical audience only. No sensitive-identity inference, outrage, loyalty test or moralized CTA.");
      break;
  }

  const sections: GeneratedBrief["sections"] = [
    { heading: "Decision to support", body: `Topic / offer: ${topic}\nAudience (your description, not inferred): ${input.audience.trim()}\nObjective: ${OBJECTIVE_LABELS[input.objective]}\nSurface: ${platform.name}\nUseful answer / promise: ${answer}` },
  ];
  if (platform.channel === "social") {
    const rhythm: Record<string, string> = {
      "instagram-feed": "Feed sequence: first image identifies the practical task; following images show the same worked example step by step; final image is a usable reference. Keep the caption, crop, alt text and image sequence fixed when only testing the opening.",
      "tiktok-for-you": "For You video: readable opening; immediate demonstration; show the result and where it fails; optional next step. Keep captions, sound, cuts, pace and duration identical after the opening. This is not Search-ranking guidance.",
      "youtube-home": "Home package: change only the video title when testing an opening frame. Keep the thumbnail fixed and truthful. Video: show the answer early, walk through the example, explain the limit, then the optional next step. Evidence-placement tests need a controlled video study, not a title-only tool.",
      "youtube-shorts": "Shorts sequence: opening line; show the setting or action; compare the same scene or task before and after; explain the limitation; optional next step. Keep the same demonstration, framing, captions, duration, audio and CTA in both versions. Do not delay the answer into a loop.",
    };
    sections.push(
      { heading: `${platform.name} production brief`, body: `${rhythm[input.platformId]}\n\nShared demonstration: ${answer}\nUse your own worked example for ${topic}. Show its starting conditions and the visible result; do not manufacture a before/after.\nLimits: ${constraints}` },
      { heading: "Value delivery & CTA", body: `Deliver the answer before asking for action.\n${cta}\nReadable captions, meaningful image descriptions and a non-flashing presentation are required.` },
    );
  } else if (platform.channel === "search") {
    sections.push(
      { heading: "Search intent & question cluster", body: `Intent hypothesis: ${input.audience.trim()} needs a usable answer about ${topic}, not mystery or a sales detour. Validate this with your own observation.\nPrimary question: How should I approach ${topic}?\nRelated questions: What should I check first? What changes the answer? How can I verify the result? When is this approach not appropriate?\nUse the topic in each question only where it reads naturally. No keyword volume, rank prediction or live competitor data is supplied.` },
      { heading: input.platformId === "google-search" ? "Answer-first page outline" : "Search-answer video outline", body: input.platformId === "google-search"
        ? `Title baseline: ${topic}: ${answer}\n1. Direct answer and who it is for: ${answer}\n2. Original worked example with conditions, method and observed result.\n3. Step-by-step explanation answering the question cluster.\n4. Alternatives and exceptions: ${constraints}\n5. Sources, authorship and a review note you can substantiate.\n6. Optional next action: ${cta}\nKeep a clear page purpose and consistent canonical for actual duplicate URLs. Do not generate thin near-copies. Google may rewrite titles; a before/after title change is observational.`
        : `On-screen question and accurate caption identify ${topic}. Speak and demonstrate the same answer: ${answer}\nShow each step, then exceptions: ${constraints}\nEnd with the complete answer and ${cta}\nKeep query, region, language and observation context fixed where possible. Do not transplant For You guidance into Search or claim an exact keyword weight.` },
      { heading: "Original evidence required", body: `${evidence}\nCreate or cite a directly relevant example, record method and conditions, credit its author, and separate observation from inference. Do not claim search demand from an unverified trend spike.` },
    );
  } else if (platform.channel === "email") {
    sections.push(
      { heading: "Email package", body: `Subject baseline: ${topic}: ${answer}\nShared preview text: A practical explanation of ${topic}, with evidence and limits.\nUse an identifiable sender and permission-based list; keep sender, preview text, send window and body fixed for a subject-line test.` },
      { heading: "Shared email body", body: `Promise: ${answer}\nWho it is for: ${input.audience.trim()}\nExplanation: show the steps or what is included in ${topic}; do not add unsupported outcomes.\nEvidence: ${evidence}\nLimits: ${constraints}\nFull terms: ${terms}\nCTA: ${cta}\nFooter: identify the sender and provide a working, easy unsubscribe. Do not hide terms behind the CTA.` },
    );
  } else {
    sections.push(
      { heading: "Offer page structure", body: `Hero promise: ${topic}: ${answer}\nFit: for ${input.audience.trim()}. State who it is not for using real limitations, not inferred identities.\nWhat is included: ${missing("actual deliverables and what is excluded")}\nEvidence: ${evidence}\nHow it works: show the real steps from decision to delivery.\nConstraints: ${constraints}` },
      { heading: "Terms & informed action", body: `Full terms in both variants: ${terms}\nShow all-in price, availability, eligibility, delivery, cancellation/refund and recurring-payment terms before commitment.\nCTA: ${cta}\nMake comparing, declining and leaving straightforward; no resetting timer, hidden fee or shame.` },
    );
  }
  sections.push(
    { heading: "Evidence & publication checklist", body: `${evidence}\nConstraints: ${constraints}\n${input.mechanismId === "social-proof" ? proof : input.mechanismId === "scarcity" ? `Real limit: ${limit}\nReason: ${reason}` : "Never invent customer counts, testimonials, availability or deadlines."}\nAny bracketed TO FILL item is an unfulfilled requirement. Verify all user-supplied claims before publication. This tool cannot authenticate them.` },
    { heading: "Why this is only a hypothesis", body: mechanism.claims.map((claim) => `${EVIDENCE_LABELS[claim.kind]} — ${claim.text}\nContext: ${claim.context}\nLimits: ${claim.limitations.join(" ")}`).join("\n\n") },
  );

  return {
    input, title: `${topic} — ${platform.name} experiment`, sections,
    experiment: {
      question: mechanism.experiment.question, variable, control, treatment, shared, blocked,
      limitations: [mechanism.experiment.limitations, ...mechanism.tradeoffs, "Only one named element differs; the rest is shared, not a second independently generated piece of content. Editing the draft can invalidate this constraint. Re-check it before use."],
    },
    metric: metricForInput(input),
    guardrails: [...platform.qualityGuardrails, "Define a comprehension or promise-fulfillment check before exposure; record its wording and scoring rule.", "Do not trade trust for a larger primary rate. Stop for misleading claims, consent issues or participant harm, and record that stop without declaring a winner."],
    confounders: [...platform.confounders],
    sourceIds: [...new Set([...mechanism.sourceIds, ...platform.sourceIds])],
  };
}

export const PHOTOGRAPHY_SAMPLE: BriefInput = {
  topic: "Orange indoor portraits",
  audience: "Beginner photographers practising indoor portraits with their own camera",
  platformId: "youtube-shorts", objective: "surface-response", mechanismId: "curiosity-gap",
  takeaway: "Set white balance for the actual light, then compare the same scene.",
  action: "Try a white-balance comparison on your next portrait",
  evidenceStatus: "missing", evidence: "",
  constraints: "Illustrative planning example only. Supply your own same-scene demonstration. Mixed light can need a different approach; do not promise perfect colour in every room.",
  verifiedProof: "", realLimit: "", limitReason: "", terms: "", nonpoliticalConfirmed: true,
};
