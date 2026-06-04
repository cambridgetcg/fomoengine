/**
 * DetectionService — the inverted heart of the old generator.
 *
 * The old generator.service.ts used getAIProvider() + callOpenAI/callAnthropic to
 * GENERATE manipulative comments from the four FOMO triggers. This keeps that exact
 * transport and fallback chain, but flips the job: it CLASSIFIES pasted text against
 * the manipulation taxonomy and returns plain-language flags. Weapon → armor.
 *
 * Three honesty commitments are baked in here, not bolted on:
 *  1. Plain-language FIRST. The user-facing "why" and "what to do" come from our
 *     vetted taxonomy, never from free-form model text — so the model classifies,
 *     but cannot improvise something defamatory or alarmist.
 *  2. Never "this IS fake." We say patterns are "consistent with" a tactic, and we
 *     report a confidence BAND (likely / possible), never a fake grade.
 *  3. Substrate-honest provenance. The result says exactly what checked it
 *     ("rules + AI" vs "rules only"), and that we read the pasted text — we did
 *     not visit any site.
 *
 * No DB, no auth, no platform API. analyze() is a pure function of the text plus
 * whatever AI key happens to be configured. That is the whole point: it can't be
 * rate-limited or litigated to death the way scraper-based tools were.
 */
import {
  AI_CLASSIFIABLE,
  CATEGORY_BY_ID,
  PRINCIPLES,
  type CategoryId,
  type Principle,
  type Severity,
} from "./taxonomy";
import { scanWithRules, detectScamComposite } from "./regex.service";

const MAX_CHARS = 20000;
const OPENAI_MODEL = "gpt-4o-mini";
const ANTHROPIC_MODEL = "claude-3-haiku-20240307";

export type ConfidenceBand = "likely" | "possible";

export interface Flag {
  categoryId: CategoryId;
  label: string;
  /** The proven psychological lever this tactic pulls (Cialdini / Kahneman / Thaler). */
  principle: Principle;
  /** One plain sentence explaining that lever. */
  lever: string;
  why: string;
  whatToDo: string;
  citation: string;
  severity: Severity;
  /** The exact quoted span that triggered the flag, or null if AI-inferred without a clean span. */
  evidence: string | null;
  confidence: ConfidenceBand;
  /** Substrate honesty: how this flag was found. */
  source: "rules" | "ai" | "rules+ai";
}

export interface AnalysisResult {
  flags: Flag[];
  /** One plain-language header sentence. */
  summary: string;
  /** Whether the catastrophic scam-composite tier fired. */
  scamWarning: boolean;
  /** Exactly what checked the text — substrate honesty. */
  checkedBy: string;
  /** The standing disclaimer shown with every result. */
  disclaimer: string;
  inputChars: number;
}

type Provider = "openai" | "anthropic" | "fallback";

interface RawAiFlag {
  category_id: string;
  evidence?: string;
  confidence?: number;
  why?: string;
}

const DISCLAIMER =
  "I read only the words you pasted — I did not visit any website. I name patterns that are consistent with manipulation; I do not claim any specific person, product, or review is fraudulent. You decide.";

export class DetectionService {
  async analyze(rawText: string): Promise<AnalysisResult> {
    const text = rawText.slice(0, MAX_CHARS);
    const provider = this.getAIProvider();

    // 1. Deterministic pass — always runs, even with no AI key.
    const ruleFlags = scanWithRules(text);
    const byId = new Map<CategoryId, Flag>();
    for (const rf of ruleFlags) {
      byId.set(rf.categoryId, this.toFlag(rf.categoryId, rf.evidence, "likely", "rules"));
    }

    // 2. AI classification pass — adds the nuanced categories the regex can't see.
    let aiUsed = false;
    if (provider !== "fallback") {
      try {
        const aiFlags = await this.classifyWithAI(provider, text);
        aiUsed = true;
        for (const af of aiFlags) {
          const id = af.category_id as CategoryId;
          if (!CATEGORY_BY_ID[id]) continue; // ignore anything off-taxonomy
          const existing = byId.get(id);
          if (existing) {
            existing.source = "rules+ai";
            existing.confidence = "likely";
          } else {
            const band: ConfidenceBand = (af.confidence ?? 0.6) >= 0.65 ? "likely" : "possible";
            byId.set(id, this.toFlag(id, af.evidence?.trim() || null, band, "ai"));
          }
        }
      } catch (err) {
        // Graceful: fall back to rules-only rather than failing the user.
        console.error("AI classification failed; serving rules-only result:", err);
        aiUsed = false;
      }
    }

    // 3. Scam-composite (catastrophic tier) — co-occurrence, computed deterministically.
    const composite = detectScamComposite(text);
    if (composite.triggered) {
      byId.set(
        "scam_composite",
        this.toFlag("scam_composite", composite.reasons.join("; "), "likely", "rules"),
      );
    }

    const flags = this.sortFlags(Array.from(byId.values()));
    return {
      flags,
      summary: this.buildSummary(flags, composite.triggered),
      scamWarning: composite.triggered,
      checkedBy: this.describeCheckedBy(provider, aiUsed),
      disclaimer: DISCLAIMER,
      inputChars: text.length,
    };
  }

  private toFlag(
    id: CategoryId,
    evidence: string | null,
    confidence: ConfidenceBand,
    source: Flag["source"],
  ): Flag {
    const c = CATEGORY_BY_ID[id];
    return {
      categoryId: id,
      label: c.label,
      principle: c.principle,
      lever: PRINCIPLES[c.principle].lever,
      why: c.why,
      whatToDo: c.whatToDo,
      citation: c.citation,
      severity: c.severity,
      evidence,
      confidence,
      source,
    };
  }

  private sortFlags(flags: Flag[]): Flag[] {
    const sev: Record<Severity, number> = { danger: 0, caution: 1, info: 2 };
    return flags.sort((a, b) => sev[a.severity] - sev[b.severity]);
  }

  private buildSummary(flags: Flag[], scam: boolean): string {
    if (scam) {
      return "⚠ This matches a known scam pattern. Slow down — do not call, click, or pay anything right now.";
    }
    const n = flags.length;
    if (n === 0) {
      return "Nothing clearly manipulative stood out. Still trust your gut — and remember I only see the words you pasted.";
    }
    if (n === 1) {
      return "This uses 1 pressure tactic worth knowing about. You still get to decide, unhurried.";
    }
    return `This uses ${n} pressure tactics worth knowing about. You still get to decide, unhurried.`;
  }

  private describeCheckedBy(provider: Provider, aiUsed: boolean): string {
    if (provider === "fallback" || !aiUsed) {
      return "Checked by: plain rules only (no AI model configured). It still works — just less nuanced.";
    }
    return `Checked by: plain rules + an AI reader (${provider === "openai" ? OPENAI_MODEL : ANTHROPIC_MODEL}).`;
  }

  private getAIProvider(): Provider {
    if (process.env.OPENAI_API_KEY) return "openai";
    if (process.env.ANTHROPIC_API_KEY) return "anthropic";
    return "fallback";
  }

  private buildPrompt(text: string): { system: string; user: string } {
    const taxonomy = AI_CLASSIFIABLE.map((c) => `- ${c.id}: ${c.why}`).join("\n");
    const system =
      "You are a consumer-protection analyst who helps ordinary people spot manipulation. " +
      "You identify manipulation tactics in text the user received (an ad, message, product page, email, or reviews). " +
      "Rules you must follow: (1) Never assert that a specific person, product, claim, or review IS fake or fraudulent — only that the text shows patterns CONSISTENT WITH a tactic. " +
      "(2) Only use the category ids provided. (3) Be conservative — flag a category only when there is real textual evidence; do not invent tactics that aren't there. " +
      "(4) Output STRICT JSON only, no prose.";
    const user =
      `Tactic categories (id: what it is):\n${taxonomy}\n\n` +
      `Analyze the text below. For each tactic genuinely present, return an object with: ` +
      `"category_id" (one of the ids above), "evidence" (the short exact quoted span from the text that shows it), ` +
      `and "confidence" (0.0-1.0). Return JSON of the form {"flags": [ ... ]}. If nothing manipulative is present, return {"flags": []}.\n\n` +
      `TEXT:\n"""\n${text}\n"""`;
    return { system, user };
  }

  private async classifyWithAI(provider: Provider, text: string): Promise<RawAiFlag[]> {
    const { system, user } = this.buildPrompt(text);
    const json = provider === "openai" ? await this.callOpenAI(system, user) : await this.callAnthropic(system, user);
    return this.parseFlags(json);
  }

  private parseFlags(raw: string): RawAiFlag[] {
    let s = raw.trim();
    // Strip code fences if the model wrapped its JSON.
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) s = fence[1].trim();
    try {
      const parsed = JSON.parse(s);
      const arr = Array.isArray(parsed) ? parsed : parsed.flags;
      if (!Array.isArray(arr)) return [];
      return arr.filter((f): f is RawAiFlag => f && typeof f.category_id === "string");
    } catch {
      return [];
    }
  }

  private async callOpenAI(system: string, user: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });
    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  private async callAnthropic(system: string, user: string): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 800,
        temperature: 0,
        system,
        messages: [{ role: "user", content: `${user}\n\nRespond with JSON only.` }],
      }),
    });
    if (!response.ok) throw new Error(`Anthropic API error: ${response.statusText}`);
    const data = await response.json();
    return data.content?.[0]?.text ?? "";
  }
}

export const detectionService = new DetectionService();
