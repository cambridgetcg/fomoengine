import test from "node:test";
import assert from "node:assert/strict";
import { scanWithRules, detectScamComposite } from "./regex.service";

test("scanWithRules catches the classic pushy-ad signals", () => {
  const ids = scanWithRules(
    "🔥 Only 2 left in stock! Offer ends in 04:59. 3 people are viewing this right now.",
  ).map((f) => f.categoryId);
  assert.ok(ids.includes("manufactured_urgency"), "countdown / urgency");
  assert.ok(ids.includes("fake_scarcity"), "low-stock + live-popularity");
});

test("scanWithRules returns at most one flag per category", () => {
  const flags = scanWithRules("only 5 left, only 3 left, selling fast, almost gone");
  const scarcity = flags.filter((f) => f.categoryId === "fake_scarcity");
  assert.equal(scarcity.length, 1);
});

test("scanWithRules stays quiet on plain, non-manipulative text", () => {
  assert.equal(scanWithRules("Thanks for your order. It will arrive on Tuesday.").length, 0);
});

test("evidence is the literal matched span", () => {
  const flags = scanWithRules("hurry, only 2 left");
  const scarcity = flags.find((f) => f.categoryId === "fake_scarcity");
  assert.equal(scarcity?.evidence, "only 2 left");
});

test("scam composite fires on impersonation + threat + act-now", () => {
  const result = detectScamComposite(
    "Microsoft Security: your account has been compromised. Call this number immediately to verify your identity.",
  );
  assert.equal(result.triggered, true);
  assert.ok(result.reasons.length >= 2);
});

test("scam composite needs an anchor (impersonation or threat), not just urgency", () => {
  // 'click the link now' alone is pushy but not the catastrophic signature.
  const result = detectScamComposite("Click the link now to grab your discount before it expires.");
  assert.equal(result.triggered, false);
});

test("scam composite does not fire on a single signal", () => {
  assert.equal(detectScamComposite("This is from your bank.").triggered, false);
});

test("scam composite stays quiet on ordinary urgent-sounding marketing", () => {
  assert.equal(
    detectScamComposite("Last chance! Our summer sale ends tonight — shop now and save 20%.").triggered,
    false,
  );
});
