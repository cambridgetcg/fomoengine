import test from "node:test";
import assert from "node:assert/strict";
import { buildBrief, metricForInput, PHOTOGRAPHY_SAMPLE } from "./brief";
import { MECHANISMS } from "./mechanisms";
import { PLATFORMS } from "./platforms";
import { generatedBriefSchema, OBJECTIVE_IDS, readyBriefInputSchema } from "./workspace-schema";

const sample = () => ({ ...PHOTOGRAPHY_SAMPLE });

test("photography brief is deterministic and changes only its opening", () => {
  const brief = buildBrief(sample());
  assert.deepEqual(brief, buildBrief(sample()));
  assert.match(brief.experiment.control, /Set white balance/);
  assert.match(brief.experiment.treatment, /What should you check first.*Orange indoor portraits/);
  assert.match(brief.experiment.variable, /direct answer versus specific question/);
  assert.ok(brief.experiment.shared.some((line) => line.includes("Same CTA")));
  assert.ok(brief.experiment.shared.some((line) => line.includes("duration")));
  assert.match(brief.metric.name, /Chose-to-view/);
  assert.doesNotMatch(brief.metric.numerator, /average.*duration/i);
  assert.match(brief.sections.map((s) => s.body).join("\n"), /explicitly missing/);
});

test("every supported mechanism and surface generates a schema-valid brief for all objectives", () => {
  for (const mechanism of MECHANISMS) for (const platformId of mechanism.compatiblePlatformIds) for (const objective of OBJECTIVE_IDS) {
    const brief = buildBrief({ ...sample(), mechanismId: mechanism.id, platformId, objective });
    assert.equal(generatedBriefSchema.safeParse(brief).success, true, `${mechanism.id}/${platformId}/${objective}`);
    assert.notEqual(brief.experiment.control, brief.experiment.treatment);
  }
});

test("topic, audience, platform and objective affect useful output, not only a title", () => {
  const base = buildBrief(sample());
  const changed = buildBrief({ ...sample(), topic: "Lens cleaning", audience: "Camera repair trainees", takeaway: "Use the specified cleaning method", objective: "understanding" });
  assert.notEqual(changed.experiment.control, base.experiment.control);
  assert.match(changed.sections[0].body, /Camera repair trainees/);
  assert.notEqual(changed.metric.numerator, base.metric.numerator);
  assert.match(changed.experiment.shared.join("\n"), /prewritten scoring question/);
  for (const platform of PLATFORMS) {
    const brief = buildBrief({ ...sample(), platformId: platform.id });
    assert.deepEqual(brief.metric, platform.metric);
  }
});

test("social, Google SEO, TikTok Search, email and offer have distinct complete templates", () => {
  const text = (platformId: typeof PHOTOGRAPHY_SAMPLE.platformId) => buildBrief({ ...sample(), platformId }).sections.map((s) => `${s.heading}\n${s.body}`).join("\n");
  assert.match(text("youtube-shorts"), /Shorts sequence/);
  assert.match(text("youtube-home"), /thumbnail fixed/);
  assert.match(text("instagram-feed"), /alt text/);
  assert.match(text("google-search"), /question cluster[\s\S]*canonical/);
  assert.match(text("tiktok-search"), /Search-answer video[\s\S]*on-screen|On-screen/);
  assert.match(text("marketing-email"), /Shared preview[\s\S]*unsubscribe/);
  assert.match(text("marketing-offer"), /all-in price[\s\S]*cancellation\/refund/);
});

test("every mechanism materially changes the experiment and preserves its research boundary", () => {
  const variables = new Set(MECHANISMS.map((m) => buildBrief({ ...sample(), platformId: "instagram-feed", mechanismId: m.id }).experiment.variable));
  assert.equal(variables.size, 6);
  const moral = buildBrief({ ...sample(), mechanismId: "moral-emotion" });
  assert.match(moral.sections.at(-1)!.body, /Observational research/);
  assert.match(moral.experiment.shared.join("\n"), /nonpolitical/);
  const arousal = buildBrief({ ...sample(), mechanismId: "arousal" });
  assert.match(arousal.sections.at(-1)!.body, /Null findings/);
});

test("no proof or actual limit means a blocked treatment, never fabricated numbers", () => {
  const proof = buildBrief({ ...sample(), mechanismId: "social-proof" });
  assert.equal(proof.experiment.blocked, true);
  assert.match(proof.experiment.control, /TO FILL/);
  const scarcity = buildBrief({ ...sample(), platformId: "marketing-offer", mechanismId: "scarcity" });
  assert.equal(scarcity.experiment.blocked, true);
  assert.match(scarcity.experiment.treatment, /actual documented deadline/);
});

test("supplied proof stays identical and scarcity changes only the explanation", () => {
  const proofText = "A real participant's exact words; consent recorded; limited to this workshop.";
  const proof = buildBrief({ ...sample(), evidenceStatus: "provided", evidence: "Permission log and transcript", verifiedProof: proofText, mechanismId: "social-proof" });
  assert.equal(proof.experiment.blocked, false);
  assert.ok(proof.experiment.control.includes(proofText));
  assert.ok(proof.experiment.treatment.includes(proofText));
  const scarce = buildBrief({ ...sample(), platformId: "marketing-offer", mechanismId: "scarcity", evidenceStatus: "provided", evidence: "Venue contract", realLimit: "Booking closes 2026-10-01 at 17:00 UTC", limitReason: "The venue needs the final access list that evening", terms: "Full price and cancellation terms are supplied separately" });
  assert.equal(scarce.experiment.blocked, false);
  assert.match(scarce.experiment.control, /17:00 UTC/);
  assert.match(scarce.experiment.treatment, /17:00 UTC[\s\S]*final access list/);
  assert.match(scarce.experiment.shared.join("\n"), /material to an informed decision/);
});

test("required fields, evidence choice, consent and incompatible IDs fail clearly", () => {
  for (const patch of [{ topic: " " }, { audience: "" }, { nonpoliticalConfirmed: false }, { evidenceStatus: "provided" as const, evidence: " " }]) {
    assert.equal(readyBriefInputSchema.safeParse({ ...sample(), ...patch }).success, false);
  }
  assert.throws(() => buildBrief({ ...sample(), mechanismId: "scarcity" }));
  assert.equal(readyBriefInputSchema.safeParse({ ...sample(), platformId: "__proto__" }).success, false);
  assert.equal(readyBriefInputSchema.safeParse({ ...sample(), surprise: true }).success, false);
});

test("action objective uses linked units, understanding uses assessed participants", () => {
  const action = metricForInput({ ...sample(), objective: "useful-action", action: "Complete the white-balance task" });
  assert.match(action.numerator, /Complete the white-balance task/);
  assert.match(action.denominator, /eligible participants assigned and exposed/);
  assert.match(action.caveat, /leave results blank/);
  assert.match(metricForInput({ ...sample(), objective: "understanding" }).denominator, /participants assessed/);
});

test("untrusted text remains literal data and does not invoke a template engine", () => {
  const payload = '<img src=x onerror="alert(1)"> ${process.env.SECRET}';
  const brief = buildBrief({ ...sample(), topic: payload });
  assert.ok(brief.title.includes(payload));
  assert.ok(brief.experiment.control.includes(payload));
});
