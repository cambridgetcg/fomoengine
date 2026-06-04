/**
 * Deterministic regex pre-pass — the no-AI-key floor.
 *
 * Pure functions over the pasted text. No network, no model, no key required, so
 * the shield degrades gracefully on slow connections, old hardware, and when no
 * API key is configured — the people most targeted by manipulation get protection
 * regardless of what they can afford or install.
 *
 * These are the highest-precision, cheapest signals (countdown timers, "only N
 * left", confirmshaming opt-outs, etc.). The AI classifier (when available) adds
 * the nuanced categories the regex can't see. Regex flags carry high confidence
 * because the textual signature is unambiguous.
 */
import { DETECTION_CATEGORIES, type CategoryId } from "./taxonomy";

export interface RuleFlag {
  categoryId: CategoryId;
  /** The exact substring that fired the rule — shown to the user as evidence. */
  evidence: string;
  /** Which signal matched (transparency / debugging; not necessarily user-facing). */
  signal: string;
}

/** Run every category's deterministic signals over the text. One flag per category, first match wins. */
export function scanWithRules(text: string): RuleFlag[] {
  const flags: RuleFlag[] = [];
  for (const cat of DETECTION_CATEGORIES) {
    if (!cat.regexSignals) continue;
    for (const sig of cat.regexSignals) {
      const m = sig.re.exec(text);
      if (m && m[0]) {
        flags.push({
          categoryId: cat.id,
          evidence: trimEvidence(m[0]),
          signal: sig.label,
        });
        break; // one flag per category from the rules pass
      }
    }
  }
  return flags;
}

/** Keep the quoted evidence short and readable. */
function trimEvidence(s: string): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > 120 ? clean.slice(0, 117) + "…" : clean;
}

// ── Scam-composite signals ────────────────────────────────────────────────
// The catastrophic tier: real-world scams (tech-support popups, pig-butchering,
// notario/immigration-fee fraud) stack impersonation + a threat/deadline + a push
// to act alone. We surface this only when several stack together — precision over
// noise, because a false "SCAM" alarm erodes the trust the tool depends on.

const IMPERSONATION =
  /\b(microsoft|apple|google|amazon|paypal|netflix|the irs|hmrc|your bank|customs|immigration|uscis|social security|government|tech support|support team|account team|security team|the lottery)\b/i;

const THREAT_OR_LOCKOUT =
  /\b(virus|infected|hacked|compromised|suspended|locked|frozen|unauthorized (login|access|charge)|legal action|arrest|deported|owe|overdue|final notice|verify your (account|identity) (now|immediately))\b/i;

const ACT_NOW_CONTACT =
  /\b(call (this number|now|immediately)|dial \+?\d|press \d|click (here|the link) (now|immediately|to (verify|secure|unlock))|send (the )?(code|gift card|crypto|bitcoin|payment)|wire (the )?(money|funds))\b/i;

const ISOLATION =
  /\b(don'?t tell (anyone|your family|the bank)|keep this (between us|confidential|private|a secret)|this is (our|a) secret|only you|the (bonus|withdrawal|offer) (window|closes|expires) in \d)\b/i;

export interface ScamComposite {
  triggered: boolean;
  reasons: string[];
}

/** Returns whether the text matches the stacked-tactics signature of a real scam. */
export function detectScamComposite(text: string): ScamComposite {
  const reasons: string[] = [];
  if (IMPERSONATION.test(text)) reasons.push("claims to be a known company or authority");
  if (THREAT_OR_LOCKOUT.test(text)) reasons.push("uses a threat, lockout, or 'final notice'");
  if (ACT_NOW_CONTACT.test(text)) reasons.push("pushes you to call/click/pay right now");
  if (ISOLATION.test(text)) reasons.push("pushes you to act alone or keep it secret");
  // Trigger only when the stack is dangerous: ≥2 reasons AND at least one is impersonation or threat.
  const hasAnchor = IMPERSONATION.test(text) || THREAT_OR_LOCKOUT.test(text);
  return { triggered: reasons.length >= 2 && hasAnchor, reasons };
}
