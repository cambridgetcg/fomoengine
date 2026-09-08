import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

const fixture = JSON.parse(readFileSync(join(__dirname, "../fixtures/attention-lab/v1.json"), "utf8"));
const base = "/api/v1/attention-lab";

test("Attention API 真 HTTP catalogue → brief → comparison 保留同一份研究與 metric", async ({ request }) => {
  const catalogue = await request.get(`${base}/catalogue`);
  expect(catalogue.status()).toBe(200);
  expect(await catalogue.json()).toEqual({ success: true, data: fixture.catalogue });
  const brief = await request.post(`${base}/briefs`, { data: fixture.briefInput });
  expect(brief.status()).toBe(200);
  const artifact = (await brief.json()).data;
  expect(artifact).toEqual(fixture.brief);
  const comparison = await request.post(`${base}/comparisons`, { data: { ...fixture.comparisonInput, metric: artifact.brief.metric } });
  expect(comparison.status()).toBe(200);
  expect(await comparison.json()).toEqual({ success: true, data: fixture.comparison });
  expect(comparison.headers()["cache-control"]).toContain("no-store");
  expect(comparison.headers()["set-cookie"]).toBeUndefined();
  expect(comparison.headers()["access-control-allow-credentials"]).toBeUndefined();
});

test("Attention API 真 HTTP raw schema／preflight／invalid inputs 唔繞過界線", async ({ request }) => {
  const document = await request.get(`${base}/openapi.json`);
  expect(document.status()).toBe(200);
  expect((await document.json()).openapi).toBe("3.1.0");
  expect((await request.head(`${base}/catalogue`)).status()).toBe(200);
  const allowed = await request.fetch(`${base}/briefs`, { method: "OPTIONS", headers: { Origin: "https://project.example", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" } });
  expect(allowed.status()).toBe(204);
  const credentials = await request.fetch(`${base}/briefs`, { method: "OPTIONS", headers: { Origin: "https://project.example", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization" } });
  expect(credentials.status()).toBe(403);
  expect((await request.get(`${base}/briefs`)).status()).toBe(405);
  const missingConfirmation = await request.post(`${base}/briefs`, { data: { ...fixture.briefInput, nonpoliticalConfirmed: false } });
  expect(missingConfirmation.status()).toBe(422);
  expect((await missingConfirmation.json()).error.code).toBe("INVALID_INPUT");
  const tooLarge = await request.post(`${base}/briefs`, { data: "x".repeat(65537), headers: { "Content-Type": "application/json" } });
  expect(tooLarge.status()).toBe(413);
  const unknown = await request.post(`${base}/comparisons`, { data: { ...fixture.comparisonInput, counts: { ...fixture.comparisonInput.counts, aOutcomes: "" } } });
  expect((await unknown.json()).data.comparison).toBeNull();
  for (const artifact of Object.values(fixture.blockedBriefs) as { brief: { input: unknown } }[]) {
    const blocked = await request.post(`${base}/briefs`, { data: artifact.brief.input });
    expect(blocked.status()).toBe(200);
    expect((await blocked.json()).data.brief.experiment.blocked).toBe(true);
  }
});
