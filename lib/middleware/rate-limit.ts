/**
 * In-memory, per-IP fixed-window rate limit.
 *
 * Purpose: protect the ANONYMOUS /api/v1/check path from denial-of-wallet — an
 * unauthenticated loop that forces unbounded paid LLM calls on our provider key.
 *
 * Design constraints (so it can't break the free-tier pledge):
 *  - DB-FREE: never touches Postgres, so invariant #1 (anonymous = no DB) holds.
 *  - FAIL-OPEN: any internal error allows the request. A broken limiter must never
 *    deny someone their free safety check.
 *  - NO PII STORED: we key on a coarse client identifier and keep only a count +
 *    window expiry in memory; nothing is persisted.
 *
 * Caveat: in-memory means PER-INSTANCE. Under serverless scale-out this is a floor,
 * not a ceiling. The production-grade layer is an edge limiter (Cloudflare
 * Turnstile/WAF or Vercel WAF) in front of the function — see docs/MONETIZATION.md.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const DEFAULT_LIMIT = 30; // requests
const DEFAULT_WINDOW_MS = 60_000; // per minute
const MAX_TRACKED = 20_000; // memory bound

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit(key: string, limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS): RateLimitResult {
  try {
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(key, b);
    }
    b.count++;
    if (buckets.size > MAX_TRACKED) pruneExpired(now);
    return { ok: b.count <= limit, remaining: Math.max(0, limit - b.count), resetMs: Math.max(0, b.resetAt - now) };
  } catch {
    return { ok: true, remaining: 1, resetMs: 0 }; // fail-open: never deny a free check on limiter error
  }
}

/** Best-effort client identifier from proxy headers. Coarse on purpose; not stored. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") || "unknown";
}

function pruneExpired(now: number): void {
  buckets.forEach((v, k) => {
    if (v.resetAt <= now) buckets.delete(k);
  });
}
