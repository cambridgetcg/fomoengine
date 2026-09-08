import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { GET as catalogueGet, HEAD as catalogueHead } from "../../app/api/v1/attention-lab/catalogue/route";
import { POST as briefPost, GET as briefGet } from "../../app/api/v1/attention-lab/briefs/route";
import { POST as comparisonPost } from "../../app/api/v1/attention-lab/comparisons/route";
import { GET as openapiGet } from "../../app/api/v1/attention-lab/openapi.json/route";

const fixture = JSON.parse(readFileSync(new URL("../../fixtures/attention-lab/v1.json", import.meta.url), "utf8"));
const base = "http://127.0.0.1/api/v1/attention-lab";
const post = (operation: string, input: unknown) => new Request(`${base}/${operation}`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
});

test("Attention route catalogue → brief → comparison 同 pure core goldens 一致", async () => {
  const catalogue = await catalogueGet(new Request(`${base}/catalogue`));
  assert.equal(catalogue.status, 200);
  assert.deepEqual(await catalogue.json(), { success: true, data: fixture.catalogue });
  const brief = await briefPost(post("briefs", fixture.briefInput));
  assert.equal(brief.status, 200);
  assert.deepEqual(await brief.json(), { success: true, data: fixture.brief });
  const comparison = await comparisonPost(post("comparisons", { ...fixture.comparisonInput, metric: fixture.brief.brief.metric }));
  assert.equal(comparison.status, 200);
  assert.deepEqual(await comparison.json(), { success: true, data: fixture.comparison });
});

test("Attention route 保留 attestation／compatibility／counts 邊界", async () => {
  for (const patch of [
    { nonpoliticalConfirmed: false },
    { mechanismId: "unknown" },
    { mechanismId: "scarcity", platformId: "youtube-shorts" },
    { evidenceStatus: "provided", evidence: "" },
    { topic: "sample\ud800" },
  ]) {
    const response = await briefPost(post("briefs", { ...fixture.briefInput, ...patch }));
    assert.equal(response.status, 422);
    assert.equal((await response.json()).error.code, "INVALID_INPUT");
  }
  for (const counts of [
    { ...fixture.comparisonInput.counts, aOutcomes: "101", aEligible: "100" },
    { ...fixture.comparisonInput.counts, aOutcomes: "9007199254740992" },
  ]) assert.equal((await comparisonPost(post("comparisons", { ...fixture.comparisonInput, counts }))).status, 422);
  const badMetric = await comparisonPost(post("comparisons", { ...fixture.comparisonInput, metric: { ...fixture.comparisonInput.metric, name: "sample\ud800" } }));
  assert.equal(badMetric.status, 422);
  const astralMetric = await comparisonPost(post("comparisons", { ...fixture.comparisonInput, metric: { ...fixture.comparisonInput.metric, name: "sample𠮷" } }));
  assert.equal(astralMetric.status, 200);
  assert.equal((await astralMetric.json()).data.metric.name, "sample𠮷");
  const incomplete = await comparisonPost(post("comparisons", { ...fixture.comparisonInput, counts: { ...fixture.comparisonInput.counts, aOutcomes: "" } }));
  assert.equal((await incomplete.json()).data.comparison, null);
  assert.equal((await briefGet()).status, 405);
});

test("Attention machine schema 係 raw OpenAPI document，HEAD 無 body", async () => {
  const response = await openapiGet(new Request(`${base}/openapi.json`));
  const document = await response.json();
  assert.equal(response.status, 200);
  assert.equal(document.openapi, "3.1.0");
  assert.equal(document.success, undefined);
  assert.ok(document.paths["/api/v1/attention-lab/briefs"].post);
  assert.equal(await (await catalogueHead(new Request(`${base}/catalogue`, { method: "HEAD" }))).text(), "");
});

test("Attention routes import／執行唔拉入 Prisma、detector 或 provider，亦唔開 socket", () => {
  const script = `
    const assert = require('node:assert/strict');
    require('node:net').Socket.prototype.connect = () => { throw new Error('Unexpected network connection'); };
    (async () => {
      const root = './app/api/v1/attention-lab/';
      const fixture = require('./fixtures/attention-lab/v1.json');
      const catalogue = await require(root + 'catalogue/route.ts').GET(new Request('http://127.0.0.1/catalogue'));
      assert.equal(catalogue.status, 200);
      const brief = await require(root + 'briefs/route.ts').POST(new Request('http://127.0.0.1/briefs', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fixture.briefInput)}));
      assert.equal(brief.status, 200);
      const comparison = await require(root + 'comparisons/route.ts').POST(new Request('http://127.0.0.1/comparisons', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fixture.comparisonInput)}));
      assert.equal(comparison.status, 200);
      const loaded = Object.keys(require.cache);
      assert.equal(loaded.some(path => /lib\\/(prisma|services\\/detection)|node_modules\\/(?:@prisma|openai|@anthropic-ai|@clerk)\\//.test(path)), false);
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `;
  const result = spawnSync(process.execPath, ["--import", "tsx", "--eval", script], {
    cwd: process.cwd(), encoding: "utf8", timeout: 20_000,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: "production", DATABASE_URL: "postgresql://fixture:fixture@synthetic.rds.amazonaws.com.invalid:9/fixture", OPENAI_API_KEY: "SYNTHETIC-UNUSABLE", ANTHROPIC_API_KEY: "SYNTHETIC-UNUSABLE" },
  });
  assert.equal(result.status, 0, result.stderr || String(result.error ?? ""));
});
