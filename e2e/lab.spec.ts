import { readFile } from "node:fs/promises";
import { test as base, expect, type Page } from "@playwright/test";

const STORAGE_KEY = "fomoengine:attention-lab:workspace:v1";
const SAMPLE_TOPIC = "Orange indoor portraits";
const SAMPLE_METRIC = "Primary metric: Chose-to-view rate";
const SYNTHETIC_NOTE = {
  sourceUrl: "https://example.invalid/research?fixture=manual-notebook",
  term: "LAB-SYNTHETIC indoor lighting — search term",
  geography: "United Kingdom",
  startDate: "2024-02-29",
  endDate: "2024-03-01",
  searchSurface: "YouTube Search",
  comparison: "Synthetic test fixture only; no live query or comparator was inspected.",
  observation: "Synthetic notebook exercise, not observed demand. Volume, cause and commercial outcomes are unknown.",
};

// 只觀察真實 browser requests，唔攔截、唔 mock；每個 test 都用獨立 context。
const test = base.extend<{ localOnlyAudit: void }>({
  localOnlyAudit: [async ({ context, baseURL }, use) => {
    const origin = new URL(baseURL!).origin;
    const external: string[] = [];
    const writes: string[] = [];
    const leakedInputs: string[] = [];
    const sockets: string[] = [];
    context.on("request", (request) => {
      const url = new URL(request.url());
      if (["http:", "https:"].includes(url.protocol) && url.origin !== origin) external.push(request.url());
      if (!["GET", "HEAD"].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
      if (decodeURIComponent(url.search).includes("LAB-SYNTHETIC")) leakedInputs.push(request.url());
    });
    context.on("page", (page) => page.on("websocket", (socket) => sockets.push(socket.url())));
    await use();
    expect(external, "No provider, analytics or supplied-source request").toEqual([]);
    expect(writes, "Lab and Trends never submit content").toEqual([]);
    expect(leakedInputs, "Draft text must not become URL parameters").toEqual([]);
    expect(sockets, "No content streaming connection").toEqual([]);
  }, { auto: true }],
});

function button(page: Page, name: string) {
  return page.getByRole("button", { name, exact: true });
}
function workspaceStatus(page: Page) {
  return page.getByRole("region", { name: "Workspace storage and exports" }).getByRole("status");
}
async function navigate(page: Page, name: "Atlas" | "Lab" | "Trends") {
  await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${name.toLowerCase()}$`));
}
async function sample(page: Page) {
  await page.goto("/lab");
  await button(page, "Try the photography brief").click();
  await expect(page.locator("#lab-markdown")).toBeVisible();
  await expect(page.locator("#lab-topic")).toHaveValue(SAMPLE_TOPIC);
}

// 對每次原生 confirm 明確 accept / dismiss，唔用全域自動接受掩蓋意外替換。
async function confirmAction(page: Page, action: () => Promise<unknown>, message: RegExp, accept: boolean) {
  const pendingDialog = page.waitForEvent("dialog", { timeout: 10_000 });
  const pendingAction = action();
  const dialog = await pendingDialog;
  const actualMessage = dialog.message();
  const actualType = dialog.type();
  if (accept) await dialog.accept();
  else await dialog.dismiss();
  await pendingAction;
  expect(actualType).toBe("confirm");
  expect(actualMessage).toMatch(message);
}
async function regenerate(page: Page, accept = true) {
  await confirmAction(page, () => button(page, "Regenerate brief").click(), /Regenerate from the current inputs\?/, accept);
}
async function fillCounts(page: Page, aOutcomes: string, aEligible: string, bOutcomes: string, bEligible: string) {
  for (const [field, value] of Object.entries({ aOutcomes, aEligible, bOutcomes, bEligible })) {
    await page.locator(`#result-${field}`).fill(value);
  }
}
async function expectCounts(page: Page, values: [string, string, string, string]) {
  for (const [index, field] of ["aOutcomes", "aEligible", "bOutcomes", "bEligible"].entries()) {
    await expect(page.locator(`#result-${field}`)).toHaveValue(values[index]);
  }
}
function comparisonValue(page: Page, label: string) {
  return page.getByTestId("comparison-results").getByText(label, { exact: true }).locator("..").locator("dd");
}
function variant(page: Page, name: "A — control" | "B — treatment") {
  return page.locator("#brief").getByRole("heading", { name, exact: true }).locator("..");
}
async function savedCopy(page: Page) {
  return page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
}
async function storageSnapshot(page: Page) {
  return page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
}
async function download(page: Page, name: "Export JSON" | "Download Markdown") {
  const [file] = await Promise.all([page.waitForEvent("download"), button(page, name).click()]);
  expect(file.suggestedFilename()).toBe(`fomoengine-attention-lab-v1.${name === "Export JSON" ? "json" : "md"}`);
  expect(await file.failure()).toBeNull();
  const path = await file.path();
  expect(path).not.toBeNull();
  return readFile(path!);
}
async function fillTrend(page: Page, note = SYNTHETIC_NOTE) {
  for (const [field, value] of Object.entries(note)) await page.locator(`#trend-${field}`).fill(value);
}
async function importBuffer(page: Page, buffer: Buffer, name = "synthetic-workspace.json") {
  await page.locator("#workspace-import").setInputFiles({ name, mimeType: "application/json", buffer });
}
async function fillRequiredBrief(page: Page) {
  await page.locator("#lab-topic").fill("LAB-SYNTHETIC white-balance workshop");
  await page.locator("#lab-audience").fill("Beginner photographers choosing a practical, nonpolitical lesson");
  await page.locator("#lab-takeaway").fill("Compare the same scene with two white-balance settings.");
  await page.locator("#lab-nonpoliticalConfirmed").check();
}

test.describe("Attention Lab — real local workspace journeys", () => {
  test.describe.configure({ mode: "serial", timeout: 60_000 });

  test("Atlas search and filters lead through stable IDs without replacing a touched draft", async ({ page }, testInfo) => {
    await page.goto("/");
    await page.screenshot({ path: testInfo.outputPath("home.png"), fullPage: true });
    await navigate(page, "Atlas");
    const cards = page.getByRole("article");
    await expect(cards.first()).toBeVisible();
    const originalCount = await cards.count();
    expect(originalCount).toBeGreaterThan(1);
    await page.getByLabel("Find a mechanism", { exact: true }).fill("  scarcity  ");
    await page.getByLabel("Surface or channel", { exact: true }).selectOption("instagram-feed");
    await page.getByLabel("Contains evidence type", { exact: true }).selectOption("experimental");
    await expect(cards).toHaveCount(1);
    await expect(page.getByRole("status")).toHaveText("1 mechanism matching your filters");
    await expect(cards.getByRole("link", { name: "Try in Lab", exact: true })).toHaveAttribute("href", "/lab?mechanism=scarcity&platform=instagram-feed");

    await page.locator("#atlas-search").fill("LAB-SYNTHETIC no such mechanism");
    await expect(page.getByRole("heading", { name: "No matching mechanism.", exact: true })).toBeVisible();
    await button(page, "Reset search & filters").click();
    await expect(cards).toHaveCount(originalCount);
    await expect(page.locator("#atlas-search")).toHaveValue("");
    await expect(page.locator("#atlas-platform")).toHaveValue("");
    await expect(page.locator("#atlas-evidence")).toHaveValue("");

    await page.locator("#atlas-search").fill("scarcity");
    await page.locator("#atlas-platform").selectOption("instagram-feed");
    await page.locator("#atlas-evidence").selectOption("experimental");
    await cards.getByRole("link", { name: "Scarcity", exact: true }).click();
    await expect(page).toHaveURL(/\/atlas\/scarcity$/);
    const build = page.getByRole("link", { name: "Build an experiment", exact: true });
    await expect(build).toHaveAttribute("href", "/lab?mechanism=scarcity");
    await build.click();
    await expect(page).toHaveURL(/\/lab\?mechanism=scarcity$/);
    await expect(page.locator("#lab-mechanismId")).toHaveValue("scarcity");
    // Scarcity 唔適用預設 Shorts；首次 ID prefill 要揀到兼容 surface。
    await expect(page.locator("#lab-platformId")).toHaveValue("instagram-feed");
    await expect(page.locator("#lab-topic")).toHaveValue("");
    await page.locator("#lab-topic").fill("LAB-SYNTHETIC preserve this topic");

    for (const choice of ["Keep current selections", "Apply linked selections"]) {
      await navigate(page, "Atlas");
      await page.locator("#atlas-search").fill("curiosity");
      await page.getByRole("link", { name: "Curiosity gap", exact: true }).click();
      await page.getByRole("link", { name: "Build an experiment", exact: true }).click();
      const request = page.getByRole("region", { name: "Requested catalogue selections" });
      await expect(request).toContainText("Your active draft was not replaced.");
      await expect(page.locator("#lab-mechanismId")).toHaveValue("scarcity");
      await button(page, choice).click();
      await expect(request).toHaveCount(0);
      await expect(page.locator("#lab-topic")).toHaveValue("LAB-SYNTHETIC preserve this topic");
    }
    await expect(page.locator("#lab-mechanismId")).toHaveValue("curiosity-gap");
    await expect(page.locator("#lab-platformId")).toHaveValue("instagram-feed");
    expect(await savedCopy(page)).toBeNull();
  });

  test("photography generates editable literal Markdown, stays in memory, and never autosaves", async ({ page }, testInfo) => {
    await page.goto("/lab");
    const initialStorage = await storageSnapshot(page);
    await expect(page.locator("#lab-platformId")).toHaveValue("youtube-shorts");
    await expect(page.locator("#lab-objective")).toHaveValue("surface-response");
    await expect(page.locator("#lab-evidenceStatus")).toHaveValue("missing");
    await expect(page.locator("#lab-nonpoliticalConfirmed")).not.toBeChecked();
    await expect(button(page, "Download Markdown")).toBeDisabled();
    await button(page, "Try the photography brief").click();
    const editor = page.getByLabel("Edited brief (Markdown)", { exact: true });
    await expect(editor).toHaveValue(/Shorts sequence:/);
    await expect(editor).toHaveValue(/supporting evidence, source and limits are explicitly missing/);
    await expect(page.locator("#brief-heading")).toBeFocused();
    await expect(variant(page, "A — control")).toContainText("Set white balance for the actual light");
    await expect(variant(page, "B — treatment")).toContainText("What should you check first for Orange indoor portraits?");
    await expectCounts(page, ["", "", "", ""]);
    await expect(page.getByTestId("comparison-results")).toHaveCount(0);

    const edited = `${await editor.inputValue()}\n\nLAB-SYNTHETIC manual edit\n<script>document.body.dataset.labInjected = 'yes'</script>`;
    await editor.fill(edited);
    expect(await page.evaluate(() => document.body.dataset.labInjected)).toBeUndefined();
    await page.screenshot({ path: testInfo.outputPath("lab.png"), fullPage: true });
    await navigate(page, "Trends");
    await page.locator("#trend-term").fill("LAB-SYNTHETIC unfinished note");
    await navigate(page, "Lab");
    await expect(editor).toHaveValue(edited);
    await confirmAction(page, () => button(page, "Try the photography brief").click(), /Replace the current inputs and edited brief/, false);
    await expect(editor).toHaveValue(edited);
    await confirmAction(page, () => button(page, "Try the photography brief").click(), /Replace the current inputs and edited brief/, true);
    await expect(editor).not.toHaveValue(edited);
    expect(await storageSnapshot(page)).toEqual(initialStorage);

    await page.reload();
    await expect(page.locator("#lab-topic")).toHaveValue("");
    await expect(editor).toHaveCount(0);
    await button(page, "Load saved draft").click();
    await expect(workspaceStatus(page)).toContainText("No saved Attention Lab draft on this device.");
    await navigate(page, "Trends");
    await expect(page.locator("#trend-term")).toHaveValue("");
    expect(await storageSnapshot(page)).toEqual(initialStorage);
  });

  test("required evidence and confirmation gate four genuinely different channel briefs", async ({ page }) => {
    await page.goto("/lab");
    await page.locator("#lab-topic").fill("");
    await page.locator("#lab-audience").fill("");
    await page.locator("#lab-evidenceStatus").selectOption("provided");
    await page.locator("#lab-evidence").fill("");
    await page.locator("#lab-nonpoliticalConfirmed").uncheck();
    await button(page, "Generate brief").click();
    await expect(page.locator("#lab-topic")).toBeFocused();
    for (const field of ["topic", "audience", "evidence", "nonpoliticalConfirmed"]) {
      await expect(page.locator(`#lab-${field}`)).toHaveAttribute("aria-invalid", "true");
      await expect(page.locator(`#lab-${field}-error`)).toBeVisible();
    }
    await page.locator("#lab-topic").fill("LAB-SYNTHETIC white-balance workshop");
    await page.locator("#lab-audience").fill("Beginner photographers learning a practical nonpolitical lesson");
    await button(page, "Generate brief").click();
    await expect(page.locator("#lab-evidence")).toBeFocused();
    await expect(page.locator("#lab-evidence-error")).toContainText("Supply evidence and its source");
    await page.locator("#lab-evidence").fill("Synthetic test fixture only: a same-scene demonstration protocol dated 2024-03-01. No real result or customer evidence is asserted.");
    await button(page, "Generate brief").click();
    await expect(page.locator("#lab-nonpoliticalConfirmed")).toBeFocused();
    await expect(page.locator("#lab-markdown")).toHaveCount(0);
    await page.locator("#lab-nonpoliticalConfirmed").check();
    await page.locator("#lab-takeaway").fill("Compare two white-balance settings on the same scene.");
    await page.locator("#lab-action").fill("Complete the synthetic comparison worksheet");
    await page.locator("#lab-constraints").fill("Synthetic planning exercise only; mixed light may need a different approach.");
    await page.locator("#lab-mechanismId").selectOption("curiosity-gap");
    await page.locator("#lab-objective").selectOption("surface-response");

    const channels = [
      { id: "instagram-feed", section: "## Instagram Feed production brief", detail: "Feed sequence:", metric: "Save rate (unique-account basis)" },
      { id: "google-search", section: "## Answer-first page outline", detail: "Search intent & question cluster", metric: "Search click-through rate" },
      { id: "marketing-email", section: "## Email package", detail: "working, easy unsubscribe", metric: "Unique-recipient click rate" },
      { id: "marketing-offer", section: "## Offer page structure", detail: "Terms & informed action", metric: "Eligible-visitor conversion rate" },
    ];
    const outputs: string[] = [];
    for (const [index, channel] of channels.entries()) {
      await page.locator("#lab-platformId").selectOption(channel.id);
      if (channel.id.startsWith("marketing-")) {
        await page.locator("#lab-terms").fill("Free synthetic exercise; one worksheet for consenting adult learners, available during the lesson, no purchase, renewal or payment; leave at any time, refunds not applicable.");
      }
      if (index === 0) await button(page, "Generate brief").click();
      else await regenerate(page);
      const editor = page.locator("#lab-markdown");
      await expect(editor).toHaveValue(new RegExp(channel.detail));
      await expect(page.getByRole("heading", { name: `Primary metric: ${channel.metric}`, exact: true })).toBeVisible();
      const output = await editor.inputValue();
      expect(output).toContain(channel.section);
      expect(output).toContain("User-supplied, not independently verified:");
      expect(output).toContain("Complete the synthetic comparison worksheet");
      for (const other of channels.filter((candidate) => candidate.id !== channel.id)) expect(output).not.toContain(other.section);
      outputs.push(output);
    }
    expect(new Set(outputs).size).toBe(4);
    expect(await savedCopy(page)).toBeNull();
  });

  test("incompatible surfaces and missing genuine proof or limits cannot silently become ready treatments", async ({ page }) => {
    await page.goto("/lab");
    await fillRequiredBrief(page);
    await page.locator("#lab-platformId").selectOption("google-search");
    await page.locator("#lab-mechanismId").selectOption("scarcity");
    await page.locator("#lab-evidenceStatus").selectOption("missing");
    await button(page, "Generate brief").click();
    await expect(page.locator("#lab-mechanismId-error")).toContainText("no application template");
    await expect(page.locator("#lab-markdown")).toHaveCount(0);
    await page.locator("#lab-platformId").selectOption("marketing-offer");
    await button(page, "Generate brief").click();
    await expect(page.locator("#brief")).toContainText("Treatment not ready.");
    await expect(page.locator("#lab-markdown")).toHaveValue(/NOT READY:/);

    const limit = "Synthetic fixture only: workshop closes 2024-03-01 at 17:00 UTC.";
    const reason = "Synthetic fixture only: the instructor must prepare the room after that cutoff.";
    await page.locator("#lab-evidenceStatus").selectOption("provided");
    await page.locator("#lab-evidence").fill("Synthetic schedule fixture dated 2024-02-29; not a real booking offer or verified commercial claim.");
    await page.locator("#lab-realLimit").fill(limit);
    await page.locator("#lab-limitReason").fill(reason);
    await page.locator("#lab-terms").fill(`Free synthetic workshop, no payment or renewal, voluntary participation, leave any time; refunds not applicable. ${limit} ${reason}`);
    await regenerate(page);
    await expect(page.locator("#brief")).not.toContainText("Treatment not ready.");
    await expect(variant(page, "A — control")).toContainText(limit);
    await expect(variant(page, "B — treatment")).toContainText(limit);
    await expect(variant(page, "B — treatment")).toContainText(reason);
    await expect(variant(page, "A — control")).not.toContainText(reason);

    await page.locator("#lab-mechanismId").selectOption("social-proof");
    await page.locator("#lab-verifiedProof").fill("");
    await regenerate(page);
    await expect(page.locator("#brief")).toContainText("Treatment not ready.");
    const proof = 'Synthetic example only, not a customer testimonial: "The reference identifies the setting." Test-fixture author, permission for testing only, 2024-03-01, no real outcome asserted.';
    await page.locator("#lab-verifiedProof").fill(proof);
    await regenerate(page);
    await expect(page.locator("#brief")).not.toContainText("Treatment not ready.");
    await expect(page.locator("#brief")).toContainText("Placement of the same verified evidence block");
    await expect(variant(page, "A — control")).toContainText(proof);
    await expect(variant(page, "B — treatment")).toContainText(proof);
  });

  test("manual A/B counts show rates, percentage points and lift without inventing zero or invalid results", async ({ page }) => {
    await sample(page);
    await fillCounts(page, "10", "100", "18", "120");
    await expect(comparisonValue(page, "A rate")).toHaveText("10.00% (10 / 100)");
    await expect(comparisonValue(page, "B rate")).toHaveText("15.00% (18 / 120)");
    await expect(comparisonValue(page, "B − A")).toHaveText("+5.00 pp");
    await expect(comparisonValue(page, "Relative lift vs A")).toHaveText("+50.00%");
    await expect(page.getByTestId("comparison-results")).toContainText("No winner, significance or causal conclusion.");

    for (const invalid of ["-1", "1.5", "1e2", "9007199254740992"]) {
      await page.locator("#result-aOutcomes").fill(invalid);
      await expect(page.locator("#result-aOutcomes")).toHaveAttribute("aria-invalid", "true");
      await expect(page.locator("#result-errors")).toHaveText("Counts must be nonnegative safe whole numbers, or blank if unavailable.");
      await expect(page.getByTestId("comparison-results")).toHaveCount(0);
    }
    await page.locator("#result-aOutcomes").fill("101");
    await expect(page.locator("#result-errors")).toHaveText("Outcomes cannot exceed eligible units.");
    await expect(page.getByTestId("comparison-results")).toHaveCount(0);
    await fillCounts(page, "0", "100", "20", "100");
    await expect(comparisonValue(page, "A rate")).toHaveText("0.00% (0 / 100)");
    await expect(comparisonValue(page, "B − A")).toHaveText("+20.00 pp");
    await expect(comparisonValue(page, "Relative lift vs A")).toHaveText("N/A");
    await page.locator("#result-aEligible").fill("0");
    await expect(comparisonValue(page, "A rate")).toHaveText("N/A (0 / 0)");
    await expect(comparisonValue(page, "B rate")).toHaveText("20.00% (20 / 100)");
    await expect(comparisonValue(page, "B − A")).toHaveText("N/A");
    await expect(comparisonValue(page, "Relative lift vs A")).toHaveText("N/A");
    await page.locator("#result-bEligible").fill("");
    await expect(page.getByTestId("comparison-results")).toHaveCount(0);
    await expect(page.locator("#experiment")).toContainText("blank is unknown, not zero.");
  });

  test("input edits keep the old metric and results until confirmed regeneration clears only the old observations", async ({ page }) => {
    await sample(page);
    await fillCounts(page, "10", "100", "20", "100");
    const edited = "# LAB-SYNTHETIC edited brief\n\nKeep this exact wording until regeneration.";
    await page.locator("#lab-markdown").fill(edited);
    await page.locator("#experiment-allocation").fill("Synthetic observational cohorts, no real exposure.");
    await page.locator("#experiment-guardrail-plan").fill("Ask the same comprehension question; stop for misleading claims.");
    await page.locator("#experiment-guardrail-results").fill("Synthetic quality note only; not a real observation.");
    const stoppingRule = await page.locator("#experiment-stopping").inputValue();
    expect(stoppingRule).not.toBe("");
    await page.locator("#lab-topic").fill("LAB-SYNTHETIC new search lesson");
    await page.locator("#lab-platformId").selectOption("google-search");
    await page.locator("#lab-objective").selectOption("understanding");
    await expect(page.locator("#brief").getByRole("status")).toContainText("Inputs changed.");
    await expect(page.getByRole("heading", { name: SAMPLE_METRIC, exact: true })).toBeVisible();
    await expect(page.locator("#lab-markdown")).toHaveValue(edited);
    await expectCounts(page, ["10", "100", "20", "100"]);
    await regenerate(page, false);
    await expect(page.locator("#lab-markdown")).toHaveValue(edited);
    await expectCounts(page, ["10", "100", "20", "100"]);
    await expect(page.locator("#experiment-guardrail-results")).toHaveValue("Synthetic quality note only; not a real observation.");
    await regenerate(page);
    await expect(page.getByRole("heading", { name: "Primary metric: Correct task-response rate", exact: true })).toBeVisible();
    await expect(page.locator("#lab-markdown")).toHaveValue(/LAB-SYNTHETIC new search lesson/);
    await expect(page.locator("#lab-markdown")).not.toHaveValue(edited);
    await expect(page.locator("#brief").getByRole("status")).toHaveCount(0);
    await expectCounts(page, ["", "", "", ""]);
    await expect(page.locator("#experiment-guardrail-results")).toHaveValue("");
    await expect(page.locator("#experiment-allocation")).toHaveValue("Synthetic observational cohorts, no real exposure.");
    await expect(page.locator("#experiment-guardrail-plan")).toHaveValue("Ask the same comprehension question; stop for misleading claims.");
    await expect(page.locator("#experiment-stopping")).toHaveValue(stoppingRule);
    await page.locator("#lab-objective").selectOption("useful-action");
    await page.locator("#lab-action").fill("Complete the LAB-SYNTHETIC worksheet");
    await regenerate(page);
    await expect(page.getByRole("heading", { name: "Primary metric: Useful-action completion rate", exact: true })).toBeVisible();
    await expect(page.locator("#experiment")).toContainText("Complete the LAB-SYNTHETIC worksheet");
    await expect(page.locator("#experiment")).toContainText("All eligible participants assigned and exposed to this variant");
  });

  test("Save, Load and Delete are explicit; reload never silently restores or saves the active draft", async ({ page }) => {
    await sample(page);
    const edited = "# LAB-SYNTHETIC saved Markdown\n\nThis is the explicit device copy.";
    await page.locator("#lab-markdown").fill(edited);
    await fillCounts(page, "2", "10", "3", "10");
    expect(await savedCopy(page)).toBeNull();
    await button(page, "Save on this device").click();
    await expect(workspaceStatus(page)).toContainText("Saved one draft on this device.");
    const saved = await savedCopy(page);
    expect(saved).not.toBeNull();
    expect(JSON.parse(saved!).draft.markdown).toBe(edited);
    await page.locator("#lab-markdown").fill("LAB-SYNTHETIC unsaved change");
    await page.locator("#lab-topic").fill("LAB-SYNTHETIC unsaved topic");
    expect(await savedCopy(page)).toBe(saved);
    await confirmAction(page, () => button(page, "Load saved draft").click(), /Replace the entire active draft/, false);
    await expect(workspaceStatus(page)).toContainText("Load cancelled. Active draft unchanged.");
    await expect(page.locator("#lab-markdown")).toHaveValue("LAB-SYNTHETIC unsaved change");
    await confirmAction(page, () => button(page, "Load saved draft").click(), /Replace the entire active draft/, true);
    await expect(page.locator("#lab-markdown")).toHaveValue(edited);
    await expect(page.locator("#lab-topic")).toHaveValue(SAMPLE_TOPIC);
    await expectCounts(page, ["2", "10", "3", "10"]);
    await page.locator("#lab-markdown").fill("LAB-SYNTHETIC discard on reload");
    await page.reload();
    await expect(page.locator("#lab-topic")).toHaveValue("");
    await expect(page.locator("#lab-markdown")).toHaveCount(0);
    expect(await savedCopy(page)).toBe(saved);
    // Reload 後未 touched，Load 唔需要替換 unsaved draft 嘅確認。
    await button(page, "Load saved draft").click();
    await expect(workspaceStatus(page)).toContainText("Loaded the validated device copy.");
    await expect(page.locator("#lab-markdown")).toHaveValue(edited);
    await expectCounts(page, ["2", "10", "3", "10"]);
    await confirmAction(page, () => button(page, "Delete saved draft").click(), /Delete the one saved Attention Lab draft/, false);
    expect(await savedCopy(page)).toBe(saved);
    await confirmAction(page, () => button(page, "Delete saved draft").click(), /Delete the one saved Attention Lab draft/, true);
    await expect(workspaceStatus(page)).toContainText("Saved device copy deleted.");
    expect(await savedCopy(page)).toBeNull();
    await expect(page.locator("#lab-markdown")).toHaveValue(edited);
    await expectCounts(page, ["2", "10", "3", "10"]);
    await button(page, "Load saved draft").click();
    await expect(workspaceStatus(page)).toContainText("No saved Attention Lab draft on this device.");
    await expect(page.locator("#lab-markdown")).toHaveValue(edited);
    await page.reload();
    await expect(page.locator("#lab-markdown")).toHaveCount(0);
    expect(await savedCopy(page)).toBeNull();
  });

  test("real Markdown and JSON downloads round-trip exact edits, counts, metric snapshots, plans and attached notes", async ({ page }) => {
    await sample(page);
    await navigate(page, "Trends");
    await fillTrend(page);
    await button(page, "Attach note & open Lab").click();
    await expect(page).toHaveURL(/\/lab$/);
    const edited = "# LAB-SYNTHETIC hand-edited brief\n\nUnicode round-trip: 白平衡 — A ≠ B.\nKeep **this exact text**, not a rebuilt template.";
    await page.locator("#lab-markdown").fill(edited);
    await fillCounts(page, "7", "20", "12", "30");
    await page.locator("#experiment-design").selectOption("randomized");
    await page.locator("#experiment-allocation").fill("Synthetic design fixture: stable coin-flip assignment before exposure; no study was run.");
    await page.locator("#experiment-eligibility").fill("Synthetic eligible unit: one consenting participant, counted once.");
    await page.locator("#experiment-start").fill("2024-02-29");
    await page.locator("#experiment-end").fill("2024-03-01");
    await page.locator("#experiment-guardrail-plan").fill("Use the same scoring question and stop for misleading claims.");
    await page.locator("#experiment-guardrail-results").fill("Synthetic quality record; no actual participant outcomes claimed.");
    await page.locator("#lab-objective").selectOption("understanding");

    const markdown = (await download(page, "Download Markdown")).toString("utf8");
    expect(markdown.startsWith(`${edited}\n\n`)).toBe(true);
    expect(markdown).toContain("INPUT CHANGED:");
    expect(markdown).toContain("Primary metric bound to generated brief: Chose-to-view rate");
    expect(markdown).toContain("A: 7 / 20 = 35.00%");
    expect(markdown).toContain("B: 12 / 30 = 40.00%");
    expect(markdown).toContain("B − A: +5.00 pp");
    expect(markdown).toContain("Relative lift vs A: +14.29%");
    expect(markdown).toContain(SYNTHETIC_NOTE.term);
    expect(markdown).toContain(SYNTHETIC_NOTE.sourceUrl);
    const json = await download(page, "Export JSON");
    const envelope = JSON.parse(json.toString("utf8"));
    expect(envelope.format).toBe("fomoengine-attention-workspace");
    expect(envelope.version).toBe(1);
    expect(envelope.draft.markdown).toBe(edited);
    expect(envelope.draft.counts).toEqual({ aOutcomes: "7", aEligible: "20", bOutcomes: "12", bEligible: "30" });
    expect(envelope.draft.input.objective).toBe("understanding");
    expect(envelope.draft.generated.input.objective).toBe("surface-response");
    expect(envelope.draft.trendNotes).toEqual([SYNTHETIC_NOTE]);
    expect(envelope.draft.plan.design).toBe("randomized");
    await page.locator("#lab-markdown").fill("LAB-SYNTHETIC keep if import cancelled");
    await page.locator("#result-aOutcomes").fill("1");
    await confirmAction(page, () => importBuffer(page, json), /Import this validated version 1 workspace/, false);
    await expect(workspaceStatus(page)).toContainText("Import cancelled. Active draft unchanged.");
    await expect(page.locator("#lab-markdown")).toHaveValue("LAB-SYNTHETIC keep if import cancelled");
    await expect(page.locator("#result-aOutcomes")).toHaveValue("1");
    await confirmAction(page, () => importBuffer(page, json), /Import this validated version 1 workspace/, true);
    await expect(workspaceStatus(page)).toContainText("Imported the validated workspace into memory. It has not been saved on this device.");
    await expect(page.locator("#lab-markdown")).toHaveValue(edited);
    await expectCounts(page, ["7", "20", "12", "30"]);
    await expect(page.getByRole("heading", { name: SAMPLE_METRIC, exact: true })).toBeVisible();
    await expect(page.locator("#lab-objective")).toHaveValue("understanding");
    await expect(page.locator("#lab-trend-notes")).toContainText(SYNTHETIC_NOTE.term);
    expect(JSON.parse((await download(page, "Export JSON")).toString("utf8"))).toEqual(envelope);
    expect(await savedCopy(page)).toBeNull();
  });

  test("malformed, unsupported, invalid-schema and oversized imports preserve the entire active draft without confirmation", async ({ page }) => {
    await sample(page);
    await page.locator("#lab-markdown").fill("# LAB-SYNTHETIC preserve every field on invalid import");
    await fillCounts(page, "3", "10", "4", "10");
    await page.locator("#experiment-guardrail-results").fill("Synthetic preservation marker.");
    const before = JSON.parse((await download(page, "Export JSON")).toString("utf8"));
    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => { dialogs.push(dialog.message()); await dialog.dismiss(); });
    const invalidFiles = [
      { name: "malformed.json", buffer: Buffer.from('{"format":'), error: "This is not valid JSON." },
      { name: "future-version.json", buffer: Buffer.from(JSON.stringify({ ...before, version: 999 })), error: "Unsupported workspace format or version." },
      { name: "invalid-counts.json", buffer: Buffer.from(JSON.stringify({ ...before, draft: { ...before.draft, counts: { ...before.draft.counts, aOutcomes: "11" } } })), error: "Invalid workspace." },
      { name: "oversized.json", buffer: Buffer.alloc(256 * 1024 + 1, " "), error: "File exceeds the 256 KiB limit." },
    ];
    for (const file of invalidFiles) {
      await importBuffer(page, file.buffer, file.name);
      await expect(workspaceStatus(page)).toContainText(file.error);
      await expect(page.locator("#workspace-import")).toBeEnabled();
      await expect(page.locator("#lab-markdown")).toHaveValue(before.draft.markdown);
      await expectCounts(page, ["3", "10", "4", "10"]);
      expect(JSON.parse((await download(page, "Export JSON")).toString("utf8")), file.name).toEqual(before);
      expect(await savedCopy(page)).toBeNull();
    }
    expect(dialogs, "Validation must finish before a replacement is offered").toEqual([]);
  });

  test("manual trend metadata and safe dates/URLs attach context, not a replacement topic, until explicit consent", async ({ page }, testInfo) => {
    await sample(page);
    const edited = "# LAB-SYNTHETIC keep the existing brief and results";
    await page.locator("#lab-markdown").fill(edited);
    await fillCounts(page, "4", "10", "5", "10");
    await navigate(page, "Trends");
    await button(page, "Attach note & open Lab").click();
    for (const field of Object.keys(SYNTHETIC_NOTE)) {
      await expect(page.locator(`#trend-${field}`)).toHaveAttribute("aria-invalid", "true");
    }
    await expect(page.locator("#trend-sourceUrl")).toBeFocused();
    await expect(page).toHaveURL(/\/trends$/);
    await fillTrend(page, { ...SYNTHETIC_NOTE, sourceUrl: "javascript:void(0)", startDate: "2024-03-02", endDate: "2024-03-01" });
    await button(page, "Attach note & open Lab").click();
    await expect(page.locator("#trend-sourceUrl-error")).toContainText("complete http:// or https:// URL without login credentials");
    await expect(page.locator("#trend-endDate-error")).toHaveText("End date must be on or after the start date.");
    await page.locator("#trend-sourceUrl").fill("https://synthetic:fixture@example.invalid/research");
    await button(page, "Attach note & open Lab").click();
    await expect(page.locator("#trend-sourceUrl-error")).toBeVisible();
    await expect(page).toHaveURL(/\/trends$/);
    await fillTrend(page);
    await page.screenshot({ path: testInfo.outputPath("trends.png"), fullPage: true });
    await navigate(page, "Lab");
    await expect(page.locator("#lab-topic")).toHaveValue(SAMPLE_TOPIC);
    await expect(page.locator("#lab-markdown")).toHaveValue(edited);
    await navigate(page, "Trends");
    for (const [field, value] of Object.entries(SYNTHETIC_NOTE)) await expect(page.locator(`#trend-${field}`)).toHaveValue(value);
    await button(page, "Attach note & open Lab").click();
    await expect(page).toHaveURL(/\/lab$/);
    await expect(page.getByRole("complementary", { name: "Attached research context" })).toContainText(SYNTHETIC_NOTE.term);
    await expect(page.locator("#lab-topic")).toHaveValue(SAMPLE_TOPIC);
    await expect(page.locator("#lab-markdown")).toHaveValue(edited);
    await expectCounts(page, ["4", "10", "5", "10"]);
    await expect(page.locator("#lab-trend-notes")).toContainText("United Kingdom · 2024-02-29 to 2024-03-01 · YouTube Search");
    const source = page.locator("#lab-trend-notes").getByRole("link", { name: "Open supplied source (new tab)", exact: true });
    await expect(source).toHaveAttribute("href", SYNTHETIC_NOTE.sourceUrl);
    await expect(source).toHaveAttribute("target", "_blank");
    await expect(source).toHaveAttribute("rel", "noopener noreferrer");
    // 外部來源只驗 link，唔開 Google 或測試用嘅 example.invalid。
    await confirmAction(page, () => button(page, "Use latest note as topic").click(), /Use the latest note's term as the topic\?/, false);
    await expect(page.locator("#lab-topic")).toHaveValue(SAMPLE_TOPIC);
    await confirmAction(page, () => button(page, "Use latest note as topic").click(), /Use the latest note's term as the topic\?/, true);
    await expect(page.locator("#lab-topic")).toHaveValue(SYNTHETIC_NOTE.term);
    await expect(page.locator("#lab-markdown")).toHaveValue(edited);
    await expectCounts(page, ["4", "10", "5", "10"]);
    await expect(page.locator("#brief").getByRole("status")).toContainText("Inputs changed.");
    await navigate(page, "Trends");
    await expect(page.locator("#trend-term")).toHaveValue("");
    const remove = button(page, `Remove note 1: ${SYNTHETIC_NOTE.term}`);
    await confirmAction(page, () => remove.click(), /Remove this note from the active draft\?/, false);
    await expect(remove).toBeVisible();
    await confirmAction(page, () => remove.click(), /Remove this note from the active draft\?/, true);
    await expect(remove).toHaveCount(0);
    await expect(page.getByText("No notes attached yet.", { exact: false })).toBeVisible();
    await navigate(page, "Lab");
    await expect(page.getByRole("complementary", { name: "Attached research context" })).toHaveCount(0);
    await expect(page.locator("#lab-topic")).toHaveValue(SYNTHETIC_NOTE.term);
    await expect(page.locator("#lab-markdown")).toHaveValue(edited);
    await expectCounts(page, ["4", "10", "5", "10"]);
    expect(await savedCopy(page)).toBeNull();
  });
});
