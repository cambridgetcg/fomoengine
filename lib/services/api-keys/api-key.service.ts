/**
 * API-key resolution + monthly metering for the public /api/v1/check endpoint.
 *
 * The rules here mirror the shield's ethos, and the guardrail test enforces them:
 *  - ANONYMOUS-FIRST. No Authorization header => free tier, and we NEVER touch the
 *    database. The free public check keeps working with zero config and zero DB.
 *  - ADDITIVE ONLY. A key adds quota + the stronger model. It can never gate or
 *    degrade the free path — enforced by the route + the guardrail test.
 *  - SECRET IS NEVER STORED. We persist sha256(secret) only; the raw key is shown
 *    once, at mint time, and is unrecoverable after that.
 *  - GRACEFUL DEGRADATION, NARROWLY. If the key store can't be *reached* to verify a
 *    key, we serve the request as free rather than failing the user. But once a key
 *    is found valid, a metering failure surfaces as a transient error — we never
 *    silently serve a known key unmetered (that would let quotas be evaded under DB
 *    stress).
 */
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { ApiTier } from "@prisma/client";

const KEY_PREFIX = "sk_live_";
const PREFIX_DISPLAY_LEN = KEY_PREFIX.length + 4; // e.g. "sk_live_a1b2"

export type KeyResolution =
  | { kind: "anonymous" }
  | { kind: "ok"; tier: ApiTier; quota: number; used: number; remaining: number }
  /** Key store was unreachable, so key validity is unknown; request is served free. */
  | { kind: "degraded"; reason: string }
  | { kind: "error"; code: string; message: string; status: number; quota?: number; used?: number };

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

/** Generate a fresh key. The secret is returned ONCE and is never stored in raw form. */
export function generateKey(): { secret: string; keyHash: string; prefix: string } {
  const secret = KEY_PREFIX + randomBytes(24).toString("hex");
  return { secret, keyHash: hashSecret(secret), prefix: secret.slice(0, PREFIX_DISPLAY_LEN) };
}

/** Calendar-month bucket in UTC, e.g. "2026-06". Quota resets when this rolls over. */
function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Accept "Authorization: Bearer sk_live_…" or a bare "sk_live_…" value. */
function parseSecret(header: string | null): string | null {
  if (!header) return null;
  const bearer = header.match(/^Bearer\s+(.+)$/i);
  const value = (bearer ? bearer[1] : header).trim();
  return value.startsWith(KEY_PREFIX) ? value : null;
}

const redact = (err: unknown): string => (err instanceof Error ? err.message : "unknown error");

/**
 * Resolve an optional API key and meter one check against its monthly quota.
 * Returns `anonymous` (and touches no DB) when no key is present.
 */
export async function resolveApiKey(authHeader: string | null): Promise<KeyResolution> {
  const secret = parseSecret(authHeader);
  if (!secret) return { kind: "anonymous" };

  // 1. Look the key up. ONLY a reach/connect failure here degrades to free — at this
  //    point the key's validity is genuinely unknown.
  let key: { id: string; tier: ApiTier; monthlyQuota: number; revokedAt: Date | null } | null;
  try {
    key = await prisma.apiKey.findUnique({ where: { keyHash: hashSecret(secret) } });
  } catch (err) {
    console.error("API key store unreachable; serving request as anonymous-free:", redact(err));
    return { kind: "degraded", reason: "key-store-unavailable" };
  }

  if (!key || key.revokedAt) {
    return {
      kind: "error",
      code: "INVALID_API_KEY",
      message:
        "That API key isn't valid (or was revoked). Omit the Authorization header to use the free anonymous tier.",
      status: 401,
    };
  }

  // 2. Meter atomically. Increment first (race-free via the unique constraint), then
  //    refund + reject if that pushed us over quota. A failure here is NOT degraded to
  //    free — the key is known-valid, so we surface a transient error instead.
  const yearMonth = currentYearMonth();
  try {
    const row = await prisma.apiUsage.upsert({
      where: { apiKeyId_yearMonth: { apiKeyId: key.id, yearMonth } },
      create: { apiKeyId: key.id, yearMonth, count: 1 },
      update: { count: { increment: 1 } },
    });

    if (key.monthlyQuota > 0 && row.count > key.monthlyQuota) {
      // Over quota: give the unit back so the counter reflects allowed usage.
      void prisma.apiUsage
        .update({ where: { apiKeyId_yearMonth: { apiKeyId: key.id, yearMonth } }, data: { count: { decrement: 1 } } })
        .catch(() => {});
      return {
        kind: "error",
        code: "QUOTA_EXCEEDED",
        message: "You've used your full monthly quota. It resets on the 1st (UTC) — or upgrade your plan for more.",
        status: 429,
        quota: key.monthlyQuota,
        used: key.monthlyQuota,
      };
    }

    // Best-effort "last used" stamp; never block or fail the request on it.
    void prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

    const remaining = key.monthlyQuota > 0 ? Math.max(0, key.monthlyQuota - row.count) : -1; // -1 = unlimited
    return { kind: "ok", tier: key.tier, quota: key.monthlyQuota, used: row.count, remaining };
  } catch (err) {
    console.error("API usage metering failed for a valid key:", redact(err));
    return {
      kind: "error",
      code: "METERING_UNAVAILABLE",
      message: "Usage metering is temporarily unavailable. Please retry in a moment.",
      status: 503,
    };
  }
}
