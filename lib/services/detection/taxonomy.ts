/**
 * Detection taxonomy — organised by PROVEN psychological lever.
 *
 * Every manipulation tactic works by pulling one documented, replicated lever in
 * human decision-making. This file is organised BY that lever, so the pathway is
 * direct: a surface tactic → the proven principle it exploits → a plain "why it's
 * a trick" → what to do.
 *
 * We include ONLY levers with robust, replicated empirical support, and we
 * deliberately leave out the replication-crisis casualties (ego depletion, social
 * priming, "power posing"). The proven foundations we stand on:
 *   - Cialdini, "Influence: The Psychology of Persuasion" (1984; rev. 2021) —
 *     Scarcity, Social Proof, Authority, Commitment & Consistency, (Reciprocity,
 *     Liking, Unity). Among the most replicated findings in applied psychology.
 *   - Kahneman & Tversky, "Prospect Theory" (1979); Tversky & Kahneman (1974);
 *     Kahneman, "Thinking, Fast and Slow" (2011) — loss aversion, anchoring,
 *     System 1. Nobel-recognised, heavily replicated.
 *   - Thaler & Sunstein, "Nudge" (2008) — the default / status-quo effect.
 *
 * Each tactic also cites where it is recognised + regulated as a dark pattern
 * (Brignull deceptive.design, Mathur et al. Princeton, FTC, EU DSA), so a verdict
 * is inspectable, not our private opinion.
 *
 * The four scarcity/social-proof tactics are the literal inversion of the four
 * FOMO "triggers" the old fomoengine deployed — the weapon's levers, turned to armor.
 *
 * License intent: CC0 — the knowledge of how manipulation works should never sit
 * behind anyone's paywall.
 */

export type CategoryId =
  | "manufactured_urgency"
  | "fake_scarcity"
  | "false_exclusivity"
  | "fake_social_proof"
  | "confirmshaming"
  | "drip_pricing"
  | "preselection"
  | "sneaking"
  | "forced_continuity"
  | "obstruction"
  | "disguised_ads"
  | "misdirection"
  | "scam_composite";

/** info = worth noticing · caution = pressure tactic · danger = catastrophic-harm scam pattern */
export type Severity = "info" | "caution" | "danger";

/** The eight proven psychological levers. Nothing speculative — every one is heavily replicated. */
export type Principle =
  | "Scarcity"
  | "Social proof"
  | "Authority"
  | "Loss aversion"
  | "Anchoring"
  | "Default effect"
  | "Commitment & consistency"
  | "Cognitive load";

export const PRINCIPLES: Record<Principle, { lever: string; source: string }> = {
  "Scarcity": {
    lever: "We want what's rare, dwindling, or running out of time more than we should.",
    source: "Cialdini, Influence (1984)",
  },
  "Social proof": {
    lever: "We assume that if many others are doing it, it must be right.",
    source: "Cialdini, Influence (1984)",
  },
  "Authority": {
    lever: "We comply with whatever looks official, expert, or credentialed.",
    source: "Cialdini, Influence (1984)",
  },
  "Loss aversion": {
    lever: "Losing feels about twice as bad as gaining feels good — so 'don't miss out' overrides judgment.",
    source: "Kahneman & Tversky, Prospect Theory (1979)",
  },
  "Anchoring": {
    lever: "The first number we see quietly becomes the yardstick for every number after it.",
    source: "Tversky & Kahneman (1974)",
  },
  "Default effect": {
    lever: "We tend to keep whatever is pre-set for us, and rarely change a default.",
    source: "Thaler & Sunstein, Nudge (2008)",
  },
  "Commitment & consistency": {
    lever: "Once we've started or invested, we feel pressure to follow through (sunk cost).",
    source: "Cialdini, Influence (1984)",
  },
  "Cognitive load": {
    lever: "When rushed or confused, we fall back on fast, automatic choices that are easy to steer.",
    source: "Kahneman, Thinking, Fast and Slow (2011)",
  },
};

export interface RegexSignal {
  /** Non-global so .exec() is stateless across calls; first match is the evidence span. */
  re: RegExp;
  label: string;
}

export interface DetectionCategory {
  id: CategoryId;
  /** Calm, plain label a stressed non-technical person reads instantly. */
  label: string;
  /** The one proven lever this tactic pulls. */
  principle: Principle;
  /** One human sentence: why it's a trick. Plain-language first, always. */
  why: string;
  /** One line of what to do — restores the person's agency. */
  whatToDo: string;
  /** Where it's recognised + regulated as a dark pattern (inspectable grounding). */
  citation: string;
  severity: Severity;
  /** Deterministic signals — the no-AI-key floor. Absent = LLM-only category. */
  regexSignals?: RegexSignal[];
}

/**
 * Organised by lever. Reading top to bottom IS the psychological map:
 *   Scarcity → Social proof → Loss aversion → Anchoring → Default effect →
 *   Commitment & consistency → Authority → Cognitive load → (composite).
 */
export const DETECTION_CATEGORIES: DetectionCategory[] = [
  // ── Scarcity (Cialdini) ──────────────────────────────────────────────────
  {
    id: "manufactured_urgency",
    label: "Manufactured urgency",
    principle: "Scarcity",
    why: "It makes time the scarce thing — a deadline or countdown that's often fake or resets — so you decide before you think.",
    whatToDo: "Take the time you actually need. A real, fair offer survives you sleeping on it.",
    citation: "Mathur et al. 2019 (Urgency); FTC 2022 §1; EU DSA Art. 25 (countdown timers)",
    severity: "caution",
    regexSignals: [
      { re: /\b\d{1,2}:\d{2}(?::\d{2})?\b/, label: "countdown timer (MM:SS)" },
      { re: /\b(act now|hurry|don'?t miss out|last chance|today only|ends? (today|soon|tonight)|expires? (today|soon|in)|limited[- ]time|while it lasts|before it'?s gone)\b/i, label: "time-pressure phrase" },
      { re: /\b(only|just)\s+\d+\s+(hours?|minutes?|mins?|days?)\s+(left|remaining|to go)\b/i, label: "deadline countdown" },
      // ── Cantonese urgency signals ──
      { re: /(?:今日|即日|限期|截止|最後|最後機會|限時|最後期限|最後召集)/, label: "Cantonese time-pressure phrase" },
      { re: /再唔(?:報|買|做|申請|確認).*冇(?:㗎|啦|咯)/, label: "Cantonese 'act now or lose it' phrase" },
      { re: /(?:緊急|即時|即刻|馬上|盡快|從速)/, label: "Cantonese urgency word" },
    ],
  },
  {
    id: "fake_scarcity",
    label: "Unverifiable scarcity",
    principle: "Scarcity",
    why: "It claims something is almost gone or wildly in-demand — a number you can't verify and that's often invented.",
    whatToDo: "Treat 'only N left' and 'X people viewing' as marketing, not facts. Decide as if the claim weren't there.",
    citation: "Mathur et al. 2019 (Scarcity); India CCPA 2023 (false urgency)",
    severity: "caution",
    regexSignals: [
      { re: /\bonly\s+\d+\s+(left|remaining|in stock|available)\b/i, label: "low-stock claim" },
      { re: /\b\d+\s+(people|others|shoppers|users)\s+(are\s+)?(viewing|looking at|watching|bought|have bought|in their cart)\b/i, label: "live-popularity claim" },
      { re: /\b(selling fast|almost (gone|sold out)|low stock|going fast|in high demand|while supplies last)\b/i, label: "scarcity phrase" },
      // ── Cantonese scarcity signals ──
      { re: /(?:得返|得返|剩低|淨返|得番)\s*\d+\s*(?:個|名額|位|份|張|件)?\s*(?:名額|位|份|存貨|存貨)?/, label: "Cantonese low-stock claim" },
      { re: /(?:售完即止|賣完即止|數量有限|名額有限|有限優惠|限量發售|售完為止)/, label: "Cantonese scarcity phrase" },
      { re: /(?:好快賣晒|好快冇㗎|就快冇|快啲嚟買|趁仲有|趁早)/, label: "Cantonese 'selling fast' phrase" },
    ],
  },
  {
    id: "false_exclusivity",
    label: "False exclusivity",
    principle: "Scarcity",
    why: "It makes access feel scarce and special — 'hand-picked', 'VIP', 'invite-only' — to lower your guard and flatter you into yes.",
    whatToDo: "Ask: would they send this to anyone? 'Exclusive' usually means 'sent to everyone.' Judge the offer on its merits.",
    citation: "Brignull (false status); FTC 2022",
    severity: "info",
    regexSignals: [
      { re: /\b(you'?ve been (specially |hand[- ]?)?(selected|chosen)|exclusive (offer|invite|access|deal)|VIP (access|member|only)|invite[- ]?only|members[- ]?only|insider (access|deal)|chosen few)\b/i, label: "exclusivity phrase" },
    ],
  },

  // ── Social proof (Cialdini) ──────────────────────────────────────────────
  {
    id: "fake_social_proof",
    label: "Possibly fake social proof",
    principle: "Social proof",
    why: "Reviews, comments, or counts can be coordinated or fabricated — duplicated phrasing and generic superlatives are the tells.",
    whatToDo: "Look for specific, detailed, mixed reviews. A wall of identical five-star praise is a warning, not reassurance.",
    citation: "Mathur et al. 2019 (Social Proof); Brignull (Fake Social Proof)",
    severity: "caution",
    regexSignals: [
      { re: /\b(join|trusted by|loved by|used by)\s+\d[\d,]*\s*\+?\s+(happy\s+)?(users|customers|people|members|founders|businesses)\b/i, label: "large round-number claim" },
      { re: /\b(everyone|thousands|millions)\s+(is|are|of\s+people)\s+(using|buying|switching|raving|talking)\b/i, label: "bandwagon phrase" },
      // ── Fake review pattern: excessive superlatives without specifics ──
      { re: /\b(absolutely (amazing|incredible|perfect|wonderful|fantastic)|best (ever|of all time|purchase I (ever )?made)|changed my life|could not (recommend|live without) (it|this) (enough|more)|simply (amazing|perfect|the best)|five stars?|⭐⭐⭐⭐⭐)\b/i, label: "generic superlatives (potential fake review)" },
      // ── Cantonese social proof ──
      { re: /(?:超過|超過)\s*\d[,\d]*\s*(?:個|名|位).*(?:用家|用戶|會員|客戶|用戶|客)/, label: "Cantonese large-number claim" },
      { re: /(?:人人都用|個個都讚|萬人推薦|全城熱捧|街坊力推)/, label: "Cantonese bandwagon phrase" },
    ],
  },

  // ── Loss aversion (Kahneman & Tversky) ───────────────────────────────────
  {
    id: "confirmshaming",
    label: "Confirmshaming",
    principle: "Loss aversion",
    why: "The 'no' option is written to make declining feel like a loss or a personal failing, so you say yes to avoid the sting.",
    whatToDo: "Declining is always allowed and never shameful. The wording is the manipulation — ignore the guilt and choose freely.",
    citation: "Brignull (Confirmshaming); India CCPA 2023",
    severity: "caution",
    regexSignals: [
      { re: /\bno,?\s+(thanks?,?\s+)?(i('| a)?m (fine|good|not interested)|i (don'?t|do not) want to (save|win|grow|succeed)|i (like|prefer|enjoy) (paying|overpaying|missing out|losing)|i hate (saving|money|deals))\b/i, label: "shaming decline option" },
      { re: /\b(no thanks),?\s+i('| a)?(m| am)?\b.*\b(rather|prefer|don'?t)\b/i, label: "guilt-loaded opt-out" },
      // ── Soft confirmshaming — peer pressure framing ──
      { re: /\bmost people (in your position|like you|in your situation)\s+(choose|prefer|continue|opt|stay|don'?t (cancel|leave|opt out))\b/i, label: "peer-pressure decline framing" },
      { re: /\b(are you sure|is that your (final |)answer|you'?re (leaving|cancelling|declining))\??\s/i, label: "second-guess prompt" },
      { re: /(唔好意思|真係唔好意思).*(取消|退訂|拒絕|唔要)/, label: "Cantonese guilt-load decline" },
    ],
  },

  // ── Anchoring (Tversky & Kahneman) ───────────────────────────────────────
  {
    id: "drip_pricing",
    label: "Hidden costs (drip pricing)",
    principle: "Anchoring",
    why: "A low headline price anchors you, then fees and charges appear only later — so the real total feels smaller than it is.",
    whatToDo: "Don't trust the first number. Find the all-in total before you commit; if it only shows at the last step, that's deliberate.",
    citation: "Brignull (Hidden Costs); Mathur et al. 2019 (Sneaking); FTC 2022 §2 (drip pricing)",
    severity: "caution",
    regexSignals: [
      { re: /\b(\+|plus)\s*(fees|taxes|shipping|charges|vat)\b/i, label: "added-cost note" },
      { re: /\b(fees?|taxes?|shipping|total)\s+(calculated|added|applied|shown|revealed)\s+(at|during)\s+(checkout|the next step|payment)\b/i, label: "cost-deferred-to-checkout" },
      { re: /\b(additional|extra|hidden|service|booking|convenience|processing)\s+fees?\b/i, label: "extra-fee language" },
    ],
  },

  // ── Default effect (Thaler & Sunstein) ───────────────────────────────────
  {
    id: "preselection",
    label: "Pre-selected for you",
    principle: "Default effect",
    why: "A box or option is ticked by default, betting you won't change it — the choice was made for you, not by you.",
    whatToDo: "Uncheck anything you didn't choose. Defaults are set in the seller's favour, not yours.",
    citation: "Brignull (Preselection); FTC 2022 §4",
    severity: "info",
    regexSignals: [
      { re: /\bpre[-\s]?(checked|selected|ticked|filled)\b/i, label: "pre-selected default" },
      { re: /\b(by default|opt[- ]?out|already (selected|enabled|added)|uncheck to)\b/i, label: "default opt-in" },
    ],
  },
  {
    id: "sneaking",
    label: "Something added you didn't choose",
    principle: "Default effect",
    why: "An item, add-on, or charge was slipped into your cart, relying on you not noticing the silent default.",
    whatToDo: "Review every line in your cart before paying. Remove anything you didn't deliberately add.",
    citation: "Brignull (Sneak into Basket); Mathur et al. 2019; India CCPA 2023",
    severity: "caution",
    regexSignals: [
      { re: /\b(added to your (cart|basket|order)|we'?ve added|automatically (added|included))\b/i, label: "auto-added item" },
    ],
  },
  {
    id: "forced_continuity",
    label: "Hidden subscription / hard to cancel",
    principle: "Default effect",
    why: "A 'free' start quietly defaults into recurring charges, betting inertia keeps you paying after you've forgotten.",
    whatToDo: "Before a free trial, find out exactly when and how much you'll be charged and how to cancel. If cancelling is hidden, walk away.",
    citation: "Brignull (Forced Continuity); FTC click-to-cancel enforcement (specific Rule vacated 2025; pursued as deceptive conduct); EU DSA",
    severity: "caution",
    regexSignals: [
      { re: /\bfree trial\b/i, label: "free-trial hook" },
      { re: /\bauto(?:matically)?[-\s]?renew(s|al|ing)?\b/i, label: "auto-renewal" },
      { re: /\b(cancel anytime|billed (monthly|annually|automatically|after)|then \$?\d+\s*\/?\s*(mo|month|yr|year)|recurring (charge|payment|billing))\b/i, label: "recurring-billing language" },
    ],
  },

  // ── Commitment & consistency / sunk cost (Cialdini) ──────────────────────
  {
    id: "obstruction",
    label: "Easy in, hard out",
    principle: "Commitment & consistency",
    why: "Signing up is one click, but leaving or cancelling is made deliberately hard — banking on the effort you've already sunk in.",
    whatToDo: "Before you commit, find the exit. If you can't easily see how to cancel or compare, treat that as a red flag.",
    citation: "Brignull (Obstruction / Roach Motel); Mathur et al. 2019",
    severity: "caution",
    // ── Structural detection added: roach motel pattern ──
    regexSignals: [
      { re: /(?:to (?:delete|cancel|unsubscribe|remove|close)\s+(?:your\s+)?(?:account|subscription|membership).*(?:navigate|go to|click|find|scroll|select|settings|advanced|privacy|data management))/i, label: "multi-step cancellation path" },
      { re: /\b(?:takes?\s+(?:just\s+)?\d+\s+(?:seconds?|minutes?|steps?)|one.click|quick.start|get started)\b.*\b(?:to (?:delete|cancel|unsubscribe|remove|close)|deletion|cancellation|unsubscri)/i, label: "easy-in / hard-out contrast" },
      { re: /(?:秒速|即時|快速).*(?:註冊|登記|開始).*(?:取消|刪除|退訂).*(?:設定|步驟|聯絡客服|填表)/, label: "Cantonese easy-in hard-out pattern" },
    ],
  },

  // ── Authority (Cialdini) ─────────────────────────────────────────────────
  {
    id: "disguised_ads",
    label: "An ad dressed as content",
    principle: "Authority",
    why: "It borrows the credibility of a normal post, article, or recommendation while actually being a paid advertisement.",
    whatToDo: "Ask who paid for this. If a 'recommendation' is really an ad and doesn't clearly say so, weigh it as advertising.",
    citation: "Brignull (Disguised Ads); FTC Endorsement Guides",
    severity: "info",
  },

  // ── Cognitive load / System 1 (Kahneman) ─────────────────────────────────
  {
    id: "misdirection",
    label: "Confusing or misleading wording",
    principle: "Cognitive load",
    why: "Confusing wording or layout overloads you so you fall back on a fast, automatic choice — the one they want.",
    whatToDo: "Read it twice, slowly. If a sentence is hard to parse, that may be on purpose — be sure what 'yes' and 'no' actually do.",
    citation: "Brignull (Misdirection); Mathur et al. 2019; EU DSA Art. 25",
    severity: "caution",
  },

  // ── Composite: stacked levers = real-scam signature ──────────────────────
  {
    id: "scam_composite",
    label: "This matches a known scam pattern",
    principle: "Authority",
    why: "Several proven levers are stacking the way real scams do — a fake authority (Authority), a sudden deadline or threat (Scarcity + Loss aversion), and a push to act alone and fast.",
    whatToDo: "Stop. Don't call a number, click a link, or send money or details now. Tell someone you trust, and verify through an official channel you find yourself.",
    citation: "FTC scam guidance; impersonation + manufactured urgency + isolation",
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

/** Categories the AI classifier labels (everything except the composite, which we compute). */
export const AI_CLASSIFIABLE = DETECTION_CATEGORIES.filter((c) => c.id !== "scam_composite");

/**
 * The truth of emotions.
 *
 * Every manipulation is an attack on a feeling. Naming the tactic tells you the
 * trick; naming the feeling — and then telling the plain truth that dissolves it —
 * gives you your clarity back. That handover is the whole point of the shield.
 *
 * Voice rules (this is the soul of the product, so they are strict):
 *  - `emotion` names the feeling being hijacked, kindly. The person is never the
 *    problem — the feeling was engineered into them on purpose.
 *  - `truth` is honest, accurate, and FREEING. The truth is a relief, not a lecture:
 *    it hands back time, money, agency, or calm, and it's allowed to be a little fun.
 *  - It must itself be free of the manipulation it describes — no fear-mongering, no
 *    shaming the reader for being targeted, no overclaim. (The scam truth stays warm
 *    and serious, never flippant — but still empowering, never frightening for its
 *    own sake.)
 *
 * Record<CategoryId, …> means a new category cannot ship without its truth — the
 * compiler enforces it, and free-tier.guardrail.test.ts asserts none is empty.
 */
export const EMOTIONAL_TRUTH: Record<CategoryId, { emotion: string; truth: string }> = {
  manufactured_urgency: {
    emotion: "Manufactured panic — the jolt that you'll lose out if you pause.",
    truth: "Breathe — you just got your time back. A real, fair offer is still there after you sleep on it. The ticking clock is the product, not the deal.",
  },
  fake_scarcity: {
    emotion: "FOMO — the itch that it's vanishing before you can decide.",
    truth: "Here's the relief: scarcity you can't verify usually isn't real. That “Only 2 left!” has said 2 for months. Decide as if the number weren't there — because it kind of isn't.",
  },
  false_exclusivity: {
    emotion: "The little glow of being “specially chosen.”",
    truth: "Fun fact: that “exclusive, just for you” landed in a million inboxes. You don't have to be flattered into yes — judge the thing on its own merits, and enjoy seeing through the wink.",
  },
  fake_social_proof: {
    emotion: "Herd-pull — everyone's doing it, so what's wrong with you?",
    truth: "Other people's choices aren't evidence about YOUR fit. “50,000 sold” describes a crowd, not you. Your own taste is allowed to win.",
  },
  confirmshaming: {
    emotion: "A flash of guilt for daring to say no.",
    truth: "“No thanks” is a complete sentence. That guilt-trip is a literal designed button, not your conscience. Declining isn't rude — it's just a normal Tuesday.",
  },
  drip_pricing: {
    emotion: "The sting of a “deal” slipping away as the total quietly climbs.",
    truth: "The all-in price is the only real price. A low headline with fees bolted on later isn't a bargain you're losing — it's the true cost, shown late on purpose. Now you can compare honestly.",
  },
  preselection: {
    emotion: "The small drag of un-choosing what someone chose for you.",
    truth: "Pre-ticked means picked FOR you, not BY you. Untick everything and start from a blank slate — that empty box is yours, and it feels surprisingly good.",
  },
  sneaking: {
    emotion: "The quiet unease that something slipped into your cart.",
    truth: "Trust that unease — it's right. Anything you didn't deliberately add doesn't belong there. Clearing it out is just you taking the wheel back.",
  },
  forced_continuity: {
    emotion: "The fog of “I'll cancel later” — which they're betting you won't.",
    truth: "A “free” trial that wants your card is a paid plan with a delay. Set the cancel reminder NOW, before the warm fuzzies fade. Future-you will high-five you.",
  },
  obstruction: {
    emotion: "The quiet dread of how hard leaving is going to be.",
    truth: "If they hid the exit, that's your answer. Find the cancel button BEFORE you join — an honest service makes leaving as easy as joining. You're always allowed to walk.",
  },
  disguised_ads: {
    emotion: "Borrowed trust — it's wearing the outfit of a real recommendation.",
    truth: "An ad in a journalist's clothes is still an ad. The moment you ask “who paid for this?” the spell breaks — and you get to weigh it for what it actually is.",
  },
  misdirection: {
    emotion: "Overwhelm — too much noise, so just grab the highlighted button.",
    truth: "Confusion can be the strategy: tire you out so you take the shiny default. Slowing down isn't slow — it's you refusing to be rushed into someone else's choice.",
  },
  scam_composite: {
    emotion: "Engineered panic — fear, a ticking clock, and “tell no one,” all at once.",
    truth: "This is the big one, and the truth is your shield: real banks, real police, and real family NEVER rush you, isolate you, or ask for gift cards or codes. The panic IS the scam. One slow breath, one trusted person, and one call back on a number you find yourself — that's all it takes to beat it.",
  },
};
