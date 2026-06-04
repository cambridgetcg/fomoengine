/**
 * Detection taxonomy — the single source of truth for the shield.
 *
 * This file is read by THREE things, so the knowledge lives in exactly one place:
 *   1. the deterministic regex pre-pass (regex.service.ts) — works with NO AI key,
 *   2. the AI classifier prompt (detection.service.ts) — the category ids + definitions,
 *   3. the public "how to spot it yourself" pages (/learn) — the durable, CC0 corpus.
 *
 * Every category is grounded in established, citable research so a verdict is
 * inspectable by the person it affects — not our private opinion:
 *   - Brignull, "Deceptive Patterns" (deceptive.design taxonomy)
 *   - Mathur et al., "Dark Patterns at Scale" (Princeton, 2019)
 *   - FTC, "Bringing Dark Patterns to Light" (2022)
 *   - EU Digital Services Act, Art. 25 (prohibition of manipulative interfaces)
 *   - India CCPA Guidelines on Dark Patterns (2023)
 *
 * The first four categories are the literal inversion of the four FOMO "triggers"
 * the old fomoengine deployed (scarcity / urgency / social-proof / exclusivity):
 * the weapon's own taxonomy, turned into armor.
 *
 * License intent: this corpus is meant to be openly licensed (CC0) so the
 * knowledge of how manipulation works can never be captured behind a paywall.
 */

export type CategoryId =
  | "manufactured_urgency"
  | "fake_scarcity"
  | "fake_social_proof"
  | "false_exclusivity"
  | "confirmshaming"
  | "drip_pricing"
  | "forced_continuity"
  | "sneaking"
  | "preselection"
  | "misdirection"
  | "disguised_ads"
  | "obstruction"
  | "scam_composite";

/** info = worth noticing · caution = pressure tactic · danger = catastrophic-harm scam pattern */
export type Severity = "info" | "caution" | "danger";

export interface RegexSignal {
  /** Non-global so .exec() is stateless across calls; first match is the evidence span. */
  re: RegExp;
  /** Human label for which signal fired (kept out of user copy; useful for transparency). */
  label: string;
}

export interface DetectionCategory {
  id: CategoryId;
  /** Calm, plain label a stressed non-technical person reads instantly. */
  label: string;
  /** What this inverts or where it's added from. */
  inverts: string;
  /** One human sentence: why it's a trick. Plain-language FIRST, always. */
  why: string;
  /** One line of what to do — restores the person's agency. */
  whatToDo: string;
  /** Citable grounding so the verdict is inspectable, not our private opinion. */
  citation: string;
  severity: Severity;
  /** Deterministic signals — the no-AI-key floor. Absent = LLM-only category. */
  regexSignals?: RegexSignal[];
}

export const DETECTION_CATEGORIES: DetectionCategory[] = [
  {
    id: "manufactured_urgency",
    label: "Manufactured urgency",
    inverts: "the old URGENCY trigger",
    why: "It manufactures time pressure so you decide before you think — the clock is often fake or resets on refresh.",
    whatToDo: "Take the time you actually need. A real, fair offer survives you sleeping on it.",
    citation: "Mathur et al. 2019 (Urgency); FTC 2022 §1; EU DSA Art. 25 (countdown timers)",
    severity: "caution",
    regexSignals: [
      { re: /\b\d{1,2}:\d{2}(?::\d{2})?\b/, label: "countdown timer (MM:SS)" },
      { re: /\b(act now|hurry|don'?t miss out|last chance|today only|ends? (today|soon|tonight)|expires? (today|soon|in)|limited[- ]time|while it lasts|before it'?s gone)\b/i, label: "time-pressure phrase" },
      { re: /\b(only|just)\s+\d+\s+(hours?|minutes?|mins?|days?)\s+(left|remaining|to go)\b/i, label: "deadline countdown" },
    ],
  },
  {
    id: "fake_scarcity",
    label: "Unverifiable scarcity",
    inverts: "the old SCARCITY trigger",
    why: "It claims something is almost gone or wildly popular — a number you have no way to verify and that's often invented.",
    whatToDo: "Treat 'only N left' and 'X people viewing' as marketing, not facts. Decide as if the claim weren't there.",
    citation: "Mathur et al. 2019 (Scarcity); India CCPA 2023 (false urgency)",
    severity: "caution",
    regexSignals: [
      { re: /\bonly\s+\d+\s+(left|remaining|in stock|available)\b/i, label: "low-stock claim" },
      { re: /\b\d+\s+(people|others|shoppers|users)\s+(are\s+)?(viewing|looking at|watching|bought|have bought|in their cart)\b/i, label: "live-popularity claim" },
      { re: /\b(selling fast|almost (gone|sold out)|low stock|going fast|in high demand|while supplies last)\b/i, label: "scarcity phrase" },
    ],
  },
  {
    id: "fake_social_proof",
    label: "Possibly fake social proof",
    inverts: "the old SOCIAL_PROOF trigger",
    why: "Reviews, comments, or counts can be coordinated or fabricated — duplicated phrasing and generic superlatives are tells.",
    whatToDo: "Look for specific, detailed, mixed reviews. A wall of five-star praise that all sounds the same is a warning, not reassurance.",
    citation: "Mathur et al. 2019 (Social Proof); Brignull (Fake Social Proof)",
    severity: "caution",
    regexSignals: [
      { re: /\b(join|trusted by|loved by|used by)\s+\d[\d,]*\s*\+?\s+(happy\s+)?(users|customers|people|members|founders|businesses)\b/i, label: "large round-number claim" },
      { re: /\b(everyone|thousands|millions)\s+(is|are|of\s+people)\s+(using|buying|switching|raving|talking)\b/i, label: "bandwagon phrase" },
    ],
  },
  {
    id: "false_exclusivity",
    label: "False exclusivity",
    inverts: "the old EXCLUSIVITY trigger",
    why: "It makes you feel hand-picked or VIP to lower your guard and make the offer feel too special to question.",
    whatToDo: "Ask: would they send this to anyone? 'Exclusive' usually means 'sent to everyone.' Judge the offer on its merits.",
    citation: "Brignull (manipulation via false status); FTC 2022",
    severity: "info",
    regexSignals: [
      { re: /\b(you'?ve been (specially |hand[- ]?)?(selected|chosen)|exclusive (offer|invite|access|deal)|VIP (access|member|only)|invite[- ]?only|members[- ]?only|insider (access|deal)|chosen few)\b/i, label: "exclusivity phrase" },
    ],
  },
  {
    id: "confirmshaming",
    label: "Confirmshaming",
    inverts: "added (Brignull)",
    why: "The 'no' option is written to guilt-trip or shame you for declining.",
    whatToDo: "Declining is always allowed and never shameful. The wording is the manipulation — ignore the guilt and choose freely.",
    citation: "Brignull (Confirmshaming); India CCPA 2023",
    severity: "caution",
    regexSignals: [
      { re: /\bno,?\s+(thanks?,?\s+)?(i('| a)?m (fine|good|not interested)|i (don'?t|do not) want to (save|win|grow|succeed)|i (like|prefer|enjoy) (paying|overpaying|missing out|losing)|i hate (saving|money|deals))\b/i, label: "shaming decline option" },
      { re: /\b(no thanks),?\s+i('| a)?(m| am)?\b.*\b(rather|prefer|don'?t)\b/i, label: "guilt-loaded opt-out" },
    ],
  },
  {
    id: "drip_pricing",
    label: "Hidden costs (drip pricing)",
    inverts: "added (Brignull / Mathur 'Sneaking')",
    why: "The real total is higher than the headline price — fees, taxes, or charges appear only later in the flow.",
    whatToDo: "Don't trust the first number. Look for the all-in total before you commit; if it only appears at the last step, that's deliberate.",
    citation: "Brignull (Hidden Costs); Mathur et al. 2019 (Sneaking); FTC 2022 §2 (drip pricing)",
    severity: "caution",
    regexSignals: [
      { re: /\b(\+|plus)\s*(fees|taxes|shipping|charges|vat)\b/i, label: "added-cost note" },
      { re: /\b(fees?|taxes?|shipping|total)\s+(calculated|added|applied|shown|revealed)\s+(at|during)\s+(checkout|the next step|payment)\b/i, label: "cost-deferred-to-checkout" },
      { re: /\b(additional|extra|hidden|service|booking|convenience|processing)\s+fees?\b/i, label: "extra-fee language" },
    ],
  },
  {
    id: "forced_continuity",
    label: "Hidden subscription / hard to cancel",
    inverts: "added (Brignull; FTC Click-to-Cancel)",
    why: "It quietly enrolls you in recurring charges, and getting out is made harder than getting in.",
    whatToDo: "Before starting a 'free' trial, find out exactly when and how much you'll be charged, and how to cancel. If cancelling is hidden, walk away.",
    citation: "Brignull (Forced Continuity); FTC Click-to-Cancel Rule; EU DSA",
    severity: "caution",
    regexSignals: [
      { re: /\bfree trial\b/i, label: "free-trial hook" },
      { re: /\bauto(?:matically)?[-\s]?renew(s|al|ing)?\b/i, label: "auto-renewal" },
      { re: /\b(cancel anytime|billed (monthly|annually|automatically|after)|then \$?\d+\s*\/?\s*(mo|month|yr|year)|recurring (charge|payment|billing))\b/i, label: "recurring-billing language" },
    ],
  },
  {
    id: "sneaking",
    label: "Something added you didn't choose",
    inverts: "added (Brignull; Mathur 'Sneaking'; India CCPA 'basket sneaking')",
    why: "An item, add-on, or charge was slipped into your cart or order without a clear choice from you.",
    whatToDo: "Review every line in your cart before paying. Remove anything you didn't deliberately add.",
    citation: "Brignull (Sneak into Basket); Mathur et al. 2019; India CCPA 2023",
    severity: "caution",
    regexSignals: [
      { re: /\b(added to your (cart|basket|order)|we'?ve added|automatically (added|included))\b/i, label: "auto-added item" },
    ],
  },
  {
    id: "preselection",
    label: "Pre-selected for you",
    inverts: "added (Brignull; FTC §4)",
    why: "A box, add-on, or option was ticked by default — the choice was made for you, not by you.",
    whatToDo: "Uncheck anything you didn't choose. Defaults are designed to be the seller's preference, not yours.",
    citation: "Brignull (Preselection); FTC 2022 §4",
    severity: "info",
    regexSignals: [
      { re: /\bpre[-\s]?(checked|selected|ticked|filled)\b/i, label: "pre-selected default" },
      { re: /\b(by default|opt[- ]?out|already (selected|enabled|added)|uncheck to)\b/i, label: "default opt-in" },
    ],
  },
  {
    id: "misdirection",
    label: "Confusing or misleading wording",
    inverts: "added (Brignull; Mathur 'Misdirection'; EU DSA)",
    why: "The wording or layout is built to steer you toward a choice that isn't in your interest — double negatives, buried meaning, a button styled to misdirect.",
    whatToDo: "Read it twice, slowly. If a sentence is hard to parse, that may be on purpose — make sure you know what 'yes' and 'no' actually do.",
    citation: "Brignull (Misdirection); Mathur et al. 2019; EU DSA Art. 25",
    severity: "caution",
  },
  {
    id: "disguised_ads",
    label: "An ad dressed as content",
    inverts: "added (Brignull; FTC endorsement guides)",
    why: "It's built to look like a normal post, article, or recommendation, but it's a paid advertisement.",
    whatToDo: "Ask who paid for this. If a 'recommendation' is actually an ad and doesn't clearly say so, weigh it as advertising.",
    citation: "Brignull (Disguised Ads); FTC Endorsement Guides",
    severity: "info",
  },
  {
    id: "obstruction",
    label: "Easy in, hard out",
    inverts: "added (Brignull 'Roach Motel'; Mathur 'Obstruction')",
    why: "Signing up takes one click but leaving, cancelling, or comparing is made deliberately difficult.",
    whatToDo: "Before you commit, find the exit. If you can't easily see how to cancel or compare, treat that as a red flag.",
    citation: "Brignull (Obstruction / Roach Motel); Mathur et al. 2019",
    severity: "caution",
  },
  {
    id: "scam_composite",
    label: "This matches a known scam pattern",
    inverts: "composite (impersonation + urgency + isolation/threat)",
    why: "Several high-pressure tactics are stacking together in the way real scams do — a fake authority, a sudden deadline or threat, and a push to act alone and fast.",
    whatToDo: "Stop. Do not call a number or send money or details right now. Tell someone you trust, and verify through an official channel you find yourself (not one in this message).",
    citation: "FTC scam guidance; composite of impersonation + manufactured urgency + isolation",
    severity: "danger",
    // Detected by co-occurrence in detection.service.ts, not a single regex.
  },
];

export const CATEGORY_BY_ID: Record<CategoryId, DetectionCategory> = DETECTION_CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, DetectionCategory>,
);

/** Categories the AI classifier is asked to label (everything except the composite, which we compute). */
export const AI_CLASSIFIABLE = DETECTION_CATEGORIES.filter((c) => c.id !== "scam_composite");
