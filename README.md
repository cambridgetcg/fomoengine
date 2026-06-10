# the authenticity shield

**Paste any text — an ad, a message, a review, a scammy "your account is suspended" SMS — and see the manipulation tactics in it, in plain words.** Free, no login, nothing saved.

→ **[Try it](https://fomoengine-cambridgetcgs-projects.vercel.app/check)**

For each pressure tactic it finds, the shield names:

- **the tactic** (a fake countdown, "only 2 left", a guilt-trip "no" button),
- **the proven psychological lever** it pulls (Cialdini scarcity/social-proof/authority; Kahneman–Tversky loss aversion; Thaler default effect),
- **the exact words** in your text that triggered it,
- **the feeling it pokes** — named kindly; you're never the problem,
- and **the truth that dissolves it** — the honest line that quietly switches the trick off.

It also catches a catastrophic **scam-composite** tier (impersonation + a threat/deadline + a push to act alone).

## The pledge

> **Free, forever, for people. No dark patterns of our own.**

We read only the words you paste — never a website, no tracking, **nothing stored**. We name patterns *consistent with* manipulation; we never call a specific person or product fraudulent. **You decide.** It's enforced in code, not just promised — see [`PLEDGE.md`](./PLEDGE.md) and the guardrail test that fails CI if the free tier is ever degraded.

## Honest origin

This repo was **inverted from a FOMO-comment generator** — a tool that *deployed* scarcity, urgency, social proof, and exclusivity. Same psychological levers; weapon turned to armor. The detection taxonomy is the literal inversion of the tactics the old engine pushed. (`git log` tells the whole story.)

## How it works

1. **Paste what you got.** Any text — it only reads the words, never opens a link or visits a site.
2. **See the tactic, the feeling, and the truth.** Each pressure move in plain language, grounded in a vetted taxonomy (so the user-facing text comes from citations, never free-form model output that could be alarmist or wrong).
3. **You decide, unhurried.** It never calls something a scam *for certain* — it shows the patterns so you spot them yourself.

Detection runs a deterministic regex pass (works with zero config, no key) **plus** an optional AI pass for nuance. Grounded in published research: Cialdini's *Influence*, Kahneman & Tversky on loss aversion, Brignull's deceptive.design, the FTC, and the EU Digital Services Act (Art. 25).

## API — for developers & AI agents

Same engine, as JSON. No key needed to start.

```bash
curl -s https://YOUR_HOST/api/v1/check \
  -H "Content-Type: application/json" \
  -d '{"text":"Only 2 left! Offer ends in 04:59."}'
```

Returns `{ success, data: { flags: [{ label, principle, lever, why, emotion, truth, whatToDo, evidence, confidence, citation }], summary, scamWarning, … } }`. A paid tier adds quota + a stronger model — strictly *additive*, the free result is never degraded. Full docs: [`docs/API.md`](./docs/API.md).

## Tech

Next.js 14 (App Router) · TypeScript · Tailwind + shadcn/ui · optional Postgres/Prisma (for API keys only — the public checker needs neither a DB nor auth) · deployed on Vercel.

## Run it locally

```bash
npm install
npm run dev          # the public checker works immediately, no env needed
npm test             # detection + guardrail tests
```

Optional env (`.env`): `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to enable the AI pass; `DATABASE_URL` only if you're issuing metered API keys.

## License

The detection taxonomy is intended as **CC0** — how manipulation works should never sit behind a paywall. See [`lib/services/detection/taxonomy.ts`](./lib/services/detection/taxonomy.ts).

---

Free, forever, for people. 🛡️
