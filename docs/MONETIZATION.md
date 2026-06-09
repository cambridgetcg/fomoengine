# Making money without becoming the thing we detect

The plan, in one line: **keep the consumer check free forever; charge businesses and
developers for volume, artifacts, and self-audit.** Backed by a 14-agent market
research pass (2026-06) whose adversarial fact-check overturned several comfortable
assumptions — recorded honestly below.

## What the research changed

- **"Consumers never pay for safety" is false.** Norton/Gen Digital earns ~$3.75B
  from ~39M consumers. So "free for people" is a real values choice that leaves money
  on the table — which is exactly why it's a credible moat, not a marketing line.
- **"Charge below market" is only half right.** Correct for the API + consumer tool
  (adoption is the moat). _Harmful_ for compliance: discount-acquired buyers churn
  ~62% more, and a suspiciously cheap audit tool reads as unserious to someone
  weighing a fine. Price the compliance product against lawyers and fines, not SaaS.
- **No room to "undercut moderation APIs."** OpenAI moderation is $0; Azure ~$0.38/1k.
  Our margin is the **named lever + exact span + regulatory citation + scam tier** —
  the inspectable artifact, not the raw classification.
- **Demand driver is US FTC/ROSCA** (Amazon $2.5B, Sept 2025), which is
  rule-independent — more durable than the EU mid-market or India CCPA stories.

## Build order

1. **Metered developer API** — _shipped (this module)._ Keys, monthly quota,
   metering, tier-based model routing on the existing `/api/v1/check`. The free
   anonymous path is untouched and DB-free.
2. **Compliance self-audit + citation-backed report** — next. Batch scan + a
   timestamped PDF/CSV ("scanned on DATE against ruleset vX") for businesses
   auditing their _own_ copy. **Hard prerequisite:** a versioned, dated citation
   engine — today the taxonomy's `citation` is a static string and even cites the
   _vacated_ FTC click-to-cancel rule as if live. Frame value on the underlying
   illegality of the conduct, never a single rule that can be struck down.
3. Then, building on those: agency white-label report, CI/CD dark-pattern linter,
   an "agent shield" pre-filter for LLM apps, and (paid-only, separate disclaimer)
   URL/email/screenshot ingestion.

## Pricing

| Product            | Price                       | Notes                                        |
| ------------------ | --------------------------- | -------------------------------------------- |
| Consumer web check | **free forever**            | never gated — see PLEDGE.md                  |
| API — Free         | $0 · 1k/mo                  | generous; adoption is the moat               |
| API — Starter      | $29/mo · 10k                | anchored just under Sightengine              |
| API — Pro          | $99/mo · 100k + SLA         | stronger model                               |
| Compliance report  | $49–$299 one-off · $99–$299/mo | priced **confidently** vs a $50k consultancy |

## Payments — your handoff

The code is provider-agnostic (`lib/services/billing/`). Receiving money needs
accounts only **you** can create — I won't touch credentials or sign you up.

**Recommended:** lead with **one merchant-of-record** so you can sell globally this
month without a tax department — the MoR is the legal seller and remits VAT/GST/sales
tax across 170+ jurisdictions.

- **Paddle** or **Polar** (~5% + $0.50), or **Creem** (3.9% + $0.40, free under ~€1k)
  if cheapest matters. Prefer an independent MoR over Lemon Squeezy (Stripe owns it
  and is launching its own MoR — concentration risk).
- Add **Stripe direct** (2.9% + $0.30, usage-based metered billing) later, once
  volume justifies owning your own tax.
- Offer **USDC** as a _secondary, opt-in_ rail (NOWPayments ~0.5–1%, or Stripe USDC
  with a US entity). **Do not lead with crypto** — Coinbase Commerce shuts down
  2026-03-31, and direct USDC carries 1099-DA cost-basis accounting load.
- **Skip** standalone SEPA/ACH wiring — let the MoR present bank transfer at checkout.

### To wire a provider

1. Sign up for the MoR; create products for Starter/Pro.
2. Set `BILLING_PROVIDER` + the webhook secret + `BILLING_PLAN_ID_STARTER` /
   `BILLING_PLAN_ID_PRO` (the provider's price ids) in env.
3. Implement `getConfiguredProvider()` in `lib/services/billing/provider.ts`
   (verify signature → normalized `BillingEvent`).
4. Point the provider's webhook at `POST /api/v1/billing/webhook`. Until then it
   returns **501** on purpose — an unwired endpoint should never look "done."
5. Build key **delivery** (a small dashboard or an email with the one-time secret).

## The guardrail (don't skip this)

The single biggest risk is mission drift: the cheapest post-launch revenue lever is
degrading the free tier. That's why the non-negotiables live in **PLEDGE.md** _and_
in **`free-tier.guardrail.test.ts`**, which fails CI if a change would gate or
degrade the free path. Keep both green.
