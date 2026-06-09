# Shield API

One endpoint. Paste text, get back the manipulation tactics in it as JSON. The same
engine that powers the free website — no login needed to start.

## The endpoint

```
POST /api/v1/check
Content-Type: application/json

{ "text": "Only 2 left! Offer ends in 04:59. Join 50,000+ happy customers." }
```

### Free, anonymous (no key)

It just works. Nothing is stored, no account needed.

```bash
curl -s https://YOUR_HOST/api/v1/check \
  -H "Content-Type: application/json" \
  -d '{"text":"Only 2 left! Offer ends in 04:59."}'
```

### Authenticated (with an API key)

Send your key as a Bearer token. A key meters your usage against a monthly quota,
and on a paid tier routes to a stronger model for sharper nuance.

```bash
curl -s https://YOUR_HOST/api/v1/check \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"text":"Only 2 left! Offer ends in 04:59."}'
```

## The response

```jsonc
{
  "success": true,
  "data": {
    "summary": "This uses 2 pressure tactics worth knowing about. You still get to decide, unhurried.",
    "scamWarning": false,
    "flags": [
      {
        "label": "Manufactured urgency",
        "principle": "Scarcity",          // the proven psychological lever
        "lever": "We want what's running out of time more than we should.",
        "why": "It makes time the scarce thing…",
        "whatToDo": "Take the time you actually need…",
        "evidence": "04:59",              // the exact span that triggered it
        "confidence": "likely",           // "likely" | "possible"
        "severity": "caution",            // "info" | "caution" | "danger"
        "citation": "Mathur et al. 2019; FTC 2022 §1; EU DSA Art. 25",
        "source": "rules"                 // "rules" | "ai" | "rules+ai"
      }
    ],
    "checkedBy": "Checked by: plain rules + an AI reader (gpt-4o-mini).",
    "disclaimer": "I read only the words you pasted — I did not visit any website…",
    "inputChars": 48
  }
}
```

The user-facing `why` / `whatToDo` / `citation` come from a vetted taxonomy, never
free-form model text — so the API can't improvise something defamatory or alarmist.

## Quota headers (authenticated requests)

| Header               | Meaning                                                          |
| -------------------- | --------------------------------------------------------------- |
| `X-Shield-Tier`      | `anonymous`, `FREE`, `STARTER`, `PRO`, `degraded`, or `error`    |
| `X-Quota-Limit`      | checks allowed this month (`unlimited`)                         |
| `X-Quota-Used`       | checks used this month                                          |
| `X-Quota-Remaining`  | checks left this month (`unlimited`; `0` on a quota-exceeded 429) |
| `X-Shield-Notice`    | present when your key couldn't be verified and we served you on the free tier instead (`X-Shield-Tier: degraded`) |

## Tiers

| Tier        | Monthly quota | Model        | Price   |
| ----------- | ------------- | ------------ | ------- |
| Anonymous   | (fair-use)    | standard     | free    |
| Free key    | 1,000         | standard     | $0      |
| Starter     | 10,000        | stronger     | $29/mo  |
| Pro         | 100,000       | stronger     | $99/mo  |

Quotas reset on the 1st of each calendar month **(UTC)**. **The free anonymous check
is never gated or degraded** — see [PLEDGE.md](../PLEDGE.md). The anonymous path has a
fair-use per-IP rate limit (a DB-free, fail-open floor); for production, an edge
limiter (Cloudflare Turnstile/WAF or Vercel WAF) is the robust layer.

## Errors

The envelope is always `{ success, data?, error? }`. On failure:

| HTTP | `error.code`            | When                                         |
| ---- | ----------------------- | -------------------------------------------- |
| 400  | `INVALID_INPUT`         | empty text, or longer than 20,000 chars      |
| 401  | `INVALID_API_KEY`       | key not found or revoked                     |
| 429  | `QUOTA_EXCEEDED`        | monthly quota used up                        |
| 429  | `RATE_LIMITED`          | too many anonymous checks too fast (per-IP)  |
| 503  | `METERING_UNAVAILABLE`  | valid key, but the usage meter was briefly unreachable — retry |
| 500  | `CHECK_FAILED`          | unexpected error reading the text            |

A bad key returns 401 — drop the `Authorization` header to fall back to the free
anonymous tier.

## Getting a key

Until self-serve billing is live, mint a key from the CLI:

```bash
npx tsx scripts/mint-api-key.ts "Acme prod" --tier STARTER
# prints the secret ONCE — copy it now
```

This needs `DATABASE_URL` set (a Postgres connection string). See
[MONETIZATION.md](./MONETIZATION.md) for how paid plans and payment rails fit in.
