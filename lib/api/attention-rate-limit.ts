type Bucket = { count: number; resetAt: number };
export type AttentionLimit =
  | { ok: true }
  | { ok: false; status: 429 | 503; retryAfter: number };

/** 只保護 Attention API；每實例、短期記憶體限制，唔改免費 checker 嘅 fail-open 策略。 */
export function createAttentionLimiter({
  now = Date.now,
  limit = 30,
  windowMs = 60_000,
  maxBuckets = 20_000,
}: { now?: () => number; limit?: number; windowMs?: number; maxBuckets?: number } = {}) {
  for (const value of [limit, windowMs, maxBuckets]) {
    if (!Number.isSafeInteger(value) || value < 1) throw new Error("Invalid Attention limiter configuration");
  }
  const buckets = new Map<string, Bucket>();
  return (key: string): AttentionLimit => {
    try {
      const time = now();
      if (!Number.isFinite(time) || typeof key !== "string" || key.length > 128) {
        return { ok: false, status: 503, retryAfter: 60 };
      }
      let bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= time) {
        if (!bucket && buckets.size >= maxBuckets) {
          for (const [id, entry] of buckets) if (entry.resetAt <= time) buckets.delete(id);
          if (buckets.size >= maxBuckets) return { ok: false, status: 503, retryAfter: 60 };
        }
        bucket = { count: 0, resetAt: time + windowMs };
        buckets.set(key, bucket);
      }
      if (bucket.count >= limit) {
        return { ok: false, status: 429, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - time) / 1000)) };
      }
      bucket.count++;
      return { ok: true };
    } catch {
      return { ok: false, status: 503, retryAfter: 60 };
    }
  };
}
