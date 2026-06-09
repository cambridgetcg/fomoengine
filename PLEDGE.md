# The Shield Pledge

_Dated commitment. First published 2026-06-08._

This tool exists to protect people from manipulation. It cannot do that while
quietly manipulating them. So before we charge anyone a cent, we are writing the
limits down — publicly, and in code.

## What stays free, forever

1. **The consumer web check is free, unmetered, and unpaywalled.** Anyone can
   paste an ad, message, product page, or review and get the full plain-language
   read — no account, no login, nothing stored.
2. **The scam danger tier is never gated.** The catastrophic "this matches a known
   scam pattern" warning fires for everyone, every time. It is never rate-limited
   into uselessness, never hidden behind a plan, never delayed to push an upgrade.
3. **No upsell ever sits between a person and a safety verdict.** No "upgrade to see
   all flags," no interstitial, no dark pattern of our own.
4. **The taxonomy stays CC0.** How manipulation works should never live behind
   anyone's paywall.

## What we charge for

Businesses, developers, and compliance teams — for **volume, artifacts, and
self-audit**, never for an individual's safety:

- A **metered developer API** (keys + quota), where a paid tier adds throughput and
  a stronger model.
- A **compliance self-audit + report** for businesses checking their _own_ copy.

Paid is always **strictly additive**. The free result must never drop below what it
is today. This isn't a slogan — it's enforced by
`lib/services/detection/free-tier.guardrail.test.ts`, which fails CI if a change
would gate or degrade the free path.

## Why bother writing this down

Market research was blunt about the real risk: the cheapest way to grow revenue,
once paid tiers exist, is to shave the free tier — lower the caps, gate the
citations, gate the scam alert, add "see more" interstitials. Each one is a dark
pattern, and each one would destroy the only thing that makes this tool
trustworthy. A dated, public, code-enforced pledge is how we make that path harder
to take than to refuse.

— If a growth idea requires charging the scared individual or degrading their
result, it is out of bounds by definition.
