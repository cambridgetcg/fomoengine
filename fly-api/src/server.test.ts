import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { handle } from "./server.ts";
import { publicRequestUrl } from "./payment.ts";

const priorPayTo = process.env.X402_PAYTO;
const priorPaymentEnabled = process.env.X402_ENABLED;

beforeEach(() => {
  delete process.env.X402_PAYTO;
  delete process.env.X402_ENABLED;
});

afterEach(() => {
  if (priorPayTo === undefined) delete process.env.X402_PAYTO;
  else process.env.X402_PAYTO = priorPayTo;
  if (priorPaymentEnabled === undefined) delete process.env.X402_ENABLED;
  else process.env.X402_ENABLED = priorPaymentEnabled;
});

describe("public service contract", () => {
  test("serves a side-effect-free liveness endpoint", async () => {
    const response = await handle(new Request("http://localhost/health"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      service: "fomoengine",
      version: "0.3.1",
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

  test("scans directly submitted HTML", async () => {
    const response = await handle(
      new Request("http://localhost/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ html: "<strong>Only 2 left. Act now.</strong>" }),
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).input.html).toBe("38 chars");
  });

  test("does not retrieve untrusted remote URLs", async () => {
    const getResponse = await handle(
      new Request("http://localhost/scan?url=https://example.com"),
    );
    expect(getResponse.status).toBe(400);
    expect((await getResponse.json()).error).toContain("remote URL retrieval is paused");

    const postResponse = await handle(
      new Request("http://localhost/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://example.com" }),
      }),
    );
    expect(postResponse.status).toBe(400);
    expect((await postResponse.json()).error).toContain("remote URL retrieval is paused");
  });

  test("rejects malformed and oversized request bodies without scanning", async () => {
    const malformed = await handle(
      new Request("http://localhost/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    );
    expect(malformed.status).toBe(400);
    expect((await malformed.json()).error).toBe("request body must be valid JSON");

    const oversized = await handle(
      new Request("http://localhost/scan", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": "2000001",
        },
        body: "{}",
      }),
    );
    expect(oversized.status).toBe(413);

    const streamedOversized = await handle(
      new Request("http://localhost/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: " ".repeat(2_000_001),
      }),
    );
    expect(streamedOversized.status).toBe(413);
  });

  test("documents only direct inputs in the OpenAPI schema", async () => {
    const response = await handle(new Request("http://localhost/openapi.json"));
    const document = await response.json();
    const scanPath = document.paths["/scan"];
    expect(scanPath.get.deprecated).toBe(true);
    expect(scanPath.post.requestBody.content["application/json"].schema.properties.url).toBeUndefined();
    expect(scanPath.post.responses["402"]).toBeUndefined();
  });
});

describe("x402 public resource URL", () => {
  test("can keep a configured recipient non-chargeable until custody is proven", async () => {
    process.env.X402_PAYTO = "configured-receiver";
    process.env.X402_ENABLED = "false";
    const response = await handle(
      new Request("http://localhost/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "Only 2 left. Act now." }),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.has("payment-required")).toBe(false);
  });

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
