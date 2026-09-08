// 呢個 registry 同舊 detector taxonomy 分開；研究標籤唔繼承 detector 嘅斷言。
export const MECHANISM_IDS = [
  "curiosity-gap",
  "social-proof",
  "scarcity",
  "negative-framing",
  "arousal",
  "moral-emotion",
] as const;

export type MechanismId = (typeof MECHANISM_IDS)[number];

export const PLATFORM_IDS = [
  "instagram-feed",
  "tiktok-for-you",
  "tiktok-search",
  "youtube-home",
  "youtube-shorts",
  "google-search",
  "marketing-email",
  "marketing-offer",
] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];

export const EVIDENCE_KINDS = [
  "official-disclosure",
  "experimental",
  "observational",
  "hypothesis",
] as const;

export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const EVIDENCE_LABELS: Readonly<Record<EvidenceKind, string>> = {
  "official-disclosure": "Official disclosure",
  experimental: "Experimental research",
  observational: "Observational research",
  hypothesis: "Hypothesis",
};

export const SOURCE_IDS = [
  "curiosity-2025",
  "arousal-replication-2024",
  "moral-emotion-2017",
  "negative-headlines-2023",
  "social-influence-2006",
  "scarcity-1994",
  "meta-feed-2022",
  "tiktok-recommendations",
  "youtube-shorts-discovery",
  "youtube-recommendations",
  "google-people-first",
  "google-canonicalization",
  "google-trends-faq",
] as const;

export type SourceId = (typeof SOURCE_IDS)[number];

export interface Source {
  readonly id: SourceId;
  readonly title: string;
  readonly url: string;
  readonly publisher: string;
  // 只記已知精度（YYYY / YYYY-MM / YYYY-MM-DD）；唔用 review 日期扮 publication 日期。
  readonly publishedAt: string | null;
  // 呢個係本地編輯 review，唔係聲稱當日成功抓取全文。
  readonly reviewedAt: "2026-09-08";
  readonly context: string;
  readonly retrievalLimitations: string;
}

export interface Claim {
  readonly id: string;
  readonly text: string;
  readonly kind: EvidenceKind;
  readonly sourceIds: readonly SourceId[];
  readonly context: string;
  readonly limitations: readonly string[];
}

export interface MechanismExample {
  readonly honest: string;
  readonly pressure: string;
  readonly distinction: string;
}

export interface MechanismExperiment {
  readonly question: string;
  readonly variable: string;
  readonly control: string;
  readonly treatment: string;
  readonly holdConstant: readonly string[];
  readonly readout: string;
  readonly limitations: string;
}

export interface Mechanism {
  readonly id: MechanismId;
  readonly name: string;
  readonly summary: string;
  readonly emotion: string;
  readonly howItWorks: readonly string[];
  readonly example: MechanismExample;
  readonly claims: readonly Claim[];
  readonly honestUse: readonly string[];
  readonly countermeasure: string;
  readonly tradeoffs: readonly string[];
  readonly experiment: MechanismExperiment;
  readonly compatiblePlatformIds: readonly PlatformId[];
  readonly sourceIds: readonly SourceId[];
}

export interface MetricDefinition {
  readonly name: string;
  readonly numerator: string;
  readonly denominator: string;
  readonly caveat: string;
}

export interface Platform {
  readonly id: PlatformId;
  readonly name: string;
  readonly channel: "social" | "search" | "email" | "offer";
  readonly surface: string;
  readonly kind: "ranked-surface" | "strategy-channel";
  readonly summary: string;
  readonly rankingDisclosure: string;
  readonly signals: readonly Claim[];
  readonly practicalChoices: readonly string[];
  readonly metric: MetricDefinition;
  readonly qualityGuardrails: readonly string[];
  readonly confounders: readonly string[];
  readonly sourceIds: readonly SourceId[];
}
