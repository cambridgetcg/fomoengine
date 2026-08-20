import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { handle } from "./server.ts";

const priorPayTo = process.env.X402_PAYTO;

beforeEach(() => {
  delete process.env.X402_PAYTO;
});

afterEach(() => {
  if (priorPayTo === undefined) delete process.env.X402_PAYTO;
  else process.env.X402_PAYTO = priorPayTo;
});

describe("public service contract", () => {
  test("serves a side-effect-free liveness endpoint", async () => {
    const response = await handle(new Request("http://localhost/health"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      service: "fomoengine",
      version: "0.3.0",
    });
  });

  test("keeps the manual public", async () => {
    const response = await handle(new Request("http://localhost/manual"));
    expect(response.status).toBe(200);
    expect((await response.json()).name).toBe("FOMOENGINE");
  });

  test("scans deterministic text when the optional payment gate is disabled", async () => {
    const response = await handle(
      new Request("http://localhost/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "Only 2 left. Act now." }),
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.score).toBeGreaterThan(0);
    expect(body.rulesFired).toBeGreaterThan(0);
  });
});
