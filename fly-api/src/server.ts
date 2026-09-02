import { scan } from "./detect.ts";
import { MANUAL } from "./manual.ts";
import { HONEYPOT_HTML } from "./honeypot.ts";
import { gateScan, x402Config } from "./payment.ts";
import { auditPage } from "./audit.ts";

const PORT = Number(process.env.PORT ?? 4242);
const MAX_REQUEST_BYTES = 2_000_000;

class InputError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "InputError";
  }
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-expose-headers": "payment-response, payment-required, payment-settlement",
    },
  });

async function readJsonObject(req: Request): Promise<Record<string, unknown>> {
  const declaredLength = req.headers.get("content-length");
  if (declaredLength !== null) {
    const length = Number(declaredLength);
    if (!Number.isSafeInteger(length) || length < 0) {
      throw new InputError("invalid content-length");
    }
    if (length > MAX_REQUEST_BYTES) {
      throw new InputError(`request body exceeds ${MAX_REQUEST_BYTES} bytes`, 413);
    }
  }

  if (!req.body) throw new InputError("provide a JSON request body");

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new InputError(`request body exceeds ${MAX_REQUEST_BYTES} bytes`, 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new InputError("request body must be valid JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new InputError("request body must be a JSON object");
  }
  return parsed as Record<string, unknown>;
}

type ScanInput = { kind: "html" | "text"; value: string };

async function readScanInput(req: Request): Promise<ScanInput> {
  const body = await readJsonObject(req);
  if (Object.hasOwn(body, "url")) {
    throw new InputError(
      "remote URL retrieval is paused; submit HTML or text directly — the service does not make server-side requests to untrusted destinations",
    );
  }
  if (Object.hasOwn(body, "html") && typeof body.html !== "string") {
    throw new InputError("html must be a string");
  }
  if (Object.hasOwn(body, "text") && typeof body.text !== "string") {
    throw new InputError("text must be a string");
  }
  if (typeof body.html === "string") return { kind: "html", value: body.html };
  if (typeof body.text === "string") return { kind: "text", value: body.text };
  throw new InputError("provide html or text");
}

function scanInput(input: ScanInput): Response {
  try {
    return json({
      input: { [input.kind]: `${input.value.length} chars` },
      ...scan(input.value, { html: input.kind === "html" }),
    });
  } catch (e) {
    console.error(`scan failed: ${String((e as Error).message ?? e)}`);
    return json({ error: "scan failed" }, 500);
  }
}

const remoteRetrievalPaused = () =>
  json(
    {
      error: "remote URL retrieval is paused; submit HTML or text directly with POST /scan",
      reason: "the service does not make server-side requests to untrusted destinations",
    },
    400,
  );

export async function handle(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);

  if (req.method === "OPTIONS")
    return new Response(null, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type, payment-signature",
        "access-control-expose-headers": "payment-response, payment-required, payment-settlement",
      },
    });

  if (pathname === "/") {
    const x402 = x402Config();
    return json({
      service: "fomoengine",
      endpoints: {
        "POST /scan": "{ html } or { text } → staged FOMO diagnosis with receipts + a rhetorlint rhetoric block (nullable — see /openapi.json)",
        "GET /scan?url=…": "paused: the service does not retrieve untrusted remote URLs",
        "GET /manual": "the FOMOENGINE framework as data (stages, tells, countermeasures, evidence)",
        "GET /honeypot": "a deliberately dark-patterned page for testing (should score ~100)",
        "GET /audit": "the static $99 Copy Pressure Audit design-partner offer (no tracking or data capture)",
        "GET /openapi.json": "machine-readable door plan (OpenAPI 3)",
      },
      pricing: x402.enabled
        ? {
            protocol: "x402",
            paid: ["/scan"],
            price: x402.price,
            asset: "USDC",
            network: x402.network,
            payTo: x402.payTo,
            free: ["/", "/manual", "/honeypot", "/audit"],
            note: "a failed scan is never charged; manual and honeypot stay free forever",
          }
        : { note: "all doors currently free", protocol: "x402-ready" },
      artifact: MANUAL.artifact,
    });
  }

  if (pathname === "/health") {
    return json({ ok: true, service: "fomoengine", version: "0.3.1" });
  }

  if (pathname === "/manual") return json(MANUAL);

  if (pathname === "/openapi.json") {
    const { openapiDocument } = await import("./openapi.ts");
    return json(openapiDocument());
  }

  if (pathname === "/audit") {
    if (req.method !== "GET") return json({ error: "method not allowed" }, 405);
    return auditPage();
  }

  if (pathname === "/honeypot")
    return new Response(HONEYPOT_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });

  if (pathname === "/scan") {
    if (req.method !== "GET" && req.method !== "POST")
      return json({ error: "method not allowed" }, 405);
    // URL retrieval is paused and GET cannot produce a chargeable scan.
    if (req.method === "GET") return remoteRetrievalPaused();
    // Bound and validate input before asking anyone to authorize payment.
    let input: ScanInput;
    try {
      input = await readScanInput(req);
    } catch (e) {
      if (e instanceof InputError) return json({ error: e.message }, e.status);
      console.error(`input validation failed: ${String((e as Error).message ?? e)}`);
      return json({ error: "input validation failed" }, 500);
    }
    const gate = await gateScan(req);
    if (gate.kind === "deny") return gate.response;
    const res = scanInput(input);
    return gate.kind === "paid" ? gate.finalize(res) : res;
  }

  return json({ error: "not found" }, 404);
}

if (import.meta.main) {
  const server = Bun.serve({ port: PORT, fetch: handle });
  console.log(`fomoengine listening on http://localhost:${server.port}`);
}
