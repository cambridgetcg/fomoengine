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
import { scanI18n, detectI18nScam } from "./i18n-signals";

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

  // ── i18n layer: scan multilingual signals for categories not yet flagged. ──
  // One flag per category (first match wins), same semantics as above.
  // This means the English regex runs first; i18n fills in what English missed.
  const flaggedCategories = new Set(flags.map((f) => f.categoryId));
  const i18nResults = scanI18n(text);
  for (const r of i18nResults) {
    if (!flaggedCategories.has(r.categoryId)) {
      flags.push({
        categoryId: r.categoryId,
        evidence: trimEvidence(r.evidence),
        signal: r.label + " (" + r.lang + ")",
      });
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
  /\b(virus|infected|hacked|compromised|suspended|locked|frozen|deactivat\w+|unauthorized (login|access|charge)|legal action|arrest|deported|owe|overdue|final notice|verify your (account|identity) (now|immediately)|(your |the )(account|card|access|profile|membership|payment) (has been |is |will (soon )?be |was )(closed|close[ds]|terminated|restricted|disabled|blocked|put on hold|limited))\b/i;

const ACT_NOW_CONTACT =
  /\b(call (this number|us|back|now|immediately)|(call|dial|text|phone)\s+(?:us\s+)?(?:on\s+|at\s+|back\s+)?(?:\+?\d|\(\d)[\d().\s-]{5,}\d|press \d|click (here|the link)|send (the )?(code|gift card|crypto|bitcoin|payment)|wire (the )?(money|funds))\b/i;

const ISOLATION =
  /\b((do not|don'?t|dont|never)\s+(tell|share (this|it) with|inform|contact)\s+(anyone|your family|the bank|the police|a soul|family|us)|tell no one|keep this (between us|confidential|private|to yourself|a secret)|this is (our|a) secret|act alone|only you|the (bonus|withdrawal|offer) (window|closes|expires) in \d)\b/i;

// ── Cantonese scam-composite signals ──
const IMPERSONATION_YUE =
  /(微軟|蘋果|谷歌|亞馬遜|PayPal|Netflix|銀行|海關|入境處|入境局|稅務局|政府|社交安全|技術支援|客服|帳戶安全中心|反洗錢中心|警方|海關人員)/;

const THREAT_OR_LOCKOUT_YUE =
  /(中毒|感染|被駭|被入侵|被暫停|已暫停|被凍結|已被凍結|停用|永久停用|異常活動|可疑活動|非法登入|未經授權|法律行動|逮捕|遞解出境|欠款|逾期|最後通知|立即驗證|帳戶.*(?:關閉|終止|停用|限制|封鎖))/;

const ACT_NOW_CONTACT_YUE =
  /(即刻致電|馬上打電話|立即聯絡|盡快聯絡|點擊.*連結|按下.*按鈕|發送.*驗證碼|轉賬|匯款|俾錢|繳費|致電.*\d)/;

const ISOLATION_YUE =
  /(唔好話俾.*知|唔好同.*講|唔好通知|保密|保持秘密|唔好報警|唔好聯絡銀行|自己處理|淨係你知)/;

export interface ScamComposite {
  triggered: boolean;
  reasons: string[];
}

/** Returns whether the text matches the stacked-tactics signature of a real scam. */
export function detectScamComposite(text: string): ScamComposite {
  const reasons: string[] = [];
  const impersonation = IMPERSONATION.test(text) || IMPERSONATION_YUE.test(text);
  const threat = THREAT_OR_LOCKOUT.test(text) || THREAT_OR_LOCKOUT_YUE.test(text);
  const actNow = ACT_NOW_CONTACT.test(text) || ACT_NOW_CONTACT_YUE.test(text);
  const isolation = ISOLATION.test(text) || ISOLATION_YUE.test(text);

  // ── i18n layer: check all other languages for scam-composite signals. ──
  // English + Cantonese already checked above; i18n covers Mandarin, Spanish,
  // Hindi, Arabic, Portuguese, French, German, Japanese, Korean, Russian.
  if (!impersonation || !threat || !actNow || !isolation) {
    const i18nResult = detectI18nScam(text);
    const allReasons = [
      ...(impersonation || i18nResult.impersonation ? ["claims to be a known company or authority"] : []),
      ...(threat || i18nResult.threat ? ["uses a threat, lockout, or 'final notice'"] : []),
      ...(actNow || i18nResult.actNow ? ["pushes you to call/click/pay right now"] : []),
      ...(isolation || i18nResult.isolation ? ["pushes you to act alone or keep it secret"] : []),
    ];
    // Deduplicate
    const unique = Array.from(new Set(allReasons));
    const hasAnchor = impersonation || i18nResult.impersonation || threat || i18nResult.threat;
    return { triggered: unique.length >= 2 && hasAnchor, reasons: unique };
  }

  if (impersonation) reasons.push("claims to be a known company or authority");
  if (threat) reasons.push("uses a threat, lockout, or 'final notice'");
  if (actNow) reasons.push("pushes you to call/click/pay right now");
  if (isolation) reasons.push("pushes you to act alone or keep it secret");
  // Trigger only when the stack is dangerous: ≥2 reasons AND at least one is impersonation or threat.
  const hasAnchor = impersonation || threat;
  return { triggered: reasons.length >= 2 && hasAnchor, reasons };
}
