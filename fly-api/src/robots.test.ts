// robots.txt on the FomoEngine Fly API: a plain allow-all, nothing else
// (Quiet Doors, small door fixes, 2026-10). No Crawl-delay, no training signal.
import { expect, test } from "bun:test";
import { handle } from "./server.ts";

for (const host of ["fomoengine.fly.dev", "api.fomoengine.io"]) {
  test(`${host}/robots.txt is a plain allow-all`, async () => {
    const res = await handle(new Request(`https://${host}/robots.txt`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type") ?? "").toMatch(/^text\/plain/);
    expect(await res.text()).toBe("User-agent: *\nAllow: /\n");
  });
}

test("other unknown paths still answer the 404 JSON", async () => {
  const res = await handle(new Request("https://fomoengine.fly.dev/robots.txt.bak"));
  expect(res.status).toBe(404);
  expect(await res.json()).toEqual({ error: "not found" });
});
