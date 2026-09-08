import { test, expect } from "@playwright/test";

const publicPages = [
  "/", "/atlas", "/atlas/curiosity-gap", "/platforms", "/lab", "/trends",
  "/sources", "/methodology", "/privacy", "/check", "/audit",
];

test("public pages render with their own brand canonical, navigation and no client errors", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const path of publicPages) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    expect(new URL(page.url()).pathname).toBe(path);
    await expect(page.locator("h1")).toHaveCount(1);
    const canonicalPattern = new RegExp(`^https://fomoengine\\.io${path === "/" ? "/?" : path}$`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonicalPattern);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonicalPattern);
    await expect(page.getByRole("navigation").first()).toBeVisible();
    if (path === "/") await page.screenshot({ path: testInfo.outputPath("home-desktop.png"), fullPage: true, animations: "disabled" });
  }
  expect(errors).toEqual([]);
});

test("unknown mechanism is a genuine 404; sitemap and robots only advertise the brand host", async ({ request }) => {
  expect((await request.get("/atlas/not-a-real-mechanism")).status()).toBe(404);
  for (const path of ["/robots.txt", "/sitemap.xml"]) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain("https://fomoengine.io");
    expect(body).not.toContain("vercel.app");
  }
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of publicPages.filter((path) => path !== "/")) expect(sitemap).toContain(`https://fomoengine.io${path}`);
});

test("actual www document requests redirect while RSC, API and previews bypass", async ({ request }) => {
  const headers = { Host: "www.fomoengine.io", Accept: "text/html" };
  const html = await request.get("/atlas?from=host-check", { headers, maxRedirects: 0 });
  expect(html.status()).toBe(308);
  expect(html.headers().location).toBe("https://fomoengine.io/atlas?from=host-check");
  for (const prefetch of [false, true]) {
    const rscHeaders = {
      Host: "www.fomoengine.io", Accept: "*/*", RSC: "1",
      ...(prefetch ? { "Next-Router-Prefetch": "1" } : {}),
    };
    let rsc = await request.get("/lab?_rsc=test", { headers: rscHeaders, maxRedirects: 0 });
    // Next 會修正人工 cache key；只容許同 origin、同路徑嘅內部 307。
    if (rsc.status() === 307) {
      const location = rsc.headers().location;
      expect(location).toBeDefined();
      const normalized = new URL(location, rsc.url());
      expect(normalized.origin).toBe(new URL(rsc.url()).origin);
      expect(normalized.pathname).toBe("/lab");
      expect([...normalized.searchParams.keys()]).toEqual(["_rsc"]);
      expect(normalized.searchParams.get("_rsc")).not.toBe("test");
      rsc = await request.get(normalized.href, { headers: rscHeaders, maxRedirects: 0 });
    }
    expect(rsc.status()).toBe(200);
    expect(rsc.headers().location).toBeUndefined();
    expect(rsc.headers()["content-type"]).toContain("text/x-component");
  }
  const prefetch = await request.get("/atlas", {
    headers: { ...headers, Purpose: "prefetch" }, maxRedirects: 0,
  });
  expect(prefetch.status()).toBe(200);
  expect(prefetch.headers().location).toBeUndefined();
  const api = await request.get("/api/v1/check", { headers, maxRedirects: 0 });
  expect(api.status()).toBe(405);
  expect(api.headers().location).toBeUndefined();
  const preview = await request.get("/atlas", { headers: { Host: "preview.vercel.app", Accept: "text/html" }, maxRedirects: 0 });
  expect(preview.status()).toBe(200);
});

test("free checker works without providers, links by ID only and keeps scam warnings ahead of application", async ({ page }) => {
  await page.goto("/check");
  const input = page.getByLabel("Paste anything you got", { exact: false });
  const privateMarker = "LOCAL-ONLY-CHECK-4816";
  await input.fill(`Only 2 left in stock! ${privateMarker}`);
  await page.getByRole("button", { name: "Check it", exact: true }).click();
  await expect(page.getByRole("region", { name: "What I found" })).toBeVisible();
  const understand = page.getByRole("link", { name: "Understand this mechanism" }).first();
  await expect(understand).toHaveAttribute("href", "/atlas/scarcity");
  await expect(page.getByRole("link", { name: "Build an honest experiment" }).first()).toHaveAttribute("href", "/lab?mechanism=scarcity");
  expect(page.url()).not.toContain(privateMarker);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain(privateMarker);

  await page.getByRole("button", { name: "A scam text", exact: true }).click();
  await expect(page.locator('[aria-live="assertive"]')).toBeVisible();
  await expect(page.getByRole("link", { name: "Build an honest experiment" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "What I found" })).toContainText("Scam pattern");

  await input.fill("今日最後機會！得返2個名額，快啲嚟買！");
  await page.getByRole("button", { name: "Check it", exact: true }).click();
  await expect(page.getByRole("region", { name: "What I found" })).toContainText("Pressure tactic");
});

test("checker renders hostile text literally and handles failed requests", async ({ page }) => {
  await page.goto("/check");
  await page.getByLabel("Paste anything you got", { exact: false }).fill('<script>window.untrustedExecuted = true</script> Only 2 left in stock!');
  await page.getByRole("button", { name: "Check it", exact: true }).click();
  await expect(page.getByRole("region", { name: "What I found" })).toBeVisible();
  expect(await page.evaluate(() => "untrustedExecuted" in window)).toBe(false);
  await page.route("**/api/v1/check", (route) => route.fulfill({ status: 503, contentType: "text/plain", body: "Synthetic unavailable" }));
  await page.getByRole("button", { name: "Check it", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("503");
});

test("mobile pages fit the viewport and reduced-motion users can navigate", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/", "/atlas", "/atlas/curiosity-gap", "/lab", "/trends", "/check"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow, path).toBe(false);
    if (path === "/") await page.screenshot({ path: testInfo.outputPath("home-mobile.png"), fullPage: true });
  }
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /skip/i })).toBeFocused();
});
