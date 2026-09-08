import type { Mechanism, MechanismId } from "./schema";

// compatiblePlatformIds 係可設計嘅研究入口，唔係已證實有效嘅平台清單。
export const MECHANISMS: readonly Mechanism[] = [
  {
    id: "curiosity-gap",
    name: "Curiosity gap",
    summary: "Make a specific missing answer worth finding, then deliver it. Withholding more information is not automatically better.",
    emotion: "Interest or unresolved uncertainty; these are possible responses, not emotions this app can detect.",
    howItWorks: [
      "A concrete question can make the distance between what a reader knows and wants to know visible.",
      "Too little context can make the promise impossible to evaluate. Revealing enough to establish relevance may matter more than being mysterious.",
      "Treat the hook as a contract: the content must supply the promised answer without a bait-and-switch.",
    ],
    example: {
      honest: "Why do indoor portraits look orange? Here is the white-balance setting to check.",
      pressure: "Photographers are hiding this unbelievable secret. You will regret not watching.",
      distinction: "The honest version names a useful question and an answer the lesson must actually contain. The pressure version substitutes secrecy and regret for a checkable promise. These are illustrative copy examples, not performance data.",
    },
    claims: [
      {
        id: "curiosity-headline-tests",
        text: "Headline concreteness has been studied using online tests of alternative headlines. The evidence does not justify a rule that a larger curiosity gap always attracts more clicks.",
        kind: "experimental",
        sourceIds: ["curiosity-2025"],
        context: "Online headline selection in the source's publisher and audience context.",
        limitations: [
          "Random assignment compares whole headline alternatives; it does not independently isolate a word attribute such as concreteness.",
          "Relationships between headline features and performance require additional assumptions and do not identify a universal optimum.",
          "A click does not establish satisfaction, learning, purchase intent or effects on short-form video.",
        ],
      },
      {
        id: "curiosity-specific-question-hypothesis",
        text: "For a useful tutorial, a specific answerable question may improve selection without reducing satisfaction compared with giving the answer immediately. Test both rather than assume the question wins.",
        kind: "hypothesis",
        sourceIds: ["curiosity-2025"],
        context: "An editorial experiment proposed by this lab, not a published result for your content.",
        limitations: [
          "The cited study motivates the question; it does not validate this template or your audience's response.",
          "The answer, evidence and CTA must remain the same in both variants.",
        ],
      },
    ],
    honestUse: [
      "Name the object, question and useful payoff so people can decide whether it is relevant.",
      "Give the promised answer promptly and make the content useful even when the title has already revealed it.",
      "For search, keep the query's meaning clear; do not hide the topic to manufacture suspense.",
    ],
    countermeasure: "Ask what concrete question the headline promises to answer. If the promise cannot be named, skip the mystery; if you open it, check whether the answer actually arrives.",
    tradeoffs: [
      "A question may attract the wrong audience or annoy people who needed a quick answer.",
      "A higher selection rate can coexist with lower completion, helpfulness or trust.",
      "An explicit answer can outperform suspense when the intent is urgent or practical.",
    ],
    experiment: {
      question: "Does a specific question change selection compared with a direct answer, while preserving useful delivery?",
      variable: "Opening frame: direct answer versus specific question",
      control: "State the useful answer in the opening line.",
      treatment: "Ask one concrete question answered by the same content.",
      holdConstant: ["Topic and factual answer", "Body or video after the opening", "Visuals, length and CTA", "Eligible audience and observation window where controllable"],
      readout: "Use the selected surface's rate and denominator; inspect completion and promise-fulfillment feedback before considering the change useful.",
      limitations: "Separate social posts or before/after search observations are descriptive, not randomized causal tests. Changing the title and thumbnail together tests a package, not only the question.",
    },
    compatiblePlatformIds: ["instagram-feed", "tiktok-for-you", "tiktok-search", "youtube-home", "youtube-shorts", "google-search", "marketing-email", "marketing-offer"],
    sourceIds: ["curiosity-2025"],
  },
  {
    id: "social-proof",
    name: "Social proof",
    summary: "Other people's choices can become information about what to choose. Popularity is not proof of quality or fit.",
    emotion: "Reassurance, belonging or worry about being left out; no response is universal.",
    howItWorks: [
      "When quality is hard to assess, visible choices or experiences can become a shortcut for judging an unfamiliar option.",
      "Exposure and imitation can reinforce one another, making popular outcomes difficult to separate from intrinsic quality.",
      "A useful testimonial provides context and limits; an unexplained count only tells you that something was counted.",
    ],
    example: {
      honest: "[Verified customer quote about this exact use case, with permission, date and relevant limitation].",
      pressure: "Everyone is switching. Join the crowd before you fall behind.",
      distinction: "The honest version is an intentionally unfilled evidence slot, not an invented testimonial. Its source, scope and permission must be supplied before publication; the pressure version asks the crowd to replace your judgment.",
    },
    claims: [
      {
        id: "social-proof-music-market",
        text: "In an artificial music-market experiment, access to others' choices increased inequality and unpredictability in which songs succeeded.",
        kind: "experimental",
        sourceIds: ["social-influence-2006"],
        context: "Music discovery and downloads under experimentally varied social-information conditions.",
        limitations: [
          "This is not an experiment on ecommerce testimonials, newsletter signup badges or today's recommendation systems.",
          "Aggregate changes do not guarantee a benefit for any particular song, product or creator.",
          "A popularity count does not establish product quality or a customer's likely outcome.",
        ],
      },
      {
        id: "social-proof-context-hypothesis",
        text: "A specific, verifiable experience may help people assess fit better than a context-free popularity claim. That is a useful local hypothesis, not a proven conversion lift.",
        kind: "hypothesis",
        sourceIds: ["social-influence-2006"],
        context: "A proposed nonpolitical product or educational-content experiment.",
        limitations: [
          "Use only real user-supplied evidence with permission; missing proof stays visibly unfilled.",
          "A successful test of presenting evidence would not prove that the testimonial's experience generalizes.",
        ],
      },
    ],
    honestUse: [
      "Use attributable experiences with permission and describe the use case, date and relevant limits.",
      "Explain what a count measures, its time period and denominator when making a rate claim.",
      "Disclose paid relationships and preserve mixed or inconvenient feedback.",
    ],
    countermeasure: "Separate 'others chose this' from 'this fits me.' Look for a traceable source, specific experience, incentives and what the count leaves out.",
    tradeoffs: [
      "Highlighting an exceptional outcome can create unrealistic expectations even when the quote is real.",
      "Visible popularity can entrench incumbents and discourage discovery.",
      "Evidence that is irrelevant to the reader can distract from a clearer product demonstration.",
    ],
    experiment: {
      question: "Does making one verified experience more prominent help people evaluate this offer or lesson?",
      variable: "Placement of the same verified evidence block",
      control: "Keep the verified quote or example below the explanation.",
      treatment: "Move the same verified quote or example immediately after the opening promise.",
      holdConstant: ["Exact quote, attribution and limitations", "Offer, all-in price and terms", "Body, visual treatment and CTA", "Eligibility rules and observation window"],
      readout: "Compare the selected surface's outcome rate and inspect fit-related questions, misleading-expectation complaints and cancellations.",
      limitations: "No genuine evidence means no social-proof treatment yet. Testing placement does not isolate every psychological pathway, and nonrandom exposure remains confounded.",
    },
    compatiblePlatformIds: ["instagram-feed", "tiktok-for-you", "tiktok-search", "youtube-home", "youtube-shorts", "google-search", "marketing-email", "marketing-offer"],
    sourceIds: ["social-influence-2006"],
  },
  {
    id: "scarcity",
    name: "Scarcity",
    summary: "Limited availability can change how an option is evaluated. Explain real constraints; never manufacture the shortage.",
    emotion: "Anticipated regret or urgency; people may also feel distrust or simply decide not to buy.",
    howItWorks: [
      "A real capacity or time limit changes the decision someone actually faces.",
      "People may interpret a shortage as demand, rarity or restricted access, but those are different explanations and need not have the same effect.",
      "The responsible creative choice is how clearly to communicate a constraint, not whether to invent one.",
    ],
    example: {
      honest: "Booking closes [actual date and time zone] because [real scheduling constraint]. [Accurate availability and cancellation terms].",
      pressure: "Only a few left! Hurry! [A timer that resets for every visitor].",
      distinction: "The honest example requires supplied facts and a reason. Brackets are missing evidence, not claims to publish. A resetting countdown or fabricated shortage is pressure, not an experiment worth running.",
    },
    claims: [
      {
        id: "scarcity-availability-experiment",
        text: "A small 1994 experiment studied how unavailability and its explanation affected product evaluation. Scarcity should not be treated as one context-free mechanism with a fixed result.",
        kind: "experimental",
        sourceIds: ["scarcity-1994"],
        context: "An older, limited experimental product-evaluation setting.",
        limitations: [
          "This is not a modern ecommerce field trial and cannot establish a universal sales lift.",
          "Product evaluation is not the same outcome as purchase, informed choice or long-term satisfaction.",
          "The study does not validate fake stock numbers, resetting timers or hiding material terms.",
        ],
      },
      {
        id: "scarcity-constraint-clarity-hypothesis",
        text: "Explaining why a genuine booking limit exists may improve informed decisions compared with stating the same limit alone.",
        kind: "hypothesis",
        sourceIds: ["scarcity-1994"],
        context: "A proposed test of clarity in a real capacity-limited offer, not of deceptive urgency.",
        limitations: [
          "The source motivates attention to the reason for scarcity, not a forecast for this offer.",
          "Both variants must display the actual limit and all material terms; do not withhold required information from a control.",
        ],
      },
    ],
    honestUse: [
      "State only an actual deadline, stock level or capacity limit supplied by the operator, with its reason and scope.",
      "Make the time zone, total price, eligibility and cancellation terms easy to find.",
      "If the constraint changes, correct the claim; if no real constraint exists, use a different mechanism.",
    ],
    countermeasure: "Check the deadline, stock claim and reason independently. Consider whether you would still want the offer without the urgency, and take the time your decision needs.",
    tradeoffs: [
      "Urgency can attract poorly matched buyers and increase regret, refunds or complaints.",
      "An accurate limit can become misleading if availability is stale or its scope is omitted.",
      "Explaining a constraint may reduce immediate conversion while improving informed choice.",
    ],
    experiment: {
      question: "Does adding a plain explanation of a real limit improve informed response without increasing regret?",
      variable: "Explanation of an already disclosed genuine constraint",
      control: "State the verified limit and all material terms plainly.",
      treatment: "Add one factual sentence explaining why that same limit exists.",
      holdConstant: ["Actual deadline or capacity", "All-in price, eligibility and cancellation terms", "Offer, evidence and CTA", "Audience allocation and remaining availability where controllable"],
      readout: "Use the offer or channel's outcome rate, then check cancellations, complaints and comprehension of the terms.",
      limitations: "No actual constraint means no scarcity treatment. If timing or remaining stock differs between groups, the comparison is confounded; a short-term conversion change alone is not a success criterion.",
    },
    compatiblePlatformIds: ["instagram-feed", "tiktok-for-you", "marketing-email", "marketing-offer"],
    sourceIds: ["scarcity-1994"],
  },
  {
    id: "negative-framing",
    name: "Negative framing",
    summary: "A problem-first headline can attract attention to a real downside. More clicks do not make fear a better service.",
    emotion: "Concern, vigilance or anticipated loss; the same framing can also exhaust or repel people.",
    howItWorks: [
      "Framing the same factual lesson around a preventable problem can change what a reader notices first.",
      "A problem-first opening and a solution-first opening can both be honest if their scope and evidence match.",
      "Do not infer that a model has detected a reader's fear or that negative language is a universal ranking advantage.",
    ],
    example: {
      honest: "Avoid orange indoor portraits: check white balance before the next shot.",
      pressure: "This mistake is destroying every photo you take.",
      distinction: "The honest version names a bounded, fixable problem. The pressure version exaggerates harm and scope. Both are invented teaching examples, not observed outcomes.",
    },
    claims: [
      {
        id: "negative-headline-randomization-boundary",
        text: "Upworthy headline-test data linked negative wording with higher click-through in that publisher's setting. The randomized unit was the whole headline alternative, not an independently assigned negative word.",
        kind: "experimental",
        sourceIds: ["negative-headlines-2023"],
        context: "Online news headline tests and feature analysis in a particular publisher and period.",
        limitations: [
          "Random assignment of headline packages does not isolate a word attribute; other wording differences can travel with negativity.",
          "The headline-feature result is not a causal promise for a new title, audience, language or platform.",
          "Click-through does not measure trust, helpfulness, downstream conversion or emotional wellbeing.",
        ],
      },
      {
        id: "negative-framing-bounded-problem-hypothesis",
        text: "A bounded problem-first opening is worth comparing with a solution-first opening when the same practical remedy is genuinely available.",
        kind: "hypothesis",
        sourceIds: ["negative-headlines-2023"],
        context: "A proposed educational or commercial copy test, not a guaranteed application of the headline study.",
        limitations: [
          "Keep the factual claim, severity and remedy unchanged; do not add alarm to create the treatment.",
          "Reject a selection gain if it comes with misleading expectations or worse usefulness.",
        ],
      },
    ],
    honestUse: [
      "Describe a real, proportionate problem and show the remedy without dramatizing the harm.",
      "Preserve uncertainty and the conditions under which the problem occurs.",
      "Offer a neutral or solution-first alternative; not every useful story needs a warning.",
    ],
    countermeasure: "Restate the headline neutrally. Check the size and likelihood of the problem, the underlying evidence and whether the promised remedy is proportionate.",
    tradeoffs: [
      "A higher click rate can conceal fatigue, distrust, avoidance or low-quality visits.",
      "Repeated warnings can distort how common or serious a problem seems.",
      "Changing many loaded words at once makes it difficult to interpret what actually changed.",
    ],
    experiment: {
      question: "Does a problem-first opening change useful engagement compared with a solution-first opening?",
      variable: "Opening frame: solution-first versus bounded problem-first",
      control: "Lead with the practical benefit of the same remedy.",
      treatment: "Lead with the specific, evidence-supported problem that remedy addresses.",
      holdConstant: ["Underlying facts, severity and uncertainty", "Remedy and evidence", "Body, visuals and CTA", "Audience eligibility and observation window"],
      readout: "Compare the channel's outcome rate alongside completion, helpfulness and alarm-or-misrepresentation complaints.",
      limitations: "This tests two opening frames, not a universal negativity coefficient. Nonrandom social or search observations remain descriptive even if the difference is large.",
    },
    compatiblePlatformIds: ["instagram-feed", "tiktok-for-you", "tiktok-search", "youtube-home", "youtube-shorts", "google-search", "marketing-email", "marketing-offer"],
    sourceIds: ["negative-headlines-2023"],
  },
  {
    id: "arousal",
    name: "Arousal",
    summary: "Activation is a research question, not a sharing switch. Replication and null findings make the simple 'more intense means more viral' story unsafe.",
    emotion: "Possible activation, excitement or agitation; arousal is not the same thing as whether a feeling is positive or negative.",
    howItWorks: [
      "Energetic language or presentation may change the felt intensity of a message, but intensity, valence and usefulness are different dimensions.",
      "Even if a presentation changes activation, that does not establish that people will share it.",
      "Use this entry to interrogate a plausible mechanism and its failed replications, not to manufacture distress.",
    ],
    example: {
      honest: "Try this playful photo challenge: photograph the same object in two kinds of light.",
      pressure: "Stop scrolling! This will shock you. Share before it disappears!",
      distinction: "The honest invitation offers an optional activity with a clear task. The pressure version piles on intensity and urgency without evidence of a useful payoff; neither example claims a measured arousal effect.",
    },
    claims: [
      {
        id: "arousal-replication-null",
        text: "Two preregistered replication studies did not detect an effect of exercise-induced incidental arousal on reported willingness to share news. They measured willingness, not actual platform sharing; the simple 'more intense means more viral' rule remains unsupported.",
        kind: "experimental",
        sourceIds: ["arousal-replication-2024"],
        context: "Exercise-induced incidental arousal and self-reported news-sharing willingness in two preregistered replication studies; not naturally occurring platform shares.",
        limitations: [
          "Null findings are not a blanket disproof of every emotional effect in every context.",
          "A failed replication does not establish that all arousal manipulations are equivalent or that the true effect is exactly zero.",
          "The result does not validate a platform-specific claim about reach, retention or recommendation weights.",
        ],
      },
      {
        id: "arousal-invitation-hypothesis",
        text: "A more energetic but accurate invitation may or may not improve voluntary engagement with a useful activity. A local test should allow a null or negative result.",
        kind: "hypothesis",
        sourceIds: ["arousal-replication-2024"],
        context: "A proposed benign creative-tone comparison; it is not a physiological arousal measurement.",
        limitations: [
          "Without an appropriate manipulation check, a wording test cannot establish that arousal changed.",
          "Any outcome difference could involve clarity, preference or novelty rather than arousal.",
        ],
      },
    ],
    honestUse: [
      "Match energy to a genuinely engaging activity; keep the invitation optional and the promise concrete.",
      "Do not use distress, flashing effects, misleading danger or relentless urgency as experimental treatments.",
      "Call a tone test a tone test unless you actually measured the proposed mediator appropriately.",
    ],
    countermeasure: "Notice whether intensity is substituting for information. Pause the presentation, read the plain claim and decide whether there is still something useful to act on.",
    tradeoffs: [
      "Excitement can become sensory overload or annoyance, especially without accessible alternatives.",
      "A share can express criticism or disbelief rather than endorsement.",
      "A positive local result does not erase the replication limits or identify arousal as its cause.",
    ],
    experiment: {
      question: "Does the tone of an accurate invitation change voluntary engagement without increasing discomfort?",
      variable: "Opening invitation tone: calm versus energetic",
      control: "Use a calm invitation to the same optional activity.",
      treatment: "Use a more energetic invitation without changing the facts, urgency, sensory intensity or task.",
      holdConstant: ["Activity, payoff and factual claims", "Visuals, audio level, pace and length", "Body and CTA", "Eligibility and observation window"],
      readout: "Compare the surface's outcome rate and inspect completion, negative feedback and accessibility complaints; accept no improvement as a valid result.",
      limitations: "This is a tone experiment, not proof that arousal mediates sharing. A null result here also cannot settle every possible emotional effect.",
    },
    compatiblePlatformIds: ["instagram-feed", "tiktok-for-you", "youtube-home", "youtube-shorts", "marketing-email"],
    sourceIds: ["arousal-replication-2024"],
  },
  {
    id: "moral-emotion",
    name: "Moral-emotional diffusion",
    summary: "Moral-emotional language and sharing were associated in political-network research. Understand the pattern without turning it into an outrage or targeting recipe.",
    emotion: "Possible indignation, concern, solidarity or a sense of duty; a word count cannot tell you what an individual felt.",
    howItWorks: [
      "Language can connect an event to a value and a feeling, making the message meaningful within a community.",
      "Network structure, topic, identity, exposure and who wrote the message can all travel with its wording.",
      "This catalogue uses the research for media literacy. Any application here is a general, nonpolitical clarity exercise, not a targeted political strategy.",
    ],
    example: {
      honest: "The museum has added step-free access. Here is the route and what is still being improved.",
      pressure: "If you care about doing the right thing, you must share this now. Anyone who stays silent is against us.",
      distinction: "The honest version connects a value to a checkable change and acknowledges limits. The pressure version makes sharing a loyalty test and erases the freedom to decline; it is a warning example, not a template to use.",
    },
    claims: [
      {
        id: "moral-emotion-observational-politics",
        text: "Brady and colleagues observed an association between moral-emotional language and diffusion in political Twitter discussions, with network context shaping the pattern.",
        kind: "observational",
        sourceIds: ["moral-emotion-2017"],
        context: "Political discussion networks on Twitter in the source's historical sample.",
        limitations: [
          "This is observational political research, not a randomized test of assigning moral-emotional words.",
          "Association does not establish a causal language effect; network, topic and author differences can confound it.",
          "It does not establish a general effect in product marketing, other platforms or nonpolitical audiences.",
          "Included for understanding diffusion, not as a targeted political strategy or instruction to amplify outrage.",
        ],
      },
      {
        id: "moral-emotion-nonpolitical-clarity-hypothesis",
        text: "For a nonpolitical service update, explicitly connecting a factual improvement to its practical value is a clarity hypothesis worth checking, not an application proven by the political study.",
        kind: "hypothesis",
        sourceIds: ["moral-emotion-2017"],
        context: "A general-audience accessibility or service-information comparison, with no political targeting.",
        limitations: [
          "No transfer of the political-network association is assumed.",
          "Do not infer sensitive identities or create in-group/out-group pressure. Keep factual detail and freedom to decline intact.",
        ],
      },
    ],
    honestUse: [
      "Explain a real service improvement and its practical value to a general audience, with evidence and remaining limitations.",
      "Make disagreement, not sharing and declining legitimate choices; do not moralize the CTA.",
      "Use this entry to decode moral pressure. Do not use the research to segment political audiences or engineer antagonism.",
    ],
    countermeasure: "Separate the factual claim, the value judgment and the requested action. Check the claim independently; your values do not obligate you to forward an unverified message.",
    tradeoffs: [
      "Moral language can oversimplify facts or make a routine decision feel like a test of identity.",
      "Sharing can reflect dispute rather than agreement, and network clustering can resemble persuasive success.",
      "A values statement without concrete action can undermine trust rather than build it.",
    ],
    experiment: {
      question: "For a nonpolitical service update, does naming a practical value improve understanding of the same factual change?",
      variable: "Opening frame: factual update versus explicit practical value",
      control: "Open with the verified service improvement.",
      treatment: "Open with its concrete benefit, then state the same verified improvement without a moralized CTA.",
      holdConstant: ["Facts, evidence and remaining limitations", "General, nonpolitical audience", "Body and neutral CTA", "Eligibility and observation window"],
      readout: "Prioritize comprehension and useful follow-through; record confusion or pressure complaints. A sharing rate alone cannot show agreement or trust.",
      limitations: "This is a nonpolitical clarity comparison, not a test of the political-network result and not proof of moral-emotional causation. No sensitive-audience inference or political targeting belongs in this brief.",
    },
    compatiblePlatformIds: ["instagram-feed", "tiktok-for-you", "youtube-home", "youtube-shorts", "google-search"],
    sourceIds: ["moral-emotion-2017"],
  },
];

export const MECHANISM_BY_ID: Readonly<Record<MechanismId, Mechanism>> = Object.fromEntries(
  MECHANISMS.map((mechanism) => [mechanism.id, mechanism]),
) as Record<MechanismId, Mechanism>;

export function getMechanism(id: string): Mechanism | undefined {
  return Object.hasOwn(MECHANISM_BY_ID, id) ? MECHANISM_BY_ID[id as MechanismId] : undefined;
}
