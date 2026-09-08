import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { CategoryId } from "../services/detection/taxonomy";
import type { Claim, SourceId } from "./schema";
import { EVIDENCE_KINDS, EVIDENCE_LABELS, MECHANISM_IDS, PLATFORM_IDS, SOURCE_IDS } from "./schema";
import { MECHANISMS, MECHANISM_BY_ID, getMechanism } from "./mechanisms";
import { PLATFORMS, PLATFORM_BY_ID, getPlatform } from "./platforms";
import { SOURCES, SOURCE_BY_ID, getSource } from "./sources";
import { mechanismForCategory } from "./detector-links";

function nonempty(value: string, label: string) {
  assert.ok(value.trim().length > 0, `${label} must not be blank`);
}

function unique(values: readonly string[], label: string) {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`);
}

function citations(ids: readonly SourceId[], label: string) {
  assert.ok(ids.length > 0, `${label} needs citations`);
  unique(ids, label);
  for (const id of ids) assert.ok(getSource(id), `${label}: unknown source ${id}`);
}

const allClaims: readonly Claim[] = [
  ...MECHANISMS.flatMap((mechanism) => mechanism.claims),
  ...PLATFORMS.flatMap((platform) => platform.signals),
];

test("catalogue has the six approved mechanism IDs, eight surfaces and thirteen sources", () => {
  assert.deepEqual(MECHANISMS.map(({ id }) => id), [...MECHANISM_IDS]);
  assert.deepEqual(PLATFORMS.map(({ id }) => id), [...PLATFORM_IDS]);
  assert.deepEqual(SOURCES.map(({ id }) => id), [...SOURCE_IDS]);
  assert.equal(MECHANISMS.length, 6);
  assert.equal(PLATFORMS.length, 8);
  assert.equal(SOURCES.length, 13);
  unique(MECHANISMS.map(({ id }) => id), "Mechanism IDs");
  unique(PLATFORMS.map(({ id }) => id), "Platform IDs");
  unique(SOURCES.map(({ id }) => id), "Source IDs");
  for (const { id } of [...MECHANISMS, ...PLATFORMS, ...SOURCES]) {
    assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
});

test("named maps and safe lookup helpers resolve the original records", () => {
  for (const mechanism of MECHANISMS) {
    assert.equal(MECHANISM_BY_ID[mechanism.id], mechanism);
    assert.equal(getMechanism(mechanism.id), mechanism);
  }
  for (const platform of PLATFORMS) {
    assert.equal(PLATFORM_BY_ID[platform.id], platform);
    assert.equal(getPlatform(platform.id), platform);
  }
  for (const source of SOURCES) {
    assert.equal(SOURCE_BY_ID[source.id], source);
    assert.equal(getSource(source.id), source);
  }
});

test("unknown, malformed and inherited-property lookups remain unsupported", () => {
  for (const id of ["", "unknown", "constructor", "toString", "__proto__", "hasOwnProperty", "Curiosity-gap", " curiosity-gap", "curiosity-gap/", "<script>", "scam_composite"]) {
    assert.equal(getMechanism(id), undefined, id);
    assert.equal(getPlatform(id), undefined, id);
    assert.equal(getSource(id), undefined, id);
  }
});

test("sources expose honest bibliographic fields, review scope and safe public URLs", () => {
  unique(SOURCES.map(({ url }) => url), "Source URLs");
  for (const source of SOURCES) {
    nonempty(source.title, `${source.id} title`);
    nonempty(source.publisher, `${source.id} publisher`);
    nonempty(source.context, `${source.id} context`);
    nonempty(source.retrievalLimitations, `${source.id} retrieval limitations`);
    assert.equal(source.reviewedAt, "2026-09-08");
    if (source.publishedAt !== null) {
      assert.match(source.publishedAt, /^\d{4}(?:-\d{2}(?:-\d{2})?)?$/);
      assert.ok(source.publishedAt <= source.reviewedAt);
    }
    const url = new URL(source.url);
    assert.equal(url.protocol, "https:");
    assert.equal(url.username, "");
    assert.equal(url.password, "");
    assert.ok(["doi.org", "ai.meta.com", "support.tiktok.com", "support.google.com", "developers.google.com"].includes(url.hostname));
  }
});

test("registry preserves the exact approved source URLs", () => {
  assert.deepEqual(SOURCES.map(({ url }) => url), [
    "https://doi.org/10.1038/s41598-024-81575-9",
    "https://doi.org/10.1177/09567976241257255",
    "https://doi.org/10.1073/pnas.1618923114",
    "https://doi.org/10.1038/s41562-023-01538-4",
    "https://doi.org/10.1126/science.1121066",
    "https://doi.org/10.1016/0167-4870(94)90007-8",
    "https://ai.meta.com/tools/system-cards/instagram-feed-ranking/",
    "https://support.tiktok.com/en/using-tiktok/exploring-videos/how-tiktok-recommends-content",
    "https://support.google.com/youtube/answer/11914225?hl=en",
    "https://support.google.com/youtube/answer/16089387?hl=en",
    "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    "https://developers.google.com/search/docs/crawling-indexing/canonicalization",
    "https://support.google.com/trends/answer/4365533?hl=en",
  ]);
});

test("every claim has its own evidence kind, known citations, context and limitations", () => {
  unique(allClaims.map(({ id }) => id), "Claim IDs");
  for (const claim of allClaims) {
    nonempty(claim.id, "Claim ID");
    nonempty(claim.text, `${claim.id} text`);
    assert.ok(EVIDENCE_KINDS.includes(claim.kind), claim.id);
    nonempty(EVIDENCE_LABELS[claim.kind], `${claim.id} evidence label`);
    citations(claim.sourceIds, claim.id);
    nonempty(claim.context, `${claim.id} context`);
    assert.ok(claim.limitations.length > 0, `${claim.id} needs limitations`);
    for (const limit of claim.limitations) nonempty(limit, claim.id);
  }
  for (const record of [...MECHANISMS, ...PLATFORMS]) {
    citations(record.sourceIds, record.id);
    const claims = "claims" in record ? record.claims : record.signals;
    for (const sourceId of claims.flatMap(({ sourceIds }) => sourceIds)) {
      assert.ok(record.sourceIds.includes(sourceId), `${record.id} must list claim source ${sourceId}`);
    }
  }
});

test("mechanisms contain usable examples, choices, countermeasures and a one-variable experiment", () => {
  for (const mechanism of MECHANISMS) {
    for (const value of [mechanism.name, mechanism.summary, mechanism.emotion, mechanism.countermeasure]) nonempty(value, mechanism.id);
    for (const values of [mechanism.howItWorks, mechanism.honestUse, mechanism.tradeoffs]) {
      assert.ok(values.length > 0, mechanism.id);
      for (const value of values) nonempty(value, mechanism.id);
    }
    for (const value of Object.values(mechanism.example)) nonempty(value, `${mechanism.id} example`);
    assert.notEqual(mechanism.example.honest, mechanism.example.pressure);
    const experiment = mechanism.experiment;
    for (const value of [experiment.question, experiment.variable, experiment.control, experiment.treatment, experiment.readout, experiment.limitations]) nonempty(value, `${mechanism.id} experiment`);
    assert.notEqual(experiment.control, experiment.treatment);
    assert.ok(experiment.holdConstant.length > 0);
    assert.ok(mechanism.claims.some(({ kind }) => kind !== "hypothesis"), `${mechanism.id} research basis`);
    assert.ok(mechanism.claims.some(({ kind }) => kind === "hypothesis"), `${mechanism.id} application boundary`);
  }
});

test("compatibility points only to real platforms, with a usable option on every platform", () => {
  for (const mechanism of MECHANISMS) {
    assert.ok(mechanism.compatiblePlatformIds.length > 0);
    unique(mechanism.compatiblePlatformIds, `${mechanism.id} compatibility`);
    for (const id of mechanism.compatiblePlatformIds) assert.ok(getPlatform(id), id);
  }
  for (const platform of PLATFORMS) {
    assert.ok(MECHANISMS.some(({ compatiblePlatformIds }) => compatiblePlatformIds.includes(platform.id)), platform.id);
  }
  assert.ok(MECHANISM_BY_ID["curiosity-gap"].compatiblePlatformIds.includes("youtube-shorts"));
  assert.ok(MECHANISM_BY_ID["social-proof"].compatiblePlatformIds.includes("marketing-offer"));
  assert.ok(MECHANISM_BY_ID["scarcity"].compatiblePlatformIds.includes("marketing-email"));
  assert.ok(!MECHANISM_BY_ID["scarcity"].compatiblePlatformIds.includes("google-search"));
});

test("platforms carry practical choices, metric units, quality guardrails and confounders", () => {
  for (const platform of PLATFORMS) {
    for (const value of [platform.name, platform.channel, platform.surface, platform.summary, platform.rankingDisclosure]) nonempty(value, platform.id);
    for (const values of [platform.practicalChoices, platform.qualityGuardrails, platform.confounders]) {
      assert.ok(values.length > 0, platform.id);
      for (const value of values) nonempty(value, platform.id);
    }
    for (const value of Object.values(platform.metric)) nonempty(value, `${platform.id} metric`);
    assert.notEqual(platform.metric.numerator, platform.metric.denominator);
    assert.ok(platform.signals.length > 0);
  }
});

test("email and offer are strategy channels with hypotheses, not official ranking disclosures", () => {
  for (const id of ["marketing-email", "marketing-offer"] as const) {
    const platform = PLATFORM_BY_ID[id];
    assert.equal(platform.kind, "strategy-channel");
    assert.match(platform.rankingDisclosure, /not an official ranking|no single official rank/i);
    assert.ok(platform.signals.every(({ kind }) => kind === "hypothesis"));
  }
  for (const platform of PLATFORMS.filter(({ kind }) => kind === "ranked-surface")) {
    assert.ok(platform.signals.some(({ kind }) => kind === "official-disclosure"));
  }
});

test("headline RCT descriptions do not isolate a word attribute or promise causal transfer", () => {
  for (const id of ["curiosity-gap", "negative-framing"] as const) {
    const claim = MECHANISM_BY_ID[id].claims.find(({ kind }) => kind === "experimental");
    assert.ok(claim);
    const boundary = claim.limitations.join(" ");
    assert.match(boundary, /whole headline alternatives|headline packages/);
    assert.match(boundary, /does not.*isolate.*word attribute|does not independently isolate a word attribute/);
    assert.match(boundary, /satisfaction|trust/);
  }
  assert.match(SOURCE_BY_ID["negative-headlines-2023"].context, /Upworthy/);
  assert.match(SOURCE_BY_ID["negative-headlines-2023"].retrievalLimitations, /does not independently isolate/);
});

test("arousal null results are visible without becoming a blanket disproof", () => {
  const arousal = MECHANISM_BY_ID.arousal;
  const research = arousal.claims.find(({ kind }) => kind === "experimental");
  assert.ok(research);
  assert.match(arousal.summary, /null findings/i);
  assert.match(research.text, /did not detect an effect/);
  assert.match(research.text, /willingness, not actual platform sharing/);
  assert.match(research.limitations.join(" "), /not a blanket disproof/);
  assert.match(arousal.experiment.limitations, /not proof.*arousal/);
  assert.equal(SOURCE_BY_ID["arousal-replication-2024"].title, "Does Physiological Arousal Increase Social Transmission of Information?");
});

test("moral emotion remains observational political research, not a targeting recipe", () => {
  const mechanism = MECHANISM_BY_ID["moral-emotion"];
  const research = mechanism.claims.filter(({ kind }) => kind !== "hypothesis");
  assert.equal(research.length, 1);
  assert.equal(research[0].kind, "observational");
  assert.match(research[0].context, /political/i);
  assert.match(research[0].limitations.join(" "), /not.*targeted political strategy/);
  assert.match(mechanism.experiment.limitations, /nonpolitical/);
  assert.match(mechanism.experiment.limitations, /no sensitive-audience inference or political targeting/i);
});

test("historical Meta and index-only TikTok limitations remain visible at point of use", () => {
  const meta = SOURCE_BY_ID["meta-feed-2022"];
  assert.equal(meta.publishedAt, "2022");
  assert.match(meta.retrievalLimitations, /not a freshly verified 2026/);
  assert.match(PLATFORM_BY_ID["instagram-feed"].rankingDisclosure, /2022/);
  assert.match(PLATFORM_BY_ID["instagram-feed"].rankingDisclosure, /not Reels or Explore/);
  assert.match(SOURCE_BY_ID["tiktok-recommendations"].retrievalLimitations, /official index only/i);
  for (const id of ["tiktok-for-you", "tiktok-search"] as const) {
    const platform = PLATFORM_BY_ID[id];
    assert.match(platform.rankingDisclosure, /official index only/i);
    assert.match(platform.rankingDisclosure, /access-restricted/);
    for (const claim of platform.signals.filter(({ kind }) => kind === "official-disclosure")) {
      assert.match(claim.limitations.join(" "), /index only/i);
    }
  }
});

test("YouTube surfaces retain different metrics and missing Search denominators are not fabricated", () => {
  assert.equal(PLATFORM_BY_ID["youtube-home"].metric.name, "Home impression click-through rate");
  assert.equal(PLATFORM_BY_ID["youtube-shorts"].metric.name, "Chose-to-view rate");
  assert.notEqual(PLATFORM_BY_ID["youtube-home"].metric.denominator, PLATFORM_BY_ID["youtube-shorts"].metric.denominator);
  assert.match(PLATFORM_BY_ID["tiktok-search"].metric.caveat, /missing exposure data means this rate is unavailable/i);
  assert.match(PLATFORM_BY_ID["google-search"].metric.caveat, /not a randomized causal test/);
  assert.match(SOURCE_BY_ID["google-trends-faq"].context, /not absolute search volumes/);
  assert.match(SOURCE_BY_ID["google-trends-faq"].retrievalLimitations, /not automatically comparable/);
});

test("detector bridge maps only relevant scarcity and social-proof categories", () => {
  assert.equal(mechanismForCategory("manufactured_urgency"), "scarcity");
  assert.equal(mechanismForCategory("fake_scarcity"), "scarcity");
  assert.equal(mechanismForCategory("false_exclusivity"), "scarcity");
  assert.equal(mechanismForCategory("fake_social_proof"), "social-proof");
  const unsupported: CategoryId[] = ["confirmshaming", "drip_pricing", "preselection", "sneaking", "forced_continuity", "obstruction", "disguised_ads", "misdirection", "scam_composite"];
  for (const id of unsupported) assert.equal(mechanismForCategory(id), undefined, id);
  for (const id of ["unknown", "constructor", "__proto__", "toString"]) {
    assert.equal(mechanismForCategory(id as CategoryId), undefined, id);
  }
});

test("detector bridge imports only types and cannot pull provider code into a client bundle", () => {
  const bridge = readFileSync(new URL("./detector-links.ts", import.meta.url), "utf8");
  const imports = bridge.match(/^import .*$/gm) ?? [];
  assert.equal(imports.length, 2);
  assert.ok(imports.every((statement) => statement.startsWith("import type ")));
  assert.match(bridge, /import type \{ CategoryId \} from "\.\.\/services\/detection\/taxonomy"/);
});
