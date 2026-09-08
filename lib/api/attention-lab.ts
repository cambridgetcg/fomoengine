import { z } from "zod";
import { jsonError, jsonOk } from "./envelope";
import { createAttentionLimiter, type AttentionLimit } from "./attention-rate-limit";
import { clientIp } from "../middleware/rate-limit";

export const ATTENTION_MAX_REQUEST_BYTES = 64 * 1024;
export const ATTENTION_MAX_RESPONSE_BYTES = 512 * 1024;
export const ATTENTION_REQUEST_TIMEOUT_MS = 10_000;
const limitAttention = createAttentionLimiter();
const encoder = new TextEncoder();

class AttentionHttpError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) { super(message); }
}

async function readJson(request: Request, timeoutMs: number): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  const encoding = request.headers.get("content-encoding");
  if (!/^application\/json(?:\s*;\s*charset=(?:utf-8|"utf-8"))?\s*$/i.test(contentType) || (encoding && encoding.toLowerCase() !== "identity")) {
    throw new AttentionHttpError("UNSUPPORTED_MEDIA_TYPE", "Send uncompressed application/json encoded as UTF-8.", 415);
  }
  const declared = request.headers.get("content-length");
  if (declared !== null && !/^(?:0|[1-9]\d*)$/.test(declared)) {
    throw new AttentionHttpError("INVALID_JSON", "Invalid request length.", 400);
  }
  if (declared !== null && Number(declared) > ATTENTION_MAX_REQUEST_BYTES) {
    throw new AttentionHttpError("PAYLOAD_TOO_LARGE", "Request exceeds the 64 KiB limit.", 413);
  }
  if (!request.body) throw new AttentionHttpError("INVALID_JSON", "A JSON request body is required.", 400);
  const reader = request.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort: (() => void) | undefined;
  let complete = false;
  const timeoutError = () => new AttentionHttpError("REQUEST_TIMEOUT", "Request body was not received in time.", 408);
  const deadline = performance.now() + timeoutMs;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(timeoutError()), timeoutMs);
    abort = () => reject(timeoutError());
    request.signal.addEventListener("abort", abort, { once: true });
    if (request.signal.aborted) abort();
  });
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
    const parts: string[] = [];
    let bytes = 0;
    let chunks = 0;
    while (true) {
      if (performance.now() >= deadline) throw timeoutError();
      const { done, value } = await Promise.race([reader.read(), expired]);
      if (done) break;
      bytes += value.byteLength;
      // 連零 byte chunks 都有上限，唔畀無限 microtask stream 拖住 timer。
      if (bytes > ATTENTION_MAX_REQUEST_BYTES || ++chunks > ATTENTION_MAX_REQUEST_BYTES + 1) {
        throw new AttentionHttpError("PAYLOAD_TOO_LARGE", "Request exceeds the 64 KiB limit.", 413);
      }
      parts.push(decoder.decode(value, { stream: true }));
    }
    complete = true;
    parts.push(decoder.decode());
    if (declared !== null && Number(declared) !== bytes) {
      throw new AttentionHttpError("INVALID_JSON", "Request length does not match its body.", 400);
    }
    return JSON.parse(parts.join(""));
  } catch (error) {
    if (error instanceof AttentionHttpError) throw error;
    throw new AttentionHttpError("INVALID_JSON", "Send valid UTF-8 JSON.", 400);
  } finally {
    clearTimeout(timer);
    if (abort) request.signal.removeEventListener("abort", abort);
    // 唔等 caller 控制嘅 cancel promise，deadline 才真正涵蓋收束。
    if (!complete) void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/** 新 routes 共用 transport 邊界；compute 只收已驗證資料，唔收到 headers／credentials。 */
export function createAttentionRoute<T = never>(
  method: "GET" | "POST",
  compute: (input: T) => unknown,
  schema?: z.ZodType<T>,
  options: { limiter?: (key: string) => AttentionLimit; requestTimeoutMs?: number; rawDocument?: boolean } = {},
) {
  const allowed = method === "GET" ? "GET, HEAD, OPTIONS" : "POST, OPTIONS";
  function headers(response: Response): Response {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", allowed);
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    response.headers.set("Access-Control-Expose-Headers", "Retry-After");
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  }
  function error(code: string, message: string, status: number): Response {
    return headers(jsonError(code, message, status));
  }
  function methodNotAllowed(): Response {
    const response = error("METHOD_NOT_ALLOWED", "This operation does not support that method.", 405);
    response.headers.set("Allow", allowed);
    return response;
  }
  function preflight(request: Request): Response {
    const requestedMethod = request.headers.get("access-control-request-method");
    const requestedHeaders = request.headers.get("access-control-request-headers");
    if ((requestedMethod && !allowed.split(", ").includes(requestedMethod)) ||
      (requestedHeaders && requestedHeaders.split(",").some((name) => name.trim().toLowerCase() !== "content-type"))) {
      return error("CORS_NOT_ALLOWED", "Only this operation's public method and Content-Type header are allowed.", 403);
    }
    const response = headers(new Response(null, { status: 204 }));
    response.headers.set("Vary", "Access-Control-Request-Method, Access-Control-Request-Headers");
    response.headers.set("Allow", allowed);
    return response;
  }
  async function handle(request: Request): Promise<Response> {
    if (request.method !== method && !(method === "GET" && request.method === "HEAD")) return methodNotAllowed();
    try {
      // 呢個係短期 bucket 座標，唔係已驗身份，亦唔係全球 quota。
      const quota = (options.limiter ?? limitAttention)(clientIp(request.headers).slice(0, 128));
      if (!quota.ok) {
        const response = quota.status === 429
          ? error("RATE_LIMITED", "Too many Attention Lab requests. Try again later.", 429)
          : error("SERVICE_UNAVAILABLE", "Attention Lab is temporarily unavailable.", 503);
        response.headers.set("Retry-After", String(quota.retryAfter));
        return response;
      }
      let input: T = undefined as T;
      if (method === "POST") {
        if (!schema) return error("SERVICE_UNAVAILABLE", "Attention Lab is temporarily unavailable.", 503);
        const raw = await readJson(request, options.requestTimeoutMs ?? ATTENTION_REQUEST_TIMEOUT_MS);
        const parsed = schema.safeParse(raw);
        if (!parsed.success) return error("INVALID_INPUT", "Input does not satisfy the Attention Lab contract. Check the schema and its semantic requirements.", 422);
        input = parsed.data;
      }
      // Output／核心失敗屬服務錯誤，唔冒充 caller 嘅 schema 錯誤。
      const data = compute(input);
      if (data === undefined || data instanceof Promise) return error("SERVICE_UNAVAILABLE", "Attention Lab is temporarily unavailable.", 503);
      const bytes = encoder.encode(JSON.stringify(options.rawDocument ? data : { success: true, data })).byteLength;
      if (bytes > ATTENTION_MAX_RESPONSE_BYTES) return error("SERVICE_UNAVAILABLE", "Attention Lab response exceeds its supported size.", 503);
      const response = headers(options.rawDocument ? Response.json(data) : jsonOk(data));
      return request.method === "HEAD" ? new Response(null, { status: response.status, headers: response.headers }) : response;
    } catch (failure) {
      if (failure instanceof AttentionHttpError) return error(failure.code, failure.message, failure.status);
      return error("SERVICE_UNAVAILABLE", "Attention Lab is temporarily unavailable.", 503);
    }
  }
  return { handle, options: preflight, methodNotAllowed };
}
