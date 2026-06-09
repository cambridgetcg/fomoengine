/**
 * POST /api/v1/check — the public manipulation checker.
 *
 * ANONYMOUS-FIRST. With no Authorization header this is the free, no-auth,
 * nothing-stored check it has always been — it never touches the database. A
 * DB-free, fail-open per-IP rate limit guards that path so it can't be turned into
 * a denial-of-wallet against our LLM provider.
 *
 * With an "Authorization: Bearer sk_live_…" key it becomes metered: the check is
 * counted against the key's monthly quota and, on a paid tier, routed to the
 * stronger model. That accuracy is strictly ADDITIVE — the rules pass and the
 * scam-composite danger tier run on every request regardless of tier, so the free
 * result is never gated or degraded. We still store NONE of the pasted content.
 *
 * Order matters: we validate the body BEFORE resolving/metering a key, so a
 * malformed request never burns a paid quota unit.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { detectionService } from "@/lib/services/detection/detection.service";
import { resolveApiKey, type KeyResolution } from "@/lib/services/api-keys/api-key.service";
import { analyzeTierFor } from "@/lib/services/billing/plans";
import { checkRateLimit, clientIp } from "@/lib/middleware/rate-limit";
import { jsonOk, jsonError } from "@/lib/api/envelope";

export const runtime = "nodejs";

const checkSchema = z.object({
  text: z
    .string()
    .min(1, "Paste something to check first.")
    .max(20000, "That's longer than I read at once — paste the key part (an ad, a message, a few reviews)."),
  lang: z.string().max(16).optional(),
});

export async function POST(req: NextRequest) {
  // 1. Validate the body first — a bad request must never burn quota or hit the key store.
  let text: string;
  try {
    const parsed = checkSchema.parse(await req.json());
    text = parsed.text;
  } catch (error) {
    const isValidation = error instanceof z.ZodError;
    return jsonError(
      isValidation ? "INVALID_INPUT" : "CHECK_FAILED",
      isValidation ? error.issues[0]?.message ?? "Please paste some text to check." : "Couldn't read that request.",
      isValidation ? 400 : 400,
    );
  }

  // 2. Resolve an optional key (meters keyed requests; anonymous returns instantly, no DB).
  const key = await resolveApiKey(req.headers.get("authorization"));
  if (key.kind === "error") {
    return withQuotaHeaders(jsonError(key.code, key.message, key.status), key);
  }

  // 3. Anonymous / degraded requests share the free model — protect that path with a
  //    DB-free, fail-open per-IP rate limit so it can't become a denial-of-wallet.
  if (key.kind === "anonymous" || key.kind === "degraded") {
    const rl = checkRateLimit(clientIp(req.headers));
    if (!rl.ok) {
      const res = jsonError(
        "RATE_LIMITED",
        "That's a lot of checks very fast. Give it a moment and try again — the free check stays free.",
        429,
      );
      res.headers.set("Retry-After", String(Math.ceil(rl.resetMs / 1000)));
      return withQuotaHeaders(res, key);
    }
  }

  // 4. Run the check. Paid tiers get the stronger model; everyone else the standard one.
  try {
    const tier = key.kind === "ok" ? analyzeTierFor(key.tier) : "free";
    const result = await detectionService.analyze(text, { tier });
    return withQuotaHeaders(jsonOk(result), key);
  } catch {
    return withQuotaHeaders(jsonError("CHECK_FAILED", "Something went wrong reading that. Please try again.", 500), key);
  }
}

/** Attach honest tier + quota headers so API consumers can see exactly where they stand. */
function withQuotaHeaders<T extends Response>(res: T, key: KeyResolution): T {
  switch (key.kind) {
    case "ok":
      res.headers.set("X-Shield-Tier", key.tier);
      res.headers.set("X-Quota-Limit", key.quota > 0 ? String(key.quota) : "unlimited");
      res.headers.set("X-Quota-Used", String(key.used));
      res.headers.set("X-Quota-Remaining", key.remaining < 0 ? "unlimited" : String(key.remaining));
      break;
    case "degraded":
      res.headers.set("X-Shield-Tier", "degraded");
      res.headers.set("X-Shield-Notice", "API key could not be verified right now; served on the free tier.");
      break;
    case "error":
      res.headers.set("X-Shield-Tier", "error");
      if (key.quota !== undefined) res.headers.set("X-Quota-Limit", String(key.quota));
      if (key.used !== undefined) {
        res.headers.set("X-Quota-Used", String(key.used));
        res.headers.set("X-Quota-Remaining", "0");
      }
      break;
    case "anonymous":
      res.headers.set("X-Shield-Tier", "anonymous");
      break;
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
  return res;
}
