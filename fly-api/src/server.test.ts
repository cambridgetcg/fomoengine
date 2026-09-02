import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { handle } from "./server.ts";
import { publicRequestUrl } from "./payment.ts";

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

describe("x402 public resource URL", () => {
  test("uses the configured HTTPS origin instead of Fly's internal HTTP URL", () => {
    const previous = process.env.X402_PUBLIC_ORIGIN;
    process.env.X402_PUBLIC_ORIGIN = "https://api.fomoengine.io";
    try {
      const request = new Request("http://api.fomoengine.io/scan?source=public");
      expect(publicRequestUrl(request, new URL(request.url))).toBe(
        "https://api.fomoengine.io/scan?source=public",
      );
    } finally {
      if (previous === undefined) delete process.env.X402_PUBLIC_ORIGIN;
      else process.env.X402_PUBLIC_ORIGIN = previous;
    }
  });

  test("honors Fly's forwarded HTTPS scheme when no origin override is set", () => {
    const previous = process.env.X402_PUBLIC_ORIGIN;
    delete process.env.X402_PUBLIC_ORIGIN;
    try {
      const request = new Request("http://api.fomoengine.io/scan", {
        headers: { "fly-forwarded-proto": "https" },
      });
      expect(publicRequestUrl(request, new URL(request.url))).toBe(
        "https://api.fomoengine.io/scan",
      );
    } finally {
      if (previous === undefined) delete process.env.X402_PUBLIC_ORIGIN;
      else process.env.X402_PUBLIC_ORIGIN = previous;
    }
  });
});
